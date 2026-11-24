// ===== STATE =====
window.APP_LANG = localStorage.getItem('lang') || 'ar';
window.APP_THEME = localStorage.getItem('theme') || 'light';

// ===== BROADCAST CHANNEL (sync across tabs/pages without reload) =====
const appChannel = new BroadcastChannel('myrip_app_channel');

appChannel.onmessage = (e) => {
  if (e.data.type === 'theme') {
    _applyThemeDOM(e.data.value);
    updateThemeToggle();
  }
  if (e.data.type === 'lang') {
    _applyLangDOM(e.data.value);
    updateLangButtons();
    if (typeof updateLangBtns === 'function') updateLangBtns();
  }
  if (e.data.type === 'fontScale') {
    document.documentElement.style.setProperty('--font-scale', e.data.value);
    if (typeof updateFontScaleUI === 'function') updateFontScaleUI(e.data.value);
  }
};

// ===== FONT SCALE =====
(function() {
  const scale = parseFloat(localStorage.getItem('fontScale') || '1');
  document.documentElement.style.setProperty('--font-scale', scale);
})();

function applyFontScale(scale, broadcast = true) {
  document.documentElement.style.setProperty('--font-scale', scale);
  localStorage.setItem('fontScale', scale);
  if (broadcast) appChannel.postMessage({ type: 'fontScale', value: scale });
}

// Listen for font scale sync across tabs
// (added to onmessage below)

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  applyTheme(window.APP_THEME, false);
  applyLang(window.APP_LANG, false);
  // Re-apply font scale after DOM ready (in case CSS var was late)
  const scale = parseFloat(localStorage.getItem('fontScale') || '1');
  document.documentElement.style.setProperty('--font-scale', scale);
});

// ===== THEME =====
function _applyThemeDOM(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.body.setAttribute('data-theme', theme);
  window.APP_THEME = theme;
  localStorage.setItem('theme', theme);
}

function applyTheme(theme, broadcast = true) {
  _applyThemeDOM(theme);
  updateThemeToggle();
  if (broadcast) {
    appChannel.postMessage({ type: 'theme', value: theme });
  }
}

function toggleTheme() {
  const next = window.APP_THEME === 'dark' ? 'light' : 'dark';
  applyTheme(next, true);
}

function updateThemeToggle() {
  const toggle = document.getElementById('themeToggle');
  if (toggle) {
    toggle.classList.toggle('on', window.APP_THEME === 'dark');
  }
}

// ===== LANG =====
function _applyLangDOM(lang) {
  window.APP_LANG = lang;
  localStorage.setItem('lang', lang);
  document.body.setAttribute('data-lang', lang);
  document.documentElement.setAttribute('lang', lang);
  // Arabic = RTL, French/English = LTR
  document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  updateAllText();
  updateLangButtons();
  if (typeof updateLangBtns === 'function') updateLangBtns();
  // Update sidebar position after lang change
  updateSidebarPosition();
}

function applyLang(lang, broadcast = true) {
  _applyLangDOM(lang);
  if (broadcast) {
    appChannel.postMessage({ type: 'lang', value: lang });
  }
}

function updateAllText() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    el.placeholder = t(el.getAttribute('data-i18n-ph'));
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.getAttribute('data-i18n-title'));
  });
}

function updateLangButtons() {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === window.APP_LANG);
  });
}

// ===== SIDEBAR POSITION =====
// Arabic  → sidebar opens from RIGHT, menu button on RIGHT
// FR / EN → sidebar opens from LEFT,  menu button on LEFT
function updateSidebarPosition() {
  // CSS handles the visual side via data-lang attribute on body — no extra JS needed here.
  // This function is a hook for future use if needed.
}

// ===== CCP → RIP ALGORITHM (Algorithme Algérie Poste officiel) =====
function calcCCPKey(ccp) {
  const padded = ccp.toString().padStart(10, '0');
  const digits = padded.split('');
  let cc = 0;
  let z = 9;
  for (let i = 4; i <= 13; i++) {
    cc += parseInt(digits[z], 10) * i;
    z--;
  }
  return (cc % 100).toString().padStart(2, '0');
}

function calcRIPKey(ccp) {
  const ccpInt = parseInt(ccp, 10);
  const remainder = (ccpInt * 100) % 97;
  let key;
  if (remainder + 85 > 97) {
    key = 97 - (remainder + 85 - 97);
  } else {
    key = 97 - (remainder + 85);
  }
  return key.toString().padStart(2, '0');
}

function buildRIP(ccp, ripKey) {
  const padded = ccp.toString().padStart(10, '0');
  const keyStr = ripKey.toString().padStart(2, '0');
  return '00799999' + padded + keyStr;
}

function formatRIPDisplay(rip) {
  if (!rip || rip.length < 20) return rip;
  return rip.slice(0, 8) + ' ' + rip.slice(8, 18) + ' ' + rip.slice(18, 20);
}

// ===== ACCOUNTS STORAGE =====
function getAccounts() {
  try {
    return JSON.parse(localStorage.getItem('accounts') || '[]');
  } catch { return []; }
}

function saveAccounts(accounts) {
  localStorage.setItem('accounts', JSON.stringify(accounts));
}

function addAccount(account) {
  const accounts = getAccounts();
  account.id = Date.now();
  account.date = new Date().toLocaleString('fr-DZ');
  accounts.unshift(account);
  saveAccounts(accounts);
  return account;
}

function updateAccount(id, data) {
  const accounts = getAccounts();
  const idx = accounts.findIndex(a => a.id == id);
  if (idx !== -1) {
    accounts[idx] = { ...accounts[idx], ...data };
    saveAccounts(accounts);
    return true;
  }
  return false;
}

function deleteAccount(id) {
  const accounts = getAccounts().filter(a => a.id != id);
  saveAccounts(accounts);
}

// ===== TOAST =====
let toastTimeout;
function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 2200);
}

// ===== COPY TO CLIPBOARD =====
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(t('copied'));
  } catch {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    showToast(t('copied'));
  }
}

// ===== SHARE =====
async function shareText(text, title) {
  if (navigator.share) {
    try {
      await navigator.share({ title: title || 'MY CCP', text });
    } catch {}
  } else {
    copyText(text);
  }
}

// ===== SIDEBAR =====
function openSidebar() {
  document.getElementById('sidebarOverlay').classList.add('open');
  document.getElementById('sidebar').classList.add('open');
}

function closeSidebar() {
  document.getElementById('sidebarOverlay').classList.remove('open');
  document.getElementById('sidebar').classList.remove('open');
}

// ===== NAVIGATE =====
function navigateTo(page) {
  closeSidebar();
  window.location.href = page;
}

// ===== CONFIRM MODAL =====
function showConfirmModal(title, message, onConfirm) {
  let modal = document.getElementById('confirmModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'confirmModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-handle"></div>
        <div class="modal-title" id="confirmModalTitle"></div>
        <p style="color:var(--text2);font-size:0.9rem;margin-bottom:8px;" id="confirmModalMsg"></p>
        <div class="modal-actions">
          <button class="btn btn-outline" id="confirmModalCancel" style="flex:1;"></button>
          <button class="btn btn-primary" id="confirmModalOk" style="flex:1;"></button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', function(e){ if(e.target===this) closeConfirmModal(); });
  }
  document.getElementById('confirmModalTitle').textContent = title;
  document.getElementById('confirmModalMsg').textContent = message;
  document.getElementById('confirmModalCancel').textContent = t('cancel');
  document.getElementById('confirmModalOk').textContent = t('confirm');
  document.getElementById('confirmModalCancel').onclick = closeConfirmModal;
  document.getElementById('confirmModalOk').onclick = () => { closeConfirmModal(); onConfirm(); };
  modal.classList.add('open');
}

function closeConfirmModal() {
  const modal = document.getElementById('confirmModal');
  if (modal) modal.classList.remove('open');
}

// ===== SVG ICONS =====
const ICONS = {
  home: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  accounts: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
  settings: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l-.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  menu: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,
  copy: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
  share: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`,
  edit: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  trash: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`,
  save: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
  person: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  account_num: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>`,
  key: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6"/><path d="M15.5 7.5l3 3L22 7l-3-3"/></svg>`,
  bank: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>`,
  crown: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M2 20h20v2H2v-2zM4 18l4-10 4 5 4-8 4 13H4z"/></svg>`,
  about: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  privacy: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  scan: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></svg>`,
  moon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
  sun: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
  lang: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  search: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  arrow: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
  history: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>`,
};
