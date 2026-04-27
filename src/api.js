// ============================================================
//  MICROSOFT GRAPH API HELPERS
//  Alle API-Aufrufe gegen SharePoint/OneDrive laufen hier durch.
// ============================================================

import { getToken } from './auth.js';

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';

/** Generischer GET-Request gegen Graph. Liefert JSON oder null bei Fehler. */
export async function graphGet(url) {
  const token = await getToken();
  const res = await fetch(url, {
    headers: { Authorization: 'Bearer ' + token }
  });
  return res.ok ? res.json() : null;
}

/** Site-ID auflösen (z.B. "host.sharepoint.com:/sites/MySite"). */
export async function getSiteId(host, path) {
  const site = await graphGet(`${GRAPH_BASE}/sites/${host}:${path}`);
  return site?.id || null;
}

/** Drive-ID einer Site holen. */
export async function getDriveId(siteId) {
  const drive = await graphGet(`${GRAPH_BASE}/sites/${siteId}/drive`);
  return drive?.id || null;
}

/** Liste der Worksheet-Namen in einer Excel-Datei. */
export async function getSheetNames(driveId, fileId) {
  const r = await graphGet(`${GRAPH_BASE}/drives/${driveId}/items/${fileId}/workbook/worksheets`);
  return r ? r.value.map(s => s.name) : [];
}

/** UsedRange.values eines Worksheets als 2D-Array. */
export async function getSheet(driveId, fileId, sheetName) {
  const r = await graphGet(
    `${GRAPH_BASE}/drives/${driveId}/items/${fileId}/workbook/worksheets('${encodeURIComponent(sheetName)}')/usedRange`
  );
  return r ? r.values : null;
}

/** Roher Datei-Content (z.B. CSV als Text). */
export async function getFileContent(driveId, fileId) {
  const token = await getToken();
  const res = await fetch(`${GRAPH_BASE}/drives/${driveId}/items/${fileId}/content`, {
    headers: { Authorization: 'Bearer ' + token }
  });
  return res.ok ? res.text() : null;
}

/** UsedRange-Objekt (mit values) - für Auslastung wo wir Zugriff auf das volle Range brauchen. */
export async function getUsedRange(driveId, fileId, sheetName) {
  return graphGet(
    `${GRAPH_BASE}/drives/${driveId}/items/${fileId}/workbook/worksheets('${encodeURIComponent(sheetName)}')/usedRange`
  );
}
