
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const html = readFileSync(
  new URL('../public/estadia.html', import.meta.url),
  'utf8'
);

const dom = new JSDOM(html, {
  url: 'http://localhost/estadia.html?id=morada-das-oliveiras&guests=2&checkin=2028-02-01&checkout=2028-02-08'
});

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

globalThis.BroadcastChannel = class {
  addEventListener() {}
  postMessage() {}
  close() {}
};

const customer = { id: 1, nome: 'Cliente Teste' };
let currentAccount = { user: customer, favorites: [] };
let createStatus = 201;
const requests = [];

const reservation = {
  id: 42,
  stayId: 'morada-das-oliveiras',
  stayName: 'Morada das Oliveiras',
  checkin: '2028-03-01',
  checkout: '2028-03-05',
  guests: 2
};

globalThis.fetch = async (url, options = {}) => {
  requests.push({ url, options });

  if (url === '/api/me') {
    return {
      ok: true,
      status: 200,
      json: async () => currentAccount
    };
  }

  if (url === '/api/reservations' && options.method === 'POST') {
    return {
      ok: createStatus === 201,
      status: createStatus,
      json: async () => createStatus === 201
        ? { reservation }
        : { error: 'Essa hospedagem já está reservada nesse período.' }
    };
  }

  if (url === '/api/reservations' && !options.method) {
    return {
      ok: true,
      status: 200,
      json: async () => ({ reservations: [reservation] })
    };
  }

  throw new Error(`Requisição inesperada: ${url}`);
};

const { account } = await import('../public/account.js');
await account.ready;
await import('../public/estadia.js');

const form = document.querySelector('#property-booking-form');
const feedback = document.querySelector('#property-booking-feedback');

const flush = () => new Promise(resolve => setImmediate(resolve));

function selectPeriod() {
  const checkin = document.querySelector('#property-checkin');
  const checkout = document.querySelector('#property-checkout');

  checkin.value = '2028-03-01';
  checkout.value = '2028-03-05';

  checkin.dispatchEvent(new dom.window.Event('input'));
  checkout.dispatchEvent(new dom.window.Event('input'));
}

function submitReservation() {
  form.dispatchEvent(new dom.window.Event('submit', {
    bubbles: true,
    cancelable: true
  }));
}

test('a página inicializa e exibe calendário e hospedagem', () => {
  assert.equal(
    document.querySelector('#property-loading').hidden,
    true
  );

  assert.equal(
    document.querySelector('#property-content').hidden,
    false
  );

  assert.equal(
    document.querySelector('#property-title').textContent,
    'Morada das Oliveiras'
  );

  assert.equal(
    document.querySelector('#property-calendars').children.length,
    2
  );
});

test('o formulário envia uma reserva válida à API', async () => {
  selectPeriod();
  createStatus = 201;
  submitReservation();

  await flush();

  const sent = requests.filter(item =>
    item.url === '/api/reservations' &&
    item.options.method === 'POST'
  );

  assert.equal(sent.length, 1);

  assert.deepEqual(JSON.parse(sent[0].options.body), {
    stayId: 'morada-das-oliveiras',
    checkin: '2028-03-01',
    checkout: '2028-03-05',
    guests: 2
  });

  assert.match(feedback.textContent, /Reserva simulada #42/);
  assert.match(feedback.textContent, /Nenhum pagamento/);
  assert.equal(feedback.classList.contains('is-error'), false);
});

test('conflito de reserva apresenta mensagem de erro', async () => {
  createStatus = 409;
  submitReservation();

  await flush();

  assert.match(
    feedback.textContent,
    /já está reservada nesse período/
  );

  assert.equal(feedback.classList.contains('is-error'), true);
});

test('a consulta apresenta as reservas do cliente', async () => {
  const button = document.querySelector('#show-reservations');

  assert.ok(button, 'Botão de consulta não encontrado');

  button.click();
  await flush();

  const list = document.querySelector('#reservations-list');
  const status = document.querySelector('#reservations-feedback');

  assert.equal(list.children.length, 1);
  assert.match(list.textContent, /Morada das Oliveiras/);
  assert.match(list.textContent, /2028-03-01/);
  assert.match(list.textContent, /2 hóspedes/);
  assert.match(status.textContent, /1 reserva encontrada/);
});

test('cancelar login não envia reserva', async () => {
  currentAccount = { user: null, favorites: [] };
  await account.refresh();

  createStatus = 201;
  selectPeriod();

  const before = requests.filter(item =>
    item.url === '/api/reservations' &&
    item.options.method === 'POST'
  ).length;

  submitReservation();
  await flush();

  const dialog = document.querySelector('#account-dialog');

  assert.ok(dialog);
  assert.equal(dialog.open, true);

  dialog.querySelector('.account-close').click();
  await flush();

  const after = requests.filter(item =>
    item.url === '/api/reservations' &&
    item.options.method === 'POST'
  ).length;

  assert.equal(after, before);
  assert.match(feedback.textContent, /Entre na sua conta/);
});
