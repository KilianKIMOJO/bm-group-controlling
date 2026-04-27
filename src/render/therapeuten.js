// TODO: Therapeuten-Funktion rT() + renderChart() aus Original migrieren.
// Siehe MIGRATION.md für Such-Ersetzen-Anweisungen.
import { state, matchStandort } from '../state.js';
import { MN, getActiveMonths, getWorkingHoursMonth, getWorkingHoursWeek } from '../helpers/months.js';
import { getPlanTherapist, getPlanTherapistMonth } from '../helpers/plan-match.js';
import { fm, fmK } from '../helpers/format.js';

export function renderTherapeuten() {
  const div = document.getElementById('tb');
  if (!div) return;
  // TODO: Hier kommt der gesamte rT()-Code rein.
  div.innerHTML = '<em style="color:var(--muted);padding:24px;display:block">⚠️ Therapeuten-Modul: noch zu migrieren. Siehe render/_stub-template.txt</em>';
}

export function renderChart(name, mode = 'umsatz') {
  // TODO: SVG-Chart rendern (renderChart aus Original)
}
