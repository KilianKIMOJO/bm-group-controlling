// Auslastungs-Parser für die KW-Daten.

export function parseAuslastungSheet(data) {
  const kwRow     = data[2]  || [];
  const monthRow  = data[1]  || [];
  const physioSum = data[19] || [];
  let ergoSum = null;

  // Ergo-Summe finden (irgendwo zwischen Zeile 21..35)
  for (let i = 21; i < Math.min(data.length, 35); i++) {
    if (data[i] && data[i][0] && String(data[i][0]).includes('Summe')) {
      ergoSum = data[i];
      break;
    }
  }

  const kws = [];
  let col = 5, lastP = null;
  while (col < kwRow.length) {
    const kw = kwRow[col];
    if (kw && typeof kw === 'number' && kw > 0 && kw < 53) {
      const ac = col + 2;
      const pv = physioSum[ac];
      const ev = ergoSum ? ergoSum[ac] : null;
      const mo = String(monthRow[col] || '');

      if (pv && typeof pv === 'number' && pv > 0 && pv <= 1.5) {
        const pp = Math.round(pv * 1000) / 10;
        // Wiederholt sich der gleiche Wert? → Ende der echten Daten
        const isReal = lastP === null || Math.abs(pp - lastP) > 0.01;
        if (!isReal) break;
        lastP = pp;
        kws.push({
          kw: Math.round(kw),
          physio: pp,
          ergo: (ev && typeof ev === 'number' && ev > 0 && ev <= 1.5) ? Math.round(ev * 1000) / 10 : null,
          month: mo
        });
      }
      col += 4;
    } else {
      col++;
    }
  }
  return kws;
}
