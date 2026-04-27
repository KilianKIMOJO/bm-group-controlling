// ============================================================
//  AUTHENTIFIZIERUNG (Microsoft Entra ID via MSAL)
// ============================================================

import { PublicClientApplication } from '@azure/msal-browser';
import { MSAL_CONFIG, LOGIN_REQUEST } from './config.js';

const msalApp = new PublicClientApplication(MSAL_CONFIG);
let initialized = false;

/** Stellt sicher, dass MSAL initialisiert ist (muss einmal aufgerufen werden). */
export async function initAuth() {
  if (initialized) return;
  await msalApp.initialize();
  initialized = true;
}

/** Liefert den ersten bereits angemeldeten Account oder null. */
export function getActiveAccount() {
  const accounts = msalApp.getAllAccounts();
  if (accounts.length > 0) {
    msalApp.setActiveAccount(accounts[0]);
    return accounts[0];
  }
  return null;
}

/** Login-Popup öffnen. */
export async function signIn() {
  const result = await msalApp.loginPopup(LOGIN_REQUEST);
  msalApp.setActiveAccount(result.account);
  return result.account;
}

/** Logout-Popup öffnen. */
export async function signOut() {
  await msalApp.logoutPopup();
}

/**
 * Holt ein Access-Token. Versucht zuerst silent (Cache),
 * fällt bei Bedarf auf Popup zurück.
 */
export async function getToken() {
  const account = msalApp.getActiveAccount();
  try {
    const result = await msalApp.acquireTokenSilent({ ...LOGIN_REQUEST, account });
    return result.accessToken;
  } catch {
    const result = await msalApp.acquireTokenPopup(LOGIN_REQUEST);
    return result.accessToken;
  }
}
