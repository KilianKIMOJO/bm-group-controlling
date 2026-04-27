# BM Group · Management Controlling Dashboard

Modulare Vite-Version des Controlling-Dashboards. Liest Daten via Microsoft Graph aus SharePoint-Excel-Dateien und visualisiert KPIs, Forecasts, Plan-vs-Ist, Therapeuten-Auslastung, Krankenstand, BWA, Cashflow und Liquidität.

## Schnellstart (lokal)

```bash
# 1. Dependencies installieren
npm install

# 2. Environment-Variablen kopieren und ggf. anpassen
cp .env.example .env

# 3. Dev-Server starten (öffnet automatisch http://localhost:5173)
npm run dev
```

Damit der Login funktioniert, muss in der Microsoft Entra ID App-Registration `http://localhost:5173` als **SPA Redirect URI** eingetragen sein.

## Build

```bash
npm run build       # Produktions-Build nach dist/
npm run preview     # Lokale Vorschau des Builds
```

## Projektstruktur

```
bm-dashboard/
├── index.html              ← HTML-Skelett (Login, Loading, Dashboard)
├── package.json
├── vite.config.js
├── .env.example
├── .github/workflows/      ← GitHub Actions für Azure-Deployment
└── src/
    ├── main.js             ← Entry-Point, Auth-Flow, Event-Handling
    ├── config.js           ← MSAL_CONFIG, FILES, SharePoint-Konstanten
    ├── auth.js             ← signIn/signOut/getToken
    ├── api.js              ← Graph-API-Calls (getSheet, …)
    ├── data-loader.js      ← Parallel-Loading aller Excel-Dateien
    ├── state.js            ← zentraler State + matchStandort()
    ├── parsers/            ← BWA, Bank, Medifox, Plan, Auslastung, Krankenstand
    ├── helpers/            ← format, months, bwa-helpers, plan-match
    ├── render/             ← eine Datei pro Dashboard-Sektion
    └── styles/             ← base, layout, components, sections, responsive
```

## Wo was ändern?

| Was du ändern willst                | Datei                                        |
|-------------------------------------|----------------------------------------------|
| BWA-Kategorie-Mapping               | `src/parsers/bwa.js`                         |
| Therapeut-Standort-Filter           | `src/state.js` (Funktion `matchStandort`)    |
| KPI-Schwellwerte (€/h, Marge)       | `src/render/hero-kpis.js`                    |
| Filter-Bar (oben/Sidebar)           | `src/render/filters.js`                      |
| Farben/Variablen                    | `src/styles/base.css`                        |
| Welche Excel-Files geladen werden   | `src/config.js` (Konstante `FILES`)          |

## Deployment

GitHub-Push auf `main` → GitHub Actions baut und deployed automatisch nach Azure Static Web Apps. Pull Requests bekommen automatisch eine Preview-URL.

Benötigte GitHub-Secrets:
- `AZURE_STATIC_WEB_APPS_API_TOKEN` (aus dem Azure Portal nach Anlage der Static Web App)
- `MSAL_CLIENT_ID`
- `MSAL_TENANT_ID`
- `SP_HOST`, `SP_SITE_KIMOJO`, `SP_SITE_PHFIP`

## Migration vom alten Single-File-Dashboard

Siehe **MIGRATION.md** — dort sind die noch zu migrierenden Render-Module aufgelistet (`forecast`, `plan-vs-ist`, `auslastung`, `therapeuten`, `krankenstand`, `bwa`, `cashflow`, `liquiditaet`) und die einfachen Such-Ersetzen-Regeln dafür.
