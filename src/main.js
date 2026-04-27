// Entry-Point: Auth, Daten-Loading, Render-Orchestrierung, globale Events.
import './styles/index.css';
import { initAuth, signIn, signOut, getActiveAccount } from './auth.js';
import { loadAll } from './data-loader.js';
import { renderAll } from './render/index.js';
import { state } from './state.js';

const $ = (id) => document.getElementById(id);

/** Loading-Screen-Text aktualisieren. */
function setLoadingText(t) {
  const el = $('lt');
  if (el) el.textContent = t;
}

/** Login-Fehler anzeigen. */
function showError(msg) {
  const er = $('er');
  if (er) {
    er.style.display = 'block';
    er.textContent = msg;
  }
}

/** Sichtbarkeit der drei Hauptbereiche steuern. */
function show(which) {
  ['lo', 'ld', 'db'].forEach(id => {
    const el = $(id);
    if (!el) return;
    if (id === which) {
      el.classList.remove('h');
      el.style.display = '';
    } else {
      el.classList.add('h');
    }
  });
}

/** Komplett-Flow: Daten laden + alle Sektionen rendern. */
async function loadAndRender() {
  show('ld');
  setLoadingText('Verbinde…');
  try {
    await loadAll(setLoadingText);
    setLoadingText('Aufbau…');
    renderAll();
    show('db');
    wireSectionToggles();
    wireSidebarNav();
  } catch (e) {
    console.error(e);
    show('lo');
    showError('Fehler beim Laden: ' + (e && e.message ? e.message : e));
  }
}

/** Sektionen ein-/ausklappen. */
function wireSectionToggles() {
  document.querySelectorAll('[data-toggle-section]').forEach(st => {
    if (st.dataset.wired === '1') return;
    st.dataset.wired = '1';
    st.style.cursor = 'pointer';
    st.addEventListener('click', () => {
      const body = st.nextElementSibling;
      if (!body || !body.classList.contains('sec-body')) return;
      body.classList.toggle('collapsed');
      st.classList.toggle('collapsed');
    });
  });
}

/** Mobile-Sidebar-Toggle und Active-State-Management. */
function wireSidebarNav() {
  // Active-State bei Klick aktualisieren
  document.querySelectorAll('.nav-item').forEach(item => {
    if (item.dataset.wired === '1') return;
    item.dataset.wired = '1';
    item.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      // Mobile: Sidebar zumachen nach Klick
      const sn = $('sideNav');
      if (sn) sn.classList.remove('open');
    });
  });
}

/** Initiales Setup: Buttons, Auth-Status. */
async function init() {
  // Login-Button
  $('loginBtn').addEventListener('click', async () => {
    try {
      await initAuth();
      const acc = await signIn();
      if (acc) await loadAndRender();
    } catch (e) {
      showError(e && e.message ? e.message : String(e));
    }
  });

  // Refresh-Button
  $('refreshBtn').addEventListener('click', async () => {
    await loadAndRender();
  });

  // Logout-Button
  $('logoutBtn').addEventListener('click', () => {
    signOut();
  });

  // Initial: MSAL initialisieren und prüfen, ob bereits eingeloggt
  show('ld');
  setLoadingText('Prüfe Anmeldung…');
  await initAuth();
  const account = getActiveAccount();
  if (account) {
    await loadAndRender();
  } else {
    show('lo');
  }
}

document.addEventListener('DOMContentLoaded', init);
