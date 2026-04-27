// ============================================================
//  ZENTRALER APPLICATION STATE
//  Statt vieler globaler Variablen: ein Objekt.
//  Wird von Datenladern befüllt, von Render-Funktionen gelesen.
// ============================================================

export const state = {
  // Auth/API IDs
  driveId: null,
  phfipDriveId: null,

  // Active filters (von User wählbar)
  activeMonth: 'YTD',          // "YTD" | "AKTUELL" | "Jan" | ... | "Dez"
  activeStandort: 'Alle',      // "Alle" | "KIMOJO Gesamt" | "KIMOJO Physio" | "KIMOJO Ergo" | "PF im Park"
  selectedAuslKW: 0,

  // Geladene Daten
  data: {
    bwaK: {},        // BWA KIMOJO: { "Januar 2026": {umsatz, ergebnis, ...}, ... }
    bwaP: {},        // BWA PHFIP
    bankK: {},       // Bank KIMOJO: { Jan: {ein, aus, saldo}, ... }
    bankP: {},       // Bank PHFIP
    ctrl: [],        // Therapeuten-Stammdaten: [{n, s, b, wh, mh}]
    raw: [],         // Medifox-Rohdaten: [{name, month, week, price, ...}]
    planK: {},       // Plan KIMOJO: { dashboard, einnahmen, ausgaben }
    planP: {},       // Plan PHFIP
    auslK: [],       // Auslastung KIMOJO: [{kw, physio, ergo, month}]
    auslP: [],       // Auslastung PHFIP
    rechnungen: { total: 0, count: 0, byType: {}, byPrefix: {} },
    krankenstand: { byMA: [], tageWoche: {}, total: 0, basePlan: 15 }
  },

  // Name-Mapping (Medifox-Name -> Controlling-Name)
  nameMap: {}
};

/** Hilfsfunktion: Standort-Filter anwenden. */
export function matchStandort(therapistStandort) {
  if (state.activeStandort === 'Alle') return true;
  if (state.activeStandort === 'KIMOJO Gesamt') {
    return therapistStandort === 'KIMOJO Physio' || therapistStandort === 'KIMOJO Ergo';
  }
  return therapistStandort === state.activeStandort;
}

// Alt-Alias (für Code, der noch matchS importiert).
export const matchS = matchStandort;
