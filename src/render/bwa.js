// TODO: BWA-Funktion rB() + renderBWACard() aus Original migrieren.
import { state, matchStandort } from '../state.js';
import { MN, getActiveMonths } from '../helpers/months.js';
import { getBWA, getBWAMonths, sumBWA } from '../helpers/bwa-helpers.js';
import { fm } from '../helpers/format.js';

export function renderBWA() {
  const div = document.getElementById('bwaDiv');
  if (!div) return;
  // TODO: Hier kommt der gesamte rB()-Code rein.
  div.innerHTML = '<em style="color:var(--muted);padding:24px;display:block">⚠️ BWA-Modul: noch zu migrieren. Siehe render/_stub-template.txt</em>';
}

export function renderBWACard(label, data, color) {
  // TODO: Einzelne BWA-Karte rendern (aus Original)
  return '';
}
