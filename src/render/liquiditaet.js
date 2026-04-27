// TODO: Liquiditäts-Funktion rLiq() aus Original migrieren.
import { state } from '../state.js';
import { MN, getActiveMonths } from '../helpers/months.js';
import { fm } from '../helpers/format.js';

export function renderLiquiditaet() {
  const div = document.getElementById('liqCockpit');
  if (!div) return;
  // TODO: Hier kommt der gesamte rLiq()-Code rein.
  div.innerHTML = '<em style="color:var(--muted);padding:24px;display:block">⚠️ Liquiditäts-Modul: noch zu migrieren. Siehe render/_stub-template.txt</em>';
}
