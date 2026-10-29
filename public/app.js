import { stays } from './stays.js';

(() => {
  'use strict';

  const storageKey = 'aori:favorites:v1';
  const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  const form = document.querySelector('#search-form');
  const grid = document.querySelector('#stays-grid');
  if (!form || !grid) return;

  const feedback = document.querySelector('#search-feedback');
  const resultsCount = document.querySelector('#results-count');
  const favoriteToggle = document.querySelector('#favorites-toggle');
  const favoritesCount = document.querySelector('#favorites-count');
  const clearButton = document.querySelector('#clear-filters');
  const dialog = document.querySelector('#stay-dialog');
  const dialogContent = document.querySelector('#stay-dialog-content');
  const destinationField = form.elements.namedItem('destination');
  const checkinField = form.elements.namedItem('checkin');
  const checkoutField = form.elements.namedItem('checkout');
  const guestsField = form.elements.namedItem('guests');
  const initialGuests = () => Math.max(1, Number.parseInt(guestsField?.value || '1', 10) || 1);
  const state = { destination: '', filter: 'all', guests: initialGuests(), favoritesOnly: false };
  const validIds = new Set(stays.map((stay) => stay.id));
  let favorites = new Set();

  function readFavorites() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
      favorites = new Set(Array.isArray(saved) ? saved.filter((id) => validIds.has(id)) : []);
    } catch { /* Browsing and favorites still work when storage is unavailable. */ }
  }
  readFavorites();

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function icon(kind) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '20');
    svg.setAttribute('height', '20');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.5');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    const paths = {
      heart: ['M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z'],
      pin: ['M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z', 'M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z'],
      arrow: ['M5 12h14', 'm13 6 6 6-6 6'],
      check: ['m5 12 4 4L19 6']
    };
    (paths[kind] || paths.arrow).forEach((d) => {
      const path = document.createElementNS(ns, 'path');
      path.setAttribute('d', d);
      svg.append(path);
    });
    return svg;
  }

  function todayLocal() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function nextDate(value) {
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day + 1, 12);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function updateDateLimits() {
    const today = todayLocal();
    if (checkinField) checkinField.min = today;
    if (checkoutField) checkoutField.min = nextDate(checkinField?.value >= today ? checkinField.value : today);
  }

  function say(message, isError = false) {
    if (!feedback) return;
    feedback.textContent = message;
    feedback.classList.toggle('is-error', isError);
  }

  function normalize(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  function matchingStays() {
    const destination = normalize(state.destination);
    return stays.filter((stay) => {
      const matchesDestination = !destination || stay.destination === destination || normalize(`${stay.location} ${stay.name}`).includes(destination);
      return matchesDestination
        && stay.guests >= state.guests
        && (state.filter === 'all' || stay.filters.includes(state.filter))
        && (!state.favoritesOnly || favorites.has(stay.id));
    });
  }

  function refreshControls() {
    document.querySelectorAll('.destination-chip[data-destination]').forEach((button) => {
      const active = button.dataset.destination === state.destination;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    document.querySelectorAll('.filter-chip[data-filter]').forEach((button) => {
      const active = button.dataset.filter === state.filter;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    if (favoriteToggle) {
      favoriteToggle.classList.toggle('is-active', state.favoritesOnly);
      favoriteToggle.setAttribute('aria-pressed', String(state.favoritesOnly));
    }
    if (favoritesCount) favoritesCount.textContent = String(favorites.size);
    if (clearButton) clearButton.hidden = !(state.destination || state.filter !== 'all' || state.guests > 1 || state.favoritesOnly || checkinField?.value || checkoutField?.value);
  }

  function favoriteButton(stay) {
    const selected = favorites.has(stay.id);
    const button = element('button', `favorite-button${selected ? ' is-favorite' : ''}`);
    button.type = 'button';
    button.dataset.favorite = stay.id;
    button.setAttribute('aria-pressed', String(selected));
    button.setAttribute('aria-label', `${selected ? 'Remover' : 'Salvar'} ${stay.name} ${selected ? 'dos' : 'nos'} favoritos`);
    button.title = selected ? 'Remover dos favoritos' : 'Salvar lugar';
    button.append(icon('heart'));
    return button;
  }

  function card(stay, index) {
    const article = element('article', 'stay-card');
    article.dataset.stay = stay.id;
    article.style.setProperty('--card-index', String(index));
    const media = element('div', 'stay-media');
    const image = element('img');
    image.src = stay.photo;
    image.alt = stay.photoAlt;
    image.width = 900;
    image.height = 675;
    image.loading = 'lazy';
    image.decoding = 'async';
    media.append(image, element('span', 'stay-tag', stay.tag), favoriteButton(stay));
    const copy = element('div', 'stay-copy');
    const location = element('p', 'stay-location');
    location.append(icon('pin'), document.createTextNode(stay.location));
    const meta = element('div', 'stay-meta');
    meta.append(element('span', '', `Até ${stay.guests} hóspedes`), element('span', '', `${stay.bedrooms} ${stay.bedrooms === 1 ? 'quarto' : 'quartos'}`));
    const bottom = element('div', 'stay-bottom');
    const price = element('p', 'stay-price');
    price.append(element('strong', '', currency.format(stay.price)), document.createTextNode(' / noite'));
    const details = element('button', 'stay-details', 'Conhecer lugar');
    details.type = 'button';
    details.dataset.openStay = stay.id;
    details.setAttribute('aria-label', `Conhecer ${stay.name}`);
    details.append(icon('arrow'));
    bottom.append(price, details);
    copy.append(location, element('h3', 'stay-title', stay.name), element('p', 'stay-description', stay.description), meta, bottom);
    article.append(media, copy);
    return article;
  }

  function render() {
    const visible = matchingStays();
    const fragment = document.createDocumentFragment();
    visible.forEach((stay, index) => fragment.append(card(stay, index)));
    if (!visible.length) {
      const empty = element('div', 'empty-state');
      empty.append(element('p', 'empty-eyebrow', 'Vamos encontrar outro caminho?'), element('h3', '', state.favoritesOnly ? 'Seus lugares favoritos ficam aqui.' : 'Ainda não encontramos esse encontro.'), element('p', '', state.favoritesOnly ? 'Toque no coração de um lugar para guardá-lo. Você também pode ajustar os filtros para rever sua seleção.' : 'Experimente outra região, menos hóspedes ou uma nova maneira de estar.'));
      const reset = element('button', 'button button-primary', 'Ver todos os lugares');
      reset.type = 'button';
      reset.dataset.resetFilters = '';
      empty.append(reset);
      fragment.append(empty);
    }
    grid.replaceChildren(fragment);
    if (resultsCount) resultsCount.textContent = `${visible.length} ${visible.length === 1 ? 'lugar' : 'lugares'}`;
    refreshControls();
  }

  function resetFilters() {
    form.reset();
    Object.assign(state, { destination: '', filter: 'all', guests: initialGuests(), favoritesOnly: false });
    if (destinationField) destinationField.value = '';
    updateDateLimits();
    say('Seleção demonstrativa: nomes, valores e disponibilidade são exemplos para conhecer a Aori.');
    render();
  }

  function toggleFavorite(id) {
    if (!validIds.has(id)) return;
    readFavorites();
    const wasSelected = favorites.has(id);
    if (wasSelected) favorites.delete(id); else favorites.add(id);
    let saved = true;
    try { localStorage.setItem(storageKey, JSON.stringify([...favorites])); } catch { saved = false; }
    const stay = stays.find((item) => item.id === id);
    say(`${stay.name} ${wasSelected ? 'removido dos' : 'salvo nos'} favoritos.${saved ? '' : ' Os favoritos ficarão disponíveis apenas nesta visita.'}`);
    render();
    const nextFocus = grid.querySelector(`[data-favorite="${id}"]`) || (state.favoritesOnly ? grid.querySelector('.favorite-button') || favoriteToggle : null);
    nextFocus?.focus({ preventScroll: true });
  }

  function stayPageUrl(stay) {
    const requestedGuests = Number.parseInt(guestsField?.value || '2', 10) || 2;
    const guests = Math.min(stay.guests, Math.max(1, requestedGuests));
    const params = new URLSearchParams({ id: stay.id, guests: String(guests) });
    const checkin = checkinField?.value || '';
    const checkout = checkoutField?.value || '';
    const dateFormat = /^\d{4}-\d{2}-\d{2}$/;
    if (dateFormat.test(checkin) && dateFormat.test(checkout)
      && checkin >= todayLocal() && checkout > checkin
      && checkinField.validity.valid && checkoutField.validity.valid) {
      params.set('checkin', checkin);
      params.set('checkout', checkout);
    }
    return `/estadia.html?${params.toString()}`;
  }

  function openStay(id) {
    const stay = stays.find((item) => item.id === id);
    if (!stay || !dialog || !dialogContent) return;
    const image = element('img', 'dialog-image');
    image.src = stay.photo;
    image.alt = stay.photoAlt;
    image.width = 1000;
    image.height = 700;
    const copy = element('div', 'dialog-copy');
    const title = element('h2', 'dialog-title', stay.name);
    title.id = 'stay-dialog-title';
    const amenities = element('ul', 'dialog-amenities');
    stay.amenities.forEach((amenity) => {
      const item = element('li');
      item.append(icon('check'), document.createTextNode(amenity));
      amenities.append(item);
    });
    const price = element('p', 'stay-price');
    price.append(element('strong', '', currency.format(stay.price)), document.createTextNode(' / noite · valor ilustrativo'));
    const availability = element('a', 'button button-primary dialog-availability', 'Ver disponibilidade');
    availability.href = stayPageUrl(stay);
    availability.target = '_blank';
    availability.rel = 'noopener noreferrer';
    availability.setAttribute('aria-label', `Ver disponibilidade de ${stay.name} (abre em nova aba)`);
    availability.title = 'Abrir a página completa da estadia em uma nova aba';
    const newTabIcon = element('span', 'new-tab-icon', ' ↗');
    newTabIcon.setAttribute('aria-hidden', 'true');
    availability.append(newTabIcon);
    const notice = element('p', 'dialog-notice', 'Seleção demonstrativa. Nome, comodidades e preço são exemplos; a fotografia é ilustrativa.');
    copy.append(element('p', 'eyebrow dialog-eyebrow', 'Seleção demonstrativa'), title, element('p', 'stay-location', stay.location), element('p', 'dialog-story', stay.story), element('p', 'stay-meta', `Até ${stay.guests} hóspedes · ${stay.bedrooms} ${stay.bedrooms === 1 ? 'quarto' : 'quartos'}`), amenities, price, availability, notice);
    dialogContent.replaceChildren(image, copy);
    dialog.setAttribute('aria-labelledby', title.id);
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
      document.body.classList.add('dialog-open');
    }
  }

  function scrollToResults() {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.querySelector('#explorar')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    updateDateLimits();
    const checkin = checkinField?.value || '';
    const checkout = checkoutField?.value || '';
    if (checkin && checkin < todayLocal()) {
      say('Escolha uma data de chegada a partir de hoje.', true);
      checkinField.focus();
      return;
    }
    if ((checkin && !checkout) || (!checkin && checkout)) {
      say('Escolha as datas de chegada e saída, ou deixe as duas em aberto.', true);
      (!checkin ? checkinField : checkoutField)?.focus();
      return;
    }
    if (checkin && checkout <= checkin) {
      say('A data de saída precisa ser depois da chegada.', true);
      checkoutField.focus();
      return;
    }
    state.destination = destinationField?.value || '';
    state.guests = Math.max(1, Number.parseInt(guestsField?.value || '1', 10) || 1);
    render();
    const count = matchingStays().length;
    say(`${count} ${count === 1 ? 'lugar encontrado' : 'lugares encontrados'} nesta seleção demonstrativa.${checkin ? ' As datas são uma simulação; a disponibilidade real ainda não está conectada.' : ' Nomes e valores são ilustrativos.'}`);
    scrollToResults();
  });

  checkinField?.addEventListener('change', updateDateLimits);
  clearButton?.addEventListener('click', resetFilters);

  document.querySelectorAll('.destination-chip[data-destination]').forEach((button) => {
    button.addEventListener('click', () => {
      state.destination = button.dataset.destination || '';
      if (destinationField) destinationField.value = state.destination;
      render();
      say(`${matchingStays().length} lugares nesta seleção demonstrativa.`);
    });
  });

  document.querySelectorAll('.filter-chip[data-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      state.filter = button.dataset.filter || 'all';
      render();
      say(`${matchingStays().length} lugares nesta seleção demonstrativa.`);
    });
  });

  favoriteToggle?.addEventListener('click', () => {
    state.favoritesOnly = !state.favoritesOnly;
    render();
    const count = matchingStays().length;
    say(state.favoritesOnly ? `${count} ${count === 1 ? 'lugar nos seus favoritos' : 'lugares nos seus favoritos'} com estes filtros.` : 'Todos os lugares da seleção demonstrativa.');
    scrollToResults();
  });

  window.addEventListener('storage', (event) => {
    if (event.key === storageKey || event.key === null) {
      readFavorites();
      render();
    }
  });

  grid.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.hasAttribute('data-favorite')) toggleFavorite(button.dataset.favorite);
    else if (button.hasAttribute('data-open-stay')) openStay(button.dataset.openStay);
    else if (button.hasAttribute('data-reset-filters')) resetFilters();
  });

  dialog?.addEventListener('click', (event) => {
    if (event.target.closest('[data-close-dialog]')) dialog.close();
    if (event.target === dialog) {
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    }
  });
  dialog?.addEventListener('close', () => { document.body.classList.remove('dialog-open'); });

  const menuToggle = document.querySelector('#mobile-menu-toggle');
  const menu = document.querySelector('#mobile-menu');
  function closeMenu(restoreFocus = false) {
    if (!menu || !menuToggle) return;
    menu.hidden = true;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Abrir menu');
    if (restoreFocus) menuToggle.focus({ preventScroll: true });
  }
  menuToggle?.addEventListener('click', () => {
    if (!menu) return;
    const opening = menu.hidden;
    menu.hidden = !opening;
    menuToggle.setAttribute('aria-expanded', String(opening));
    menuToggle.setAttribute('aria-label', opening ? 'Fechar menu' : 'Abrir menu');
  });
  menu?.addEventListener('click', (event) => { if (event.target.closest('a')) closeMenu(); });
  document.addEventListener('click', (event) => {
    if (menu && menuToggle && !menu.hidden && !menu.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu && !menu.hidden) closeMenu(menu.contains(document.activeElement));
  });
  window.matchMedia('(min-width: 701px)').addEventListener('change', (event) => { if (event.matches) closeMenu(); });

  updateDateLimits();
  say('Seleção demonstrativa: nomes, valores e disponibilidade são exemplos para conhecer a Aori.');
  render();
})();
