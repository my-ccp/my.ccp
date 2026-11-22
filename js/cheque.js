// ===== CHEQUE MANAGER - الصك البريدي لبريد الجزائر =====

// ===== تحويل المبلغ للأحرف (عربي) =====
const ONES_AR = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة',
  'عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر',
  'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
const TENS_AR  = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
const HUNDREDS_AR = ['', 'مائة', 'مئتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

function numToWordsAr(n) {
  if (n === 0) return 'صفر';
  if (n < 0)   return 'سالب ' + numToWordsAr(-n);
  const parts = [];
  if (n >= 1000000) {
    const m = Math.floor(n / 1000000);
    parts.push(m === 1 ? 'مليون' : m === 2 ? 'مليونان' : numToWordsAr(m) + ' ملايين');
    n %= 1000000;
  }
  if (n >= 1000) {
    const k = Math.floor(n / 1000);
    if (k === 1)       parts.push('ألف');
    else if (k === 2)  parts.push('ألفان');
    else if (k <= 10)  parts.push(ONES_AR[k] + ' آلاف');
    else               parts.push(numToWordsAr(k) + ' ألف');
    n %= 1000;
  }
  if (n >= 100) {
    parts.push(HUNDREDS_AR[Math.floor(n / 100)]);
    n %= 100;
  }
  if (n >= 20) {
    const t = Math.floor(n / 10), o = n % 10;
    parts.push(o > 0 ? ONES_AR[o] + ' و ' + TENS_AR[t] : TENS_AR[t]);
  } else if (n > 0) {
    parts.push(ONES_AR[n]);
  }
  return parts.join(' و ');
}

function amountToWords(amount) {
  if (!amount || amount <= 0) return '';
  const intPart = Math.floor(amount);
  const decPart = Math.round((amount - intPart) * 100);
  // Always use Arabic for the cheque words (official legal format)
  let result = numToWordsAr(intPart) + ' دينارًا جزائريًا';
  if (decPart > 0) result += ' و ' + numToWordsAr(decPart) + ' سنتيمًا';
  return result;
}

// ===== السجل =====
function getCheques() {
  try { return JSON.parse(localStorage.getItem('cheques') || '[]'); } catch { return []; }
}
function saveCheques(arr) {
  localStorage.setItem('cheques', JSON.stringify(arr));
}
function addCheque(entry) {
  const arr = getCheques();
  arr.unshift(entry);
  if (arr.length > 200) arr.pop();
  saveCheques(arr);
}
function deleteCheque(id) {
  const arr = getCheques().filter(c => c.id !== id);
  saveCheques(arr);
}
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ===== الحسابات المحفوظة =====
function getSavedAccounts() {
  try { return JSON.parse(localStorage.getItem('accounts') || '[]'); } catch { return []; }
}

function populateChequeAccountSelect() {
  const accounts = getSavedAccounts();
  const sel = document.getElementById('chequeAccountSelect');
  if (!sel) return;
  sel.innerHTML = `<option value="">${t('select_from_saved')}</option>`;
  accounts.forEach(acc => {
    const opt = document.createElement('option');
    opt.value = JSON.stringify({ ccp: acc.ccp, key: acc.ccpKey });
    opt.textContent = `${acc.name} — ${acc.ccp}/${acc.ccpKey}`;
    sel.appendChild(opt);
  });
}

function onSelectChequeAccount(sel) {
  if (!sel.value) return;
  const acc = JSON.parse(sel.value);
  document.getElementById('chequeAccount').value = acc.ccp || '';
  document.getElementById('chequeKey').value     = acc.key || '';
  updateChequePreview();
}

// ===== تحديث المعاينة الحية =====
function updateChequePreview() {
  const amount   = parseFloat(document.getElementById('chequeAmount').value) || 0;
  const orderTo  = document.getElementById('chequeOrderTo').value.trim() || '';
  const place    = document.getElementById('chequePlace').value.trim() || '..................';
  const dateVal  = document.getElementById('chequeDate').value;
  const account  = document.getElementById('chequeAccount').value.trim();
  const key      = document.getElementById('chequeKey').value.trim();
  const words    = amount > 0 ? amountToWords(amount) : '...................................................';

  // تحديث حقول المعاينة
  document.getElementById('prev_amount').textContent    = amount > 0 ? amount.toLocaleString('fr-DZ') : '';
  document.getElementById('prev_order').textContent     = orderTo || 'الاسم، شخصيا، لحامله';
  document.getElementById('prev_words').textContent     = words;
  document.getElementById('prev_place').textContent     = place;
  document.getElementById('prev_date').textContent      = dateVal ? formatDateFr(dateVal) : '..../.../......';
  document.getElementById('prev_account').textContent   = account ? account.padStart(10, '0') : '0000000000';
  document.getElementById('prev_key').textContent       = key || '00';

  // تحديث المبلغ بالأرقام في الصك
  document.getElementById('prev_amount_box').textContent = amount > 0 ? amount.toLocaleString('fr-DZ') : '';

  // تحديث حقل الأحرف
  document.getElementById('wordsPreview').textContent = words || '---';
}

function formatDateFr(isoDate) {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-');
  return `${y}/${m}/${d}`;
}

// ===== اختيار التبويب =====
let chequeTab = 'form';
function switchChequeTab(tab) {
  chequeTab = tab;
  document.querySelectorAll('.ch-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.getElementById('chequeFormSection').style.display    = tab === 'form'    ? 'flex' : 'none';
  document.getElementById('chequeHistorySection').style.display = tab === 'history' ? 'flex' : 'none';
  if (tab === 'history') renderChequeHistory();
}

// ===== معاينة وحفظ =====
function openChequePreview() {
  const amount = parseFloat(document.getElementById('chequeAmount').value);
  if (!amount || amount <= 0) { showToast(t('invalid_amount')); return; }

  const orderTo = document.getElementById('chequeOrderTo').value.trim();
  if (!orderTo) { showToast(t('order_required')); return; }

  updateChequePreview();
  document.getElementById('chequePreviewModal').classList.add('open');
}

function closeChequePreview() {
  document.getElementById('chequePreviewModal').classList.remove('open');
}

function saveChequeEntry() {
  const amount   = parseFloat(document.getElementById('chequeAmount').value);
  const orderTo  = document.getElementById('chequeOrderTo').value.trim();
  const place    = document.getElementById('chequePlace').value.trim();
  const dateVal  = document.getElementById('chequeDate').value;
  const account  = document.getElementById('chequeAccount').value.trim();
  const key      = document.getElementById('chequeKey').value.trim();
  const words    = amountToWords(amount);

  const entry = {
    id: genId(),
    amount, orderTo, place, date: dateVal,
    account, key, words,
    createdAt: new Date().toLocaleString('fr-DZ'),
  };

  addCheque(entry);
  closeChequePreview();
  showToast(t('cheque_saved_ok'));
  renderChequeHistory();
  resetChequeForm();
  switchChequeTab('history');
}

// ===== مشاركة صك =====
function shareCheque(id) {
  const item = getCheques().find(c => c.id === id);
  if (!item) return;
  const unit = t('dzd_unit');
  let text = `🗒️ ${t('cheque_page_title')} - Algérie Poste\n`;
  text += `${t('cheque_amount_label')}: ${parseFloat(item.amount).toLocaleString('fr-DZ')} ${unit}\n`;
  text += `${t('in_words')}: ${item.words}\n`;
  text += `${t('cheque_order_label')}: ${item.orderTo}\n`;
  text += `${t('cheque_date_label')}: ${item.date} - ${item.place || '---'}\n`;
  if (item.account) text += `${t('cheque_account_label')}: ${item.account}/${item.key || '?'}\n`;
  text += `\n— My RiP`;
  shareText(text, `${t('cheque_page_title')} - My RiP`);
}

// ===== عرض السجل =====
function renderChequeHistory() {
  const list = getCheques();
  const container = document.getElementById('chequeHistoryList');

  const unit = t('dzd_unit');
  if (list.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text2)"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <p>${t('no_cheques')}</p>
        <span>${t('no_cheques_sub')}</span>
      </div>`;
    return;
  }

  container.innerHTML = list.map(item => `
    <div class="cheque-card" id="cc-${item.id}">
      <div class="cc-header">
        <span class="cc-title">📄 ${t('cheque_page_title')}</span>
        <span class="cc-amount">${parseFloat(item.amount).toLocaleString('fr-DZ')} ${unit}</span>
      </div>
      <div class="cc-details">
        <div class="cc-row"><span>${t('cheque_order_label')}:</span><span>${item.orderTo}</span></div>
        <div class="cc-row"><span>${t('in_words')}:</span><span class="cc-words">${item.words}</span></div>
        ${item.place ? `<div class="cc-row"><span>${t('place_label')}:</span><span>${item.place}</span></div>` : ''}
        <div class="cc-row"><span>${t('cheque_date_label')}:</span><span dir="ltr">${item.date}</span></div>
        ${item.account ? `<div class="cc-row"><span>${t('cheque_account_label')}:</span><span dir="ltr">${item.account}/${item.key || '?'}</span></div>` : ''}
        <div class="cc-row muted"><span>${t('saved')}:</span><span>${item.createdAt}</span></div>
      </div>
      <div class="cc-actions">
        <button class="tc-btn" onclick="shareCheque('${item.id}')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          ${t('share')}
        </button>
        <button class="tc-btn danger" onclick="confirmDeleteCheque('${item.id}')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          ${t('delete')}
        </button>
      </div>
    </div>
  `).join('');
}

// ===== حذف =====
let pendingChequeDeleteId = null;
function confirmDeleteCheque(id) {
  pendingChequeDeleteId = id;
  document.getElementById('chequeDeleteModal').classList.add('open');
}
function cancelChequeDelete() {
  pendingChequeDeleteId = null;
  document.getElementById('chequeDeleteModal').classList.remove('open');
}
function doDeleteCheque() {
  if (pendingChequeDeleteId) {
    deleteCheque(pendingChequeDeleteId);
    renderChequeHistory();
    showToast(t('deleted'));
  }
  cancelChequeDelete();
}

// ===== مسح الكل =====
function confirmClearCheques() {
  if (getCheques().length === 0) { showToast(t('no_cheques')); return; }
  document.getElementById('chequeClearModal').classList.add('open');
}
function cancelClearCheques() {
  document.getElementById('chequeClearModal').classList.remove('open');
}
function doClearCheques() {
  localStorage.removeItem('cheques');
  renderChequeHistory();
  showToast(t('deleted'));
  cancelClearCheques();
}

// ===== إعادة تعيين النموذج =====
function resetChequeForm() {
  document.getElementById('chequeAmount').value   = '';
  document.getElementById('chequeOrderTo').value  = '';
  document.getElementById('chequePlace').value    = '';
  document.getElementById('chequeAccount').value  = '';
  document.getElementById('chequeKey').value      = '';
  if (document.getElementById('chequeAccountSelect'))
    document.getElementById('chequeAccountSelect').value = '';
  document.getElementById('chequeDate').value = new Date().toLocaleDateString('fr-CA');
  document.getElementById('wordsPreview').textContent = '---';
  updateChequePreview();
}

// ===== نسخ الأحرف =====
function copyWordsPreview() {
  const text = document.getElementById('wordsPreview').textContent;
  if (text && text !== '---') {
    navigator.clipboard.writeText(text).then(() => showToast(t('copied'))).catch(() => {});
  }
}

// ===== تهيئة =====
document.addEventListener('DOMContentLoaded', () => {
  if (typeof updateAllText === 'function') updateAllText();
  document.getElementById('chequeDate').value = new Date().toLocaleDateString('fr-CA');
  populateChequeAccountSelect();
  updateChequePreview();

  // ربط الأحداث للتحديث الحي
  ['chequeAmount','chequeOrderTo','chequePlace','chequeDate','chequeAccount','chequeKey'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateChequePreview);
  });

  // إغلاق المودالات
  ['chequePreviewModal','chequeDeleteModal','chequeClearModal'].forEach(id => {
    document.getElementById(id).addEventListener('click', function(e) {
      if (e.target === this) this.classList.remove('open');
    });
  });
});
