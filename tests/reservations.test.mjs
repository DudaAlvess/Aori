
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createAoriServer } from '../scripts/server.mjs';

const password = 'Senha de teste 2026!';
const clientA = {
  nome: 'Cliente Reserva A',
  cpf: '12345678909',
  telefone: '48999990001',
  email: 'reservaa@example.test',
  senha: password
};
const clientB = {
  nome: 'Cliente Reserva B',
  cpf: '98765432100',
  telefone: '48999990002',
  email: 'reservab@example.test',
  senha: password
};

const stayA = 'casa-do-horizonte';
const stayB = 'casa-entre-mares';

function futureDate(days) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function booking(start = 10, end = 15) {
  return {
    stayId: stayA,
    checkin: futureDate(start),
    checkout: futureDate(end),
    guests: 2
  };
}

async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'aori-reservations-'));
  const databasePath = join(directory, 'test.sqlite3');
  let server;
  let base;

  async function start() {
    server = createAoriServer({ databasePath });

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

  t.after(async () => {
    await stop();
    await rm(directory, { recursive: true, force: true });
  });

  await start();

  async function request(path, { method = 'GET', cookie, data } = {}) {
    const headers = {};

    if (cookie) headers.Cookie = cookie;
    if (data !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(base + path, {
      method,
      headers,
      body: data === undefined ? undefined : JSON.stringify(data)
    });

    const body = await response.json();
    const sessionCookie = response.headers.get('set-cookie')
      ?.match(/aori_session=[^;]+/)?.[0];

    return {
      status: response.status,
      body,
      cookie: sessionCookie
    };
  }

  async function register(client) {
    const result = await request('/api/register', {
      method: 'POST',
      data: client
    });

    assert.equal(result.status, 201);
    assert.ok(result.cookie);

    return result.cookie;
  }

  return {
    request,
    register,
    databasePath,
    restart: async () => {
      await stop();
      await start();
    }
  };
}

test('reservas exigem autenticação', async t => {
  const app = await fixture(t);

  const list = await app.request('/api/reservations');
  assert.equal(list.status, 401);

  const create = await app.request('/api/reservations', {
    method: 'POST',
    data: booking()
  });
  assert.equal(create.status, 401);
});

test('reserva válida é criada, consultada e persiste após reinício', async t => {
  const app = await fixture(t);
  const cookie = await app.register(clientA);
  const period = booking();

  const created = await app.request('/api/reservations', {
    method: 'POST',
    cookie,
    data: period
  });

  assert.equal(created.status, 201);
  assert.ok(created.body.reservation.id);
  assert.equal(created.body.reservation.stayId, period.stayId);
  assert.equal(created.body.reservation.checkin, period.checkin);
  assert.equal(created.body.reservation.checkout, period.checkout);
  assert.equal(created.body.reservation.guests, 2);

  const list = await app.request('/api/reservations', { cookie });

  assert.equal(list.status, 200);
  assert.equal(list.body.reservations.length, 1);
  assert.equal(
    list.body.reservations[0].id,
    created.body.reservation.id
  );

  await app.restart();

  const persisted = await app.request('/api/reservations', { cookie });
  assert.equal(persisted.status, 200);
  assert.equal(persisted.body.reservations.length, 1);

  const db = new DatabaseSync(app.databasePath, { readOnly: true });

  try {
    const count = db.prepare(
      'SELECT COUNT(*) AS total FROM Reservas'
    ).get();

    assert.equal(count.total, 1);

    const payments = db.prepare(
      'SELECT COUNT(*) AS total FROM Pagamentos'
    ).get();

    assert.equal(payments.total, 0);
  } finally {
    db.close();
  }
});

test('datas inválidas e hóspedes inválidos são rejeitados', async t => {
  const app = await fixture(t);
  const cookie = await app.register(clientA);

  const invalid = [
    { ...booking(), checkin: '2026-02-30' },
    { ...booking(), checkout: 'data-invalida' },
    { ...booking(), checkin: futureDate(-2) },
    { ...booking(), checkout: futureDate(10) },
    { ...booking(), checkout: futureDate(9) },
    { ...booking(), guests: 0 },
    { ...booking(), guests: 10000 },
    { ...booking(), guests: 1.5 }
  ];

  for (const data of invalid) {
    const result = await app.request('/api/reservations', {
      method: 'POST',
      cookie,
      data
    });

    assert.equal(result.status, 400, JSON.stringify(data));
  }

  const missing = await app.request('/api/reservations', {
    method: 'POST',
    cookie,
    data: { ...booking(), stayId: 'inexistente' }
  });

  assert.equal(missing.status, 404);

  const list = await app.request('/api/reservations', { cookie });
  assert.deepEqual(list.body.reservations, []);
});

test('reservas conflitantes são bloqueadas para qualquer cliente', async t => {
  const app = await fixture(t);
  const cookieA = await app.register(clientA);
  const cookieB = await app.register(clientB);

  const first = await app.request('/api/reservations', {
    method: 'POST',
    cookie: cookieA,
    data: booking(10, 15)
  });

  assert.equal(first.status, 201);

  for (const [start, end] of [
    [10, 15],
    [12, 17],
    [8, 12],
    [9, 16]
  ]) {
    const conflict = await app.request('/api/reservations', {
      method: 'POST',
      cookie: cookieB,
      data: booking(start, end)
    });

    assert.equal(conflict.status, 409);
  }

  const adjacent = await app.request('/api/reservations', {
    method: 'POST',
    cookie: cookieB,
    data: booking(15, 18)
  });

  assert.equal(adjacent.status, 201);

  const differentStay = await app.request('/api/reservations', {
    method: 'POST',
    cookie: cookieB,
    data: { ...booking(10, 15), stayId: stayB }
  });

  assert.equal(differentStay.status, 201);

  const listA = await app.request('/api/reservations', {
    cookie: cookieA
  });
  const listB = await app.request('/api/reservations', {
    cookie: cookieB
  });

  assert.equal(listA.body.reservations.length, 1);
  assert.equal(listB.body.reservations.length, 2);

  assert.ok(listA.body.reservations.every(
    item => !listB.body.reservations.some(
      other => other.id === item.id
    )
  ));
});
