// ===== TRANSFER MANAGER - مدير الحوالات البريدية =====
// نموذج الحوالة البريدية الحقيقية لبريد الجزائر

// ===== نوع العملية =====
// withdrawal = سحب | transfer = تحويل من حساب لآخر | deposit = دفع في الحساب
let currentTransferOp = 'withdrawal';

// ===== السجل =====
function getTransfers() {
  try { return JSON.parse(localStorage.getItem('transfers') || '[]'); } catch { return []; }
}
function saveTransfers(arr) {
  localStorage.setItem('transfers', JSON.stringify(arr));
}
function addTransfer(entry) {
  const arr = getTransfers();
  arr.unshift(entry);
  if (arr.length > 200) arr.pop();
  saveTransfers(arr);
}
function deleteTransfer(id) {
  const arr = getTransfers().filter(t => t.id !== id);
  saveTransfers(arr);
}

// ===== توليد معرف =====
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ===== الحسابات المحفوظة (من التطبيق الأصلي) =====
function getSavedAccounts() {
  try { return JSON.parse(localStorage.getItem('accounts') || '[]'); } catch { return []; }
}

// ===== اختيار نوع العملية =====
function selectTransferOp(op) {
  currentTransferOp = op;
  document.querySelectorAll('.tr-op-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.op === op);
  });
  updateFormForOp(op);
}

function updateFormForOp(op) {
  // حقل حساب المصدر/المستلم
  const benefSection  = document.getElementById('benefSection');
  const srcSection    = document.getElementById('srcSection');
  const dstSection    = document.getElementById('dstSection');

  if (op === 'withdrawal') {
    srcSection.style.display    = 'flex';
    dstSection.style.display    = 'none';
    benefSection.style.display  = 'flex';
    document.getElementById('srcLabel').textContent = t('src_account_label');
  } else if (op === 'transfer') {
    srcSection.style.display    = 'flex';
    dstSection.style.display    = 'flex';
    benefSection.style.display  = 'none';
    document.getElementById('srcLabel').textContent = t('src_account_label');
  } else {
    // deposit
    srcSection.style.display    = 'none';
    dstSection.style.display    = 'flex';
    benefSection.style.display  = 'flex';
    document.getElementById('dstLabel').textContent = t('dst_account_label');
  }
}

// ===== ملء الحسابات المحفوظة =====
function populateAccountSelects() {
  const accounts = getSavedAccounts();
  const selects = document.querySelectorAll('.account-select-quick');
  selects.forEach(sel => {
    const prevVal = sel.value;
    sel.innerHTML = `<option value="">${t('select_from_saved')}</option>`;
    accounts.forEach(acc => {
      const opt = document.createElement('option');
      opt.value = JSON.stringify({ ccp: acc.ccp, key: acc.ccpKey, name: acc.name });
      opt.textContent = `${acc.name} — ${acc.ccp}/${acc.ccpKey}`;
      sel.appendChild(opt);
    });
    sel.value = prevVal;
  });
}

function onSelectSrcAccount(sel) {
  if (!sel.value) return;
  const acc = JSON.parse(sel.value);
  document.getElementById('srcAccount').value = acc.ccp || '';
  document.getElementById('srcKey').value     = acc.key || '';
}
function onSelectDstAccount(sel) {
  if (!sel.value) return;
  const acc = JSON.parse(sel.value);
  document.getElementById('dstAccount').value = acc.ccp || '';
  document.getElementById('dstKey').value     = acc.key || '';
}

// ===== التحقق من الحقول =====
function validateTransferForm() {
  const amount = parseFloat(document.getElementById('trAmount').value);
  if (!amount || amount <= 0) { showToast(t('invalid_amount')); return false; }

  if (currentTransferOp === 'withdrawal' || currentTransferOp === 'transfer') {
    const srcAcc = document.getElementById('srcAccount').value.trim();
    if (!srcAcc) { showToast(t('invalid_account_10')); return false; }
    if (!/^\d{10}$/.test(srcAcc)) { showToast(t('invalid_account_10')); return false; }
  }
  if (currentTransferOp === 'transfer' || currentTransferOp === 'deposit') {
    const dstAcc = document.getElementById('dstAccount').value.trim();
    if (!dstAcc) { showToast(t('invalid_account_10')); return false; }
    if (!/^\d{10}$/.test(dstAcc)) { showToast(t('invalid_account_10')); return false; }
  }
  return true;
}

// ===== معاينة وحفظ =====
function previewTransfer() {
  if (!validateTransferForm()) return;
  buildPreviewModal();
  document.getElementById('previewModal').classList.add('open');
}

function buildPreviewModal() {
  const op      = currentTransferOp;
  const amount  = parseFloat(document.getElementById('trAmount').value);
  const subject = document.getElementById('trSubject').value.trim() || '---';
  const dateVal = document.getElementById('trDate').value;

  const srcAcc  = document.getElementById('srcAccount').value.trim();
  const srcKey  = document.getElementById('srcKey').value.trim();
  const dstAcc  = document.getElementById('dstAccount').value.trim();
  const dstKey  = document.getElementById('dstKey').value.trim();

  const bLastName  = document.getElementById('benefLastName').value.trim();
  const bFirstName = document.getElementById('benefFirstName').value.trim();
  const bAddress   = document.getElementById('benefAddress').value.trim();

  const opLabels = { withdrawal: t('op_withdrawal'), transfer: t('op_transfer'), deposit: t('op_deposit') };
  const unit = t('dzd_unit');

  let html = `
    <div class="preview-row"><span class="preview-label">${t('op_type')}</span><span class="preview-val">${opLabels[op]}</span></div>
    <div class="preview-row"><span class="preview-label">${t('amount_dzd')}</span><span class="preview-val amount-val">${amount.toLocaleString('fr-DZ')} ${unit}</span></div>
  `;

  if (op === 'withdrawal' || op === 'transfer') {
    html += `<div class="preview-row"><span class="preview-label">${t('src_account_label')}</span><span class="preview-val" dir="ltr">${srcAcc}/${srcKey || '?'}</span></div>`;
  }
  if (op === 'transfer' || op === 'deposit') {
    html += `<div class="preview-row"><span class="preview-label">${t('dst_account_label')}</span><span class="preview-val" dir="ltr">${dstAcc}/${dstKey || '?'}</span></div>`;
  }
  if ((op === 'withdrawal' || op === 'deposit') && bLastName) {
    html += `<div class="preview-row"><span class="preview-label">${t('beneficiary_label')}</span><span class="preview-val">${bLastName} ${bFirstName}</span></div>`;
    if (bAddress) html += `<div class="preview-row"><span class="preview-label">${t('address_label')}</span><span class="preview-val">${bAddress}</span></div>`;
  }
  html += `<div class="preview-row"><span class="preview-label">${t('subject_label')}</span><span class="preview-val">${subject}</span></div>`;
  html += `<div class="preview-row"><span class="preview-label">${t('date_label')}</span><span class="preview-val" dir="ltr">${dateVal}</span></div>`;

  document.getElementById('previewContent').innerHTML = html;
}

function saveTransferFromPreview() {
  const op      = currentTransferOp;
  const amount  = parseFloat(document.getElementById('trAmount').value);
  const subject = document.getElementById('trSubject').value.trim();
  const dateVal = document.getElementById('trDate').value;

  const srcAcc  = document.getElementById('srcAccount').value.trim();
  const srcKey  = document.getElementById('srcKey').value.trim();
  const dstAcc  = document.getElementById('dstAccount').value.trim();
  const dstKey  = document.getElementById('dstKey').value.trim();

  const bLastName  = document.getElementById('benefLastName').value.trim();
  const bFirstName = document.getElementById('benefFirstName').value.trim();
  const bAddress   = document.getElementById('benefAddress').value.trim();

  const entry = {
    id: genId(),
    op, amount, subject, date: dateVal,
    srcAcc, srcKey, dstAcc, dstKey,
    bLastName, bFirstName, bAddress,
    createdAt: new Date().toLocaleString('fr-DZ'),
  };

  addTransfer(entry);
  closePreviewModal();
  showToast(t('transfer_saved_ok'));
  renderHistory();
  resetForm();
  switchTab('history');
}

function closePreviewModal() {
  document.getElementById('previewModal').classList.remove('open');
}

// ===== إعادة تعيين النموذج =====
function resetForm() {
  document.getElementById('trAmount').value      = '';
  document.getElementById('srcAccount').value    = '';
  document.getElementById('srcKey').value        = '';
  document.getElementById('dstAccount').value    = '';
  document.getElementById('dstKey').value        = '';
  document.getElementById('benefLastName').value  = '';
  document.getElementById('benefFirstName').value = '';
  document.getElementById('benefAddress').value  = '';
  document.getElementById('trSubject').value     = '';
  // إعادة تاريخ اليوم
  document.getElementById('trDate').value = new Date().toLocaleDateString('fr-CA');
  document.querySelectorAll('.account-select-quick').forEach(s => s.value = '');
}

// ===== عرض السجل =====
function renderHistory() {
  const list = getTransfers();
  const container = document.getElementById('historyList');

  if (list.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text2)"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <p>${t('no_transfers')}</p>
        <span>${t('no_transfers_sub')}</span>
      </div>`;
    return;
  }

  const opLabels = { withdrawal: t('op_withdrawal'), transfer: t('op_transfer'), deposit: t('op_deposit') };
  const opColors = { withdrawal: '#ef4444', transfer: '#3b82f6', deposit: '#22c55e' };
  const unit = t('dzd_unit');

  container.innerHTML = list.map(item => `
    <div class="transfer-card" id="tc-${item.id}">
      <div class="tc-header">
        <span class="tc-op-badge" style="background:${opColors[item.op] || '#888'}20;color:${opColors[item.op] || '#888'};border-color:${opColors[item.op] || '#888'}40;">
          ${opLabels[item.op] || item.op}
        </span>
        <span class="tc-amount">${parseFloat(item.amount).toLocaleString('fr-DZ')} ${unit}</span>
      </div>
      <div class="tc-details">
        ${item.srcAcc ? `<div class="tc-row"><span>${t('from_label')}</span><span dir="ltr">${item.srcAcc}/${item.srcKey || '?'}</span></div>` : ''}
        ${item.dstAcc ? `<div class="tc-row"><span>${t('to_label')}</span><span dir="ltr">${item.dstAcc}/${item.dstKey || '?'}</span></div>` : ''}
        ${item.bLastName ? `<div class="tc-row"><span>${t('beneficiary_name_label')}</span><span>${item.bLastName} ${item.bFirstName}</span></div>` : ''}
        ${item.subject   ? `<div class="tc-row"><span>${t('subject_label_tr')}</span><span>${item.subject}</span></div>` : ''}
        <div class="tc-row muted"><span>${t('date_label_tr')}</span><span dir="ltr">${item.date}</span></div>
        <div class="tc-row muted"><span>${t('saved')}:</span><span>${item.createdAt}</span></div>
      </div>
      <div class="tc-actions">
        <button class="tc-btn" onclick="shareTransfer('${item.id}')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          ${t('share')}
        </button>
        <button class="tc-btn danger" onclick="confirmDeleteTransfer('${item.id}')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          ${t('delete')}
        </button>
      </div>
    </div>
  `).join('');
}

// ===== حذف حوالة =====
let pendingDeleteId = null;

function confirmDeleteTransfer(id) {
  pendingDeleteId = id;
  document.getElementById('deleteModal').classList.add('open');
}
function cancelDelete() {
  pendingDeleteId = null;
  document.getElementById('deleteModal').classList.remove('open');
}
function doDeleteTransfer() {
  if (pendingDeleteId) {
    deleteTransfer(pendingDeleteId);
    renderHistory();
    showToast(t('deleted'));
  }
  cancelDelete();
}

// ===== مشاركة حوالة =====
function shareTransfer(id) {
  const item = getTransfers().find(t => t.id === id);
  if (!item) return;
  const opLabels = { withdrawal: t('op_withdrawal'), transfer: t('op_transfer'), deposit: t('op_deposit') };
  const unit = t('dzd_unit');
  let text = `📋 ${t('transfer_preview_title')}\n`;
  text += `${t('op_type')}: ${opLabels[item.op] || item.op}\n`;
  text += `${t('amount_dzd')}: ${parseFloat(item.amount).toLocaleString('fr-DZ')} ${unit}\n`;
  if (item.srcAcc) text += `${t('from_label')} ${item.srcAcc}/${item.srcKey || '?'}\n`;
  if (item.dstAcc) text += `${t('to_label')} ${item.dstAcc}/${item.dstKey || '?'}\n`;
  if (item.bLastName) text += `${t('beneficiary_name_label')} ${item.bLastName} ${item.bFirstName}\n`;
  if (item.subject) text += `${t('subject_label_tr')} ${item.subject}\n`;
  text += `${t('date_label_tr')} ${item.date}\n`;
  text += `\n— My RiP`;
  shareText(text, 'حوالة بريدية - My RiP');
}

// ===== التبويب =====
let currentTab = 'form';
function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.getElementById('formSection').style.display    = tab === 'form'    ? 'flex' : 'none';
  document.getElementById('historySection').style.display = tab === 'history' ? 'flex' : 'none';
  if (tab === 'history') renderHistory();
}

// ===== مسح الكل =====
function confirmClearAll() {
  if (getTransfers().length === 0) { showToast(t('no_transfers')); return; }
  document.getElementById('clearModal').classList.add('open');
}
function cancelClear() {
  document.getElementById('clearModal').classList.remove('open');
}
function doClearAll() {
  localStorage.removeItem('transfers');
  renderHistory();
  showToast(t('deleted'));
  cancelClear();
}

// ===== تهيئة =====
document.addEventListener('DOMContentLoaded', () => {
  // تطبيق الترجمات
  if (typeof updateAllText === 'function') updateAllText();

  // تاريخ اليوم كافتراضي
  document.getElementById('trDate').value = new Date().toLocaleDateString('fr-CA');

  // تحميل الحسابات المحفوظة
  populateAccountSelects();

  // العملية الافتراضية
  selectTransferOp('withdrawal');

  // إغلاق المودالات بالضغط خارجها
  ['previewModal','deleteModal','clearModal'].forEach(id => {
    document.getElementById(id).addEventListener('click', function(e) {
      if (e.target === this) this.classList.remove('open');
    });
  });
});
