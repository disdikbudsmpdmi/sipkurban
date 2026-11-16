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
