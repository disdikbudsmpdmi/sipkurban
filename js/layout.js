// =========================================================================
// 7. SHELL UTAMA PORTAL (SIDEBAR DESKTOP, FLOATING NAV MOBILE, TOPBAR, FOOTER)
// =========================================================================
const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', shortLabel: 'Beranda', icon: 'layout-dashboard' },
  { id: 'peserta', label: 'Peserta & Kelompok', shortLabel: 'Peserta', icon: 'users' },
  { id: 'iuran', label: 'Catat & Riwayat Iuran', shortLabel: 'Iuran', icon: 'wallet' },
  { id: 'laporan', label: 'Cetak Laporan', shortLabel: 'Laporan', icon: 'printer' },
  { id: 'jadwal', label: 'Jadwal & Distribusi', shortLabel: 'Jadwal', icon: 'calendar-clock' },
  { id: 'pengumuman', label: 'Pengumuman RT', shortLabel: 'Info RT', icon: 'megaphone' },
  { id: 'profil', label: 'Profil & Pengaturan', shortLabel: 'Akun', icon: 'settings' }
];

window.navigateMenu = function (menuId) {
  APP_STATE.activeMenu = menuId;
  renderMainApp();
  const wrapper = document.getElementById('sipkurban-root-wrapper');
  if (wrapper) wrapper.scrollTo({ top: 0, behavior: 'smooth' });
};

window.handleGlobalSearch = function (val) {
  APP_STATE.searchQuery = val.toLowerCase();
  renderActivePageContent();
};

function renderMainApp() {
  const app = document.getElementById('app-container');
  const user = APP_STATE.currentUser;
  const isAdmin = user.role === 'admin';
  const rtName = APP_STATE.settings?.namaRT || 'RT 05 / RW 03 Perumahan Griya Asri';
  const logoUrl = APP_STATE.settings?.logoUrl || 'https://placehold.co/128x128/0D47A1/FFFFFF?text=RT05';

  app.innerHTML = `
    <div class="min-h-screen flex flex-col bg-[#F4F7FE]">
      
      <div class="flex flex-1">
        <!-- FIXED LEFT SIDEBAR (DESKTOP >= 1024px) -->
        <aside class="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-slate-200/80 z-30 justify-between">
          <div class="flex flex-col flex-1 min-h-0">
            <!-- Brand Logo Header -->
            <div class="px-6 py-5 border-b border-slate-100 flex items-center gap-3 shrink-0">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0A3D91] to-[#1976D2] text-white flex items-center justify-center shadow-md shadow-blue-900/15 shrink-0 overflow-hidden">
                <img src="${logoUrl}" alt="Logo RT" class="w-full h-full object-cover" onerror="this.src='https://placehold.co/128x128/0D47A1/FFFFFF?text=RT'" />
              </div>
              <div class="min-w-0">
                <div class="font-extrabold text-base text-[#0A3D91] tracking-tight truncate">SIPKURBAN RT</div>
                <div class="text-[11px] font-medium text-slate-400 truncate">${rtName}</div>
              </div>
            </div>

            <!-- Daftar Menu Navigasi -->
            <nav class="sidebar-nav flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-1.5">
              ${MENU_ITEMS.map(item => {
                const active = APP_STATE.activeMenu === item.id;
                return `
                  <button onclick="navigateMenu('${item.id}')"
                    class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      active
                        ? 'bg-[#0D47A1] text-white shadow-md shadow-blue-900/20'
                        : 'text-slate-600 hover:bg-blue-50/70 hover:text-[#0D47A1]'
                    }">
                    <i data-lucide="${item.icon}" class="w-4 h-4 shrink-0"></i>
                    <span class="truncate">${item.label}</span>
                  </button>
                `;
              }).join('')}

              <div class="pt-3 mt-3 border-t border-slate-100">
                <button onclick="handleLogout()"
                  class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all cursor-pointer">
                  <i data-lucide="log-out" class="w-4 h-4 shrink-0"></i>
                  <span>Keluar Aplikasi</span>
                </button>
              </div>
            </nav>
          </div>

          <!-- Kartu Kutipan Ibadah di Bawah Sidebar (disembunyikan di layar pendek) -->
          <div class="sidebar-quote p-4 shrink-0">
            <div class="bg-gradient-to-br from-blue-50 to-indigo-50/80 border border-blue-100 rounded-2xl p-4 text-center">
              <div class="w-10 h-10 mx-auto rounded-xl bg-[#0D47A1] text-white flex items-center justify-center mb-2.5 shadow-sm">
                <i data-lucide="heart-handshake" class="w-5 h-5"></i>
              </div>
              <p class="text-xs font-extrabold text-[#0A3D91]">Niatkan, Tabungkan, Tunaikan.</p>
              <p class="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Kebersamaan warga dalam beribadah kurban mempererat silaturahmi RT.
              </p>
            </div>
          </div>
        </aside>

        <!-- KONTEN KANAN (TOPBAR + HALAMAN DINAMIS + FOOTER) -->
        <div class="flex-1 lg:pl-64 flex flex-col min-w-0 pb-24 lg:pb-0">
          
          <!-- TOP HEADER BAR -->
          <header class="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200/70 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 no-print">
            <div class="flex items-center gap-3 min-w-0">
              <div class="lg:hidden w-9 h-9 rounded-xl bg-[#0D47A1] text-white flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                <img src="${logoUrl}" alt="Logo RT" class="w-full h-full object-cover" onerror="this.src='https://placehold.co/128x128/0D47A1/FFFFFF?text=RT'" />
              </div>
              <div class="min-w-0">
                <h1 class="text-base sm:text-xl font-extrabold text-[#0A3D91] truncate">Portal Iuran Kurban RT</h1>
                <p class="text-[11px] text-slate-400 hidden sm:block truncate">
                  Tahun ${APP_STATE.settings?.tahunHijriah || '1448 H / 2027 M'} • ${rtName}
                </p>
              </div>
            </div>

            <!-- Search Bar -->
            <div class="hidden md:flex items-center flex-1 max-w-md mx-4">
              <div class="relative w-full">
                <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
                <input type="text" value="${APP_STATE.searchQuery}" oninput="handleGlobalSearch(this.value)"
                  placeholder="Cari nama warga, blok rumah, atau no kuitansi..."
                  class="w-full pl-10 pr-4 py-2 rounded-xl bg-[#F4F7FE] border border-slate-200/80 focus:bg-white focus:border-[#0D47A1] text-xs outline-none transition-all" />
              </div>
            </div>

            <!-- Kanan: Notifikasi & Profil -->
            <div class="flex items-center gap-2.5 sm:gap-3 shrink-0">
              <button onclick="navigateMenu('pengumuman')" title="Pengumuman Panitia"
                class="relative w-9 h-9 rounded-xl bg-[#F4F7FE] hover:bg-blue-50 text-slate-600 hover:text-[#0D47A1] flex items-center justify-center transition-all cursor-pointer">
                <i data-lucide="bell" class="w-4 h-4"></i>
                <span class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  ${APP_STATE.pengumuman.length}
                </span>
              </button>

              <div onclick="navigateMenu('profil')" class="flex items-center gap-2.5 pl-2 border-l border-slate-200 cursor-pointer">
                <div class="w-9 h-9 rounded-full bg-gradient-to-br from-[#0D47A1] to-blue-500 text-white font-extrabold text-xs flex items-center justify-center shadow-sm">
                  ${user.name.charAt(0).toUpperCase()}
                </div>
                <div class="hidden sm:block text-left">
                  <div class="text-xs font-bold text-slate-800 leading-tight max-w-[130px] truncate">Halo, ${user.name.split(' ')[0]}</div>
                  <div class="text-[10px] font-semibold ${isAdmin ? 'text-emerald-600' : 'text-blue-600'}">
                    ${isAdmin ? 'Admin Panitia' : 'Peserta Warga'}
                  </div>
                </div>
              </div>
            </div>
          </header>

          <!-- AREA KONTEN UTAMA -->
          <main id="page-content" class="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto"></main>

          <!-- FOOTER BIRU SOLID (SEPERTI REFERENSI) -->
          <footer class="bg-[#0A3D91] text-white text-xs py-3.5 px-4 sm:px-8 mt-auto no-print">
            <div class="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
              <div class="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-blue-100">
                <span class="inline-flex items-center gap-1.5">
                  <i data-lucide="map-pin" class="w-3.5 h-3.5"></i>
                  ${APP_STATE.settings?.alamatSekretariat || 'Masjid Al-Ikhlas RT 05'}
                </span>
                <span class="inline-flex items-center gap-1.5">
                  <i data-lucide="phone" class="w-3.5 h-3.5"></i>
                  ${APP_STATE.settings?.kontakPanitia || '0812-8890-4521'}
                </span>
              </div>
              <div class="text-blue-200 font-medium">
                © 2026–2027 Panitia Kurban ${rtName}
              </div>
            </div>
          </footer>

        </div>
      </div>

      <!-- FLOATING BOTTOM NAVIGATION BAR (MOBILE) -->
      <nav class="lg:hidden fixed bottom-3 inset-x-2 z-40 bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-[0_8px_30px_rgba(15,23,42,0.12)] rounded-2xl px-1.5 py-1.5 flex items-center justify-around no-print">
        ${MENU_ITEMS.slice(0, 6).map(item => {
          const active = APP_STATE.activeMenu === item.id;
          return `
            <button onclick="navigateMenu('${item.id}')"
              class="flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all cursor-pointer min-w-0 ${
                active ? 'bg-[#0D47A1] text-white shadow-sm' : 'text-slate-500 hover:text-[#0D47A1]'
              }">
              <i data-lucide="${item.icon}" class="w-4 h-4 shrink-0"></i>
              <span class="text-[9.5px] font-bold mt-0.5 truncate max-w-[52px]">${item.shortLabel}</span>
            </button>
          `;
        }).join('')}
      </nav>

    </div>
  `;

  renderActivePageContent();
}

function renderActivePageContent() {
  const container = document.getElementById('page-content');
  if (!container) return;

  switch (APP_STATE.activeMenu) {
    case 'dashboard':
      renderDashboardView(container);
      break;
    case 'peserta':
      renderPesertaView(container);
      break;
    case 'iuran':
      renderIuranView(container);
      break;
    case 'laporan':
      renderLaporanView(container);
      break;
    case 'jadwal':
      renderJadwalView(container);
      break;
    case 'pengumuman':
      renderPengumumanView(container);
      break;
    case 'profil':
      renderProfilView(container);
      break;
    default:
      renderDashboardView(container);
  }

  if (window.lucide) window.lucide.createIcons();
}

