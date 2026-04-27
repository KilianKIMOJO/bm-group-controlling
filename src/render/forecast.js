// TODO: Forecast-Funktion rFC() aus Original migrieren.
// Siehe MIGRATION.md für Such-Ersetzen-Anweisungen.
//
// Du brauchst zusätzlich: ein Modul-Level Variable für `fcMode` (statt globalem `let fcMode`)
// und die Funktion setFCMode().

import { state, matchStandort } from '../state.js';
import { MN, getActiveMonths } from '../helpers/months.js';
import { getBWA } from '../helpers/bwa-helpers.js';
import { fm, fmK } from '../helpers/format.js';

let fcMode = 'einnahmen';

function setFCMode(m) {
  fcMode = m;
  renderForecast();
}

export function renderForecast() {
  const div = document.getElementById('forecastDiv');
  if (!state.data.planK.dashboard && !state.data.planP.dashboard) {
    div.innerHTML = '';
    return;
  }
  // TODO: Hier kommt der gesamte rFC()-Code rein.
  div.innerHTML = '<div class="fc-card" style="padding:24px;color:var(--muted)"><em>⚠️ Forecast-Modul: noch zu migrieren. Siehe render/_stub-template.txt</em></div>';
}
