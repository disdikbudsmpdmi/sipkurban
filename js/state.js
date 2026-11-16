// =========================================================================
// 5. STATE APLIKASI & HELPER UTILITIES
// =========================================================================
const APP_STATE = {
  currentUser: null,
  activeMenu: 'dashboard',
  searchQuery: '',
  warga: [],
  transaksi: [],
  kelompok: [],
  jadwal: [],
  pengumuman: [],
  settings: null,
  reportFilter: {
    type: 'rekap_warga',
    statusLunas: 'semua',
    jenisKurban: 'semua',
    metodeBayar: 'semua',
    tglMulai: '',
    tglSelesai: '',
    selectedWargaId: ''
  },
  tren: [],
  charts: {
    trendChart: null,
    donutChart: null
  }
};

// -------------------------------------------------------------------------
// STATUS AGENDA OTOMATIS (mengikuti tanggal & jam agenda, memakai jam perangkat)
//   sebelum jam mulai di tanggal agenda -> Akan Datang
//   sejak jam mulai s.d. akhir tanggal agenda -> Berlangsung
//   setelah tanggal agenda terlewat -> Selesai
// Format tanggal: "17-05-2027" (utama) / "17 Mei 2027" / "2027-05-17" / "17/05/2027".
// Format jam: "08:00" (atau "08:00 WIB") atau rentang "08:00 - 14:00" (jam pertama = jam mulai).
// -------------------------------------------------------------------------
const BULAN_MAP = {
  jan: 0, feb: 1, mar: 2, apr: 3, mei: 4, may: 4, jun: 5, jul: 6,
  agu: 7, agt: 7, ags: 7, aug: 7, sep: 8, okt: 9, oct: 9, nov: 10, des: 11, dec: 11
};

function parseTanggalAgenda(teks) {
  const t = unesc(teks).trim();
  let m = t.match(/(\d{1,2})\s+([A-Za-z]+)\.?,?\s+(\d{4})/);
  if (m) {
    const bln = BULAN_MAP[m[2].toLowerCase().slice(0, 3)];
    if (bln !== undefined) return { y: +m[3], m: bln, d: +m[1] };
  }
  m = t.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return { y: +m[1], m: +m[2] - 1, d: +m[3] };
  m = t.match(/(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/);
  if (m) return { y: +m[3], m: +m[2] - 1, d: +m[1] };
  return null;
}

function hitungStatusAgenda(j, now = new Date()) {
  const tgl = parseTanggalAgenda(j.tanggal);
  if (!tgl) return j.status;   // tanggal tak terbaca: pakai status tersimpan
  const jam = unesc(j.waktu).match(/(\d{1,2})[:.](\d{2})/);
  const mulai = new Date(tgl.y, tgl.m, tgl.d, jam ? +jam[1] : 0, jam ? +jam[2] : 0);
  const akhirHari = new Date(tgl.y, tgl.m, tgl.d + 1, 0, 0);
  if (now < mulai) return 'Akan Datang';
  if (now < akhirHari) return 'Berlangsung';
  return 'Selesai';
}

function refreshJadwalStatus() {
  const now = new Date();
  APP_STATE.jadwal.forEach(j => { j.status = hitungStatusAgenda(j, now); });
}

// -------------------------------------------------------------------------
// FORMAT TANGGAL & JAM TAMPILAN: tanggal "dd-mm-yyyy", jam "HH:mm WIB"
// Menerima "2027-05-17", "2027-05-17T07:00:00", "17 Mei 2027", "17/05/2027", Date.
// -------------------------------------------------------------------------
const BULAN_SINGKAT = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];

function fmtTgl(v) {
  if (v === null || v === undefined || v === '') return '';
  const p2 = n => String(n).padStart(2, '0');
  if (v instanceof Date) {
    return isNaN(v) ? '' : `${p2(v.getDate())}-${p2(v.getMonth() + 1)}-${v.getFullYear()}`;
  }
  const t = parseTanggalAgenda(String(v));
  return t ? `${p2(t.d)}-${p2(t.m + 1)}-${t.y}` : String(v);
}

function fmtWaktu(v) {
  const t = unesc(v || '').trim();
  if (!t) return '';
  return /[A-Za-z]/.test(t) ? t : `${t} WIB`;
}

// Mask input tanggal: otomatis menyisipkan "-" -> dd-mm-yyyy
window.maskTanggalInput = function (el) {
  const d = el.value.replace(/\D/g, '').slice(0, 8);
  let out = d.slice(0, 2);
  if (d.length > 2) out += '-' + d.slice(2, 4);
  if (d.length > 4) out += '-' + d.slice(4);
  el.value = out;
};

// Validasi ketat "dd-mm-yyyy" (tanggal harus benar-benar ada di kalender)
function validTglDMY(teks) {
  const m = String(teks || '').trim().match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!m) return false;
  const d = new Date(+m[3], +m[2] - 1, +m[1]);
  return d.getFullYear() === +m[3] && d.getMonth() === +m[2] - 1 && d.getDate() === +m[1];
}

// Validasi jam "HH:mm" atau rentang "HH:mm - HH:mm" (24 jam)
function validJam(teks) {
  return /^([01]\d|2[0-3]):[0-5]\d(\s*-\s*([01]\d|2[0-3]):[0-5]\d)?$/.test(String(teks || '').trim());
}

function formatRupiah(angka) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(Number(angka) || 0);
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  const colors = {
    success: 'bg-emerald-600 text-white border-emerald-500',
    error: 'bg-rose-600 text-white border-rose-500',
    info: 'bg-[#0D47A1] text-white border-blue-500'
  };
  toast.className = `pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs sm:text-sm font-semibold transition-all duration-300 translate-y-0 opacity-100 ${colors[type] || colors.info}`;
  toast.innerHTML = `
    <i data-lucide="${type === 'error' ? 'alert-circle' : (type === 'success' ? 'check-circle-2' : 'info')}" class="w-4 h-4 shrink-0"></i>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  if (window.lucide) window.lucide.createIcons();
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-8px)';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

function openModal(htmlContent) {
  const modal = document.getElementById('modal-container');
  modal.innerHTML = htmlContent;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  if (window.lucide) window.lucide.createIcons();
}

window.closeModal = function () {
  const modal = document.getElementById('modal-container');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  modal.innerHTML = '';
};

// Backend mengirim teks yang sudah di-escape HTML (aman untuk innerHTML).
// Gunakan unesc() hanya untuk konteks teks biasa (CSV, confirm, dsb).
function unesc(s) {
  return String(s ?? '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
}

// Menonaktifkan tombol submit selama permintaan ke server berlangsung.
async function runBusy(btn, fn) {
  const original = btn ? btn.innerHTML : '';
  if (btn) { btn.disabled = true; btn.classList.add('opacity-60', 'cursor-wait'); btn.innerHTML = 'Memproses…'; }
  try {
    return await fn();
  } catch (err) {
    if (err && err.code !== 'UNAUTHORIZED') showToast(err.message || 'Terjadi kesalahan.', 'error');
    return undefined;
  } finally {
    if (btn && btn.isConnected) { btn.disabled = false; btn.classList.remove('opacity-60', 'cursor-wait'); btn.innerHTML = original; }
  }
}

// Menerapkan data terbaru dari server ke APP_STATE.
function applySnapshot(snap) {
  if (!snap) return;
  if (snap.user) APP_STATE.currentUser = snap.user;
  APP_STATE.settings = snap.settings || null;
  APP_STATE.warga = snap.warga || [];
  APP_STATE.transaksi = (snap.transaksi || []).slice().sort((a, b) => (b.tanggalSetor || '').localeCompare(a.tanggalSetor || ''));
  APP_STATE.kelompok = snap.kelompok || [];
  APP_STATE.jadwal = snap.jadwal || [];
  refreshJadwalStatus();
  APP_STATE.pengumuman = snap.pengumuman || [];
  APP_STATE.tren = snap.tren || [];

  const f = APP_STATE.reportFilter;
  if ((!f.selectedWargaId || !APP_STATE.warga.some(w => w.idWarga === f.selectedWargaId)) && APP_STATE.warga.length > 0) {
    f.selectedWargaId = APP_STATE.warga[0].idWarga;
  }
}

async function refreshAllData() {
  const snap = await apiCall('bootstrap');
  applySnapshot(snap);
}
