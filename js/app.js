// =========================================================================
// INISIALISASI APLIKASI SAAT HALAMAN DIMUAT
// =========================================================================
function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') return;
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

function renderSplash(text) {
  document.getElementById('app-container').innerHTML = `
    <div class="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#F4F7FE]">
      <div class="w-12 h-12 rounded-full border-4 border-blue-100 border-t-[#0D47A1] animate-spin"></div>
      <p class="text-sm font-semibold text-slate-500">${text}</p>
    </div>
  `;
}

async function bootstrapApp() {
  registerServiceWorker();

  // Pulihkan sesi bila token masih tersimpan (sessionStorage).
  if (getToken() && CONFIG.API_URL) {
    renderSplash('Memuat data dari Google Spreadsheet…');
    try {
      await refreshAllData();     // snapshot juga membawa data user dari server
      const isAdmin = APP_STATE.currentUser && APP_STATE.currentUser.role === 'admin';
      APP_STATE.reportFilter.type = isAdmin ? 'rekap_warga' : 'pribadi_warga';
      APP_STATE.activeMenu = 'dashboard';
      renderMainApp();
      return;
    } catch (err) {
      setToken(null);
      APP_STATE.currentUser = null;
      renderLoginView();
      if (err.code !== 'UNAUTHORIZED') showToast(err.message, 'error');
      return;
    }
  }
  renderLoginView();
}

document.addEventListener('DOMContentLoaded', bootstrapApp);
