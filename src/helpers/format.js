// ============================================================
//  FORMATIERUNGS-HELPERS
// ============================================================

/** Vollständige EUR-Formatierung: "1.234,56 €" */
export const fm = n => new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR'
}).format(n);

/** Kompakte EUR-Formatierung: ab 1k abgekürzt */
export const fmK = n => {
  const abs = Math.abs(n);
  if (abs >= 1000) {
    return (n < 0 ? '-' : '') + Math.round(abs / 1000).toLocaleString('de-DE') + 'k €';
  }
  return fm(n);
};

/** Kurzer Standort-Name (z.B. "Physio und Fitness im Park" -> "PF im Park") */
export const sn = s => s === 'Physio und Fitness im Park' ? 'PF im Park' : s;
