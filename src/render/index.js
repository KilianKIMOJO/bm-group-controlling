// Orchestriert alle Render-Funktionen.
import { renderFilters } from './filters.js';
import { renderHeroKpis } from './hero-kpis.js';
import { renderForecast } from './forecast.js';
import { renderAuslastung } from './auslastung.js';
import { renderPlanVsIst } from './plan-vs-ist.js';
import { renderTherapeuten } from './therapeuten.js';
import { renderKrankenstand } from './krankenstand.js';
import { renderBWA } from './bwa.js';
import { renderCashflow } from './cashflow.js';
import { renderLiquiditaet } from './liquiditaet.js';

/** Re-render alle Bereiche – wird nach jedem Filter-Wechsel aufgerufen. */
export function renderAll() {
  renderFilters();
  renderHeroKpis();
  renderForecast();
  renderAuslastung();
  renderPlanVsIst();
  renderTherapeuten();
  renderKrankenstand();
  renderBWA();
  renderCashflow();
  renderLiquiditaet();
}
