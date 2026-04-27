// ============================================================
//  BWA-PARSER
//  Parst die Datev-BWA aus Excel.
//  Erkennt Zeilennummern (Z-Spalte) als Anker für Kategorien.
// ============================================================

import { getMonthFromSheet } from '../helpers/months.js';

/**
 * Parst ein BWA-Worksheet.
 *
 * Erwartete Struktur:
 *   Spalte 0: Z-Nummer (z.B. "1006" für Umsatz)
 *   Spalte 1: Kontonummer
 *   Spalte 2: Bezeichnung
 *   Spalte 3: Wert
 *
 * Z-Nummern (Datev-Standard):
 *   1006 = Umsatzerlöse
 *   1164 = Personalkosten gesamt
 *   1190 = Raum-/Energiekosten
 *   1208 = Versicherung
 *   1216 = Fahrzeuge
 *   1224 = Werbung
 *   1264 = Sonstige Kosten
 *   1294 = Gesamtkosten
 *   1374 = Ergebnis vor Steuern
 */
export function parseBWA(rows) {
  const data = {
    umsatz: 0,
    personal: 0,
    raum: 0,
    versicherung: 0,
    fahrzeuge: 0,
    werbung: 0,
    sonstige: 0,
    gesamtkosten: 0,
    ergebnis: 0,
    items: {}
  };

  let currentCategory = null;

  for (const row of rows) {
    const zNum = String(row[0] || '').trim();
    const konto = String(row[1] || '').trim();
    const bezeichnung = String(row[2] || '').trim();
    const wert = parseFloat(row[3]) || 0;

    // Hauptkategorien anhand Z-Nummer erkennen
    if (zNum === '1006') data.umsatz = wert;
    else if (zNum === '1164') { data.personal = wert; currentCategory = 'Personal'; }
    else if (zNum === '1190') { data.raum = wert; currentCategory = 'Raum/Energie'; }
    else if (zNum === '1208') { data.versicherung = wert; currentCategory = 'Versicherung'; }
    else if (zNum === '1216') { data.fahrzeuge = wert; currentCategory = 'Fahrzeuge'; }
    else if (zNum === '1224') { data.werbung = wert; currentCategory = 'Werbung'; }
    else if (zNum === '1264') { data.sonstige = wert; currentCategory = 'Sonstige'; }
    else if (zNum === '1294') data.gesamtkosten = wert;
    else if (zNum === '1374') data.ergebnis = wert;
    else if (zNum === '1200' || zNum === '1290') currentCategory = null;

    // Detail-Konten innerhalb der aktuellen Kategorie sammeln
    if (!zNum && konto && currentCategory && wert !== 0) {
      if (!data.items[currentCategory]) data.items[currentCategory] = [];
      data.items[currentCategory].push({
        n: bezeichnung.replace(/^\s+/, ''),
        v: wert
      });
    }
  }

  return data;
}

/** Liefert alle Monats-Sheets einer BWA mit erkanntem Monat. */
export function getBWAMonths(bwa) {
  return Object.keys(bwa)
    .map(s => ({ sheet: s, month: getMonthFromSheet(s) }))
    .filter(x => x.month);
}

/** BWA-Daten für einen bestimmten Monat holen. */
export function getBWA(bwa, month) {
  const entry = getBWAMonths(bwa).find(x => x.month === month);
  return entry ? bwa[entry.sheet] : null;
}

/** Summiert BWA-Daten über mehrere Monate (für YTD etc.). */
export function sumBWA(bwa, months) {
  const sum = {
    umsatz: 0, personal: 0, raum: 0, versicherung: 0,
    fahrzeuge: 0, werbung: 0, sonstige: 0,
    gesamtkosten: 0, ergebnis: 0, items: {}
  };

  months.forEach(m => {
    const d = getBWA(bwa, m);
    if (!d) return;

    ['umsatz', 'personal', 'raum', 'versicherung', 'fahrzeuge',
     'werbung', 'sonstige', 'gesamtkosten', 'ergebnis'].forEach(k => {
      sum[k] += d[k];
    });

    Object.entries(d.items || {}).forEach(([cat, subs]) => {
      if (!sum.items[cat]) sum.items[cat] = [];
      subs.forEach(sub => {
        const existing = sum.items[cat].find(x => x.n === sub.n);
        if (existing) existing.v += sub.v;
        else sum.items[cat].push({ ...sub });
      });
    });
  });

  return sum;
}
