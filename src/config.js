// ============================================================
//  ZENTRALE KONFIGURATION
//  Hier liegen ALLE IDs, Konstanten und Einstellungen.
//  Wenn sich eine Datei-ID ändert, NUR HIER anpassen.
// ============================================================

// --- Microsoft Auth ---
// Werte kommen aus .env (im Repo nur als .env.example).
// Vite ersetzt import.meta.env.VITE_* beim Build automatisch.
export const MSAL_CONFIG = {
  auth: {
    clientId: import.meta.env.VITE_MSAL_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_MSAL_TENANT_ID}`,
    redirectUri: window.location.origin + window.location.pathname
  },
  cache: {
    cacheLocation: 'sessionStorage'
  }
};

export const LOGIN_REQUEST = {
  scopes: ['Files.Read', 'Sites.Read.All']
};

// --- SharePoint Sites ---
export const SITE = {
  host: import.meta.env.VITE_SHAREPOINT_HOST,
  path: import.meta.env.VITE_SHAREPOINT_PATH
};

export const PHFIP_SITE = {
  host: import.meta.env.VITE_SHAREPOINT_HOST,
  path: import.meta.env.VITE_PHFIP_PATH
};

// --- Datei-IDs in SharePoint ---
// Wenn ein Excel-File ausgetauscht wird, hier die neue ID eintragen.
export const FILES = {
  kpi: 'a9b8cad6-e1bd-414d-8aaf-503a0e18822f',
  medifoxF1: '7BB83665-B91D-4E99-9FDB-E6CBA0496721',
  medifoxF2: 'C7C25E25-8770-4123-B0F0-39B550252905',
  medifoxF3: 'C3F9A7D3-452D-4ED5-8C3B-602BB7910A2F',
  medifoxF4: '6230A887-EE13-4FA7-86DA-C1FDBEE62B5F',
  bwaK: 'EEE9DBB4-A663-4A58-9E80-0E155B44D938',
  bwaP: '09CE1ACC-AE3C-4A0A-A7B6-FFFE6FB22C04',
  bankK: '65B46DB5-34A8-4D10-9343-B556B19A22D6',
  bankP: 'B53B0F06-2604-43E1-A4B5-E204F986C081',
  planK: 'FE3CC1BF-F19E-4AD4-8D5C-C8E79756622C',
  planP: '0479CA17-C22A-4A0B-87F2-F11EA7FF9CFD',
  rechnungen: 'D8CC52C7-9EE7-4CA1-ABB4-F520769C8078',
  krankenstand: 'F0E4C01E-14F3-4FF2-9380-329672BEEEB4'
};

// PHFIP-spezifische Datei-ID (liegt auf PHFIP-Site)
export const KPI_PHFIP_ID = '770759B1-D4F0-48A1-804B-7EB765D00E5F';

// --- Standort-Farbcodes ---
export const STANDORT_COLORS = {
  'KIMOJO Physio': '#C03B35',
  'KIMOJO Ergo': '#e07a5f',
  'KIMOJO Gesamt': '#C03B35',
  'PF im Park': '#00bfa6'
};

// --- Monatsnamen (deutsch, kurz) ---
export const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

// --- Feiertage pro Monat (für Wochenstunden-Berechnung) ---
export const FEIERTAGE_BY_MONTH = {
  Jan: 2, Feb: 0, 'Mär': 0, Apr: 2, Mai: 3, Jun: 1,
  Jul: 0, Aug: 0, Sep: 0, Okt: 0, Nov: 0, Dez: 1
};

// --- Schwellwerte für €/Stunde-Bewertung ---
export const EUR_PRO_STUNDE = {
  ROT: 56,
  GELB: 65
};

// --- Plan-Krankenstand: Basis-Tage pro Jahr bei 5-Tage-Woche ---
export const KRANKENSTAND_BASE_PLAN = 15;
