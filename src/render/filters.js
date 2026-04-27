// Filter-Bar oben + Sidebar-Filter-Pills + Header-Badge.
import { state } from '../state.js';
import { MN, getActiveMonths } from '../helpers/months.js';
import { getBWAMonths } from '../helpers/bwa-helpers.js';
import { STANDORT_COLORS } from '../config.js';
import { sn } from '../helpers/format.js';
import { renderAll } from './index.js';

/** Wird beim Klick auf einen Filter-Button aufgerufen. */
function setMonth(m)    { state.activeMonth = m;     renderAll(); }
function setStandort(s) { state.activeStandort = s;  renderAll(); }

export function renderFilters() {
  // Verfügbare Monate aus den Daten ableiten
  const rawMonths  = new Set(state.data.raw.map(r => r.month).filter(Boolean).map(m => MN[m - 1]));
  const bwaMonths  = new Set([
    ...getBWAMonths(state.data.bwaK).map(x => x.month),
    ...getBWAMonths(state.data.bwaP).map(x => x.month)
  ]);
  const bankMonths = new Set([...Object.keys(state.data.bankK), ...Object.keys(state.data.bankP)]);
  const avail = new Set([...bwaMonths, ...bankMonths, ...rawMonths]);

  // Top-Filter-Bar
  let h = '<span class="fl">Zeitraum</span>';
  h += btn('YTD',     state.activeMonth === 'YTD',     'YTD');
  h += btn('AKTUELL', state.activeMonth === 'AKTUELL', 'Aktuell');
  MN.forEach(m => {
    if (avail.has(m)) h += btn(m, state.activeMonth === m, m);
  });
  h += '<span class="sep"></span><span class="fl">Standort</span>';

  ['Alle', 'KIMOJO Gesamt', 'KIMOJO Physio', 'KIMOJO Ergo', 'PF im Park'].forEach(s => {
    const c = STANDORT_COLORS[s] || '#999';
    const active = state.activeStandort === s ? ' a' : '';
    h += `<button class="fb${active}" data-standort="${s}"><span class="dot" style="background:${c}"></span>${sn(s)}</button>`;
  });

  const flt = document.getElementById('flt');
  flt.innerHTML = h;

  // Click-Handler
  flt.querySelectorAll('button[data-month]').forEach(b => b.addEventListener('click', () => setMonth(b.dataset.month)));
  flt.querySelectorAll('button[data-standort]').forEach(b => b.addEventListener('click', () => setStandort(b.dataset.standort)));

  // Header-Badge
  const label = state.activeMonth === 'AKTUELL'
    ? 'Aktuell (inkl. ' + MN[new Date().getMonth()] + ')'
    : state.activeMonth;
  document.getElementById('hb').textContent =
    label + ' 2026' + (state.activeStandort !== 'Alle' ? ' · ' + sn(state.activeStandort) : '');

  // Sidebar-Pills
  let tp = '';
  tp += pill('YTD',     state.activeMonth === 'YTD',     'YTD');
  tp += pill('AKTUELL', state.activeMonth === 'AKTUELL', 'Aktuell');
  MN.forEach(m => { if (avail.has(m)) tp += pill(m, state.activeMonth === m, m); });
  const navTime = document.getElementById('navTimePills');
  navTime.innerHTML = tp;
  navTime.querySelectorAll('span[data-month]').forEach(p => p.addEventListener('click', () => setMonth(p.dataset.month)));

  let lp = '';
  ['Alle', 'KIMOJO Gesamt', 'PF im Park'].forEach(s => {
    const label = s === 'KIMOJO Gesamt' ? 'KIMOJO' : sn(s);
    lp += `<span class="nav-pill${state.activeStandort === s ? ' a' : ''}" data-standort="${s}">${label}</span>`;
  });
  const navLoc = document.getElementById('navLocPills');
  navLoc.innerHTML = lp;
  navLoc.querySelectorAll('span[data-standort]').forEach(p => p.addEventListener('click', () => setStandort(p.dataset.standort)));

  // Timestamp
  const ts = document.getElementById('navTs');
  if (ts) ts.textContent = '⏱ ' + new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

  // KW-Select für Therapeuten-Tabelle
  const monthNums = getActiveMonths().map(m => MN.indexOf(m) + 1);
  const weeks = new Set(state.data.raw.filter(r => monthNums.includes(r.month)).map(r => r.week).filter(Boolean));
  const kwSel = document.getElementById('kwf');
  const curVal = kwSel.value;
  kwSel.innerHTML = '<option value="all">Alle KWs</option>';
  [...weeks].sort((a, b) => a - b).forEach(w => {
    kwSel.innerHTML += `<option value="${w}">KW ${w}</option>`;
  });
  kwSel.value = curVal && kwSel.querySelector(`option[value="${curVal}"]`) ? curVal : 'all';
}

function btn(value, active, label) {
  return `<button class="fb${active ? ' a' : ''}" data-month="${value}">${label}</button>`;
}
function pill(value, active, label) {
  return `<span class="nav-pill${active ? ' a' : ''}" data-month="${value}">${label}</span>`;
}

/** Helper für Plan-Delta-Anzeige (Erbringt: positiv = grün, Kosten: positiv = rot). */
export function renderDelta(ist, plan, invertColors) {
  if (!plan || plan === 0) return '';
  const delta = ist - plan;
  const pct = ((delta / Math.abs(plan)) * 100).toFixed(1);
  const isGood = invertColors ? delta <= 0 : delta >= 0;
  const cls = isGood ? 'delta-pos' : 'delta-neg';
  const sign = delta >= 0 ? '+' : '';
  return `<span class="plan-delta ${cls}">${sign}${pct}%</span>`;
}
