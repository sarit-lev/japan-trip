/* יפן של שמחה ובני — app logic. Vanilla JS, no build step.
   Screens: today, journey, map, tips. Data: data/trip.json. Weather: Open-Meteo, cached in localStorage. */
(() => {
'use strict';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bidi = s => String(s ?? '').split(/(\+?[A-Za-z0-9][A-Za-z0-9 ,.'\-\/:+]*[A-Za-z0-9.%]|[A-Za-z0-9])/).map((p, i) => i % 2 ? `<bdi dir="ltr">${esc(p)}</bdi>` : esc(p)).join('');
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

// iOS shows :active only when a touch listener exists
document.addEventListener('touchstart', () => {}, { passive: true });

// ---------- icons ----------
const GMAPS_LL = (s) => `https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}`;
const AMAPS = (s) => `https://maps.apple.com/?q=${encodeURIComponent(s.en || s.name)}&ll=${s.lat},${s.lng}`;
const ICON = {
  gmaps: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7l6-3 6 3 6-3v13l-6 3-6-3-6 3z"/><path d="M9 4v13M15 7v13"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>',
  sight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h18M5 7l1-3h12l1 3M7 7v13M17 7v13M4 11h16"/></svg>',
  food: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M16 3c-2 1-3 4-3 7h4v11M17 3v7"/></svg>',
  shop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h12l1 14H5L6 7z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/></svg>',
  tech: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18h2"/></svg>',
  hotel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18V8M3 14h18v4M7 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM11 11h7a3 3 0 0 1 3 3"/></svg>',
  transit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 14l8-2 4-8 2 1-2 8 6 3-1 2-6-1-3 4-2-1 1-4-6-1z"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
  kosher: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3l3 5h6l-4.5 4L18 18l-6-3-6 3 1.5-6L3 8h6z"/></svg>',
  shabbat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 21h8M10 21v-9h4v9M12 12V7M12 3c1 1.5 1.5 2.5 0 4-1.5-1.5-1-2.5 0-4z"/></svg>',
  bus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="4" width="16" height="14" rx="3"/><path d="M4 11h16M8 21v-3M16 21v-3M8 15h.01M16 15h.01"/></svg>',
  train: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="5" y="3" width="14" height="15" rx="3"/><path d="M5 11h14M9 21l-1.5-3M15 21l1.5-3M9 15h.01M15 15h.01"/></svg>',
  shinkansen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 15c3-7 7-9 14-9h4v5c0 2-1 4-4 4H3z"/><path d="M3 15h18M7 19h10"/></svg>',
  boat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l2 2c2 1 4-1 7-1s5 2 7 1l2-2M5 16l-1-5 8-2 8 2-1 5M12 9V4"/></svg>',
  ropeway: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6l20-3M12 4.5V9"/><rect x="7" y="9" width="10" height="9" rx="2"/><path d="M7 13h10"/></svg>',
  walk: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13" cy="4" r="1.5"/><path d="M10 21l2-6 3 2v4M8 12l3-3 3 1 2 3"/></svg>',
  flight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 14l8-2 4-8 2 1-2 8 6 3-1 2-6-1-3 4-2-1 1-4-6-1z"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 21s6-6 6-11a6 6 0 0 0-12 0c0 5 6 11 6 11z"/><circle cx="12" cy="10" r="2"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>',
};
const MODE_LABEL = { bus: 'אוטובוס', train: 'רכבת', shinkansen: 'שינקנסן', boat: 'שייט', ropeway: 'רכבל', walk: 'ברגל', flight: 'טיסה' };
const KIND_LABEL = { sight: 'אתר', food: 'אוכל כשר', shop: 'קניות', tech: 'טכנולוגיה', hotel: 'לינה', transit: 'שדה תעופה', train: 'רכבת', info: 'כדאי לדעת', kosher: 'כשרות', shabbat: 'שבת' };
const KIND_VAR = { sight: 'var(--k-sight)', food: 'var(--k-food)', kosher: 'var(--k-food)', shop: 'var(--k-shop)', tech: 'var(--k-tech)', hotel: 'var(--k-hotel)', transit: 'var(--k-transit)', train: 'var(--k-transit)', info: 'var(--k-transit)', shabbat: 'var(--k-sight)' };

// ---------- weather icons (WMO codes) ----------
const WX = {
  sun:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg>',
  partly: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="9" r="3.5"/><path d="M9 2.5v1.5M2.5 9H4M4.4 4.4l1 1M4.4 13.6l1-1"/><path d="M9 20h8.5a3.5 3.5 0 0 0 .5-7 5 5 0 0 0-9.6 1.2A3 3 0 0 0 9 20z"/></svg>',
  cloud: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M7 19h10.5a4 4 0 0 0 .6-8 6 6 0 0 0-11.5 1.4A3.3 3.3 0 0 0 7 19z"/></svg>',
  fog:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 9h16M4 13h16M6 17h12"/></svg>',
  rain: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 15h10.5a4 4 0 0 0 .6-8 6 6 0 0 0-11.5 1.4A3.3 3.3 0 0 0 7 15z"/><path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3"/></svg>',
  snow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 14h10.5a4 4 0 0 0 .6-8 6 6 0 0 0-11.5 1.4A3.3 3.3 0 0 0 7 14z"/><path d="M8 18h.01M12 18h.01M16 18h.01M10 21h.01M14 21h.01"/></svg>',
  storm: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 14h10.5a4 4 0 0 0 .6-8 6 6 0 0 0-11.5 1.4A3.3 3.3 0 0 0 7 14z"/><path d="M13 14l-2.5 4h3L11 22"/></svg>',
};
function wmo(code) {
  if (code === 0) return ['בהיר', 'sun'];
  if (code === 1) return ['בהיר ברובו', 'sun'];
  if (code === 2) return ['מעונן חלקית', 'partly'];
  if (code === 3) return ['מעונן', 'cloud'];
  if (code >= 45 && code <= 48) return ['ערפל', 'fog'];
  if (code >= 51 && code <= 57) return ['טפטוף', 'rain'];
  if (code >= 61 && code <= 67) return ['גשם', 'rain'];
  if (code >= 71 && code <= 77) return ['שלג', 'snow'];
  if (code >= 80 && code <= 82) return ['ממטרים', 'rain'];
  if (code >= 85 && code <= 86) return ['ממטרי שלג', 'snow'];
  if (code >= 95) return ['סופת רעמים', 'storm'];
  return ['', 'cloud'];
}
function advice(d) {
  const out = [];
  if (d.rain >= 60) out.push('גשם היום, קחו מטרייה');
  else if (d.rain >= 35) out.push('אולי גשם, מטרייה קטנה בתיק');
  if (d.max >= 30) out.push('חם ולח, מים ובגדים קלים');
  else if (d.min <= 4) out.push('קר מאוד בבוקר ובערב, מעיל חם וכפפות');
  else if (d.min <= 9) out.push('קר בבוקר ובערב, מעיל');
  else if (d.max <= 16) out.push('קריר, שכבה חמה');
  else if (d.max <= 22) out.push('נעים, שכבה דקה לערב');
  if (!out.length) out.push('יום נוח');
  return out.join('. ') + '.';
}

// ---------- dates ----------
const HE_MONTH = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
function isoToday(tz) {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' });
  return f.format(new Date());
}
function fmtDate(iso) {
  const [, m, d] = iso.split('-').map(Number);
  return `${d} ב${HE_MONTH[m - 1]}`;
}
function shortDate(iso) { const [, m, d] = iso.split('-').map(Number); return `${d}.${m}`; }
function daysBetween(a, b) { return Math.round((new Date(b) - new Date(a)) / 864e5); }
function fmtMin(min) {
  if (min < 60) return `${min} דק׳`;
  const h = Math.floor(min / 60), m = min % 60;
  if (!m) return h === 1 ? 'שעה' : h === 2 ? 'שעתיים' : `${h} שעות`;
  if (m === 30) return h === 1 ? 'שעה וחצי' : h === 2 ? 'שעתיים וחצי' : `${h} וחצי שעות`;
  return `${h}:${String(m).padStart(2, '0')} שעות`;
}
function timeOf(isoDateTime) { return isoDateTime.slice(11, 16); }

// ---------- state ----------
const state = {
  trip: null, outline: null,
  dayIdx: 0, todayIdx: 0, screen: 'today',
  weather: null, bigMap: null, miniMap: null, mapLayer: null, mapFilter: 'all', meMarker: null,
  tipSeg: 'kosher', scroll: {},
};

async function loadJSON(path) { const r = await fetch(path); if (!r.ok) throw new Error(path); return r.json(); }

// ---------- boot ----------
async function boot() {
  const [trip, outline, credits] = await Promise.all([loadJSON('data/trip.json?v=7'), loadJSON('data/japan-outline.json?v=7'), loadJSON('data/credits.json?v=7').catch(() => null)]);
  state.trip = trip; state.outline = outline; state.credits = credits;

  const q = new URLSearchParams(location.search);
  const forced = q.get('date');
  const today = forced || isoToday(trip.tz);
  const idx = trip.days.findIndex(d => d.date === today);
  if (idx >= 0) state.todayIdx = idx;
  else if (today < trip.days[0].date) state.todayIdx = -1;      // before the trip
  else state.todayIdx = trip.days.length;                        // after the trip
  state.dayIdx = Math.min(Math.max(state.todayIdx, 0), trip.days.length - 1);
  state.today = today;

  wireNav();
  tickClock(); setInterval(tickClock, 15000); document.addEventListener('visibilitychange', tickClock);
  renderToday();
  renderJourney();
  renderTipsShell();
  loadWeather().then(() => { renderWeather(); renderJourney(); });

  const hash = location.hash.replace('#', '');
  if (['today', 'journey', 'map', 'tips'].includes(hash)) go(hash, false);

  if ('serviceWorker' in navigator) {
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (navigator.serviceWorker.controller && !reloaded) { reloaded = true; location.reload(); } });
    navigator.serviceWorker.register('sw.js').then(r => r.update && r.update()).catch(() => {});
  }
}

// ---------- clock: Israel time, always on top ----------
function tickClock() {
  const T = state.trip; if (!T) return;
  const D = T.days[Math.min(Math.max(state.todayIdx, 0), T.days.length - 1)];
  const hereTz = (D.weatherAt && D.weatherAt.tz) || T.tz;
  const f = tz => new Intl.DateTimeFormat('he-IL', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
  const hereName = hereTz === 'Asia/Bangkok' ? 'בבנגקוק' : hereTz === 'Asia/Jerusalem' ? '' : 'ביפן';
  const el = $('#clock');
  el.innerHTML = `<span class="clock__il">בארץ <b><bdi>${f('Asia/Jerusalem')}</bdi></b></span>${hereName ? `<span class="clock__sep"></span><span class="clock__here">${hereName} <b><bdi>${f(hereTz)}</bdi></b></span>` : ''}`;
}

// ---------- navigation ----------
function wireNav() {
  $$('.tab').forEach(b => b.addEventListener('click', () => go(b.dataset.go)));
  $('#dayPrev').addEventListener('click', () => setDay(state.dayIdx - 1));
  $('#dayNext').addEventListener('click', () => setDay(state.dayIdx + 1));
  $('#btnBackToday').addEventListener('click', () => setDay(Math.min(Math.max(state.todayIdx, 0), state.trip.days.length - 1)));
  $('#miniMapBtn').addEventListener('click', () => { state.mapFilter = String(state.dayIdx); go('map'); });
  $('#btnLocate').addEventListener('click', locateMe);
  $('#scrim').addEventListener('click', closeSheet);
  $$('[data-close]').forEach(b => b.addEventListener('click', closeSheet));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });
  wireSheetDrag();
  window.addEventListener('hashchange', () => {
    const h = location.hash.replace('#', '');
    if (h && h !== state.screen && ['today', 'journey', 'map', 'tips'].includes(h)) go(h, false);
  });

  // swipe between days on the Today screen (buttons remain the non-gesture alternative)
  let sx = 0, sy = 0, tracking = false;
  const scr = $('#screen-today');
  scr.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; tracking = true; }, { passive: true });
  scr.addEventListener('touchend', e => {
    if (!tracking) return; tracking = false;
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 70 && Math.abs(dy) < 50) setDay(state.dayIdx + (dx > 0 ? -1 : 1)); // RTL: swipe right = previous
  }, { passive: true });
}

function go(name, push = true) {
  state.scroll[state.screen] = window.scrollY;
  state.screen = name;
  $$('.screen').forEach(s => s.hidden = s.dataset.screen !== name);
  $$('.tab').forEach(t => { const on = t.dataset.go === name; t.classList.toggle('is-active', on); on ? t.setAttribute('aria-current', 'page') : t.removeAttribute('aria-current'); });
  document.body.classList.toggle('is-map', name === 'map');
  if (push) history.replaceState(null, '', '#' + name);
  if (name === 'map') { requestAnimationFrame(renderBigMap); window.scrollTo(0, 0); }
  else window.scrollTo(0, state.scroll[name] || 0);
}

function setDay(i) {
  const n = state.trip.days.length;
  if (i < 0 || i >= n) return;
  state.dayIdx = i;
  renderToday();
  window.scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' });
}

// ---------- Today ----------
function renderToday() {
  const T = state.trip, D = T.days[state.dayIdx], n = T.days.length;
  const isToday = state.dayIdx === state.todayIdx;
  const before = state.todayIdx === -1, after = state.todayIdx === n;

  $('#dayPrev').disabled = state.dayIdx === 0;
  $('#dayNext').disabled = state.dayIdx === n - 1;
  $('#btnBackToday').hidden = isToday || before || after;
  $('#todayTitle').textContent = isToday ? 'היום' : before ? 'בקרוב' : after ? 'המסע' : (state.dayIdx < state.todayIdx ? 'היה' : 'בהמשך');

  const base = T.bases.find(b => b.id === D.base);
  const tripDays = T.days.filter(d => d.n > 0).length;
  const kicker = D.n > 0 ? `יום ${D.n} מתוך ${tripDays}` : 'בדרך';

  let pre = '';
  if (before && state.dayIdx === 0) {
    const left = daysBetween(state.today, T.days[0].date);
    pre = `<div class="count"><span class="count__n num">${left}</span><span class="count__l">${left === 1 ? 'יום להמראה' : 'ימים להמראה'}</span></div>`;
  }
  const credit = (state.credits || {})[D.img];
  $('#hero').innerHTML = `
    ${D.img ? `<img class="hero__img" src="img/${D.img}.jpg" alt="${esc(credit ? credit.title : D.title)}">` : ''}
    <div class="hero__shade" aria-hidden="true"></div>
    <div class="hero__top">
      <span class="badge">${esc(kicker)}</span>
      ${isToday ? '<span class="badge badge--live">היום</span>' : D.shabbat ? '<span class="badge">שבת</span>' : ''}
    </div>
    <div class="hero__body">
      <p class="hero__kicker">${esc(D.weekday)}, <bdi>${esc(fmtDate(D.date))}</bdi></p>
      ${pre}
      <h2 class="hero__title">${esc(D.title)}</h2>
      <p class="hero__sub">${esc(D.subtitle)}</p>
    </div>`;

  const R = D.route, rc = $('#route');
  rc.hidden = !R;
  if (R) {
    const hotel = base && base.hotel;
    const stopsN = D.stops.filter(s => s.kind !== 'hotel' && s.kind !== 'transit').length || D.stops.length;
    rc.innerHTML = `
      <div class="route__end"><div class="route__code">${esc(R.from)}</div><div class="route__city">${D.n > 0 ? 'יציאה בבוקר' : 'המראה'}</div></div>
      <div class="route__mid"><div class="route__line">${ICON[R.mode] || ICON.bus}</div><div class="route__dur">${R.mode === 'flight' ? '' : 'כ-'}${esc(fmtMin(R.minutes))}</div></div>
      <div class="route__end route__end--to"><div class="route__code">${esc(R.to)}</div><div class="route__city">${MODE_LABEL[R.mode] || ''}</div></div>
      <dl class="route__meta">
        <div><dt>לינה</dt><dd>${esc(D.sleep)}</dd></div>
        <div><dt>${hotel ? 'טלפון מלון' : 'יום'}</dt><dd>${hotel ? `<a href="tel:${esc(hotel.tel.replace(/[^+\d]/g, ''))}" style="text-decoration:none;color:inherit"><bdi>${esc(hotel.tel)}</bdi></a>` : esc(D.weekday)}</dd></div>
        <div><dt>תחנות</dt><dd>${stopsN}</dd></div>
      </dl>`;
  }

  renderWeather();

  const N = D.note, nc = $('#note');
  nc.hidden = !N;
  if (N) nc.innerHTML = `<span class="note__icon" aria-hidden="true">${ICON.info}</span><div><h3 class="note__title">${esc(N.title)}</h3><p class="note__text">${bidi(N.text)}</p></div>`;

  const legs = D.legs || [];
  let html = '';
  D.stops.forEach((s, i) => {
    if (i > 0 && legs[i - 1]) html += legHTML(legs[i - 1]);
    html += `<li class="stop card" style="--k:${KIND_VAR[s.kind] || 'var(--label-2)'}">
      <div class="stop__head"><span class="stop__ico">${ICON[s.kind] || ICON.pin}</span><div style="min-width:0">
        <h3 class="stop__name">${esc(s.name)}</h3>
        ${s.ja || s.en ? `<span class="stop__ja">${s.ja ? `<span class="ja">${esc(s.ja)}</span> · ` : ''}<bdi>${esc(s.en || '')}</bdi></span>` : ''}
      </div></div>
      ${s.lat ? `<a class="stop__go" href="${GMAPS_LL(s)}" target="_blank" rel="noopener" aria-label="לפתוח את ${esc(s.name)} בגוגל מפות">${ICON.gmaps}</a>` : ''}
      ${s.blurb ? `<p class="stop__blurb">${bidi(s.blurb)}</p>` : ''}
    </li>`;
  });
  for (let j = D.stops.length - 1; j < legs.length; j++) if (legs[j]) html += legHTML(legs[j]);
  $('#timeline').innerHTML = html;

  const tips = D.tips || [];
  $('#dayTipsWrap').hidden = !tips.length;
  $('#dayTips').innerHTML = tips.map(t => rowHTML(t)).join('');
  $('#daySource').textContent = D.n > 0 ? 'לפי חוברת הטיול ודף המלונות. סדר הביקורים לפי המדריך בשטח.' : 'שעות הטיסות לפי הכרטיסים.';
  renderMiniMap(D);
}

function legHTML(l) {
  const dest = l.to ? `${esc(l.from)} ← ${esc(l.to)}` : esc(l.from);
  return `<li class="leg"><span class="leg__chip">${ICON[l.mode] || ICON.bus}<span>${MODE_LABEL[l.mode] || ''} · ${l.approx ? 'כ-' : ''}${esc(fmtMin(l.minutes))}</span></span>${l.note ? `<span class="leg__note">${esc(l.note)}</span>` : ''}</li>`;
}
function rowHTML(t) {
  const k = t.kind || 'info';
  return `<li class="row" style="--k:${KIND_VAR[k] || 'var(--gray)'}"><span class="row__icon">${ICON[k] || ICON.info}</span>
    <p class="row__text"><span class="row__kicker">${esc(KIND_LABEL[k] || '')}</span>${bidi(t.text)}${t.url ? ` <a href="${esc(t.url)}" target="_blank" rel="noopener">מקור</a>` : ''}</p></li>`;
}

// ---------- weather ----------
const WX_KEY = 'japan-weather-v1';
function wxSlots() {
  // one slot per distinct location (lat,lng), so Open-Meteo gets a single multi-location request
  const seen = new Map();
  state.trip.days.forEach(d => { const w = d.weatherAt; if (!w) return; const k = `${w.lat},${w.lng}`; if (!seen.has(k)) seen.set(k, w); });
  return [...seen.entries()];
}
async function loadWeather() {
  try { const c = JSON.parse(localStorage.getItem(WX_KEY)); if (c && c.data) state.weather = c; } catch {}
  if (!navigator.onLine && state.weather) return;
  const slots = wxSlots();
  const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + slots.map(([, w]) => w.lat).join(',') +
    '&longitude=' + slots.map(([, w]) => w.lng).join(',') +
    '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset&timezone=auto&forecast_days=16';
  try {
    const r = await fetch(url); if (!r.ok) throw 0;
    let j = await r.json(); if (!Array.isArray(j)) j = [j];
    const data = {};
    j.forEach((loc, i) => {
      const key = slots[i][0]; data[key] = {};
      loc.daily.time.forEach((t, k) => { data[key][t] = { code: loc.daily.weather_code[k], max: loc.daily.temperature_2m_max[k], min: loc.daily.temperature_2m_min[k], rain: loc.daily.precipitation_probability_max[k], sunrise: loc.daily.sunrise[k], sunset: loc.daily.sunset[k] }; });
    });
    state.weather = { at: Date.now(), data };
    try { localStorage.setItem(WX_KEY, JSON.stringify(state.weather)); } catch {}
  } catch { /* keep cached */ }
}
function wxFor(D) {
  if (!state.weather || !D.weatherAt) return null;
  const k = `${D.weatherAt.lat},${D.weatherAt.lng}`;
  return (state.weather.data[k] || {})[D.date] || null;
}
function renderWeather() {
  const D = state.trip.days[state.dayIdx];
  const el = $('#weather');
  const w = wxFor(D);
  const base = state.trip.bases.find(b => b.id === D.base);
  const place = D.weatherAt ? D.weatherAt.name : (base ? base.city : '');
  if (!w) {
    el.className = 'card weather weather--empty';
    el.innerHTML = `<p class="weather__advice"><b>מזג האוויר ב${esc(place)}:</b> ${bidi(base && base.climate ? base.climate : 'התחזית תופיע כשיש קליטה')}.</p>`;
    return;
  }
  const [desc, ic] = wmo(w.code);
  const ageH = Math.round((Date.now() - state.weather.at) / 36e5);
  el.className = 'card weather';
  el.innerHTML = `
    <div class="weather__icon" aria-hidden="true">${WX[ic]}</div>
    <div class="weather__main"><span class="weather__temp"><bdi>${Math.round(w.max)}°</bdi></span><span class="weather__desc">${esc(desc)} ב${esc(place)}</span></div>
    <div class="weather__meta"><span>לילה <bdi>${Math.round(w.min)}°</bdi></span><span>גשם <bdi>${w.rain ?? 0}%</bdi></span><span>זריחה <bdi>${timeOf(w.sunrise)}</bdi></span><span>שקיעה <bdi>${timeOf(w.sunset)}</bdi></span></div>
    <p class="weather__advice">${esc(advice(w))}</p>
    ${ageH >= 6 ? `<p class="weather__stale">עודכן לפני ${ageH} שעות</p>` : ''}`;
}

// ---------- maps ----------
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
function pinIcon(kind, big = false) {
  return L.divIcon({ className: '', html: `<div class="pin${big ? ' pin--big' : ''}" style="--k:${KIND_VAR[kind] || 'var(--gray)'}">${ICON[kind] || ICON.pin}</div>`, iconSize: big ? [38, 38] : [30, 30], iconAnchor: big ? [19, 19] : [15, 15] });
}
function renderMiniMap(D) {
  const pts = D.stops.filter(s => s.lat && s.lng && s.lat > 20);
  const wrap = $('#miniMapWrap');
  wrap.hidden = pts.length === 0;
  if (!pts.length) return;
  if (!state.miniMap) {
    state.miniMap = L.map('miniMap', { zoomControl: false, attributionControl: false, scrollWheelZoom: false });
    L.tileLayer(TILE_URL, { maxZoom: 18 }).addTo(state.miniMap);
    state.miniLayer = L.layerGroup().addTo(state.miniMap);
  }
  state.miniLayer.clearLayers();
  pts.forEach(s => { const m = L.marker([s.lat, s.lng], { icon: pinIcon(s.kind), title: s.name }).addTo(state.miniLayer); m.on('click', () => openPlace(s, D)); });
  const b = L.latLngBounds(pts.map(s => [s.lat, s.lng]));
  state.miniMap.fitBounds(b.pad(0.3), { maxZoom: 13, animate: false });
  setTimeout(() => { state.miniMap.invalidateSize(); state.miniMap.fitBounds(b.pad(0.3), { maxZoom: 13, animate: false }); }, 60);
}
function renderBigMap() {
  const T = state.trip;
  if (!state.bigMap) {
    state.bigMap = L.map('bigMap', { zoomControl: false, attributionControl: true });
    L.tileLayer(TILE_URL, { maxZoom: 18, attribution: TILE_ATTR }).addTo(state.bigMap);
    state.mapLayer = L.layerGroup().addTo(state.bigMap);
  }
  // chips
  const chips = $('#mapChips');
  const items = [['all', 'כל הטיול']].concat(T.days.map((d, i) => [String(i), d.n > 0 ? `יום ${d.n} · ${shortDate(d.date)}` : shortDate(d.date)]));
  chips.innerHTML = items.map(([v, l]) => `<button class="chip${state.mapFilter === v ? ' is-active' : ''}" role="tab" aria-selected="${state.mapFilter === v}" data-f="${v}">${esc(l)}</button>`).join('');
  $$('.chip', chips).forEach(c => c.addEventListener('click', () => { state.mapFilter = c.dataset.f; renderBigMap(); }));
  const active = $('.chip.is-active', chips); if (active) active.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'auto' });

  state.mapLayer.clearLayers();
  const days = state.mapFilter === 'all' ? T.days : [T.days[Number(state.mapFilter)]];
  const pts = [];
  days.forEach(d => d.stops.forEach(s => {
    if (!s.lat || !s.lng) return;
    if (state.mapFilter === 'all' && (s.kind === 'transit' || s.lat < 20)) return; // the single-trip map stays on Japan
    pts.push([s.lat, s.lng]);
    const m = L.marker([s.lat, s.lng], { icon: pinIcon(s.kind, state.mapFilter !== 'all'), keyboard: true, title: s.name }).addTo(state.mapLayer);
    if (state.mapFilter !== 'all') m.bindTooltip(s.name, { permanent: true, direction: 'bottom', offset: [0, 18], className: 'pin-label' });
    m.on('click', () => openPlace(s, d));
  }));
  if (state.meMarker) state.meMarker.addTo(state.mapLayer);
  if (pts.length) state.bigMap.fitBounds(L.latLngBounds(pts).pad(0.2), { maxZoom: state.mapFilter === 'all' ? 7 : 13, animate: false });
  setTimeout(() => state.bigMap.invalidateSize(), 50);
}
function locateMe() {
  if (!navigator.geolocation) { toast('המכשיר לא משתף מיקום'); return; }
  toast('מחפש אתכם…');
  navigator.geolocation.getCurrentPosition(p => {
    const ll = [p.coords.latitude, p.coords.longitude];
    if (!state.meMarker) state.meMarker = L.marker(ll, { icon: L.divIcon({ className: '', html: '<div class="pin pin--me"></div>', iconSize: [18, 18], iconAnchor: [9, 9] }), interactive: false, zIndexOffset: 1000 });
    state.meMarker.setLatLng(ll).addTo(state.mapLayer);
    state.bigMap.setView(ll, Math.max(state.bigMap.getZoom(), 14), { animate: !REDUCED });
    toast('הנקודה הכחולה זה אתם');
  }, () => toast('אין מיקום. בהגדרות של האייפון: פרטיות, שירותי מיקום, Safari'), { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
}

// ---------- place sheet ----------
function openPlace(s, d) {
  const k = s.kind || 'sight';
  const hotel = k === 'hotel' && d ? (state.trip.bases.find(b => b.id === d.base) || {}).hotel : null;
  $('#placeBody').innerHTML = `
    <div style="--k:${KIND_VAR[k]}">
      ${d && d.img && k !== 'hotel' ? `<img class="place__img" src="img/${d.img}.jpg" alt="">` : ''}
      <div class="place__kind">${ICON[k] || ICON.pin}<span>${esc(KIND_LABEL[k] || '')}${d ? ` · ${d.n > 0 ? `יום ${d.n}, ` : ''}${esc(d.weekday)} ${shortDate(d.date)}` : ''}</span></div>
      <h2 class="place__name" id="placeTitle">${esc(s.name)}</h2>
      ${s.en ? `<p class="place__en">${esc(s.en)}</p>` : ''}
      ${hotel ? `<p class="place__en">${esc(hotel.address)}</p>` : ''}
      ${s.ja ? `<div class="place__ja" lang="ja">${esc(s.ja)}</div><p class="place__hint">להראות לנהג או לשאול דרך</p>` : ''}
      ${s.blurb ? `<p class="place__blurb">${bidi(s.blurb)}</p>` : ''}
      <div class="place__btns">
        <a class="place__btn place__btn--primary" href="${GMAPS_LL(s)}" target="_blank" rel="noopener">${ICON.gmaps}<span>גוגל מפות</span></a>
        ${hotel ? `<a class="place__btn" href="tel:${esc(hotel.tel.replace(/[^+\d]/g, ''))}">${ICON.phone}<span>למלון</span></a>` : `<a class="place__btn" href="${AMAPS(s)}" target="_blank" rel="noopener">${ICON.pin}<span>מפות אפל</span></a>`}
      </div>
    </div>`;
  const sh = $('#sheetPlace'), sc = $('#scrim');
  sh.hidden = false; sc.hidden = false; sh.scrollTop = 0;
  requestAnimationFrame(() => { sh.classList.add('is-on'); sc.classList.add('is-on'); });
  $('[data-close]', sh).focus({ preventScroll: true });
}
function closeSheet() {
  const sh = $('#sheetPlace'), sc = $('#scrim');
  if (sh.hidden) return;
  sh.classList.remove('is-on'); sc.classList.remove('is-on'); sh.style.transform = '';
  setTimeout(() => { sh.hidden = true; sc.hidden = true; }, REDUCED ? 0 : 420);
}
function wireSheetDrag() {
  const sh = $('#sheetPlace');
  let y0 = 0, dy = 0, t0 = 0, on = false;
  sh.addEventListener('touchstart', e => { if (sh.scrollTop > 0) return; y0 = e.touches[0].clientY; t0 = performance.now(); on = true; dy = 0; sh.classList.add('is-dragging'); }, { passive: true });
  sh.addEventListener('touchmove', e => { if (!on) return; dy = Math.max(0, e.touches[0].clientY - y0); sh.style.transform = `translateY(${dy}px)`; }, { passive: true });
  sh.addEventListener('touchend', () => {
    if (!on) return; on = false; sh.classList.remove('is-dragging');
    const v = dy / Math.max(1, performance.now() - t0); // px per ms
    if (dy > 140 || v > 0.6) closeSheet(); else sh.style.transform = '';
  });
}

// ---------- Journey ----------
function renderJourney() {
  const T = state.trip, O = state.outline;
  const tripDays = T.days.filter(d => d.n > 0).length;
  $('#journeyLead').textContent = `${tripDays} ימים, ${T.bases.filter(b => b.id !== 'bkk').length} מלונות, שתי שבתות. הקו המלא הוא המסלול, המקווקו הן נסיעות היום. לחיצה על עיר פותחת את היום שלה.`;

  // projection shared with data/japan-outline.json
  const [LON0, LON1, LAT0, LAT1] = O.bbox, W = O.w, H = O.h;
  const merc = lat => Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360));
  const MY0 = merc(LAT0), MY1 = merc(LAT1);
  const P = (lat, lng) => [((lng - LON0) / (LON1 - LON0)) * W, ((MY1 - merc(lat)) / (MY1 - MY0)) * H];

  // route: where they sleep, in order; day trips: from the base to the day's main stop
  const route = [
    { name: 'טוקיו', lat: 35.681, lng: 139.767, nights: 5, id: 'tokyo', ja: '東京', dx: 30, dy: 8 },
    { name: 'הקונה', lat: 35.233, lng: 139.03, nights: 0, dx: -58, dy: 34 },
    { name: 'מאטסומוטו', lat: 36.239, lng: 137.969, nights: 0, dx: 0, dy: -24 },
    { name: 'טקאיאמה', lat: 36.146, lng: 137.252, nights: 1, id: 'takayama', ja: '高山', dx: -120, dy: -18 },
    { name: 'שירקאווה-גו', lat: 36.258, lng: 136.906, nights: 0, dx: -150, dy: -38 },
    { name: 'קובה', lat: 34.695, lng: 135.196, nights: 6, id: 'kobe', ja: '神戸', dx: -40, dy: 50 },
  ];
  const trips = [
    { from: route[0], name: 'קמקורה', lat: 35.317, lng: 139.536, dx: 52, dy: 34 },
    { from: route[5], name: 'קיוטו', lat: 35.012, lng: 135.768, dx: 20, dy: -22 },
    { from: route[5], name: 'נארה', lat: 34.685, lng: 135.843, dx: 56, dy: 6 },
    { from: route[5], name: 'אוסקה', lat: 34.669, lng: 135.501, dx: 60, dy: 44 },
    { from: route[5], name: 'הירושימה', lat: 34.396, lng: 132.454, dx: -16, dy: -26 },
    { from: route[5], name: 'מיאג\'ימה', lat: 34.296, lng: 132.320, dx: -30, dy: 50 },
  ];
  const today = T.days[Math.min(Math.max(state.todayIdx, 0), T.days.length - 1)];
  const nowBase = today.base;
  const firstDayOf = id => T.days.findIndex(d => d.base === id && d.n > 1);
  const dayOfTrip = name => T.days.findIndex(d => d.title.includes(name) || d.subtitle.includes(name));

  // crop the viewBox to the journey (west Honshu to Tokyo), with margins
  const all = route.concat(trips).map(c => P(c.lat, c.lng));
  const xs = all.map(p => p[0]), ys = all.map(p => p[1]);
  const pad = 110;
  const vx = Math.min(...xs) - pad - 60, vy = Math.min(...ys) - pad, vw = Math.max(...xs) - vx + pad + 40, vh = Math.max(...ys) - vy + pad;

  const pathD = pts => pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('');
  const routePts = route.map(c => P(c.lat, c.lng));
  let svg = `<svg viewBox="${vx.toFixed(0)} ${vy.toFixed(0)} ${vw.toFixed(0)} ${vh.toFixed(0)}" role="img" aria-label="מפת יפן עם המסלול">
    <path class="rm-land" d="${O.d}"/>
    ${trips.map(t => `<path class="rm-trip" d="${pathD([P(t.from.lat, t.from.lng), P(t.lat, t.lng)])}"/>`).join('')}
    <path class="rm-route" d="${pathD(routePts)}"/>`;
  trips.forEach(t => { const [x, y] = P(t.lat, t.lng); svg += `<circle class="rm-city rm-city--trip" data-day="${dayOfTrip(t.name)}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9"/><text class="rm-label rm-label--small" x="${(x + t.dx).toFixed(1)}" y="${(y + t.dy).toFixed(1)}" text-anchor="middle">${esc(t.name)}</text>`; });
  route.forEach(c => {
    const [x, y] = P(c.lat, c.lng); const r = c.nights ? 10 + c.nights * 1.6 : 7;
    const now = c.id && c.id === nowBase;
    if (now) svg += `<circle class="rm-now" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r + 8}"/>`;
    svg += `<circle class="rm-city${now ? ' rm-city--now' : ''}" data-day="${c.id ? firstDayOf(c.id) : dayOfTrip(c.name)}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}"/>`;
    svg += `<text class="rm-label" x="${(x + c.dx).toFixed(1)}" y="${(y + c.dy).toFixed(1)}" text-anchor="middle">${esc(c.name)}</text>`;
    if (c.nights) svg += `<text class="rm-nights" x="${(x + c.dx).toFixed(1)}" y="${(y + c.dy + 22).toFixed(1)}" text-anchor="middle">${c.nights} לילות</text>`;
  });
  svg += '</svg>';
  $('#routeMap').innerHTML = svg;
  $$('.rm-city', $('#routeMap')).forEach(c => c.addEventListener('click', () => { const i = Number(c.dataset.day); if (i >= 0) { setDay(i); go('today'); } }));

  $('#cities').innerHTML = T.bases.filter(b => b.id !== 'bkk').map(b => {
    const i = firstDayOf(b.id);
    return `<button class="city" data-i="${i}" aria-label="${esc(b.city)}"><img src="img/${b.img}.jpg" alt=""><span class="city__shade"></span>
      ${b.ja ? `<span class="city__ja" aria-hidden="true">${esc(b.ja)}</span>` : ''}
      <span class="city__body"><p class="city__name">${esc(b.city)}</p><p class="city__meta">${b.nights} לילות${b.hotel ? ` · ${esc(b.hotel.he)}` : ''}</p></span></button>`;
  }).join('');
  $$('.city').forEach(b => b.addEventListener('click', () => { setDay(Number(b.dataset.i)); go('today'); }));
  $('#credits').innerHTML = esc(T.guide.credits || '') + (state.credits ? ` <a href="#tips" id="creditsLink">רשימת התמונות</a>` : '');
  const cl = $('#creditsLink'); if (cl) cl.addEventListener('click', e => { e.preventDefault(); state.tipSeg = 'useful'; renderTipsShell(); go('tips'); });

  // day list grouped by where they sleep
  const groups = [];
  T.days.forEach((d, i) => {
    const key = d.n === 0 || d.n === 1 ? 'way' : (d.n >= 14 ? 'home' : d.base);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.days.push(i); else groups.push({ key, days: [i] });
  });
  const label = { way: ['בדרך ליפן', ''], home: ['הדרך הביתה', ''] };
  $('#journeyList').innerHTML = groups.map(g => {
    const base = T.bases.find(b => b.id === g.key);
    const [city, ja] = label[g.key] || [base ? base.city : g.key, base ? base.ja : ''];
    const nights = base && !label[g.key] ? `${base.nights} לילות` : '';
    return `<section class="jgroup"><div class="jgroup__head"><h2 class="jgroup__city">${esc(city)} ${ja ? `<span class="jgroup__ja" aria-hidden="true">${esc(ja)}</span>` : ''}</h2><span class="jgroup__nights">${nights}</span></div>
      <div class="jlist">${g.days.map(i => jdayHTML(T.days[i], i)).join('')}</div></section>`;
  }).join('');
  $$('.jday').forEach(b => b.addEventListener('click', () => { setDay(Number(b.dataset.i)); go('today'); }));
}
function jdayHTML(d, i) {
  const w = wxFor(d);
  const cls = ['jday', i === state.todayIdx ? 'is-today' : '', i < state.todayIdx ? 'is-past' : ''].join(' ');
  const wx = w ? `<span class="jday__wx" aria-label="מזג אוויר">${WX[wmo(w.code)[1]]}<bdi>${Math.round(w.max)}°</bdi></span>` : (d.shabbat ? `<span class="jday__shabbat">שבת</span>` : '<span></span>');
  const [, , day] = d.date.split('-').map(Number);
  return `<button class="${cls}" data-i="${i}"><span class="jday__date"><span class="jday__num num">${day}</span><span class="jday__wd">${esc(d.weekday)}</span></span>
    <span><p class="jday__title">${d.n > 0 ? `יום ${d.n} · ` : ''}${esc(d.title)}</p><p class="jday__sub">${esc(d.subtitle)}</p></span>${wx}</button>`;
}

// ---------- Tips ----------
const SEGS = [['kosher', 'כשרות'], ['shop', 'מציאות'], ['tech', 'טכנולוגיה'], ['shabbat', 'שבת'], ['useful', 'שימושי'], ['phrases', 'מילים']];
function renderTipsShell() {
  $('#tipSegments').innerHTML = SEGS.map(([k, l]) => `<button class="seg${state.tipSeg === k ? ' is-active' : ''}" role="tab" aria-selected="${state.tipSeg === k}" data-seg="${k}">${l}</button>`).join('');
  $$('.seg').forEach(b => b.addEventListener('click', () => { state.tipSeg = b.dataset.seg; renderTipsShell(); }));
  renderTipsBody();
}
function renderTipsBody() {
  const G = state.trip.guide, k = state.tipSeg;
  const body = $('#tipsBody');
  const lead = { kosher: 'הטיול דואג לאוכל. זה למי שרוצה עוד, או ליום חופשי. לבדוק שעות פתיחה לפני שיוצאים.', shop: 'איפה המציאות, ואיך עובד הפטור ממס.', tech: 'החנויות שבני יאהב.', shabbat: 'זמני השבת לפי השעון המקומי ביפן.', useful: 'המלונות, מספרים ושעות.', phrases: 'עשר מילים שפותחות דלתות. להראות את היפנית, או לנסות להגיד.' };
  let html = `<p class="tipsec__lead">${lead[k] || ''}</p>`;
  if (k === 'phrases') {
    html += `<div class="rows">${G.phrases.map(p => `<div class="phrase"><span class="phrase__he">${esc(p.he)}</span><span class="phrase__ja" lang="ja">${esc(p.ja)}</span><span class="phrase__ro">${esc(p.romaji)}</span></div>`).join('')}</div>`;
  } else if (k === 'shabbat') {
    const S = G.shabbat || [];
    html += S.length ? `<div class="shabbat-grid">${S.map(s => `<div class="shabbat-card card"><h3>${esc(s.city)}</h3><p class="footnote" style="margin:0 0 8px">${esc(s.date)}</p><dl><dt>כניסה</dt><dd><bdi>${esc(s.candles)}</bdi></dd><dt>יציאה</dt><dd><bdi>${esc(s.havdalah)}</bdi></dd></dl></div>`).join('')}</div>` : '<p class="footnote">זמני השבת יתווספו בקרוב.</p>';
    html += `<p class="footnote" style="margin-top:12px">${esc((G.shabbatNote) || '')}</p>`;
    const extra = (G.shabbatTips || []);
    if (extra.length) html += `<ul class="rows" style="margin-top:12px">${extra.map(rowHTML).join('')}</ul>`;
  } else if (k === 'useful') {
    html += `<section class="tipsec"><h2 class="title2">המלונות</h2><div class="rows">${(G.hotels || []).map(h => `<div class="hotel"><p class="hotel__name">${esc(h.he)} · <bdi>${esc(h.name)}</bdi></p><p class="hotel__meta"><bdi>${esc(h.address)}</bdi></p><p class="hotel__meta">${shortDate(h.checkin)} עד ${shortDate(h.checkout)}, ${h.nights} לילות${h.approx ? ' · המיקום במפה משוער' : ''}</p>
      <div class="hotel__actions"><a class="btn-sm" href="tel:${esc(h.tel.replace(/[^+\d]/g, ''))}">${ICON.phone}<bdi>${esc(h.tel)}</bdi></a><a class="btn-sm" href="${GMAPS_LL(h)}" target="_blank" rel="noopener">${ICON.gmaps}גוגל מפות</a></div></div>`).join('')}</div></section>`;
    (G.useful || []).forEach(sec => { html += `<section class="tipsec"><h2 class="title2">${esc(sec.title)}</h2><ul class="rows">${sec.items.map(it => rowHTML({ ...it, kind: it.kind || 'info' })).join('')}</ul></section>`; });
    if (state.credits) html += `<section class="tipsec"><h2 class="title2">התמונות</h2><p class="tipsec__lead">${esc(G.credits || '')}</p><ul class="rows">${Object.values(state.credits).map(c => `<li class="row" style="--k:var(--k-transit)"><span class="row__icon">${ICON.pin}</span><p class="row__text"><bdi>${esc(c.title)}</bdi> <a href="${esc(c.page)}" target="_blank" rel="noopener">מקור</a></p></li>`).join('')}</ul></section>`;
  } else {
    const groups = G[k] || [];
    if (!groups.length) html += '<p class="footnote">בקרוב.</p>';
    groups.forEach(sec => {
      html += `<section class="tipsec"><h2 class="title2">${esc(sec.title)}</h2>${sec.lead ? `<p class="tipsec__lead">${esc(sec.lead)}</p>` : ''}<ul class="rows">${sec.items.map(it => rowHTML({ ...it, kind: it.kind || k })).join('')}</ul></section>`;
    });
  }
  body.innerHTML = html;
}

// ---------- toast ----------
let toastT;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('is-on');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('is-on'), 2600);
}

boot().catch(err => {
  console.error(err);
  $('#app').insertAdjacentHTML('afterbegin', `<div class="card" style="margin-top:40px"><h2 class="title2">המסע לא נטען</h2><p>כדאי לסגור ולפתוח שוב. אם זה חוזר, שרית תדע לעזור.</p></div>`);
});
})();
