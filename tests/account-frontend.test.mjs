
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM(
  '<!DOCTYPE html><html><body><header><div class="header-actions"></div></header></body></html>',
  { url: 'http://localhost/' }
);

dom.window.HTMLDialogElement.prototype.showModal = function () {
  this.open = true;
};

dom.window.HTMLDialogElement.prototype.close = function () {
  this.open = false;
  this.dispatchEvent(new dom.window.Event('close'));
};

globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.FormData = dom.window.FormData;
globalThis.localStorage = dom.window.localStorage;

// Evita abrir um canal real durante os testes.
globalThis.BroadcastChannel = class {
  addEventListener() {}
  postMessage() {}
  close() {}
};

let currentAccount = { user: null, favorites: [] };
const requests = [];

let loginShouldFail = false;

globalThis.fetch = async (url, options = {}) => {
  requests.push({ url, options });

  if (url === '/api/login') {
  if (loginShouldFail) {
    return {
      ok: false,
      status: 401,
      json: async () => ({ error: 'Credenciais inválidas.' })
    };
  }

  currentAccount = {
    user: { id: 2, nome: 'Carlos Souza' },
    favorites: []
  };

  return {
    ok: true,
    status: 200,
    json: async () => currentAccount
  };
}

  if (url === '/api/me') {
    return {
      ok: true,
      status: 200,
      json: async () => currentAccount
    };
  }

  if (url === '/api/logout') {
    currentAccount = { user: null, favorites: [] };

    return {
      ok: true,
      status: 200,
      json: async () => ({ success: true })
    };
  }
  
  if (url.startsWith('/api/favorites/')) {
  const id = decodeURIComponent(url.split('/').pop());
  const next = new Set(currentAccount.favorites);

  if (options.method === 'PUT') {
    next.add(id);
  } else if (options.method === 'DELETE') {
    next.delete(id);
  } else {
    throw new Error(`Método inesperado: ${options.method}`);
  }

  currentAccount = {
    ...currentAccount,
    favorites: [...next]
  };

  return {
    ok: true,
    status: 200,
    json: async () => ({
      favorites: [...next]
    })
  };
}

  throw new Error(`Requisição inesperada: ${url}`);
};

const { account } = await import('../public/account.js');

await account.ready;

test('inicia sem usuário e sem favoritos quando não há sessão', () => {
  assert.equal(account.user, null);
  assert.deepEqual([...account.favorites], []);

  const button = document.querySelector('.account-header-button');

  assert.ok(button);
  assert.equal(button.textContent, 'Entrar');
  assert.equal(button.getAttribute('aria-label'), 'Entrar na minha conta');
});

test('subscribe notifica imediatamente e permite cancelar a inscrição', async () => {
  let notifications = 0;

  const unsubscribe = account.subscribe(() => {
    notifications++;
  });

  assert.equal(notifications, 1);

  await account.refresh();

  assert.equal(notifications, 2);

  unsubscribe();

  await account.refresh();

  assert.equal(notifications, 2);
});

test('refresh atualiza usuário, favoritos e cabeçalho', async () => {
  currentAccount = {
    user: {
      id: 1,
      nome: 'Maria Silva'
    },
    favorites: ['hotel-1', 'hotel-2']
  };

  await account.refresh();

  assert.equal(account.user.id, 1);
  assert.equal(account.user.nome, 'Maria Silva');
  assert.deepEqual([...account.favorites], ['hotel-1', 'hotel-2']);

  const button = document.querySelector('.account-header-button');
  const label = document.querySelector('.account-customer-name');

  assert.equal(button.textContent, 'Sair');
  assert.equal(button.getAttribute('aria-label'), 'Sair da minha conta');
  assert.equal(label.textContent, 'Olá, Maria');
  assert.equal(label.hidden, false);
});

test('favorites retorna uma cópia independente do estado interno', () => {
  const favorites = account.favorites;

  favorites.add('favorito-inexistente');

  assert.equal(account.favorites.has('favorito-inexistente'), false);
  assert.deepEqual([...account.favorites], ['hotel-1', 'hotel-2']);
});

test('logout encerra a sessão e atualiza o cabeçalho', async () => {
  await account.logout();

  assert.equal(account.user, null);
  assert.deepEqual([...account.favorites], []);

  const button = document.querySelector('.account-header-button');
  const label = document.querySelector('.account-customer-name');

  assert.equal(button.textContent, 'Entrar');
  assert.equal(button.getAttribute('aria-label'), 'Entrar na minha conta');
  assert.equal(label.hidden, true);

  assert.ok(
    requests.some(request =>
      request.url === '/api/logout' &&
      request.options.method === 'POST'
    )
  );
});


test('ensureUser abre o diálogo e permite alternar entre login e cadastro', async () => {
  const promise = account.ensureUser('Entre para salvar seus favoritos.');

  // Aguarda a conclusão da etapa assíncrona de ensureUser.
  await new Promise(resolve => setImmediate(resolve));

  const dialog = document.querySelector('#account-dialog');

  assert.ok(dialog);
  assert.equal(dialog.open, true);
  assert.equal(
    dialog.querySelector('.account-explanation').textContent,
    'Entre para salvar seus favoritos.'
  );

  const title = dialog.querySelector('#account-dialog-title');
  const switchButton = dialog.querySelector('.account-switch');

  assert.equal(title.textContent, 'Entre e guarde seus lugares.');

  switchButton.click();

  assert.equal(title.textContent, 'Crie sua conta Aori.');

  const nameField = dialog.querySelector('[name="nome"]');
  const cpfField = dialog.querySelector('[name="cpf"]');
  const passwordField = dialog.querySelector('[name="senha"]');

  assert.equal(nameField.disabled, false);
  assert.equal(cpfField.disabled, false);
  assert.equal(passwordField.minLength, 10);
  assert.equal(passwordField.autocomplete, 'new-password');

  switchButton.click();

  assert.equal(title.textContent, 'Entre e guarde seus lugares.');
  assert.equal(nameField.disabled, true);
  assert.equal(cpfField.disabled, true);
  assert.equal(passwordField.minLength, 1);
  assert.equal(passwordField.autocomplete, 'current-password');

  dialog.querySelector('.account-close').click();

  assert.equal(await promise, null);
  assert.equal(dialog.open, false);
});

test('login exibe erro e autentica quando as credenciais são válidas', async () => {
  loginShouldFail = true;

  const promise = account.ensureUser();
  await new Promise(resolve => setImmediate(resolve));

  const dialog = document.querySelector('#account-dialog');
  const form = dialog.querySelector('form');

  form.elements.namedItem('email').value = 'carlos@example.com';
  form.elements.namedItem('senha').value = 'senha-incorreta';

  form.dispatchEvent(
    new dom.window.Event('submit', {
      bubbles: true,
      cancelable: true
    })
  );

  await new Promise(resolve => setImmediate(resolve));

  assert.equal(dialog.open, true);
  assert.equal(
    dialog.querySelector('.account-message').textContent,
    'Credenciais inválidas.'
  );

  loginShouldFail = false;
  form.elements.namedItem('senha').value = 'senha-correta';

  form.dispatchEvent(
    new dom.window.Event('submit', {
      bubbles: true,
      cancelable: true
    })
  );

  const authenticatedUser = await promise;

  assert.equal(dialog.open, false);
  assert.equal(authenticatedUser.id, 2);
  assert.equal(authenticatedUser.nome, 'Carlos Souza');
  assert.equal(account.user.id, 2);

  await account.logout();
});

test('toggleFavorite adiciona e remove favoritos no frontend', async () => {
  currentAccount = {
    user: { id: 2, nome: 'Carlos Souza' },
    favorites: []
  };

  await account.refresh();

  const id = 'casa-do-horizonte';

  assert.equal(account.favorites.has(id), false);

  const added = await account.toggleFavorite(id);

  assert.equal(added, true);
  assert.equal(account.favorites.has(id), true);
  assert.equal(account.isPending(id), false);

  assert.ok(
    requests.some(request =>
      request.url === `/api/favorites/${id}` &&
      request.options.method === 'PUT'
    )
  );

  const removed = await account.toggleFavorite(id);

  assert.equal(removed, true);
  assert.equal(account.favorites.has(id), false);
  assert.equal(account.isPending(id), false);

  assert.ok(
    requests.some(request =>
      request.url === `/api/favorites/${id}` &&
      request.options.method === 'DELETE'
    )
  );

  await account.logout();
});