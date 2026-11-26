import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, dirname, basename } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createAoriServer } from '../scripts/server.mjs';
import { hashPassword } from '../scripts/database.mjs';

const password = 'Senha de teste 2026!';
const clientA = { nome: 'Cliente Teste A', cpf: '12345678909', telefone: '48999990001', email: 'clientea@example.test', senha: password };
const clientB = { nome: 'Cliente Teste B', cpf: '98765432100', telefone: '48999990002', email: 'clienteb@example.test', senha: password };
const stayA = 'casa-do-horizonte';
const stayB = 'casa-entre-mares';

async function fixture(t, { legacy = false } = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'aori-api-test-'));
  const databasePath = join(directory, 'isolated.sqlite3');
  let server;
  let base;
  let legacyRows;
  t.after(async () => {
    await stop();
    const cleanup = resolve(directory);
    assert.equal(dirname(cleanup), resolve(tmpdir()));
    assert.ok(basename(cleanup).startsWith('aori-api-test-'));
    await rm(cleanup, { recursive: true, force: true });
  });
  if (legacy) {
    // Snapshot of the three-table schema that predates customer accounts.
    const original = new DatabaseSync(databasePath);
    try {
      original.exec(`
        CREATE TABLE Clientes (ID INTEGER PRIMARY KEY, Nome TEXT NOT NULL, CPF TEXT NOT NULL UNIQUE, Telefone TEXT NOT NULL, Email TEXT NOT NULL);
        CREATE TABLE Pagamentos (ID INTEGER PRIMARY KEY, ID_Reserva INTEGER NOT NULL, Valor INTEGER NOT NULL, Data_Pagamento TEXT NOT NULL, "Método" TEXT NOT NULL);
        CREATE TABLE "Funcionários" (ID INTEGER PRIMARY KEY, Nome TEXT NOT NULL, Cargo TEXT NOT NULL, Login TEXT NOT NULL COLLATE NOCASE UNIQUE, Senha TEXT NOT NULL);
      `);
      original.prepare('INSERT INTO Clientes VALUES (?,?,?,?,?)').run(41, clientA.nome, clientA.cpf, clientA.telefone, clientA.email);
      original.prepare('INSERT INTO Pagamentos VALUES (?,?,?,?,?)').run(52, 99, 12345, '2026-10-29', 'Pix');
      original.prepare('INSERT INTO "Funcionários" VALUES (?,?,?,?,?)').run(63, 'Funcionário Teste', 'Recepção', 'legado_fixture', await hashPassword(password));
      legacyRows = Object.fromEntries(['Clientes', 'Pagamentos', 'Funcionários'].map(table => [table, original.prepare(`SELECT * FROM "${table}" ORDER BY ID`).all()]));
    } finally { original.close(); }
  }
  async function start() {
    server = await createAoriServer({ databasePath });
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    base = `http://127.0.0.1:${server.address().port}`;
  }
  async function stop() {
    if (!server?.listening) return;
    await new Promise((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
      server.closeIdleConnections?.();
    });
  }
  await start();
  async function request(path, { method = 'GET', cookie, data, origin = base, rawBody } = {}) {
    const headers = {};
    if (cookie) headers.Cookie = cookie;
    if (method !== 'GET' && method !== 'HEAD') {
      headers.Origin = origin;
      headers['Content-Type'] = 'application/json';
    }
    const response = await fetch(base + path, { method, headers, body: rawBody ?? (data === undefined ? undefined : JSON.stringify(data)) });
    const text = await response.text();
    let body;
    try { body = JSON.parse(text); } catch { body = text; }
    const setCookie = response.headers.get('set-cookie') || '';
    const sessionCookie = setCookie.match(/(?:^|,\s*)(aori_session=[^;]*)/)?.[1];
    return { status: response.status, body, text, setCookie, cookie: sessionCookie, headers: response.headers };
  }
  return { request, databasePath, legacyRows, restart: async () => { await stop(); await start(); } };
}

test('o banco mantém as três tabelas obrigatórias e as colunas solicitadas', async t => {
  const app = await fixture(t);
  const db = new DatabaseSync(app.databasePath, { readOnly: true });
  try {
    const expected = {
      Clientes: ['ID', 'Nome', 'CPF', 'Telefone', 'Email'],
      Pagamentos: ['ID', 'ID_Reserva', 'Valor', 'Data_Pagamento', 'Método'],
      Funcionários: ['ID', 'Nome', 'Cargo', 'Login', 'Senha']
    };
    for (const [table, columns] of Object.entries(expected)) {
      assert.deepEqual(db.prepare(`PRAGMA table_info("${table}")`).all().map(row => row.name), columns);
    }
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(row => row.name);
    for (const table of ['Contas_Clientes', 'Sessoes_Clientes', 'Hospedagens', 'Favoritos']) assert.ok(tables.includes(table), table);
  } finally { db.close(); }
});

test('migração aditiva preserva linhas e IDs existentes nas três tabelas originais', async t => {
  const app = await fixture(t, { legacy: true });
  function assertPreserved() {
    const db = new DatabaseSync(app.databasePath, { readOnly: true });
    try {
      for (const [table, rows] of Object.entries(app.legacyRows)) {
        assert.deepEqual(db.prepare(`SELECT * FROM "${table}" ORDER BY ID`).all(), rows, table);
      }
      assert.equal(db.prepare('SELECT COUNT(*) AS total FROM Hospedagens').get().total, 6);
      for (const table of ['Contas_Clientes', 'Sessoes_Clientes', 'Favoritos']) {
        assert.equal(db.prepare(`SELECT COUNT(*) AS total FROM "${table}"`).get().total, 0, table);
      }
    } finally { db.close(); }
  }
  assertPreserved();
  await app.restart();
  assertPreserved();
});

test('cadastro cria sessão protegida e senhas com hashes distintos para a mesma senha', async t => {
  const app = await fixture(t);
  const anonymous = await app.request('/api/me');
  assert.equal(anonymous.status, 200);
  assert.deepEqual(anonymous.body, { user: null, favorites: [] });
  const registered = await app.request('/api/register', { method: 'POST', data: clientA });
  assert.equal(registered.status, 201);
  assert.ok(registered.cookie);
  assert.match(registered.setCookie, /HttpOnly/i);
  assert.match(registered.setCookie, /SameSite=Lax/i);
  assert.match(registered.setCookie, /Path=\//i);
  assert.equal(registered.body.user.email, clientA.email);
  assert.equal(registered.body.user.nome, clientA.nome);
  assert.deepEqual(registered.body.favorites, []);
  for (const key of ['senha', 'Senha', 'password', 'token', 'session', 'cpf', 'CPF']) {
    assert.equal(Object.hasOwn(registered.body, key), false);
    assert.equal(Object.hasOwn(registered.body.user, key), false);
  }
  const second = await app.request('/api/register', { method: 'POST', data: clientB });
  assert.equal(second.status, 201);
  const db = new DatabaseSync(app.databasePath, { readOnly: true });
  try {
    const hashes = db.prepare('SELECT "Senha" FROM "Contas_Clientes"').all().map(row => row.Senha);
    assert.equal(hashes.length, 2);
    assert.ok(hashes.every(hash => hash.startsWith('scrypt$') && !hash.includes(password)));
    assert.notEqual(hashes[0], hashes[1]);
  } finally { db.close(); }
  const me = await app.request('/api/me', { cookie: registered.cookie });
  assert.equal(me.body.user.id, registered.body.user.id);
});

test('favoritos pertencem à sessão, são idempotentes e persistem após reiniciar', async t => {
  const app = await fixture(t);
  assert.equal((await app.request('/api/favorites')).status, 401);
  assert.equal((await app.request(`/api/favorites/${stayA}`, { method: 'PUT', data: {} })).status, 401);
  const a = await app.request('/api/register', { method: 'POST', data: clientA });
  const b = await app.request('/api/register', { method: 'POST', data: clientB });
  const saved = await app.request(`/api/favorites/${stayA}`, { method: 'PUT', cookie: a.cookie, data: {} });
  assert.equal(saved.status, 200);
  assert.deepEqual(saved.body.favorites, [stayA]);
  const duplicate = await app.request(`/api/favorites/${stayA}`, { method: 'PUT', cookie: a.cookie, data: {} });
  assert.deepEqual(duplicate.body.favorites, [stayA]);
  assert.deepEqual((await app.request('/api/favorites', { cookie: b.cookie })).body.favorites, []);
  await app.request(`/api/favorites/${stayB}`, { method: 'PUT', cookie: b.cookie, data: {} });
  await app.restart();
  assert.deepEqual((await app.request('/api/favorites', { cookie: a.cookie })).body.favorites, [stayA]);
  assert.deepEqual((await app.request('/api/favorites', { cookie: b.cookie })).body.favorites, [stayB]);
  assert.equal((await app.request('/api/favorites/estadia-inexistente', { method: 'PUT', cookie: a.cookie, data: {} })).status, 404);
  const removed = await app.request(`/api/favorites/${stayA}`, { method: 'DELETE', cookie: a.cookie, data: {} });
  assert.equal(removed.status, 200);
  assert.deepEqual(removed.body.favorites, []);
  assert.deepEqual((await app.request('/api/favorites', { cookie: b.cookie })).body.favorites, [stayB]);
});

test('login e logout não permitem reutilizar uma sessão revogada', async t => {
  const app = await fixture(t);
  const registered = await app.request('/api/register', { method: 'POST', data: clientA });
  const wrongPassword = await app.request('/api/login', { method: 'POST', data: { email: clientA.email, senha: 'Senha errada 2026!' } });
  assert.equal(wrongPassword.status, 401);
  const unknown = await app.request('/api/login', { method: 'POST', data: { email: 'inexistente@example.test', senha: password } });
  assert.equal(unknown.status, 401);
  assert.equal(wrongPassword.body.error, unknown.body.error);
  const loggedIn = await app.request('/api/login', { method: 'POST', data: { email: clientA.email.toUpperCase(), senha: password } });
  assert.equal(loggedIn.status, 200);
  assert.ok(loggedIn.cookie);
  assert.notEqual(loggedIn.cookie, registered.cookie);
  const logout = await app.request('/api/logout', { method: 'POST', cookie: loggedIn.cookie, data: {} });
  assert.equal(logout.status, 200);
  assert.deepEqual(logout.body, { user: null, favorites: [] });
  assert.equal((await app.request('/api/me', { cookie: loggedIn.cookie })).body.user, null);
  assert.equal((await app.request('/api/favorites', { cookie: loggedIn.cookie })).status, 401);
});

test('cadastro valida CPF, senha e duplicidade sem registrar dados inválidos', async t => {
  const app = await fixture(t);
  assert.equal((await app.request('/api/register', { method: 'POST', data: { ...clientA, cpf: '11111111111' } })).status, 400);
  assert.equal((await app.request('/api/register', { method: 'POST', data: { ...clientA, senha: 'curta' } })).status, 400);
  assert.equal((await app.request('/api/register', { method: 'POST', data: clientA })).status, 201);
  assert.equal((await app.request('/api/register', { method: 'POST', data: { ...clientB, email: clientA.email.toUpperCase() } })).status, 409);
  assert.equal((await app.request('/api/register', { method: 'POST', data: { ...clientB, cpf: clientA.cpf } })).status, 409);
  const db = new DatabaseSync(app.databasePath, { readOnly: true });
  try { assert.equal(db.prepare('SELECT COUNT(*) AS total FROM "Clientes"').get().total, 1); }
  finally { db.close(); }
});

test('API rejeita alteração de outra origem, JSON inválido e corpo excessivo', async t => {
  const app = await fixture(t);
  const a = await app.request('/api/register', { method: 'POST', data: clientA });
  const blocked = await app.request(`/api/favorites/${stayA}`, { method: 'PUT', cookie: a.cookie, data: {}, origin: 'https://origem-invalida.example' });
  assert.equal(blocked.status, 403);
  assert.deepEqual((await app.request('/api/favorites', { cookie: a.cookie })).body.favorites, []);
  const malformed = await app.request('/api/login', { method: 'POST', rawBody: '{invalid' });
  assert.equal(malformed.status, 400);
  const oversized = await app.request('/api/login', { method: 'POST', rawBody: JSON.stringify({ email: 'x'.repeat(17000), senha: password }) });
  assert.equal(oversized.status, 413);
});

test('o servidor não publica banco, documentos internos ou travessia de diretórios', async t => {
  const app = await fixture(t);
  for (const path of ['/database/aori.sqlite3', '/database/schema.sql', '/scripts/server.mjs', '/%2e%2e%2fdatabase/aori.sqlite3']) {
    const response = await app.request(path);
    assert.ok([403, 404].includes(response.status), `${path}: ${response.status}`);
    assert.doesNotMatch(response.text, /SQLite format 3|CREATE TABLE|import http/);
  }
});

test('cadastro rejeita formatos inválidos de e-mail', async t => {
  const app = await fixture(t);

  const invalidEmails = [
    'sem-arroba',
    '@example.test',
    'teste@@example.test',
    'teste example@example.test',
    'teste@example.',
    'teste@example',
    'a'.repeat(255)
  ];

  for (const email of invalidEmails) {
    const response = await app.request('/api/register', {
      method: 'POST',
      data: { ...clientA, email }
    });

    assert.equal(
      response.status,
      400,
      `E-mail inválido aceito: ${email}`
    );
  }
});