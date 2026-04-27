// Planungs-Parser: Dashboard, Einnahmen pro Therapeut, Ausgaben.
import { MN } from '../helpers/months.js';

/** "Dashboard"-Sheet: Plankosten/-einnahmen/-gewinn pro Monat. */
export function parsePlanDashboard(rows) {
  const plan = { therapie: {}, club: {} };
  let section = 'therapie';

  // Format-Erkennung: Label in Spalte 0 oder 1?
  let labelCol = 0, dataStart = 2;
  for (const r of rows) {
    const c1 = String(r[1] || '').trim();
    if (c1 === 'Plankosten' || c1 === 'Plan 26 Therapie') { labelCol = 1; dataStart = 3; break; }
    if (String(r[0] || '').trim() === 'Plankosten') { labelCol = 0; dataStart = 2; break; }
  }

  for (const r of rows) {
    const label = String(r[labelCol] || '').trim();

    if (label === 'Club 26' || label === 'Plan 25 Club' || label === 'Plan 26 Club') section = 'club';
    if (label === 'Therapie 26' || label === 'Plan 26 Therapie') section = 'therapie';

    const writeMonths = (key, abs = false) => {
      for (let i = 0; i < 12; i++) {
        const v = parseFloat(r[dataStart + i]) || 0;
        plan[section][key + '_' + MN[i]] = abs ? Math.abs(v) : v;
      }
    };

    if (label === 'Plankosten')                                              writeMonths('kosten', true);
    if (label === 'Planeinnahmen')                                           writeMonths('einnahmen');
    if (label === 'Plangewinn' || label === 'Plangewinn DB II')              writeMonths('gewinn');
    if (label === 'Rentabilität')                                            writeMonths('renta');
    if (label === 'Davon Personalkosten Plan' || label === 'Gesamtkosten Personal') writeMonths('personal');
  }
  return plan;
}

/** Pro-Therapeut-Plan-Umsatz (KIMOJO-Format). */
export function parsePlanEinnahmen(rows) {
  const byName = {};
  let section = 'physio';

  const skipLabels = new Set([
    'Summe Umsatz', 'Summe Umsatz Ergo', 'Gesamtumsatz',
    'Anzahl Physios', 'Anzahl Ergos', 'Summe Therapeuten', 'Einnahmen Physio'
  ]);

  for (const r of rows) {
    const label = String(r[1] || '').trim();
    if (label === 'Ergo') { section = 'ergo'; continue; }
    if (skipLabels.has(label) || !label) continue;

    const hasVals = [2,3,4,5,6,7,8,9,10,11,12,13].some(i => parseFloat(r[i]) > 0);
    if (!hasVals) continue;

    const name = label.replace(/\s+$/, '');
    byName[name] = { section };
    for (let i = 0; i < 12; i++) byName[name][MN[i]] = parseFloat(r[2 + i]) || 0;
  }
  return byName;
}

/** Pro-Therapeut-Plan-Umsatz (PHFIP-Format, mit Stunden-Info im Namen). */
export function parsePlanEinnahmenPHFIP(rows) {
  const byName = {};
  let stopped = false;

  for (const r of rows) {
    const label = String(r[1] || '').trim();
    // Parsen stoppen wenn "Aktueller Umsatz" kommt (= Ist-Werte, nicht Plan!)
    if (label === 'Aktueller Umsatz' || label.startsWith('Aktueller Umsatz')) { stopped = true; continue; }
    if (stopped) continue;
    if (!label || label === 'Einnahmen Ortsmitte' || label === 'Summe Umsatz' ||
        label === 'Anzahl Physios' || label.startsWith('Produktverkauf')) continue;

    const hasVals = [2,3,4,5,6,7,8,9,10,11,12,13].some(i => parseFloat(r[i]) > 0);
    if (!hasVals) continue;

    // Name säubern: "(30h) geplant am Px 30" → ""
    const name = label.replace(/\s*\([\d]+h\).*$/, '').replace(/\s+$/, '').trim();
    byName[name] = { section: 'physio' };
    for (let i = 0; i < 12; i++) byName[name][MN[i]] = parseFloat(r[2 + i]) || 0;
  }
  return byName;
}

/** Planausgaben → BWA-Kategorien gemappt. */
export function parsePlanAusgaben(rows) {
  const cats = { Personal: {}, Raum: {}, Versicherung: {}, Fahrzeuge: {}, Werbung: {}, Sonstige: {} };
  MN.forEach(m => Object.keys(cats).forEach(c => cats[c][m] = 0));

  function mapToCat(name) {
    const nl = name.toLowerCase();
    if (nl.includes('werbung') || nl.includes('marketing') || nl.includes('reisekosten')) return 'Werbung';
    if (nl.includes('raumkosten') || nl.includes('nebenkosten') || nl.includes('stellplatz') ||
        nl.includes('miete') || nl.includes('kosten für räume')) return 'Raum';
    if (nl.includes('versicherung') || nl.includes('beiträge')) return 'Versicherung';
    if (nl.includes('fahrzeug')) return 'Fahrzeuge';
    return 'Sonstige';
  }

  let section = 'sachkosten';
  const nameCol = 1, dataStart = 3;

  for (const r of rows) {
    const label = String(r[nameCol] || '').trim();
    if (!label) continue;
    const labelL = label.toLowerCase();

    if (labelL === 'planausgaben zentral' || labelL === 'planausgaben ortsmitte') { section = 'sachkosten'; continue; }
    if (labelL === 'physio' || labelL === 'ergo' || labelL.includes('over head') || labelL.includes('overhead') ||
        labelL === 'personal' || labelL.includes('praxismanag')) { section = 'personal'; continue; }

    if (labelL.startsWith('summe') || labelL.startsWith('gesamt') || labelL.startsWith('davon') ||
        labelL.startsWith('anzahl') || labelL === 'summe 1') continue;

    const vals = [];
    let hasVals = false;
    for (let i = 0; i < 12; i++) {
      const v = parseFloat(r[dataStart + i]) || 0;
      vals.push(v);
      if (v !== 0) hasVals = true;
    }
    if (!hasVals) continue;

    // Header-Zeile mit Monatsnamen ignorieren
    if (typeof r[dataStart] === 'string' && isNaN(parseFloat(r[dataStart]))) continue;

    if (section === 'personal') {
      for (let i = 0; i < 12; i++) cats.Personal[MN[i]] += vals[i];
    } else {
      const cat = mapToCat(label);
      for (let i = 0; i < 12; i++) cats[cat][MN[i]] += vals[i];
    }
  }
  return cats;
}
