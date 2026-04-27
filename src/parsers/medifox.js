// Medifox-Parser: Therapeuten-Stammdaten (Controlling-Sheet "Teams") und Roh-Umsätze.
import { MN } from '../helpers/months.js';

/** Roh-Umsätze pro Behandlung (eine Zeile pro Behandlung). */
export function parseRaw(rows) {
  const out = [];

  function getWeek(dt) {
    const t = new Date(dt.getFullYear(), 0, 1);
    const dn = (dt.getDay() + 6) % 7;
    dt.setDate(dt.getDate() - dn + 3);
    const fw = new Date(dt.getFullYear(), 0, 4);
    return 1 + Math.round(((dt - fw) / 864e5 - 3 + (fw.getDay() + 6) % 7) / 7);
  }

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const name = r[0];
    const price = parseFloat(r[7]) || 0;
    if (!name || price <= 0) continue;

    let month = null, week = null, dateObj = null;
    const dv = r[1];
    if (typeof dv === 'number' && dv > 40000) {
      dateObj = new Date(Math.round((dv - 25569) * 86400000));
      month = dateObj.getUTCMonth() + 1;
    } else {
      const s = String(dv), m = s.match(/(\d{1,2})\.(\d{1,2})\.(\d{2,4})/);
      if (m) {
        month = parseInt(m[2]);
        dateObj = new Date(parseInt(m[3] < 100 ? 2000 + parseInt(m[3]) : m[3]), month - 1, parseInt(m[1]));
      } else {
        const m2 = s.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (m2) {
          month = parseInt(m2[2]);
          dateObj = new Date(parseInt(m2[1]), month - 1, parseInt(m2[3]));
        }
      }
    }

    const clean = String(name)
      .replace(/\s*\((?:Physio|Ergo)\s*(?:-\s*)?#\d+\)\s*/g, '')
      .replace(/\s+/g, ' ').trim();

    const billed = String(r[8] || '').toUpperCase() === 'WAHR' || r[8] === true;
    const wd = dateObj ? (dateObj.getUTCDay() + 6) % 7 : null;
    if (dateObj) week = getWeek(new Date(dateObj.getTime()));

    let startMin = null, durMin = 0;
    const tv = r[2];
    if (typeof tv === 'number') {
      startMin = Math.round(tv * 1440);
    } else {
      const tm = String(tv || '').match(/(\d{1,2}):(\d{2})/);
      if (tm) startMin = parseInt(tm[1]) * 60 + parseInt(tm[2]);
    }
    const dv3 = r[3];
    if (typeof dv3 === 'number') {
      durMin = Math.round(dv3 * 1440);
    } else {
      const dm = String(dv3 || '').match(/(\d{1,2}):(\d{2})/);
      if (dm) durMin = parseInt(dm[1]) * 60 + parseInt(dm[2]);
    }
    const dateKey = dateObj
      ? (dateObj.getUTCFullYear() + '-' + (dateObj.getUTCMonth() + 1) + '-' + dateObj.getUTCDate())
      : null;

    out.push({ name: clean, month, week, price, billed, wd, startMin, durMin, dateKey });
  }
  return out;
}

/** Therapeuten-Stammdaten aus dem "Teams"-Sheet. */
export function parseCtrl(rows) {
  const out = [];
  const skipPrefixes = ['Team-Zuordnung', 'Team-Spalte', 'BM ', 'Daten', '>65', 'Verfügbare', 'Hinweis', 'Anleitung'];

  for (let i = 0; i < rows.length; i++) {
    const n = String(rows[i][0] || '').trim();
    if (!n || n === 'GESAMT' || n === 'Therapeut:in' || skipPrefixes.some(p => n.startsWith(p))) continue;

    const s = String(rows[i][2] || '').trim();
    const b = String(rows[i][3] || '').trim();

    const mh = {};
    for (let mi = 0; mi < 12; mi++) {
      const v = parseFloat(rows[i][4 + mi]);
      if (!isNaN(v) && v > 0) mh[MN[mi]] = v;
    }
    // Carry-forward für leere Monate
    let last = 0;
    MN.forEach(m => {
      if (mh[m]) last = mh[m];
      else if (last > 0) mh[m] = last;
    });

    const w = mh['Jan'] || parseFloat(rows[i][4]) || 0;
    if (w > 0 || Object.keys(mh).length > 0) out.push({ n, s, b, wh: w, mh });
  }
  return out;
}
