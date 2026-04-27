// ============================================================
//  DATA LOADER
//  Lädt parallel alle Excel-Dateien aus SharePoint, parst sie
//  und befüllt den zentralen state.
// ============================================================

import { state } from './state.js';
import { SITE, PHFIP_SITE, FILES, KPI_PHFIP_ID } from './config.js';
import { getSiteId, getDriveId, getSheetNames, getSheet, getUsedRange } from './api.js';
import { parseBWA } from './parsers/bwa.js';
import { loadBank } from './parsers/bank.js';
import { parseRaw, parseCtrl } from './parsers/medifox.js';
import { parsePlanDashboard, parsePlanEinnahmen, parsePlanEinnahmenPHFIP, parsePlanAusgaben } from './parsers/plan.js';
import { parseAuslastungSheet } from './parsers/auslastung.js';
import { parseKrankenstand, parseRechnungen } from './parsers/krankenstand.js';
import { buildNameMap } from './helpers/plan-match.js';
import { getCurrentKW } from './helpers/months.js';

// Hilfsfunktion: wickelt eine Promise-Kette in einen "darf scheitern"-Wrapper
const safe = (p) => p.catch((e) => { console.warn('Loader (ignoriert):', e); return null; });

export async function loadAll(progress = () => {}) {
  progress('Verbinde…');

  const siteId = await getSiteId(SITE.host, SITE.path);
  state.driveId = await getDriveId(siteId);
  if (!state.driveId) throw new Error('KIMOJO-Drive konnte nicht aufgelöst werden');

  // PHFIP optional – darf scheitern
  try {
    const phfipSiteId = await getSiteId(PHFIP_SITE.host, PHFIP_SITE.path);
    if (phfipSiteId) state.phfipDriveId = await getDriveId(phfipSiteId);
  } catch (e) {
    console.warn('PHFIP site:', e);
  }

  progress('Lade alle Daten parallel…');

  const dK = state.driveId;
  const dP = state.phfipDriveId;

  // alle Calls in safe(...) gewickelt – einzelne 404 brechen NICHT den ganzen Loader
  const bwaKSheetsP   = safe(getSheetNames(dK, FILES.bwaK));
  const bwaPSheetsP   = safe(getSheetNames(dK, FILES.bwaP));
  const ctrlP         = safe(getSheet(dK, FILES.kpi, 'Teams'));

  const medifoxP = [
    { file: FILES.medifoxF1, filiale: 'KIMOJO #1' },
    { file: FILES.medifoxF2, filiale: 'KIMOJO #2' },
    { file: FILES.medifoxF3, filiale: 'KIMOJO #3' },
    { file: FILES.medifoxF4, filiale: 'PHFIP' }
  ].map(m => safe(getSheet(dK, m.file, 'Export')).then(d => ({ d, filiale: m.filiale })));

  const bankKP = safe(loadBank(dK, FILES.bankK));
  const bankPP = safe(loadBank(dK, FILES.bankP));

  const planDashKP = safe(getSheet(dK, FILES.planK, 'Dashboard 2026'));
  const planEinKP  = safe(getSheet(dK, FILES.planK, 'Planeinnahmen'));
  const planKSheetsP = safe(getSheetNames(dK, FILES.planK));
  const planDashPP = safe(getSheet(dK, FILES.planP, 'Dashboard'));
  const planEinPP  = safe(getSheet(dK, FILES.planP, 'Planeinnahmen'));
  const planPSheetsP = safe(getSheetNames(dK, FILES.planP));

  const auslKP = safe(getUsedRange(dK, FILES.kpi, 'Auslastung'));
  const auslPP = dP
    ? safe(getUsedRange(dP, KPI_PHFIP_ID, 'Auslastung'))
    : Promise.resolve(null);

 // Rechnungen-Datei vorerst deaktiviert (404 in SharePoint)
  const rechnungenP = Promise.resolve(null);
  const krankenstandP   = safe(getSheet(dK, FILES.krankenstand, 'Export'));
  const krankenstandTWP = safe(getSheet(dK, FILES.krankenstand, 'TageWoche'));

  // ─── BWA verarbeiten ───
  progress('Verarbeite BWA…');
  const [bwaKSheets, bwaPSheets] = await Promise.all([bwaKSheetsP, bwaPSheetsP]);

  state.data.bwaK = {};
  if (bwaKSheets && bwaKSheets.length) {
    const bwaKLoads = bwaKSheets.map(s => safe(getSheet(dK, FILES.bwaK, s)).then(d => ({ s, d })));
    (await Promise.all(bwaKLoads)).forEach(({ s, d }) => { if (d) state.data.bwaK[s] = parseBWA(d); });
  }

  state.data.bwaP = {};
  if (bwaPSheets && bwaPSheets.length) {
    const bwaPLoads = bwaPSheets.map(s => safe(getSheet(dK, FILES.bwaP, s)).then(d => ({ s, d })));
    (await Promise.all(bwaPLoads)).forEach(({ s, d }) => { if (d) state.data.bwaP[s] = parseBWA(d); });
  }

  // ─── Bank ───
  progress('Verarbeite Umsatzdaten…');
  const [bankK, bankP] = await Promise.all([bankKP, bankPP]);
  state.data.bankK = bankK || {};
  state.data.bankP = bankP || {};

  // ─── Therapeuten ───
  const ctrl = await ctrlP;
  if (ctrl) state.data.ctrl = parseCtrl(ctrl);

  // ─── Medifox ───
  const medifoxResults = await Promise.all(medifoxP);
  let allRaw = [];
  medifoxResults.forEach(({ d, filiale }) => {
    if (d) {
      const parsed = parseRaw(d);
      parsed.forEach(r => r.filiale = filiale);
      allRaw = allRaw.concat(parsed);
    }
  });
  if (allRaw.length > 0) {
    state.data.raw = allRaw;
  } else {
    try {
      const raw = await getSheet(dK, FILES.kpi, 'Rohdaten Umsatz');
      if (raw) {
        state.data.raw = parseRaw(raw);
        state.data.raw.forEach(r => r.filiale = 'KIMOJO');
      }
    } catch {}
  }

  // ─── Plan KIMOJO ───
  progress('Verarbeite Planungen…');
  try {
    const planDashK = await planDashKP;
    if (planDashK) state.data.planK.dashboard = parsePlanDashboard(planDashK);
    const planEinK = await planEinKP;
    if (planEinK) state.data.planK.einnahmen = parsePlanEinnahmen(planEinK);
    const planKSheets = await planKSheetsP;
    const planAusKName = (planKSheets || []).find(s => s.trim().toLowerCase() === 'planausgaben');
    if (planAusKName) {
      const planAusK = await safe(getSheet(dK, FILES.planK, planAusKName));
      if (planAusK) state.data.planK.ausgaben = parsePlanAusgaben(planAusK);
    }
  } catch (e) { console.warn('Plan KIMOJO:', e); }

  // ─── Plan PHFIP ───
  try {
    const planDashP = await planDashPP;
    if (planDashP) state.data.planP.dashboard = parsePlanDashboard(planDashP);
    const planEinP = await planEinPP;
    if (planEinP) state.data.planP.einnahmen = parsePlanEinnahmenPHFIP(planEinP);
    const planPSheets = await planPSheetsP;
    const planAusPName = (planPSheets || []).find(s => s.trim().toLowerCase() === 'planausgaben');
    if (planAusPName) {
      const planAusP = await safe(getSheet(dK, FILES.planP, planAusPName));
      if (planAusP) state.data.planP.ausgaben = parsePlanAusgaben(planAusP);
    }
  } catch (e) { console.warn('Plan PHFIP:', e); }

  // ─── Auslastung ───
  const auslKR = await auslKP;
  if (auslKR && auslKR.values) state.data.auslK = parseAuslastungSheet(auslKR.values);
  const auslPR = await auslPP;
  if (auslPR && auslPR.values) state.data.auslP = parseAuslastungSheet(auslPR.values);

  // ─── Rechnungen ───
  try {
    const rechnungenData = await rechnungenP;
    state.data.rechnungen = parseRechnungen(rechnungenData);
  } catch (e) {
    console.warn('Rechnungen:', e);
    state.data.rechnungen = { total: 0, count: 0, byType: {}, byPrefix: {} };
  }

  // ─── Krankenstand ───
  try {
    const ksData = await krankenstandP;
    const ksTW = await krankenstandTWP;
    state.data.krankenstand = parseKrankenstand(ksData, ksTW);
  } catch (e) {
    console.warn('Krankenstand:', e);
    state.data.krankenstand = { byMA: [], tageWoche: {}, total: 0, basePlan: 15 };
  }

  // ─── Initiale KW ───
  const allAuslKWs = [
    ...(state.data.auslK || []).map(d => d.kw),
    ...(state.data.auslP || []).map(d => d.kw)
  ];
  const curKW = getCurrentKW();
  state.selectedAuslKW = Math.min(curKW - 1, allAuslKWs.length ? Math.max(...allAuslKWs) : curKW - 1);

  // ─── Name-Mapping ───
  progress('Aufbau…');
  if (state.data.raw && state.data.raw.length && state.data.ctrl && state.data.ctrl.length) {
    buildNameMap();
    state.data.raw.forEach(r => { if (state.nameMap[r.name]) r.name = state.nameMap[r.name]; });
  }
}