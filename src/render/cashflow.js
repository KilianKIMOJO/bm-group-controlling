// TODO: Cashflow-Funktion rCF() + renderCumulativeChart() aus Original migrieren.
import { state, matchStandort } from '../state.js';
import { MN, getActiveMonths } from '../helpers/months.js';
import { sumBWA } from '../helpers/bwa-helpers.js';
import { fm } from '../helpers/format.js';

export function renderCashflow() {
  const div = document.getElementById('cfDiv');
  if (!div) return;
  // TODO: Hier kommt der gesamte rCF()-Code rein.
  div.innerHTML = '<em style="color:var(--muted);padding:24px;display:block">⚠️ Cashflow-Modul: noch zu migrieren. Siehe render/_stub-template.txt</em>';
}

export function renderCumulativeChart(data) {
  // TODO: Kumulatives Cashflow-Diagramm rendern (aus Original)
}
