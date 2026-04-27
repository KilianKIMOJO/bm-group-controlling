// Monats- und Wochen-Helper.
import { MONTHS, FEIERTAGE_BY_MONTH } from '../config.js';
import { state } from '../state.js';
import { getBWAMonths } from './bwa-helpers.js';

export const MN = MONTHS;

/** Aktuelle Kalenderwoche nach ISO 8601. */
export function getCurrentKW() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const w1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - w1.getTime()) / 864e5 - 3 + (w1.getDay() + 6) % 7) / 7);
}

/** Sheet-Name → Monatskürzel ('Januar 2026' → 'Jan'). */
export function getMonthFromSheet(name) {
  const nl = name.toLowerCase();
  const longMap = {
    januar: 'Jan', february: 'Feb', februar: 'Feb', märz: 'Mär', march: 'Mär',
    april: 'Apr', mai: 'Mai', may: 'Mai', juni: 'Jun', june: 'Jun',
    juli: 'Jul', july: 'Jul', august: 'Aug', september: 'Sep',
    oktober: 'Okt', october: 'Okt', november: 'Nov', dezember: 'Dez', december: 'Dez'
  };
  for (const [long, short] of Object.entries(longMap)) {
    if (nl.includes(long)) return short;
  }
  for (const m of MN) {
    if (name.includes(m) || nl.includes(m.toLowerCase())) return m;
  }
  const enMap = {
    Jan: 'Jan', Feb: 'Feb', Mar: 'Mär', Apr: 'Apr', May: 'Mai', Jun: 'Jun',
    Jul: 'Jul', Aug: 'Aug', Sep: 'Sep', Oct: 'Okt', Nov: 'Nov', Dec: 'Dez'
  };
  for (const [en, de] of Object.entries(enMap)) {
    if (nl.includes(en.toLowerCase())) return de;
  }
  return null;
}

/**
 * Liefert die aktiven Monate basierend auf state.activeMonth.
 * - 'YTD'      = abgeschlossene Monate (alle Daten vorhanden)
 * - 'AKTUELL'  = abgeschlossene + laufender Monat
 * - 'Jan'..    = nur dieser Monat
 */
export function getActiveMonths() {
  const aM = state.activeMonth;
  if (aM === 'AKTUELL') {
    const currentMonth = new Date().getMonth();
    const rawMonths = new Set(state.data.raw.map(r => r.month).filter(Boolean).map(m => MN[m - 1]));
    const bwaMonths = new Set([
      ...getBWAMonths(state.data.bwaK).map(x => x.month),
      ...getBWAMonths(state.data.bwaP).map(x => x.month)
    ]);
    const all = new Set([...bwaMonths, ...rawMonths]);
    return MN.filter((m, i) => all.has(m) && i <= currentMonth);
  }
  if (aM === 'YTD') {
    const currentMonth = new Date().getMonth();
    const bwaMonths = new Set([
      ...getBWAMonths(state.data.bwaK).map(x => x.month),
      ...getBWAMonths(state.data.bwaP).map(x => x.month)
    ]);
    const rawMonths = new Set(state.data.raw.map(r => r.month).filter(Boolean).map(m => MN[m - 1]));
    const all = new Set([...bwaMonths, ...rawMonths]);
    return MN.filter((m, i) => all.has(m) && i < currentMonth);
  }
  return [aM];
}

/** Wöchentliche Stunden eines Therapeuten für die gegebenen Monate (Durchschnitt). */
export function getWorkingHoursWeek(therapeut, months) {
  if (!months.length) return therapeut.wh || 0;
  let sum = 0, count = 0;
  months.forEach(m => {
    const wh = therapeut.mh && therapeut.mh[m] ? therapeut.mh[m] : (therapeut.wh || 0);
    if (wh > 0) { sum += wh; count++; }
  });
  return count > 0 ? sum / count : (therapeut.wh || 0);
}

/** Monatsstunden eines Therapeuten (4.33 Wochen pro Monat, abzgl. Feiertage). */
export function getWorkingHoursMonth(therapeut, months) {
  let total = 0;
  months.forEach(m => {
    const wh = therapeut.mh && therapeut.mh[m] ? therapeut.mh[m] : (therapeut.wh || 0);
    const dailyH = wh / 5;
    const feiertageTage = FEIERTAGE_BY_MONTH[m] || 0;
    const monatStunden = wh * 4.33 - dailyH * feiertageTage;
    total += Math.max(0, monatStunden);
  });
  return total;
}