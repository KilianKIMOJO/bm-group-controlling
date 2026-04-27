// TODO: Krankenstand-Funktion rKS() aus Original migrieren.
import { state } from '../state.js';
import { MN, getActiveMonths } from '../helpers/months.js';
import { fm } from '../helpers/format.js';

export function renderKrankenstand() {
  const div = document.getElementById('krankenDiv');
  if (!div) return;
  if (!state.data.krankenstand || !state.data.krankenstand.byMA.length) {
    div.innerHTML = '';
    return;
  }
  // TODO: Hier kommt der gesamte rKS()-Code rein.
  div.innerHTML = '<em style="color:var(--muted);padding:24px;display:block">⚠️ Krankenstand-Modul: noch zu migrieren. Siehe render/_stub-template.txt</em>';
}
