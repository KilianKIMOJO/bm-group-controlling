// ============================================================
//  BANK-PARSER
//  Parst Kontoauszüge (XLSX bevorzugt, CSV als Fallback).
// ============================================================

import { MONTHS } from '../config.js';
import { getSheetNames, getSheet, getFileContent } from '../api.js';

const MONTH_LABELS = ['', ...MONTHS];

/**
 * Lädt Bank-Daten aus einer Datei. Versucht erst XLSX, dann CSV.
 * @returns {Object} { Jan: {ein, aus, saldo}, Feb: {...}, ... }
 */
export async function loadBank(driveId, fileId) {
  // 1. XLSX-Versuch
  try {
    const sheets = await getSheetNames(driveId, fileId);
    if (sheets && sheets.length > 0) {
      const data = await getSheet(driveId, fileId, sheets[0]);
      if (data && data.length > 1) return parseBankXLSX(data);
    }
  } catch (e) {
    console.log('Bank XLSX failed, trying CSV...', e);
  }

  // 2. CSV-Fallback
  try {
    const txt = await getFileContent(driveId, fileId);
    if (txt) return parseBankCSV(txt);
  } catch (e) {
    console.warn('Bank CSV also failed:', e);
  }

  return {};
}

/** Findet die richtigen Spalten anhand der Header-Zeile. */
function findBankColumns(headerRow) {
  let dateCol = -1, betragCol = -1, saldoCol = -1;

  for (let c = 0; c < headerRow.length; c++) {
    const h = String(headerRow[c] || '').toLowerCase();
    if (h.includes('buchungstag')) dateCol = c;
    if (h === 'betrag') betragCol = c;
    if (h.includes('saldo')) saldoCol = c;
  }

  // Fallbacks (typische Sparkassen-Struktur)
  if (dateCol < 0) dateCol = 4;
  if (betragCol < 0) betragCol = 11;
  if (saldoCol < 0) saldoCol = 13;

  return { dateCol, betragCol, saldoCol };
}

/** Parst ein Datum aus Excel-Zelle (Number, dd.mm.yyyy oder yyyy-mm-dd). */
function parseDateCell(value) {
  if (!value) return null;

  // Excel-Datum als Zahl
  if (typeof value === 'number' && value > 40000) {
    const date = new Date((value - 25569) * 86400000);
    return { date, month: date.getUTCMonth() + 1 };
  }

  const s = String(value);

  // dd.mm.yyyy
  const m = s.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (m) {
    const month = parseInt(m[2]);
    return { date: new Date(parseInt(m[3]), month - 1, parseInt(m[1])), month };
  }

  // yyyy-mm-dd
  const m2 = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m2) {
    const month = parseInt(m2[2]);
    return { date: new Date(parseInt(m2[1]), month - 1, parseInt(m2[3])), month };
  }

  // Letzter Versuch: native Date-Parsing
  try {
    const date = new Date(value);
    if (!isNaN(date)) return { date, month: date.getMonth() + 1 };
  } catch {}

  return null;
}

/** Parst einen Geldbetrag (Excel-Number oder de-Format-String). */
function parseAmount(value) {
  if (typeof value === 'string') {
    return parseFloat(value.replace(/\./g, '').replace(',', '.'));
  }
  return parseFloat(value);
}

export function parseBankXLSX(rows) {
  const months = {};
  const monthDates = {}; // letztes Datum pro Monat (für Saldo)

  const { dateCol, betragCol, saldoCol } = findBankColumns(rows[0] || []);

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;

    const parsed = parseDateCell(row[dateCol]);
    if (!parsed || parsed.month < 1 || parsed.month > 12) continue;

    const betrag = parseAmount(row[betragCol]);
    if (isNaN(betrag)) continue;

    const saldoRaw = saldoCol < row.length ? row[saldoCol] : null;
    const saldo = saldoRaw != null ? parseAmount(saldoRaw) : NaN;

    const monthName = MONTH_LABELS[parsed.month];
    if (!months[monthName]) months[monthName] = { ein: 0, aus: 0, saldo: 0 };

    if (betrag > 0) months[monthName].ein += betrag;
    else months[monthName].aus += betrag;

    // Saldo: jeweils der jüngste Eintrag des Monats
    if (!isNaN(saldo)) {
      if (!monthDates[monthName] || (parsed.date && parsed.date >= monthDates[monthName])) {
        monthDates[monthName] = parsed.date;
        months[monthName].saldo = saldo;
      }
    }
  }

  return months;
}

export function parseBankCSV(csv) {
  const lines = csv.split('\n');
  const months = {};

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(';');
    if (cols.length < 14) continue;

    const dateStr = cols[4];
    const betragStr = cols[11];
    const saldoStr = cols[13];

    if (!dateStr || !betragStr) continue;

    const m = dateStr.match(/(\d{2})\.(\d{2})\.(\d{4})/);
    if (!m) continue;

    const month = parseInt(m[2]);
    const betrag = parseFloat(betragStr.replace(/\./g, '').replace(',', '.'));
    const saldo = parseFloat(saldoStr.replace(/\./g, '').replace(',', '.'));
    if (isNaN(betrag)) continue;

    const monthName = MONTH_LABELS[month];
    if (!months[monthName]) months[monthName] = { ein: 0, aus: 0, saldo: 0 };

    if (betrag > 0) months[monthName].ein += betrag;
    else months[monthName].aus += betrag;
    months[monthName].saldo = saldo;
  }

  return months;
}
