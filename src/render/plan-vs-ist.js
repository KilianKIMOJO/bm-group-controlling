// TODO: Plan-vs-Ist-Funktion rPVI() aus Original migrieren.
// Siehe MIGRATION.md für Such-Ersetzen-Anweisungen.
import { state, matchStandort } from '../state.js';
import { MN, getActiveMonths } from '../helpers/months.js';
import { sumBWA } from '../helpers/bwa-helpers.js';
import { getPlanForMonths, getPlanCatForMonths } from '../helpers/plan-match.js';
import { fm, fmK } from '../helpers/format.js';
import { renderDelta } from './filters.js';

export function renderPlanVsIst() {
  const div = document.getElementById('planVsIstDiv');
  if (!div) return;
  if (!state.data.planK.dashboard && !state.data.planP.dashboard) {
    div.innerHTML = '';
    return;
  }
  // TODO: Hier kommt der gesamte rPVI()-Code rein.
  div.innerHTML = '<div class="pvi-card" style="padding:24px;color:var(--muted)"><em>⚠️ Plan-vs-Ist-Modul: noch zu migrieren. Siehe render/_stub-template.txt</em></div>';
}
