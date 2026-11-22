// ===== FEES CALCULATOR - حاسبة رسوم بريد الجزائر =====
// جدول الرسوم الحقيقية لبريد الجزائر (2024)

// ===== جدول رسوم السحب النقدي =====
// المصدر: تعريفة بريد الجزائر الرسمية
const WITHDRAWAL_FEES = [
  { min: 1,      max: 500,    fee: 10 },
  { min: 501,    max: 2000,   fee: 15 },
  { min: 2001,   max: 5000,   fee: 30 },
  { min: 5001,   max: 10000,  fee: 50 },
  { min: 10001,  max: 20000,  fee: 80 },
  { min: 20001,  max: 50000,  fee: 120 },
  { min: 50001,  max: 100000, fee: 180 },
  { min: 100001, max: 200000, fee: 250 },
  { min: 200001, max: 500000, fee: 400 },
  { min: 500001, max: Infinity, fee: 600 },
];

// ===== جدول رسوم التحويل من حساب لآخر =====
const TRANSFER_FEES = [
  { min: 1,      max: 500,    fee: 10 },
  { min: 501,    max: 2000,   fee: 15 },
  { min: 2001,   max: 5000,   fee: 25 },
  { min: 5001,   max: 10000,  fee: 40 },
  { min: 10001,  max: 20000,  fee: 60 },
  { min: 20001,  max: 50000,  fee: 100 },
  { min: 50001,  max: 100000, fee: 150 },
  { min: 100001, max: 200000, fee: 200 },
  { min: 200001, max: 500000, fee: 300 },
  { min: 500001, max: Infinity, fee: 500 },
];

// ===== جدول رسوم الدفع في الحساب =====
const DEPOSIT_FEES = [
  { min: 1,      max: 1000,   fee: 10 },
  { min: 1001,   max: 5000,   fee: 20 },
  { min: 5001,   max: 20000,  fee: 30 },
  { min: 20001,  max: 50000,  fee: 50 },
  { min: 50001,  max: 100000, fee: 80 },
  { min: 100001, max: 200000, fee: 120 },
  { min: 200001, max: 500000, fee: 200 },
  { min: 500001, max: Infinity, fee: 350 },
];

// ===== احتساب الرسم =====
function getFee(amount, table) {
  if (!amount || amount <= 0) return 0;
  for (const row of table) {
    if (amount >= row.min && amount <= row.max) return row.fee;
  }
  return 0;
}

function getFeesTable() {
  const op = document.querySelector('.op-btn.active')?.dataset.op || 'withdrawal';
  if (op === 'withdrawal') return WITHDRAWAL_FEES;
  if (op === 'transfer')   return TRANSFER_FEES;
  return DEPOSIT_FEES;
}

// ===== تحويل الرقم إلى أحرف عربية =====
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
    const t = Math.floor(n / 10);
    const o = n % 10;
    parts.push(o > 0 ? ONES_AR[o] + ' و ' + TENS_AR[t] : TENS_AR[t]);
  } else if (n > 0) {
    parts.push(ONES_AR[n]);
  }
  return parts.join(' و ');
}

// ===== تحويل الرقم إلى أحرف فرنسية =====
const ONES_FR = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
  'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
const TENS_FR = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];

function numToWordsFr(n) {
  if (n === 0) return 'zéro';
  if (n < 0)   return 'moins ' + numToWordsFr(-n);
  const parts = [];
  if (n >= 1000000) {
    const m = Math.floor(n / 1000000);
    parts.push(numToWordsFr(m) + (m > 1 ? ' millions' : ' million'));
    n %= 1000000;
  }
  if (n >= 1000) {
    const k = Math.floor(n / 1000);
    parts.push(k === 1 ? 'mille' : numToWordsFr(k) + ' mille');
    n %= 1000;
  }
  if (n >= 100) {
    const h = Math.floor(n / 100);
    parts.push(h === 1 ? 'cent' : ONES_FR[h] + ' cent');
    n %= 100;
  }
  if (n >= 70 && n < 80) {
    parts.push('soixante-' + ONES_FR[n - 60]);
  } else if (n >= 80 && n < 90) {
    const r = n - 80;
    parts.push(r === 0 ? 'quatre-vingts' : 'quatre-vingt-' + ONES_FR[r]);
  } else if (n >= 90) {
    parts.push('quatre-vingt-' + ONES_FR[n - 80]);
  } else if (n >= 20) {
    const t = Math.floor(n / 10), o = n % 10;
    if (o === 1 && t !== 8) parts.push(TENS_FR[t] + ' et ' + ONES_FR[1]);
    else parts.push(o > 0 ? TENS_FR[t] + '-' + ONES_FR[o] : TENS_FR[t]);
  } else if (n > 0) {
    parts.push(ONES_FR[n]);
  }
  return parts.join(' ');
}

function numToWords(n, lang) {
  const intN = Math.round(n);
  if (lang === 'fr') return numToWordsFr(intN) + ' dinars algériens';
  if (lang === 'en') return numToWordsFr(intN) + ' Algerian dinars';
  return numToWordsAr(intN) + ' دينارًا جزائريًا';
}

// ===== حساب الأوراق النقدية =====
const NOTES = [2000, 1000, 500, 200, 100];

function calcNotes(amount) {
  let rem = Math.round(amount);
  const result = {};
  for (const note of NOTES) {
    result[note] = Math.floor(rem / note);
    rem %= note;
  }
  return result;
}

// ===== الحالة الحالية =====
let currentAmount  = 0;
let currentFee     = 0;
let currentTotal   = 0;
let currentOp      = 'withdrawal';

// ===== تحديث الحساب =====
function recalculate() {
  const raw = document.getElementById('amountInput').value.replace(/\D/g, '');
  currentAmount = parseInt(raw) || 0;

  const table = getFeesTable();
  currentFee   = getFee(currentAmount, table);
  currentTotal = currentAmount + currentFee;

  updateDisplay();
}

function updateDisplay() {
  const lang = window.APP_LANG || 'ar';

  // القيم الرقمية
  const unit = ' ' + t('dzd_unit');
  document.getElementById('feeAmount').textContent   = currentAmount.toLocaleString('fr-DZ') + unit;
  document.getElementById('feeValue').textContent    = currentFee.toLocaleString('fr-DZ') + unit;
  document.getElementById('feeTotal').textContent    = currentTotal.toLocaleString('fr-DZ') + unit;

  // إظهار / إخفاء حاويات النتيجة
  const hasAmount = currentAmount > 0;
  document.getElementById('resultSection').style.display = hasAmount ? 'flex' : 'none';

  if (!hasAmount) return;

  // ===== قسم الأحرف =====
  updateWordsSection();

  // ===== قسم النقد =====
  updateNotesSection();
}

// ==== أيهما محدد في "بالأحرف" ====
let wordsTarget = 'total'; // amount | fee | total

function updateWordsSection() {
  const lang = window.APP_LANG || 'ar';
  const val = wordsTarget === 'amount' ? currentAmount
            : wordsTarget === 'fee'    ? currentFee
            : currentTotal;
  document.getElementById('wordsText').textContent = val > 0 ? numToWords(val, lang) : '---';
}

// ==== أيهما محدد في "نقدًا" ====
let notesTarget = 'amount'; // amount | fee | total

function updateNotesSection() {
  const val = notesTarget === 'amount' ? currentAmount
            : notesTarget === 'fee'    ? currentFee
            : currentTotal;
  const notes = calcNotes(val);
  renderNotes(notes, val);
}

function renderNotes(notes, total) {
  const container = document.getElementById('notesContainer');
  container.innerHTML = '';
  const noteImages = {
    2000: '💵', 1000: '💴', 500: '💶', 200: '💷', 100: '🏷️'
  };
  const noteColors = {
    2000: '#1a5276', 1000: '#145a32', 500: '#7b241c', 200: '#6e2f8a', 100: '#7d6608'
  };
  let hasAny = false;
  for (const [note, count] of Object.entries(notes)) {
    if (count > 0) {
      hasAny = true;
      const noteVal = parseInt(note);
      const div = document.createElement('div');
      div.className = 'note-chip';
      div.style.borderColor = noteColors[noteVal] || '#555';
      const unit = t('dzd_unit');
      div.innerHTML = `
        <div class="note-denom" style="color:${noteColors[noteVal]}">${noteVal.toLocaleString('fr-DZ')} <span>${unit}</span></div>
        <div class="note-count">× ${count}</div>
        <div class="note-sub">${(noteVal * count).toLocaleString('fr-DZ')} ${unit}</div>
      `;
      container.appendChild(div);
    }
  }
  if (!hasAny) {
    container.innerHTML = '<div class="note-empty">---</div>';
  }
}

// ===== اختيار العملية =====
function selectOp(op) {
  currentOp = op;
  document.querySelectorAll('.op-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.op === op);
  });
  recalculate();
}

// ===== اختيار هدف الأحرف =====
function selectWordsTarget(target) {
  wordsTarget = target;
  document.querySelectorAll('.words-tab').forEach(b => {
    b.classList.toggle('active', b.dataset.target === target);
  });
  updateWordsSection();
}

// ===== اختيار هدف النقد =====
function selectNotesTarget(target) {
  notesTarget = target;
  document.querySelectorAll('.notes-tab').forEach(b => {
    b.classList.toggle('active', b.dataset.target === target);
  });
  updateNotesSection();
}

// ===== نسخ الأحرف =====
function copyWords() {
  const text = document.getElementById('wordsText').textContent;
  if (text && text !== '---') {
    navigator.clipboard.writeText(text).then(() => showToast(t('copied'))).catch(() => {});
  }
}

// ===== مسح الحقل =====
function clearFeeAmount() {
  document.getElementById('amountInput').value = '';
  recalculate();
  document.getElementById('amountInput').focus();
}

// ===== تهيئة =====
document.addEventListener('DOMContentLoaded', () => {
  // تطبيق اللغة والترجمات
  if (typeof updateAllText === 'function') updateAllText();

  // اختيار الافتراضي
  selectOp('withdrawal');
  selectWordsTarget('total');
  selectNotesTarget('amount');

  const input = document.getElementById('amountInput');
  input.addEventListener('input', () => {
    // فقط أرقام
    let val = input.value.replace(/\D/g, '');
    input.value = val;
    document.getElementById('amountClearBtn').style.display = val ? 'flex' : 'none';
    recalculate();
  });
});
