// ============================================================
//  MONATS- UND KW-HELPERS (rein, ohne State-Abhängigkeiten)
// ============================================================

import { MONTHS, FEIERTAGE_BY_MONTH } from '../config.js';

// MN als Re-Export für bequemen Zugriff
export const MN = MONTHS;

/** Aktuelle KW (ISO-8601). */
export function getCurrentKW() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const w1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - w1.getTime()) / 864e5 - 3 + (w1.getDay() + 6) % 7) / 7);
}

/** Mappt einen beliebigen Sheet-Namen auf ein Kurz-Monat ("Januar" -> "Jan"). */
export function getMonthFromSheet(name) {
  const nl = name.toLowerCase();
  const longMap = {
    januar: 'Jan', february: 'Feb', februar: 'Feb',
    märz: 'Mär', march: 'Mär',
    april: 'Apr', mai: 'Mai', may: 'Mai',
    juni: 'Jun', june: 'Jun', juli: 'Jul', july: 'Jul',
    august: 'Aug', september: 'Sep',
    oktober: 'Okt', october: 'Okt',
    november: 'Nov', dezember: 'Dez', december: 'Dez'
  };
  for (const [long, short] of Object.entries(longMap)) {
    if (nl.includes(long)) return short;
  }
  for (const m of MONTHS) {
    if (name.includes(m) || nl.includes(m.toLowerCase())) return m;
  }
  const enMap = {
    Jan: 'Jan', Feb: 'Feb', Mar: 'Mär', Apr: 'Apr', May: 'Mai',
    Jun: 'Jun', Jul: 'Jul', Aug: 'Aug', Sep: 'Sep',
    Oct: 'Okt', Nov: 'Nov', Dec: 'Dez'
  };
  for (const [en, de] of Object.entries(enMap)) {
    if (nl.includes(en.toLowerCase())) return de;
  }
  return null;
}

/** Wochenstunden eines Therapeuten über mehrere Monate (mit Feiertags-Abzug). */
export function getWhM(therapist, months) {
  let total = 0;
  months.forEach(m => {
    const wh = therapist.mh && therapist.mh[m] ? therapist.mh[m] : (therapist.wh || 0);
    const dailyH = wh / 5;
    const feiertageTage = FEIERTAGE_BY_MONTH[m] || 0;
    const monatStunden = wh * 4.33 - dailyH * feiertageTage;
    total += Math.max(0, monatStunden);
  });
  return total;
}

/** Durchschnittliche Wochenstunden eines Therapeuten über mehrere Monate. */
export function getWhW(therapist, months) {
  if (!months.length) return therapist.wh || 0;
  let sum = 0, count = 0;
  months.forEach(m => {
    const wh = therapist.mh && therapist.mh[m] ? therapist.mh[m] : (therapist.wh || 0);
    if (wh > 0) { sum += wh; count++; }
  });
  return count > 0 ? sum / count : (therapist.wh || 0);
}

/**
 * Ermittelt aktive Monate basierend auf Filter (YTD, AKTUELL oder Einzelmonat).
 * Braucht Zugriff auf state.data um zu wissen welche Monate verfügbar sind.
 */
export function getActiveMonths(state, getBWAMonths) {
  const { activeMonth, data } = state;

  if (activeMonth === 'AKTUELL') {
    const currentMonth = new Date().getMonth();
    const rawMonths = new Set(data.raw.map(r => r.month).filter(Boolean).map(m => MN[m - 1]));
    const bwaMonths = new Set([
      ...getBWAMonths(data.bwaK).map(x => x.month),
      ...getBWAMonths(data.bwaP).map(x => x.month)
    ]);
    const all = new Set([...bwaMonths, ...rawMonths]);
    return MN.filter((m, i) => all.has(m) && i <= currentMonth);
  }

  if (activeMonth === 'YTD') {
    const currentMonth = new Date().getMonth();
    const bwaMonths = new Set([
      ...getBWAMonths(data.bwaK).map(x => x.month),
      ...getBWAMonths(data.bwaP).map(x => x.month)
    ]);
    const rawMonths = new Set(data.raw.map(r => r.month).filter(Boolean).map(m => MN[m - 1]));
    const all = new Set([...bwaMonths, ...rawMonths]);
    return MN.filter((m, i) => all.has(m) && i < currentMonth);
  }

  return [activeMonth];
}
