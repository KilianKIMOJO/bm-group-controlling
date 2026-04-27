// Krankenstand-Parser.

export function parseKrankenstand(ksData, ksTW) {
  const result = {
    total: 0, count: 0, avg: 0,
    basePlan: 15,        // 15 Tage/Jahr bei 5-Tage-Woche
    byMA: [],
    tageWoche: {}
  };

  // 1. TageWoche-Sheet: Name → Arbeitstage/Woche
  if (ksTW && ksTW.length > 1) {
    for (let i = 1; i < ksTW.length; i++) {
      const r = ksTW[i];
      if (!r || !r[0]) continue;
      const name = String(r[0]).trim();
      const tw = parseInt(r[1]) || 5;
      result.tageWoche[name.toLowerCase()] = tw;
    }
  }

  // 2. Krankentage pro MA
  if (ksData && ksData.length > 1) {
    for (let i = 1; i < ksData.length; i++) {
      const r = ksData[i];
      if (!r || !r[0]) continue;
      const name = String(r[0]).trim();
      const days = parseInt(r[1]) || 0;
      result.byMA.push({ name, days });
      result.total += days;
      result.count++;
    }
    result.byMA.sort((a, b) => b.days - a.days);
  }

  // 3. MAs aus TageWoche, die nicht im Export sind, mit 0 Tagen ergänzen
  if (ksTW && ksTW.length > 1) {
    const existing = new Set(result.byMA.map(m => m.name.toLowerCase()));
    for (let i = 1; i < ksTW.length; i++) {
      const r = ksTW[i];
      if (!r || !r[0]) continue;
      const name = String(r[0]).trim();
      if (!existing.has(name.toLowerCase())) {
        result.byMA.push({ name, days: 0 });
      }
    }
  }

  return result;
}

/** Rechnungsübersicht parsen. */
export function parseRechnungen(rows) {
  const result = { total: 0, count: 0, byType: {}, byPrefix: {} };
  if (!rows || rows.length <= 1) return result;

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r) continue;
    const saldo = parseFloat(r[17]) || 0;
    if (saldo === 0) continue;
    const typ = String(r[6] || 'Unbekannt');
    const nr = String(r[0] || '');
    const prefix = nr.startsWith('K-') ? 'KIMOJO' : 'PHFIP';

    result.total += saldo;
    result.count++;
    if (!result.byType[typ]) result.byType[typ] = { count: 0, saldo: 0 };
    result.byType[typ].count++;
    result.byType[typ].saldo += saldo;
    if (!result.byPrefix[prefix]) result.byPrefix[prefix] = { count: 0, saldo: 0 };
    result.byPrefix[prefix].count++;
    result.byPrefix[prefix].saldo += saldo;
  }
  return result;
}
