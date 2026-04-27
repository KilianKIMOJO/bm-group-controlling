// TODO: Auslastungs-Funktionen rAusl() + auslColor() + changeAuslKW() migrieren.
import { state } from '../state.js';
import { getCurrentKW } from '../helpers/months.js';

export function changeAuslKW(d) {
  const allKWs = [...state.data.auslK.map(x => x.kw), ...state.data.auslP.map(x => x.kw)];
  if (!allKWs.length) return;
  const min = Math.min(...allKWs), max = Math.max(...allKWs);
  state.selectedAuslKW = Math.max(min, Math.min(max, state.selectedAuslKW + d));
  renderAuslastung();
}

function auslColor(v) {
  return v >= 90 ? '#00907a' : v >= 80 ? '#c77f1a' : 'var(--red)';
}

export function renderAuslastung() {
  // TODO: Hier kommt der rAusl()-Code rein.
  document.getElementById('auslDiv').innerHTML = '<div style="padding:24px;color:var(--muted)"><em>⚠️ Auslastungs-Modul: noch zu migrieren.</em></div>';
}
