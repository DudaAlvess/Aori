import { stays } from './stays.js';

const params = new URLSearchParams(window.location.search);
const stay = stays.find(item => item.id === params.get('id'));
const loading = document.querySelector('#property-loading');
const content = document.querySelector('#property-content');
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const dayText = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
const shortDate = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const monthText = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });
const storageKey = 'aori:favorites:v1';

function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function stamp(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function parseDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1000 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(year, month - 1, day, 12);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

function nextDay(value) {
  const date = parseDate(value);
  date.setDate(date.getDate() + 1);
  return stamp(date);
}

function nightCount(start, end) {
  const first = parseDate(start);
  const last = parseDate(end);
  if (!first || !last) return 0;
  return Math.round((Date.UTC(last.getFullYear(), last.getMonth(), last.getDate()) - Date.UTC(first.getFullYear(), first.getMonth(), first.getDate())) / 86400000);
}

function checkIcon() {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', 'm5 12 4 4L19 6');
  svg.append(path);
  return svg;
}

if (!stay) {
  loading.hidden = true;
  document.querySelector('#property-not-found').hidden = false;
  document.title = 'Estadia não encontrada — Aori';
} else {
  document.title = `${stay.name}, ${stay.location} — Aori`;
  const set = (selector, text) => { document.querySelector(selector).textContent = text; };
  set('#property-region', stay.regionLabel);
  set('#property-breadcrumb-name', stay.name);
  set('#property-tag', stay.tag);
  set('#property-title', stay.name);
  set('#property-location', `${stay.location} · Santa Catarina`);
  set('#property-type', stay.propertyType || 'Uma estadia com alma');
  set('#property-capacity', `Até ${stay.guests} hóspedes · ${stay.bedrooms} ${stay.bedrooms === 1 ? 'quarto' : 'quartos'} · ${stay.bathrooms || 1} ${(stay.bathrooms || 1) === 1 ? 'banheiro' : 'banheiros'}`);
  set('#property-night-price', money.format(stay.price));
  set('#place-title', `Uma pausa em ${stay.location.replace(/, SC$/, '')}.`);
  set('#property-location-description', stay.locationDescription || stay.story);
  set('#property-region-location', stay.location);
  const descriptions = Array.isArray(stay.longDescription) ? stay.longDescription : [stay.longDescription || stay.story];
  document.querySelector('#property-description').replaceChildren(...descriptions.map(text => make('p', '', text)));
  const pictures = (stay.gallery?.length ? stay.gallery : [{ src: stay.photo, alt: stay.photoAlt }]).slice(0, 3);
  const gallery = document.querySelector('#property-gallery');
  pictures.forEach((picture, index) => {
    const frame = make('figure');
    const image = make('img');
    image.src = picture.src;
    image.alt = picture.alt || stay.photoAlt;
    image.width = 1200;
    image.height = 800;
    image.decoding = 'async';
    if (index === 0) image.fetchPriority = 'high';
    frame.append(image);
    gallery.append(frame);
  });
  const amenities = document.querySelector('#property-amenities');
  stay.amenities.forEach(amenity => {
    const item = make('li');
    item.append(checkIcon(), document.createTextNode(amenity));
    amenities.append(item);
  });
  const rules = stay.rules?.length ? stay.rules : ['Entrada a partir das 15h', 'Saída até as 11h'];
  document.querySelector('#property-rules').replaceChildren(...rules.map(rule => make('li', '', rule)));

  const favoriteButton = document.querySelector('#property-save');
  const favoriteLabel = document.querySelector('#property-save-label');
  const validIds = new Set(stays.map(item => item.id));
  let favorites = new Set();
  function readFavorites() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
      favorites = new Set(Array.isArray(saved) ? saved.filter(id => validIds.has(id)) : []);
    } catch { /* Keep the in-memory selection if local storage is unavailable. */ }
  }
  function renderFavorite() {
    const saved = favorites.has(stay.id);
    favoriteButton.setAttribute('aria-pressed', String(saved));
    favoriteButton.setAttribute('aria-label', `${saved ? 'Remover' : 'Salvar'} ${stay.name} ${saved ? 'dos' : 'nos'} favoritos`);
    favoriteLabel.textContent = saved ? 'Lugar salvo' : 'Salvar lugar';
  }
  readFavorites();
  renderFavorite();
  favoriteButton.addEventListener('click', () => {
    readFavorites();
    if (favorites.has(stay.id)) favorites.delete(stay.id); else favorites.add(stay.id);
    try { localStorage.setItem(storageKey, JSON.stringify([...favorites])); } catch { /* Favorites still work for this visit. */ }
    renderFavorite();
  });
  window.addEventListener('storage', event => {
    if (event.key === storageKey) { readFavorites(); renderFavorite(); }
  });

  const form = document.querySelector('#property-booking-form');
  const checkin = document.querySelector('#property-checkin');
  const checkout = document.querySelector('#property-checkout');
  const guests = document.querySelector('#property-guests');
  const feedback = document.querySelector('#property-booking-feedback');
  const summary = document.querySelector('#property-price-summary');
  const selection = document.querySelector('#calendar-selection');
  const calendars = document.querySelector('#property-calendars');
  const previous = document.querySelector('#calendar-previous');
  const next = document.querySelector('#calendar-next');
  const today = stamp(new Date());
  const todayDate = parseDate(today);
  const currentMonth = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1, 12);
  let cursor = new Date(currentMonth);

  for (let count = 1; count <= stay.guests; count += 1) guests.append(make('option', '', `${count} ${count === 1 ? 'hóspede' : 'hóspedes'}`));
  [...guests.options].forEach((option, index) => { option.value = String(index + 1); });
  const queryGuests = /^\d{1,2}$/.test(params.get('guests') || '') ? Number(params.get('guests')) : 2;
  guests.value = String(Math.min(stay.guests, Math.max(1, queryGuests)));
  const queryArrival = params.get('checkin');
  const queryDeparture = params.get('checkout');
  if (parseDate(queryArrival) && queryArrival >= today) {
    checkin.value = queryArrival;
    cursor = new Date(parseDate(queryArrival).getFullYear(), parseDate(queryArrival).getMonth(), 1, 12);
    if (parseDate(queryDeparture) && queryDeparture > queryArrival) checkout.value = queryDeparture;
  }

  function validPeriod() {
    return !!parseDate(checkin.value) && !!parseDate(checkout.value) && checkin.value >= today && checkout.value > checkin.value;
  }

  function syncUrl() {
    const url = new URL(window.location.href);
    url.search = '';
    url.searchParams.set('id', stay.id);
    url.searchParams.set('guests', guests.value);
    if (parseDate(checkin.value) && checkin.value >= today) {
      url.searchParams.set('checkin', checkin.value);
      if (validPeriod()) url.searchParams.set('checkout', checkout.value);
    }
    window.history.replaceState(null, '', url);
  }

  function renderSummary() {
    summary.replaceChildren();
    if (!validPeriod()) {
      summary.append(make('p', 'property-summary-hint', 'Escolha as datas para imaginar a sua estadia.'));
      return;
    }
    const nights = nightCount(checkin.value, checkout.value);
    const line = make('p', 'property-summary-line');
    line.append(make('span', '', `${money.format(stay.price)} × ${nights} ${nights === 1 ? 'noite' : 'noites'}`), make('span', '', money.format(stay.price * nights)));
    const total = make('p', 'property-summary-total');
    total.append(make('span', '', 'Total ilustrativo'), make('span', '', money.format(stay.price * nights)));
    summary.append(line, total);
  }

  function calendarMonth(date) {
    const month = make('section', 'property-month');
    const title = make('h3', 'property-month-title', monthText.format(date));
    title.id = `month-${date.getFullYear()}-${date.getMonth()}`;
    const weekdays = make('div', 'property-weekdays');
    weekdays.setAttribute('aria-hidden', 'true');
    ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].forEach(day => weekdays.append(make('span', '', day)));
    const days = make('div', 'property-month-days');
    days.setAttribute('role', 'group');
    days.setAttribute('aria-labelledby', title.id);
    const first = new Date(date.getFullYear(), date.getMonth(), 1, 12);
    const length = new Date(date.getFullYear(), date.getMonth() + 1, 0, 12).getDate();
    for (let padding = 0; padding < first.getDay(); padding += 1) {
      const blank = make('span');
      blank.setAttribute('aria-hidden', 'true');
      days.append(blank);
    }
    for (let day = 1; day <= length; day += 1) {
      const dateValue = new Date(date.getFullYear(), date.getMonth(), day, 12);
      const value = stamp(dateValue);
      const button = make('button', 'property-calendar-day', String(day));
      button.type = 'button';
      button.dataset.date = value;
      button.disabled = value < today;
      const edge = value === checkin.value || value === checkout.value;
      const between = validPeriod() && value > checkin.value && value < checkout.value;
      if (edge) button.classList.add('is-edge');
      if (between) button.classList.add('is-between');
      if (value === today) button.classList.add('is-today');
      button.setAttribute('aria-pressed', String(edge || between));
      const role = value === checkin.value ? ', chegada selecionada' : value === checkout.value ? ', saída selecionada' : between ? ', dentro do período selecionado' : '';
      button.setAttribute('aria-label', `${dayText.format(dateValue)}${role}`);
      days.append(button);
    }
    month.append(title, weekdays, days);
    return month;
  }

  function renderCalendars() {
    calendars.replaceChildren(calendarMonth(cursor), calendarMonth(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1, 12)));
    previous.disabled = cursor <= currentMonth;
    if (validPeriod()) {
      const nights = nightCount(checkin.value, checkout.value);
      selection.textContent = `${shortDate.format(parseDate(checkin.value))} a ${shortDate.format(parseDate(checkout.value))} · ${nights} ${nights === 1 ? 'noite' : 'noites'}`;
    } else if (checkin.value && parseDate(checkin.value) && checkin.value >= today) {
      selection.textContent = 'Agora escolha uma data de saída.';
    } else {
      selection.textContent = 'Escolha uma data de chegada.';
    }
  }

  function update({ moveCalendar = false } = {}) {
    checkin.min = today;
    checkout.min = nextDay(parseDate(checkin.value) && checkin.value >= today ? checkin.value : today);
    if (moveCalendar && parseDate(checkin.value) && checkin.value >= today) {
      const date = parseDate(checkin.value);
      cursor = new Date(date.getFullYear(), date.getMonth(), 1, 12);
    }
    feedback.textContent = '';
    feedback.classList.remove('is-error');
    renderSummary();
    renderCalendars();
    syncUrl();
  }

  calendars.addEventListener('click', event => {
    const target = event.target.closest('button[data-date]');
    if (!target || target.disabled) return;
    const value = target.dataset.date;
    if (!checkin.value || checkout.value || value <= checkin.value) {
      checkin.value = value;
      checkout.value = '';
    } else {
      checkout.value = value;
    }
    update();
    calendars.querySelector(`[data-date="${value}"]`)?.focus({ preventScroll: true });
  });
  previous.addEventListener('click', () => {
    if (cursor > currentMonth) {
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1, 12);
      renderCalendars();
    }
  });
  next.addEventListener('click', () => { cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1, 12); renderCalendars(); });
  document.querySelector('#clear-property-dates').addEventListener('click', () => {
    checkin.value = '';
    checkout.value = '';
    cursor = new Date(currentMonth);
    update();
  });
  checkin.addEventListener('input', () => {
    if (checkout.value && checkout.value <= checkin.value) checkout.value = '';
    update({ moveCalendar: true });
  });
  checkout.addEventListener('input', () => update());
  guests.addEventListener('change', () => update());
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!validPeriod()) {
      feedback.textContent = 'Escolha uma chegada a partir de hoje e uma saída posterior à chegada.';
      feedback.classList.add('is-error');
      return;
    }
    const nights = nightCount(checkin.value, checkout.value);
    feedback.classList.remove('is-error');
    feedback.textContent = `Seu período: ${shortDate.format(parseDate(checkin.value))} a ${shortDate.format(parseDate(checkout.value))}, ${nights} ${nights === 1 ? 'noite' : 'noites'}, ${guests.value} ${Number(guests.value) === 1 ? 'hóspede' : 'hóspedes'}. Total ilustrativo: ${money.format(stay.price * nights)}. Esta é uma simulação; nenhuma reserva foi criada e nenhum pagamento foi realizado.`;
  });

  update();
  loading.hidden = true;
  content.hidden = false;
}
