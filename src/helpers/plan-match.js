// Plan-Helper: Aggregation und Therapeuten-Matching.
import { state } from '../state.js';

/**
 * Summe einer Plan-Kategorie (z.B. 'Personal') über mehrere Monate,
 * gefiltert nach Standort (state.activeStandort).
 */
export function getPlanCatForMonths(months, cat) {
  let total = 0;
  const sources = [];
  const aS = state.activeStandort;

  if (aS === 'Alle' || aS === 'KIMOJO Gesamt' || aS === 'KIMOJO Physio' || aS === 'KIMOJO Ergo') {
    if (state.data.planK.ausgaben) sources.push(state.data.planK.ausgaben);
  }
  if (aS === 'Alle' || aS === 'PF im Park') {
    if (state.data.planP.ausgaben) sources.push(state.data.planP.ausgaben);
  }
  sources.forEach(src => {
    if (!src[cat]) return;
    months.forEach(m => { total += (src[cat][m] || 0); });
  });
  return total;
}

/**
 * Summe eines Plan-Wertes (einnahmen|kosten|gewinn|personal) über mehrere Monate.
 */
export function getPlanForMonths(months, key) {
  let total = 0;
  const aS = state.activeStandort;

  months.forEach(m => {
    if (aS === 'Alle' || aS === 'KIMOJO Gesamt' || aS === 'KIMOJO Physio' || aS === 'KIMOJO Ergo') {
      if (state.data.planK.dashboard) {
        total += (state.data.planK.dashboard.therapie[key + '_' + m] || 0);
      }
    }
    if (aS === 'Alle' || aS === 'PF im Park') {
      if (state.data.planP.dashboard) {
        total += (state.data.planP.dashboard.therapie[key + '_' + m] || 0);
      }
    }
  });
  return total;
}

/** Plan-Umsatz eines einzelnen Therapeuten über mehrere Monate (Fuzzy-Matching). */
export function getPlanTherapist(name, months) {
  const allPlans = [];
  if (state.data.planK.einnahmen) allPlans.push(state.data.planK.einnahmen);
  if (state.data.planP.einnahmen) allPlans.push(state.data.planP.einnahmen);

  for (const planEin of allPlans) {
    const match = matchPlanName(planEin, name);
    if (match) {
      let total = 0;
      months.forEach(m => { total += (planEin[match][m] || 0); });
      if (total > 0) return total;
    }
  }
  return 0;
}

/** Plan-Umsatz eines Therapeuten für genau einen Monat. */
export function getPlanTherapistMonth(name, month) {
  const allPlans = [];
  if (state.data.planK.einnahmen) allPlans.push(state.data.planK.einnahmen);
  if (state.data.planP.einnahmen) allPlans.push(state.data.planP.einnahmen);

  for (const planEin of allPlans) {
    const match = matchPlanName(planEin, name);
    if (match) {
      const v = planEin[match][month] || 0;
      if (v > 0) return v;
    }
  }
  return 0;
}

/** Fuzzy-Matching: Therapist-Name → Plan-Eintrag-Name. */
function matchPlanName(planEin, name) {
  const planNames = Object.keys(planEin).filter(n => !n.startsWith('Planstelle'));
  // 1. Exakter Match
  let match = planNames.find(pn => pn.toLowerCase() === name.toLowerCase());
  if (match) return match;

  const parts = name.split(/[,\s]+/).filter(p => p.length > 2);

  // 2. Mindestens zwei Namensteile passen
  if (parts.length >= 2) {
    match = planNames.find(pn => {
      const pnL = pn.toLowerCase();
      return parts.filter(p => pnL.includes(p.toLowerCase())).length >= 2;
    });
    if (match) return match;
  }

  // 3. Single-word match (z.B. nur Vorname)
  if (parts.length === 1) {
    match = planNames.find(pn => pn.toLowerCase() === parts[0].toLowerCase());
    if (match) return match;
    match = planNames.find(pn => pn.toLowerCase().includes(parts[0].toLowerCase()) && pn.split(/\s+/).length <= 2);
    if (match) return match;
  }

  // 4. Last resort: Nachname matcht
  if (parts.length >= 2) {
    const surname = parts[0].toLowerCase();
    match = planNames.find(pn => {
      const pnL = pn.toLowerCase();
      return pnL.startsWith(surname) || pnL.includes(surname + ' ') || pnL.includes(surname + ',');
    });
    if (match) return match;
  }
  return null;
}

/** Normalisiert einen Therapeuten-Namen zu "Nachname,Vorname" (lowercase). */
export function normalizeTherapeutName(n) {
  n = String(n).trim();
  if (n.includes(',')) {
    const p = n.split(',');
    return (p[0].trim() + ',' + p[1].trim()).toLowerCase();
  }
  const p = n.split(/\s+/);
  if (p.length >= 2) return (p[p.length - 1] + ',' + p.slice(0, -1).join(' ')).toLowerCase();
  return n.toLowerCase();
}

/** Erstellt Mapping: Medifox-Name → Controlling-Name. */
export function buildNameMap() {
  const map = {};
  const ctrlNorm = {};
  state.data.ctrl.forEach(t => { ctrlNorm[normalizeTherapeutName(t.n)] = t.n; });
  const rawNames = new Set(state.data.raw.map(r => r.name));
  rawNames.forEach(rawName => {
    const nm = normalizeTherapeutName(rawName);
    if (ctrlNorm[nm]) { map[rawName] = ctrlNorm[nm]; return; }
    const parts = rawName.split(/[,\s]+/);
    for (const target of Object.keys(ctrlNorm)) {
      if (parts.some(p => p.length > 2 && target.includes(p.toLowerCase()))) {
        map[rawName] = ctrlNorm[target];
        return;
      }
    }
  });
  state.nameMap = map;
}
