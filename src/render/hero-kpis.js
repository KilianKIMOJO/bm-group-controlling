// Hero-KPI-Karten oben im Dashboard.
import { state, matchStandort } from '../state.js';
import { MN, getActiveMonths, getWorkingHoursMonth } from '../helpers/months.js';
import { getBWA, sumBWA } from '../helpers/bwa-helpers.js';
import { getPlanForMonths } from '../helpers/plan-match.js';
import { fm, fmK } from '../helpers/format.js';
import { renderDelta } from './filters.js';

export function renderHeroKpis() {
  const months = getActiveMonths();
  const aS = state.activeStandort;
  const bK = sumBWA(state.data.bwaK, months);
  const bP = sumBWA(state.data.bwaP, months);

  // Aggregierte BWA-Werte je nach Standort
  let umsatzBWA = 0, ergebnis = 0, kosten = 0;
  if (aS === 'Alle' || aS === 'KIMOJO Gesamt' || aS === 'KIMOJO Physio' || aS === 'KIMOJO Ergo') {
    umsatzBWA += bK.umsatz; ergebnis += bK.ergebnis; kosten += bK.gesamtkosten;
  }
  if (aS === 'Alle' || aS === 'PF im Park') {
    umsatzBWA += bP.umsatz; ergebnis += bP.ergebnis; kosten += bP.gesamtkosten;
  }

  const marge = umsatzBWA > 0 ? (ergebnis / umsatzBWA * 100).toFixed(1) : '0';
  const margeColor = parseFloat(marge) < 10 ? 'var(--red)' : parseFloat(marge) < 20 ? '#c77f1a' : '#00907a';
  const ergebnisColor = ergebnis >= 0 ? '#00907a' : 'var(--red)';

  // Erbrachte Leistungen (Medifox)
  const monthNums = months.map(m => MN.indexOf(m) + 1);
  const filtered = state.data.raw.filter(r => monthNums.includes(r.month));
  let umsatzErbracht = 0;
  const therapists = state.data.ctrl.filter(t => matchStandort(t.s));
  const theraNames = new Set(therapists.map(t => t.n));
  filtered.forEach(r => {
    if (aS !== 'Alle' && !theraNames.has(r.name)) return;
    umsatzErbracht += r.price;
  });

  // ø €/Stunde
  const agg = {};
  filtered.forEach(r => {
    if (aS !== 'Alle' && !theraNames.has(r.name)) return;
    if (!agg[r.name]) agg[r.name] = 0;
    agg[r.name] += r.price;
  });
  const ephs = therapists.map(t => {
    const rev = agg[t.n] || 0;
    const h = getWorkingHoursMonth(t, months);
    return h > 0 ? rev / h : 0;
  }).filter(v => v > 0);
  const avgU = ephs.length ? (ephs.reduce((a, b) => a + b, 0) / ephs.length).toFixed(1) : '0';
  const avgUColor = parseFloat(avgU) < 56 ? 'var(--red)' : parseFloat(avgU) < 65 ? '#c77f1a' : '#00907a';

  // Geschätzter Gewinn = erbracht - kosten
  const geschGewinn = umsatzErbracht - kosten;
  const geschGewinnColor = geschGewinn >= 0 ? '#00907a' : 'var(--red)';
  const geschMarge = umsatzErbracht > 0 ? (geschGewinn / umsatzErbracht * 100).toFixed(1) : '0';
  const geschMargeColor = parseFloat(geschMarge) < 10 ? 'var(--red)' : parseFloat(geschMarge) < 20 ? '#c77f1a' : '#00907a';
  const kostenColor = kosten > 0 ? 'var(--dark)' : 'var(--muted)';

  // Plan-Werte
  const planEin    = getPlanForMonths(months, 'einnahmen');
  const planKosten = getPlanForMonths(months, 'kosten');
  const planGewinn = getPlanForMonths(months, 'gewinn');

  const planBadge = (ist, plan, label, invertColors) => {
    if (!plan || (!state.data.planK.dashboard && !state.data.planP.dashboard)) return '';
    return `<div class="hk-plan"><span class="plan-label">${label}</span> <span class="plan-val">${fmK(plan)}</span> ${renderDelta(ist, plan, invertColors)}</div>`;
  };

  const aM = state.activeMonth;
  let html = '';

  html += `<div class="hk"><div class="hk-l">Umsatz Erbracht</div><div class="hk-v">${fm(umsatzErbracht)}</div><div class="hk-sub">${aM} · aus Praxissoftware</div>${planBadge(umsatzErbracht, planEin, 'Plan')}</div>`;
  html += `<div class="hk"><div class="hk-l">Umsatz BWA</div><div class="hk-v">${fm(umsatzBWA)}</div><div class="hk-sub">${aM} · vom Steuerberater</div></div>`;
  html += `<div class="hk"><div class="hk-l">Gesamtkosten</div><div class="hk-v" style="color:${kostenColor}">${fm(kosten)}</div><div class="hk-sub">${aM} · BWA</div>${planBadge(kosten, planKosten, 'Plan-Kosten', true)}</div>`;
  html += `<div class="hk"><div class="hk-l">Ergebnis (BWA)</div><div class="hk-v" style="color:${ergebnisColor}">${fm(ergebnis)}</div><div class="hk-sub">vor Steuern · Marge ${marge}%</div>${planBadge(ergebnis, planGewinn, 'Plan-Gewinn')}</div>`;
  html += `<div class="hk"><div class="hk-l">ø €/Stunde</div><div class="hk-v" style="color:${avgUColor}">${avgU.replace('.', ',')} €</div><div class="hk-sub">&lt;56 · 56–65 · &gt;65</div></div>`;
  html += `<div class="hk" style="border:2px dashed var(--border);background:#fffdf8"><div class="hk-l">Geschätzter Gewinn (erbracht) *</div><div class="hk-v" style="color:${geschGewinnColor}">${fm(geschGewinn)}</div><div class="hk-sub" style="font-style:italic">* Marge <span style="color:${geschMargeColor};font-weight:700">${geschMarge}%</span> · Erbrachte Leistungen − BWA-Kosten</div>${planBadge(geschGewinn, planGewinn, 'Plan-Gewinn')}</div>`;

  // Erwarteter Jahresgewinn (rollierend)
  const curMonthIdx = new Date().getMonth();
  let jahresGewinnIst = 0, jahresGewinnPlan = 0;
  MN.forEach((m, i) => {
    if (i < curMonthIdx) {
      const bKm = getBWA(state.data.bwaK, m);
      const bPm = getBWA(state.data.bwaP, m);
      if (aS === 'Alle' || aS === 'KIMOJO Gesamt' || aS === 'KIMOJO Physio' || aS === 'KIMOJO Ergo') { if (bKm) jahresGewinnIst += bKm.ergebnis; }
      if (aS === 'Alle' || aS === 'PF im Park') { if (bPm) jahresGewinnIst += bPm.ergebnis; }
    } else {
      if (aS === 'Alle' || aS === 'KIMOJO Gesamt' || aS === 'KIMOJO Physio' || aS === 'KIMOJO Ergo') { if (state.data.planK.dashboard) jahresGewinnPlan += state.data.planK.dashboard.therapie['gewinn_' + m] || 0; }
      if (aS === 'Alle' || aS === 'PF im Park') { if (state.data.planP.dashboard) jahresGewinnPlan += state.data.planP.dashboard.therapie['gewinn_' + m] || 0; }
    }
  });
  const jahresGewinn = jahresGewinnIst + jahresGewinnPlan;
  const jgColor = jahresGewinn >= 0 ? '#00907a' : 'var(--red)';
  const jahresPlanGewinn = getPlanForMonths(MN, 'gewinn');
  const jgDelta = jahresPlanGewinn > 0 ? ((jahresGewinn - jahresPlanGewinn) / jahresPlanGewinn * 100).toFixed(1) : '0';
  const jgDeltaCls = parseFloat(jgDelta) >= 0 ? 'delta-pos' : 'delta-neg';
  const jgSign = parseFloat(jgDelta) >= 0 ? '+' : '';

  html += `<div class="hk" style="background:linear-gradient(135deg,#fafffe,#f0fdf9);border:2px solid rgba(0,191,166,.2)"><div class="hk-l">🔮 Erwarteter Jahresgewinn 2026</div><div class="hk-v" style="color:${jgColor}">${fm(jahresGewinn)}</div><div class="hk-sub">Ist (Jan–${MN[Math.max(curMonthIdx - 1, 0)]}) + Plan (${MN[curMonthIdx]}–Dez)</div><div class="hk-plan"><span class="plan-label">Jahres-Plan</span> <span class="plan-val">${fmK(jahresPlanGewinn)}</span> <span class="plan-delta ${jgDeltaCls}">${jgSign}${jgDelta}%</span></div></div>`;

  // Personalquote
  let personalK = 0, personalP = 0;
  if (aS === 'Alle' || aS === 'KIMOJO Gesamt' || aS === 'KIMOJO Physio' || aS === 'KIMOJO Ergo') personalK = bK.personal;
  if (aS === 'Alle' || aS === 'PF im Park') personalP = bP.personal;
  const personalTotal = personalK + personalP;
  const pQuote = umsatzBWA > 0 ? (personalTotal / umsatzBWA * 100).toFixed(1) : '0';
  const pqColor = parseFloat(pQuote) > 80 ? 'var(--red)' : parseFloat(pQuote) > 65 ? '#c77f1a' : '#00907a';
  html += `<div class="hk"><div class="hk-l">Personalquote</div><div class="hk-v" style="color:${pqColor}">${pQuote}%</div><div class="hk-sub">Personal ÷ Umsatz · Ziel &lt;65%</div></div>`;

  // Forderungsreichweite
  if (state.data.rechnungen && state.data.rechnungen.total > 0 && months.length > 0) {
    const avgMonthRev = umsatzBWA / months.length;
    const fordReichweite = avgMonthRev > 0 ? (state.data.rechnungen.total / avgMonthRev).toFixed(1) : '0';
    const frColor = parseFloat(fordReichweite) > 2 ? 'var(--red)' : parseFloat(fordReichweite) > 1 ? '#c77f1a' : '#00907a';
    html += `<div class="hk"><div class="hk-l">Forderungsreichweite</div><div class="hk-v" style="color:${frColor}">${fordReichweite} Monate</div><div class="hk-sub">${fm(state.data.rechnungen.total)} offene Forderungen</div></div>`;
  }

  document.getElementById('hero').innerHTML = html;
}
