# Migrations-Anleitung

In dieser Datei steht, wie du die noch fehlenden Render-Module aus deiner alten `dashboard.html` in die neue Struktur überträgst.

Es ist **mechanische Arbeit**, keine Logik-Änderungen — nur Imports ergänzen und ein paar global-State-Zugriffe umschreiben.

## Status

Bereits vollständig migriert:
- ✅ `src/render/filters.js` (war `rF()`)
- ✅ `src/render/hero-kpis.js` (war `rH()`)

Noch als Stubs vorhanden — hier musst du den Original-Code reinkopieren:
- ⏳ `src/render/forecast.js` ← `rFC()` + `setFCMode()`
- ⏳ `src/render/plan-vs-ist.js` ← `rPVI()`
- ⏳ `src/render/auslastung.js` ← `rAusl()` + `changeAuslKW()` + `auslColor()`
- ⏳ `src/render/therapeuten.js` ← `rT()` + `renderChart()` + `toggleChart()` + `toggleDrill()`
- ⏳ `src/render/krankenstand.js` ← `rKS()`
- ⏳ `src/render/bwa.js` ← `rB()` + `renderBWACard()`
- ⏳ `src/render/cashflow.js` ← `rCF()` + `renderCumulativeChart()`
- ⏳ `src/render/liquiditaet.js` ← `rLiq()` + `toggleLiq()`

## Vorgehen pro Modul

1. Öffne die alte `dashboard.html` und kopiere den Funktions-Body in das jeweilige Stub-File.
2. Ersetze den Funktionsnamen durch den `export function renderXxx() { … }` aus dem Stub.
3. Wende die untenstehenden Such-Ersetzen-Regeln an.
4. Speichere und teste mit `npm run dev`.

## Such-Ersetzen-Regeln

Diese gelten **immer** beim Migrieren:

| Suchen (alt)             | Ersetzen (neu)                          | Warum |
|--------------------------|-----------------------------------------|-------|
| `D.`                     | `state.data.`                           | State liegt zentral in `state.js` |
| `aM`                     | `state.activeMonth`                     | aktiver Monat-Filter |
| `aS`                     | `state.activeStandort`                  | aktiver Standort-Filter |
| `matchS(`                | `matchStandort(`                        | jetzt importiert |
| `getWhM(`                | `getWorkingHoursMonth(`                 | aus `helpers/months.js` |
| `getWhW(`                | `getWorkingHoursWeek(`                  | aus `helpers/months.js` |
| `selectedAuslKW`         | `state.selectedAuslKW`                  | Modul-State |
| `nameMap[`               | `state.nameMap[`                        | Modul-State |
| `onclick="setFCMode(`    | `data-fc-mode="` + `addEventListener`   | inline-onclick weg, weil module-scoped |
| `onclick="changeAuslKW(` | `data-ausl-kw=` + `addEventListener`    | dito |
| `onclick="toggleChart(`  | `data-toggle-chart=` + `addEventListener` | dito |
| `onclick="toggleDrill(`  | `data-toggle-drill=` + `addEventListener` | dito |
| `onclick="toggleLiq(`    | `data-toggle-liq=` + `addEventListener` | dito |

## Imports — was wo gebraucht wird

Jedes Render-Modul beginnt typischerweise mit:

```js
import { state, matchStandort } from '../state.js';
import { MN, getActiveMonths, getWorkingHoursMonth, getWorkingHoursWeek } from '../helpers/months.js';
import { getBWA, getBWAMonths, sumBWA } from '../helpers/bwa-helpers.js';
import { getPlanForMonths, getPlanCatForMonths, getPlanTherapist, getPlanTherapistMonth } from '../helpers/plan-match.js';
import { fm, fmK, sn } from '../helpers/format.js';
import { renderDelta } from './filters.js';
```

Importiert nur die Funktionen, die das jeweilige Modul tatsächlich benutzt — Vite warnt sonst.

## Inline-onclick → addEventListener

**Vorher** (im Original-Code):
```html
<button onclick="setFCMode('einnahmen')">Einnahmen</button>
```

**Nachher** im Modul:
```js
// HTML aufbauen
html += `<button data-fc-mode="einnahmen">Einnahmen</button>`;

// nachdem innerHTML gesetzt ist, Event-Handler binden:
div.querySelectorAll('[data-fc-mode]').forEach(b => {
  b.addEventListener('click', () => setFCMode(b.dataset.fcMode));
});
```

Der Grund: ES-Module sind nicht im globalen Scope, also kann `onclick="setFCMode(…)"` die Funktion gar nicht finden. Daten-Attribute + `addEventListener` ist die saubere Variante.

## DOM-IDs (zur Referenz)

Diese IDs gibt es in `index.html` und werden von den Render-Modulen verwendet:

- `hero` ← Hero-KPIs (rH)
- `flt`, `hb` ← Filter-Bar + Header-Badge (rF)
- `forecastDiv` ← Forecast (rFC)
- `planVsIstDiv` ← Plan vs. Ist (rPVI)
- `auslDiv`, `auslKWTitle`, `auslKWInfo`, `auslPrev`, `auslNext` ← Auslastung (rAusl)
- `theraKpis`, `tb`, `tht`, `kwf`, `so`, `kwInfo` ← Therapeuten (rT)
- `krankenDiv` ← Krankenstand (rKS)
- `bwaDiv` ← BWA (rB)
- `cfDiv` ← Cashflow (rCF)
- `liqCockpit` ← Liquidität (rLiq)
- `navTimePills`, `navLocPills`, `navTs` ← Sidebar-Filter (rF)

## Tests

Sobald du ein Modul migriert hast:

```bash
npm run dev
```

Im Browser prüfst du, ob die Sektion korrekt rendert. Wenn ein Render-Fehler auftritt, schau in die Browser-Konsole — Vite zeigt dir die Zeile.

## Häufige Stolperfallen

1. **Vergessen, eine Helper-Funktion zu importieren** → `ReferenceError: getActiveMonths is not defined` → fehlende Zeile oben ergänzen.
2. **`this.value` in einem `<select onchange="…">`** → Im Original war `setFCMode(this.value)` üblich. In ES-Modulen geht das nicht; nutze stattdessen das Pattern wie oben (`addEventListener('change', e => setFCMode(e.target.value))`).
3. **Module-State (z.B. `selectedAuslKW`, `fcMode`)** → liegt jetzt entweder im `state` (zentral) oder als `let` am Modul-Anfang (lokal). Beim Original waren das alles globale Variablen.
4. **CSS-Klassen-Namen** → unverändert, alle Klassen aus dem Original-CSS sind in `src/styles/*.css` enthalten.

## Reihenfolge der Migration (Empfehlung)

1. **forecast** (mittlere Komplexität, gut zum Reinkommen)
2. **plan-vs-ist** (ähnlich)
3. **bwa** + **cashflow** (BWA-Tabellen, viel Visuelles)
4. **auslastung** (Heatmap-Komplexität)
5. **therapeuten** (am komplexesten — Tabelle + SVG-Charts + Drill-Down)
6. **krankenstand** (eigenständig)
7. **liquiditaet** (am Ende — nutzt Werte aus den anderen)

Plan: pro Modul ca. 15–30 Minuten. Insgesamt ein halber Tag konzentrierte Arbeit.
