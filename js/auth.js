// =========================================================================
// 6. HALAMAN LOGIN HYBRID (CLEAN MODERN PORTAL)
// =========================================================================
function renderLoginView() {
  const app = document.getElementById('app-container');
  const rtName = getCachedRtName();

  app.innerHTML = `
    <div class="min-h-screen flex flex-col justify-between bg-[#F4F7FE]">
      <!-- Top Accent Bar -->
      <div class="w-full bg-gradient-to-r from-[#0A3D91] via-[#0D47A1] to-[#1976D2] text-white py-2.5 px-4 text-center text-xs font-medium tracking-wide">
        Portal Resmi Pengelolaan Tabungan & Iuran Kurban • <span class="login-rt-name">${rtName}</span>
      </div>

      <div class="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div class="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl shadow-[0_12px_40px_rgba(13,71,161,0.08)] border border-slate-200/70 overflow-hidden">
          
          <!-- Sisi Kiri: Branding & Informasi RT -->
          <div class="lg:col-span-5 bg-gradient-to-br from-[#0A3D91] via-[#0D47A1] to-[#1565C0] p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
            <div class="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/10 blur-xl pointer-events-none"></div>
            <div class="absolute -left-10 -bottom-10 w-40 h-40 rounded-full bg-emerald-400/15 blur-xl pointer-events-none"></div>

            <div class="relative z-10">
              <div class="inline-flex items-center gap-3 bg-white/15 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/20 mb-6">
                <div class="w-9 h-9 rounded-xl bg-white text-[#0D47A1] flex items-center justify-center font-extrabold shadow-sm">
                  <i data-lucide="landmark" class="w-5 h-5"></i>
                </div>
                <div>
                  <div class="font-extrabold text-sm tracking-tight leading-none">SIPKURBAN RT</div>
                  <div class="text-[11px] text-blue-100 mt-0.5">Transparan • Amanah • Terukur</div>
                </div>
              </div>

              <h1 class="text-2xl sm:text-3xl font-extrabold leading-tight mb-3">
                Kelola Iuran Kurban Warga Lebih Mudah & Transparan
              </h1>
              <p class="text-blue-100 text-xs sm:text-sm leading-relaxed">
                Pantau saldo tabungan kurban sapi patungan maupun kambing mandiri, cek pembagian kelompok hewan, dan unduh kuitansi resmi panitia RT secara real-time.
              </p>
            </div>

            <div class="relative z-10 mt-8 pt-6 border-t border-white/15 space-y-3">
              <div class="flex items-center gap-3 text-xs text-blue-100">
                <span class="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                  <i data-lucide="shield-check" class="w-4 h-4"></i>
                </span>
                <span>Akses Warga cukup memakai <strong>ID Warga / No. HP & PIN</strong></span>
              </div>
              <div class="flex items-center gap-3 text-xs text-blue-100">
                <span class="w-7 h-7 rounded-lg bg-amber-400/20 text-amber-200 flex items-center justify-center shrink-0">
                  <i data-lucide="receipt" class="w-4 h-4"></i>
                </span>
                <span>Kuitansi digital & laporan keuangan otomatis terarsip</span>
              </div>
            </div>
          </div>

          <!-- Sisi Kanan: Form Hybrid Login (Tab Warga & Tab Admin) -->
          <div class="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
            <div class="mb-6">
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-[#0D47A1] mb-2">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                ${CONFIG.API_URL ? 'Terhubung ke Google Spreadsheet' : 'Backend belum dikonfigurasi'}
              </span>
              <h2 class="text-xl sm:text-2xl font-extrabold text-slate-800">Masuk ke Portal Kurban</h2>
              ${CONFIG.API_URL ? '' : `<div class="mt-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 leading-relaxed"><strong>API_URL belum diisi.</strong> Deploy backend Apps Script, lalu tempel URL <code>/exec</code> ke <code>js/config.js</code>. Lihat README.md.</div>`}
              <p class="text-xs sm:text-sm text-slate-500 mt-1">Silakan pilih peran Anda sebagai Peserta Kurban (Warga) atau Panitia RT.</p>
            </div>

            <!-- Switcher Tab Role -->
            <div class="grid grid-cols-2 gap-2 p-1.5 bg-[#F4F7FE] rounded-2xl border border-slate-200/80 mb-6">
              <button type="button" id="tab-btn-warga" onclick="switchLoginTab('warga')"
                class="py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all bg-[#0D47A1] text-white shadow-sm cursor-pointer">
                <i data-lucide="user-check" class="w-4 h-4"></i>
                <span>Warga / Peserta</span>
              </button>
              <button type="button" id="tab-btn-admin" onclick="switchLoginTab('admin')"
                class="py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all text-slate-600 hover:text-slate-900 cursor-pointer">
                <i data-lucide="shield" class="w-4 h-4"></i>
                <span>Admin / Panitia RT</span>
              </button>
            </div>

            <!-- FORM LOGIN WARGA -->
            <form id="form-login-warga" class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1.5">ID Warga atau Nomor HP Terdaftar</label>
                <div class="relative">
                  <i data-lucide="smartphone" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
                  <input type="text" id="warga-identifier" required placeholder="Contoh: RT05-003 atau 081345678901"
                    class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#0D47A1] focus:ring-2 focus:ring-blue-500/20 outline-none text-sm transition-all" />
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1.5">PIN Akses (4 Digit)</label>
                <div class="relative">
                  <i data-lucide="key-round" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
                  <input type="password" id="warga-pin" required inputmode="numeric" autocomplete="current-password" placeholder="${CONFIG.DEMO_HINTS ? 'Masukkan PIN (Default demo: 1234)' : 'Masukkan PIN'}"
                    class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#0D47A1] focus:ring-2 focus:ring-blue-500/20 outline-none text-sm transition-all" />
                </div>
              </div>

              ${CONFIG.DEMO_HINTS ? `
              <div class="flex items-center justify-between pt-1">
                <button type="button" onclick="fillDemoWarga()" class="text-xs font-semibold text-[#0D47A1] hover:underline flex items-center gap-1 cursor-pointer">
                  <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
                  Isi Akun Demo Warga (Ibu Siti)
                </button>
                <span class="text-[11px] text-slate-400">PIN Default: 1234</span>
              </div>
              ` : ''}

              <button type="submit"
                class="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-[#0A3D91] to-[#1976D2] hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-blue-900/15 flex items-center justify-center gap-2 transition-all cursor-pointer">
                <span>Masuk Sebagai Peserta Kurban</span>
                <i data-lucide="arrow-right" class="w-4 h-4"></i>
              </button>
            </form>

            <!-- FORM LOGIN ADMIN -->
            <form id="form-login-admin" class="space-y-4 hidden">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1.5">Email Admin Panitia RT</label>
                <div class="relative">
                  <i data-lucide="mail" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
                  <input type="email" id="admin-email" required placeholder="admin@rt.id"
                    class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#0D47A1] focus:ring-2 focus:ring-blue-500/20 outline-none text-sm transition-all" />
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1.5">Kata Sandi Admin</label>
                <div class="relative">
                  <i data-lucide="lock" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
                  <input type="password" id="admin-password" required placeholder="••••••••"
                    class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#0D47A1] focus:ring-2 focus:ring-blue-500/20 outline-none text-sm transition-all" />
                </div>
              </div>

              ${CONFIG.DEMO_HINTS ? `
              <div class="flex items-center justify-between pt-1">
                <button type="button" onclick="fillDemoAdmin()" class="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer">
                  <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
                  Isi Akun Demo Admin Panitia
                </button>
                <span class="text-[11px] text-slate-400">Demo: admin@rt.id</span>
              </div>
              ` : ''}

              <button type="submit"
                class="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-emerald-900/15 flex items-center justify-center gap-2 transition-all cursor-pointer">
                <span>Masuk Sebagai Admin Panitia</span>
                <i data-lucide="shield-check" class="w-4 h-4"></i>
              </button>
            </form>
          </div>
        </div>
      </div>

      <!-- Footer Strip -->
      <footer class="bg-[#0A3D91] text-white/90 py-3 px-4 text-center text-xs">
        © 2026–2027 SIPKURBAN RT • Panitia Pelaksana Ibadah Kurban <span class="login-rt-name">${rtName}</span>
      </footer>
    </div>
  `;

  document.getElementById('form-login-warga').addEventListener('submit', handleWargaLogin);
  document.getElementById('form-login-admin').addEventListener('submit', handleAdminLogin);
  if (window.lucide) window.lucide.createIcons();
  loadPublicInfo();
}

// Nama RT di halaman login diambil dari server (di-cache agar tampil instan pada kunjungan berikutnya).
const RT_NAME_KEY = 'sipkurban_rt_name';
const DEFAULT_RT_NAME = 'RT 05 / RW 03 Perumahan Griya Asri';

function getCachedRtName() {
  try { return localStorage.getItem(RT_NAME_KEY) || DEFAULT_RT_NAME; } catch (e) { return DEFAULT_RT_NAME; }
}

async function loadPublicInfo() {
  if (!CONFIG.API_URL) return;
  try {
    const info = await apiCall('public_info');
    if (info && info.namaRT) {
      try { localStorage.setItem(RT_NAME_KEY, unesc(info.namaRT)); } catch (e) {}
      document.querySelectorAll('.login-rt-name').forEach(el => { el.innerHTML = info.namaRT; });
    }
  } catch (e) { /* diam: info publik hanya pemanis */ }
}

window.switchLoginTab = function (role) {
  const btnWarga = document.getElementById('tab-btn-warga');
  const btnAdmin = document.getElementById('tab-btn-admin');
  const formWarga = document.getElementById('form-login-warga');
  const formAdmin = document.getElementById('form-login-admin');

  if (role === 'warga') {
    btnWarga.className = 'py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all bg-[#0D47A1] text-white shadow-sm cursor-pointer';
    btnAdmin.className = 'py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all text-slate-600 hover:text-slate-900 cursor-pointer';
    formWarga.classList.remove('hidden');
    formAdmin.classList.add('hidden');
  } else {
    btnAdmin.className = 'py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all bg-emerald-600 text-white shadow-sm cursor-pointer';
    btnWarga.className = 'py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all text-slate-600 hover:text-slate-900 cursor-pointer';
    formAdmin.classList.remove('hidden');
    formWarga.classList.add('hidden');
  }
};

window.fillDemoWarga = function () {
  document.getElementById('warga-identifier').value = 'RT05-003';
  document.getElementById('warga-pin').value = '1234';
  showToast('Data demo Ibu Siti Rahmawati (RT05-003) diisikan!', 'info');
};

window.fillDemoAdmin = function () {
  document.getElementById('admin-email').value = 'admin@rt.id';
  document.getElementById('admin-password').value = 'admin123';
  showToast('Kredensial demo Admin Panitia RT diisikan!', 'info');
};

async function handleWargaLogin(e) {
  e.preventDefault();
  const identifier = document.getElementById('warga-identifier').value.trim();
  const pin = document.getElementById('warga-pin').value.trim();
  const btn = e.submitter || e.target.querySelector('[type=submit]');

  await runBusy(btn, async () => {
    const res = await apiCall('login_warga', { identifier, pin });
    setToken(res.token);
    applySnapshot(res.snapshot);
    APP_STATE.reportFilter.type = 'pribadi_warga';
    APP_STATE.activeMenu = 'dashboard';
    showToast(`Assalamualaikum, ${APP_STATE.currentUser.name}!`, 'success');
    renderMainApp();
  });
}

async function handleAdminLogin(e) {
  e.preventDefault();
  const email = document.getElementById('admin-email').value.trim();
  const password = document.getElementById('admin-password').value;
  const btn = e.submitter || e.target.querySelector('[type=submit]');

  await runBusy(btn, async () => {
    const res = await apiCall('login_admin', { email, password });
    setToken(res.token);
    applySnapshot(res.snapshot);
    APP_STATE.reportFilter.type = 'rekap_warga';
    APP_STATE.activeMenu = 'dashboard';
    showToast('Berhasil masuk sebagai Admin Panitia RT!', 'success');
    renderMainApp();
  });
}

window.handleLogout = function () {
  setToken(null);
  APP_STATE.currentUser = null;
  APP_STATE.searchQuery = '';
  showToast('Anda telah keluar dari sistem.', 'info');
  renderLoginView();
};
