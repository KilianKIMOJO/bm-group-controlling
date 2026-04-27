// BWA-spezifische Helper-Funktionen.
import { getMonthFromSheet } from './months.js';

/**
 * Liste aller BWA-Sheets mit ihrem zugeordneten Monat:
 * [{ sheet: 'Januar 2026', month: 'Jan' }, ...]
 */
export function getBWAMonths(bwa) {
  return Object.keys(bwa)
    .map(s => ({ sheet: s, month: getMonthFromSheet(s) }))
    .filter(x => x.month);
}

/** BWA-Daten für einen bestimmten Monat ('Jan', 'Feb', ...) holen. */
export function getBWA(bwa, month) {
  const entry = getBWAMonths(bwa).find(x => x.month === month);
  return entry ? bwa[entry.sheet] : null;
}

/** BWA-Werte über mehrere Monate aufsummieren. */
export function sumBWA(bwa, months) {
  const sum = {
    umsatz: 0, personal: 0, raum: 0, versicherung: 0, fahrzeuge: 0,
    werbung: 0, sonstige: 0, gesamtkosten: 0, ergebnis: 0,
    items: {}
  };
  months.forEach(m => {
    const d = getBWA(bwa, m);
    if (!d) return;
    ['umsatz', 'personal', 'raum', 'versicherung', 'fahrzeuge', 'werbung', 'sonstige', 'gesamtkosten', 'ergebnis']
      .forEach(k => sum[k] += d[k]);
    Object.entries(d.items || {}).forEach(([cat, subs]) => {
      if (!sum.items[cat]) sum.items[cat] = [];
      subs.forEach(sub => {
        const ex = sum.items[cat].find(x => x.n === sub.n);
        if (ex) ex.v += sub.v;
        else sum.items[cat].push({ ...sub });
      });
    });
  });
  return sum;
}
