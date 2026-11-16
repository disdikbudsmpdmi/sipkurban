// =========================================================================
// 8. HALAMAN 1: DASHBOARD UTAMA (SESUAI BLUEPRINT REFERENSI UI)
// =========================================================================
function renderDashboardView(container) {
  refreshJadwalStatus();
  const user = APP_STATE.currentUser;
  const isAdmin = user.role === 'admin';

  const totalWarga = APP_STATE.warga.length;
  const totalTargetDana = APP_STATE.warga.reduce((acc, w) => acc + Number(w.targetIuran || 0), 0);
  const totalTerkumpul = APP_STATE.warga.reduce((acc, w) => acc + Number(w.totalTerbayar || 0), 0);
  const persentaseTerkumpul = totalTargetDana > 0 ? Math.min(100, Math.round((totalTerkumpul / totalTargetDana) * 100)) : 0;
  const jumlahLunas = APP_STATE.warga.filter(w => w.statusLunas || w.totalTerbayar >= w.targetIuran).length;
  const jumlahSapi = APP_STATE.warga.filter(w => w.jenisKurban === 'Sapi Patungan').length;
  const jumlahKambing = APP_STATE.warga.filter(w => w.jenisKurban === 'Kambing').length;

  const targetDate = new Date(APP_STATE.settings?.tanggalIdulAdha || '2027-05-17T07:00:00');
  const now = new Date();
  const diffDays = Math.max(0, Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24)));

  const selfWarga = !isAdmin && user.wargaData ? user.wargaData : APP_STATE.warga[0];
  const selfPercent = selfWarga && selfWarga.targetIuran > 0
    ? Math.min(100, Math.round((selfWarga.totalTerbayar / selfWarga.targetIuran) * 100))
    : 0;

  container.innerHTML = `
    <!-- ASYMMETRIC 2-COLUMN GRID (75% KIRI, 25% KANAN DI DESKTOP) -->
    <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">
      
      <!-- KOLOM UTAMA KIRI (8/12) -->
      <div class="xl:col-span-8 space-y-6">
        
        <!-- 1. HERO BANNER BIRU GRADASI DENGAN FLOATING GLASS WIDGET -->
        <div class="relative rounded-2xl bg-gradient-to-r from-[#0A3D91] via-[#0D47A1] to-[#1976D2] p-6 sm:p-8 text-white overflow-hidden shadow-lg shadow-blue-900/15">
          <div class="absolute right-0 top-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/4 blur-2xl pointer-events-none"></div>
          
          <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div class="space-y-2.5 max-w-lg">
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-[11px] font-bold backdrop-blur-sm">
                <i data-lucide="sparkles" class="w-3.5 h-3.5 text-amber-300"></i>
                Idul Adha ${APP_STATE.settings?.tahunHijriah || '1448 H'}
              </span>
              <h2 class="text-xl sm:text-2xl font-extrabold tracking-tight">
                Assalamualaikum, ${user.name}! 👋
              </h2>
              <p class="text-xs sm:text-sm text-blue-100 leading-relaxed">
                ${isAdmin
                  ? 'Pantau progres pengumpulan iuran kurban warga, kelola kelompok sapi patungan, dan cetak kuitansi resmi panitia RT.'
                  : 'Terima kasih telah berpartisipasi dalam ibadah kurban lingkungan RT. Pantau progres setoran dan kelompok hewan Anda di sini.'}
              </p>
              <div class="pt-2 flex flex-wrap gap-3">
                <button onclick="${isAdmin ? 'openModalTambahSetoran()' : "navigateMenu('iuran')"}"
                  class="bg-white text-[#0D47A1] hover:bg-blue-50 font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-sm inline-flex items-center gap-2 transition-all cursor-pointer">
                  <i data-lucide="${isAdmin ? 'plus-circle' : 'receipt'}" class="w-4 h-4"></i>
                  <span>${isAdmin ? 'Catat Setoran Warga' : 'Lihat Riwayat & Kuitansi'}</span>
                </button>
                <button onclick="navigateMenu('laporan')"
                  class="bg-white/15 hover:bg-white/25 text-white border border-white/25 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl inline-flex items-center gap-2 transition-all cursor-pointer">
                  <i data-lucide="printer" class="w-4 h-4"></i>
                  <span>Cetak Laporan</span>
                </button>
              </div>
            </div>

            <!-- Floating Glass Widgets -->
            <div class="flex flex-row lg:flex-col gap-3 shrink-0">
              <div class="flex-1 bg-white/95 backdrop-blur-md text-slate-800 rounded-2xl p-3.5 shadow-md min-w-[145px]">
                <div class="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                  <i data-lucide="clock" class="w-3.5 h-3.5 text-[#0D47A1]"></i>
                  <span>Menuju Idul Adha</span>
                </div>
                <div class="text-lg sm:text-xl font-extrabold text-[#0A3D91] mt-1">${diffDays} Hari Lagi</div>
                <div class="text-[10px] font-semibold text-emerald-600 mt-0.5">Persiapan Hewan RT</div>
              </div>

              <div class="flex-1 bg-white/95 backdrop-blur-md text-slate-800 rounded-2xl p-3.5 shadow-md min-w-[145px]">
                <div class="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                  <i data-lucide="trending-up" class="w-3.5 h-3.5 text-emerald-600"></i>
                  <span>Dana Terkumpul</span>
                </div>
                <div class="text-lg sm:text-xl font-extrabold text-emerald-600 mt-1">${persentaseTerkumpul}%</div>
                <div class="text-[10px] font-semibold text-slate-500 mt-0.5">Dari Target Kas RT</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. EMPAT KARTU QUICK ACTION BERLATAR PASTEL -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Card 1: Biru -->
          <div class="bg-[#EEF4FF] border border-blue-100 rounded-2xl p-4 flex flex-col justify-between hover:-translate-y-0.5 transition-all">
            <div>
              <div class="w-11 h-11 rounded-xl bg-[#1E88E5] text-white flex items-center justify-center shadow-sm mb-3">
                <i data-lucide="wallet" class="w-5 h-5"></i>
              </div>
              <h3 class="font-extrabold text-sm text-slate-800">${isAdmin ? 'Catat Setoran' : 'Setoran Saya'}</h3>
              <p class="text-[11px] text-slate-500 mt-0.5">${isAdmin ? 'Input cicilan/pelunasan warga' : 'Cek mutasi pembayaran'}</p>
            </div>
            <button onclick="${isAdmin ? 'openModalTambahSetoran()' : "navigateMenu('iuran')"}"
              class="mt-4 w-full py-2 px-3 rounded-xl bg-[#1E88E5] hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer">
              <span>${isAdmin ? 'Input Baru' : 'Buka Riwayat'}</span>
              <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
            </button>
          </div>

          <!-- Card 2: Hijau -->
          <div class="bg-[#ECFDF5] border border-emerald-100 rounded-2xl p-4 flex flex-col justify-between hover:-translate-y-0.5 transition-all">
            <div>
              <div class="w-11 h-11 rounded-xl bg-[#10B981] text-white flex items-center justify-center shadow-sm mb-3">
                <i data-lucide="users" class="w-5 h-5"></i>
              </div>
              <h3 class="font-extrabold text-sm text-slate-800">Kelompok Kurban</h3>
              <p class="text-[11px] text-slate-500 mt-0.5">${APP_STATE.kelompok.length} kelompok hewan aktif</p>
            </div>
            <button onclick="navigateMenu('peserta')"
              class="mt-4 w-full py-2 px-3 rounded-xl bg-[#10B981] hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer">
              <span>Lihat Kelompok</span>
              <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
            </button>
          </div>

          <!-- Card 3: Ungu -->
          <div class="bg-[#F3E8FF] border border-purple-100 rounded-2xl p-4 flex flex-col justify-between hover:-translate-y-0.5 transition-all">
            <div>
              <div class="w-11 h-11 rounded-xl bg-[#7C3AED] text-white flex items-center justify-center shadow-sm mb-3">
                <i data-lucide="receipt" class="w-5 h-5"></i>
              </div>
              <h3 class="font-extrabold text-sm text-slate-800">Kuitansi Digital</h3>
              <p class="text-[11px] text-slate-500 mt-0.5">Cetak bukti setoran resmi</p>
            </div>
            <button onclick="navigateMenu('iuran')"
              class="mt-4 w-full py-2 px-3 rounded-xl bg-[#7C3AED] hover:bg-violet-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer">
              <span>Cetak Kuitansi</span>
              <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
            </button>
          </div>

          <!-- Card 4: Oranye -->
          <div class="bg-[#FFF7ED] border border-amber-100 rounded-2xl p-4 flex flex-col justify-between hover:-translate-y-0.5 transition-all">
            <div>
              <div class="w-11 h-11 rounded-xl bg-[#F59E0B] text-white flex items-center justify-center shadow-sm mb-3">
                <i data-lucide="calendar-days" class="w-5 h-5"></i>
              </div>
              <h3 class="font-extrabold text-sm text-slate-800">Jadwal Kurban</h3>
              <p class="text-[11px] text-slate-500 mt-0.5">Penyembelihan & kupon daging</p>
            </div>
            <button onclick="navigateMenu('jadwal')"
              class="mt-4 w-full py-2 px-3 rounded-xl bg-[#F59E0B] hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer">
              <span>Cek Agenda</span>
              <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>

        <!-- 3. RINGKASAN STATISTIK KAS RT (4 KARTU KPI PUTIH) -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm sm:text-base font-extrabold text-slate-800">Ringkasan Kas & Peserta Kurban RT</h3>
            <span class="text-xs font-semibold text-slate-400">Update Real-Time</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- KPI 1 -->
            <div class="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-xl bg-blue-50 text-[#0D47A1] flex items-center justify-center shrink-0">
                  <i data-lucide="banknote" class="w-5 h-5"></i>
                </div>
                <div class="min-w-0">
                  <div class="text-base sm:text-lg font-extrabold text-slate-800 truncate">${formatRupiah(totalTerkumpul)}</div>
                  <div class="text-[11px] font-medium text-slate-400">Dana Terkumpul</div>
                </div>
              </div>
              <div class="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span class="text-emerald-600 font-bold">↑ ${persentaseTerkumpul}% tercapai</span>
                <span class="text-slate-400">Target ${formatRupiah(totalTargetDana)}</span>
              </div>
            </div>

            <!-- KPI 2 -->
            <div class="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <i data-lucide="user-check" class="w-5 h-5"></i>
                </div>
                <div>
                  <div class="text-xl font-extrabold text-slate-800">${totalWarga} Warga</div>
                  <div class="text-[11px] font-medium text-slate-400">Total Shohibul Kurban</div>
                </div>
              </div>
              <div class="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span class="text-emerald-600 font-bold">${jumlahSapi} Sapi • ${jumlahKambing} Kambing</span>
                <span class="text-slate-400">Aktif</span>
              </div>
            </div>

            <!-- KPI 3 -->
            <div class="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                  <i data-lucide="badge-check" class="w-5 h-5"></i>
                </div>
                <div>
                  <div class="text-xl font-extrabold text-slate-800">${jumlahLunas}/${totalWarga}</div>
                  <div class="text-[11px] font-medium text-slate-400">Peserta Sudah Lunas</div>
                </div>
              </div>
              <div class="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span class="text-violet-600 font-bold">${totalWarga - jumlahLunas} masih cicilan</span>
                <span class="text-slate-400">Status</span>
              </div>
            </div>

            <!-- KPI 4 -->
            <div class="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                  <i data-lucide="layers" class="w-5 h-5"></i>
                </div>
                <div>
                  <div class="text-xl font-extrabold text-slate-800">${APP_STATE.kelompok.length} Kelompok</div>
                  <div class="text-[11px] font-medium text-slate-400">Alokasi Hewan Kurban</div>
                </div>
              </div>
              <div class="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span class="text-amber-600 font-bold">Siap Koordinasi</span>
                <span class="text-slate-400">Panitia RT</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. DATA VISUALIZATION (GRAFIK TREN SETORAN & DONUT KOMPOSISI HEWAN) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div class="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200/70 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h4 class="font-extrabold text-sm text-slate-800">Tren Setoran Iuran Bulanan</h4>
                <p class="text-[11px] text-slate-400">Akumulasi pemasukan tabungan kurban warga (Juta Rp)</p>
              </div>
              <span class="px-2.5 py-1 rounded-lg bg-blue-50 text-[#0D47A1] text-[11px] font-bold">${(APP_STATE.tren.slice(-1)[0]?.bulan || '').slice(0, 4) || new Date().getFullYear()}</span>
            </div>
            <div class="h-56 w-full">
              <canvas id="chart-tren-setoran"></canvas>
            </div>
          </div>

          <div class="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200/70 shadow-[0_2px_12px_rgba(15,23,42,0.03)] flex flex-col justify-between">
            <div>
              <h4 class="font-extrabold text-sm text-slate-800">Komposisi Paket Kurban</h4>
              <p class="text-[11px] text-slate-400">Perbandingan Sapi Patungan vs Kambing</p>
            </div>
            <div class="h-44 w-full my-2 flex items-center justify-center">
              <canvas id="chart-komposisi-hewan"></canvas>
            </div>
            <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-[#0D47A1]"></span>
                <span class="text-slate-600 font-medium">Sapi Patungan:</span>
                <span class="font-extrabold text-slate-800">${jumlahSapi}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
                <span class="text-slate-600 font-medium">Kambing:</span>
                <span class="font-extrabold text-slate-800">${jumlahKambing}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- KOLOM KANAN SIDE PANEL (4/12): PROFIL & PROGRESS, JADWAL, PENGUMUMAN -->
      <div class="xl:col-span-4 space-y-6">
        
        <!-- 1. KARTU PROFIL & PROGRESS PELUNASAN -->
        <div class="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-extrabold text-sm text-slate-800">
              ${isAdmin ? 'Status Kas Keseluruhan RT' : 'Profil & Progres Iuran Anda'}
            </h3>
            <button onclick="navigateMenu('profil')" class="text-slate-400 hover:text-[#0D47A1] cursor-pointer">
              <i data-lucide="more-vertical" class="w-4 h-4"></i>
            </button>
          </div>

          <div class="flex items-center gap-3.5 pb-4 border-b border-slate-100">
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0A3D91] to-[#1976D2] text-white font-extrabold text-xl flex items-center justify-center shadow-md shrink-0">
              ${user.name.charAt(0).toUpperCase()}
            </div>
            <div class="min-w-0">
              <div class="font-extrabold text-sm text-slate-800 truncate">${user.name}</div>
              <div class="text-xs text-slate-500 truncate mt-0.5">
                ${isAdmin ? 'Ketua / Bendahara Kurban RT 05' : `${selfWarga?.idWarga} • ${selfWarga?.blokRumah}`}
              </div>
              <span class="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0D47A1]">
                ${isAdmin ? 'Akses Penuh Panitia' : (selfWarga?.kelompokHewan || 'Peserta Kurban')}
              </span>
            </div>
          </div>

          <!-- Progress Bar Pelunasan -->
          <div class="mt-4">
            <div class="flex items-center justify-between text-xs mb-1.5">
              <span class="font-semibold text-slate-600">
                ${isAdmin ? 'Pelunasan Target RT' : 'Progres Pelunasan Anda'}
              </span>
              <span class="font-extrabold text-[#0D47A1]">
                ${isAdmin ? persentaseTerkumpul : selfPercent}%
              </span>
            </div>
            <div class="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div class="h-full bg-gradient-to-r from-[#0D47A1] to-[#1976D2] rounded-full transition-all duration-500"
                style="width: ${isAdmin ? persentaseTerkumpul : selfPercent}%"></div>
            </div>
            <div class="flex items-center justify-between text-[11px] text-slate-500 mt-2">
              <span>Terbayar: <strong class="text-slate-800">${formatRupiah(isAdmin ? totalTerkumpul : selfWarga?.totalTerbayar)}</strong></span>
              <span>Target: <strong class="text-slate-800">${formatRupiah(isAdmin ? totalTargetDana : selfWarga?.targetIuran)}</strong></span>
            </div>
          </div>
        </div>

        <!-- 2. KARTU JADWAL KEGIATAN KURBAN -->
        <div class="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-extrabold text-sm text-slate-800">Agenda Kurban RT</h3>
            <button onclick="navigateMenu('jadwal')" class="text-xs font-bold text-[#0D47A1] hover:underline cursor-pointer">
              Lihat Semua
            </button>
          </div>

          <div class="space-y-3">
            ${APP_STATE.jadwal.slice(0, 3).map(j => {
              const parts = (j.tanggal || '17 Mei').split(' ');
              const badgeStyle = j.status === 'Selesai'
                ? 'bg-emerald-50 text-emerald-700'
                : (j.status === 'Berlangsung' ? 'bg-blue-50 text-[#0D47A1]' : 'bg-amber-50 text-amber-700');
              return `
                <div class="flex items-center gap-3 p-2.5 rounded-xl bg-[#F4F7FE]/80 border border-slate-100">
                  <div class="w-12 h-12 rounded-xl bg-white border border-slate-200/80 flex flex-col items-center justify-center shrink-0 shadow-2xs">
                    <span class="text-sm font-extrabold text-[#0D47A1] leading-none">${parts[0] || '17'}</span>
                    <span class="text-[10px] font-bold text-slate-400 uppercase mt-0.5">${parts[1] || 'MEI'}</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-xs font-bold text-slate-800 truncate">${j.judulKegiatan}</div>
                    <div class="text-[11px] text-slate-400 truncate mt-0.5">${j.waktu} • ${j.lokasi}</div>
                  </div>
                  <span class="px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 ${badgeStyle}">
                    ${j.status}
                  </span>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- 3. KARTU PENGUMUMAN PANITIA RT -->
        <div class="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
          <div class="flex items-center justify-between mb-3.5">
            <h3 class="font-extrabold text-sm text-slate-800">Pengumuman Panitia</h3>
            <button onclick="navigateMenu('pengumuman')" class="text-xs font-bold text-[#0D47A1] hover:underline cursor-pointer">
              Semua Info
            </button>
          </div>

          <div class="space-y-3">
            ${APP_STATE.pengumuman.slice(0, 2).map(ann => `
              <div class="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100/80">
                <div class="flex items-start gap-2.5">
                  <div class="w-8 h-8 rounded-lg bg-[#0D47A1] text-white flex items-center justify-center shrink-0 mt-0.5">
                    <i data-lucide="megaphone" class="w-4 h-4"></i>
                  </div>
                  <div class="min-w-0">
                    <h4 class="text-xs font-extrabold text-slate-800 leading-snug">${ann.judul}</h4>
                    <p class="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">${ann.isiPesan}</p>
                    <div class="text-[10px] font-semibold text-slate-400 mt-2">${ann.tanggalPost} • ${ann.penulis}</div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

      </div>
    </div>
  `;

  setTimeout(() => initDashboardCharts(jumlahSapi, jumlahKambing), 50);
}

function initDashboardCharts(jumlahSapi, jumlahKambing) {
  if (!window.Chart) return;

  const ctxTrend = document.getElementById('chart-tren-setoran');
  if (ctxTrend) {
    if (APP_STATE.charts.trendChart) APP_STATE.charts.trendChart.destroy();
    const BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const trenData = APP_STATE.tren.slice(-6);   // akumulasi per bulan dihitung server dari transaksi nyata
    APP_STATE.charts.trendChart = new Chart(ctxTrend, {
      type: 'line',
      data: {
        labels: trenData.map(t => BLN[Number(t.bulan.slice(5, 7)) - 1] || t.bulan),
        datasets: [{
          label: 'Total Dana Masuk (Juta Rp)',
          data: trenData.map(t => Math.round(t.kumulatif / 10000) / 100),
          borderColor: '#0D47A1',
          backgroundColor: 'rgba(13, 71, 161, 0.12)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#FFFFFF',
          pointBorderColor: '#0D47A1',
          pointBorderWidth: 2.5,
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: '#F1F5F9' },
            ticks: { font: { size: 11, family: 'Plus Jakarta Sans' }, color: '#64748B' }
          },
          x: {
            grid: { display: false },
            ticks: { font: { size: 11, family: 'Plus Jakarta Sans' }, color: '#64748B' }
          }
        }
      }
    });
  }

  const ctxDonut = document.getElementById('chart-komposisi-hewan');
  if (ctxDonut) {
    if (APP_STATE.charts.donutChart) APP_STATE.charts.donutChart.destroy();
    APP_STATE.charts.donutChart = new Chart(ctxDonut, {
      type: 'doughnut',
      data: {
        labels: ['Sapi Patungan', 'Kambing Mandiri'],
        datasets: [{
          data: [jumlahSapi || 1, jumlahKambing || 1],
          backgroundColor: ['#0D47A1', '#10B981'],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: { display: false }
        }
      }
    });
  }
}

