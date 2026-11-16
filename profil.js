// =========================================================================
// 13. HALAMAN 6: PROFIL & PENGATURAN SISTEM RT
// =========================================================================
function renderProfilView(container) {
  const user = APP_STATE.currentUser;
  const isAdmin = user.role === 'admin';
  const s = APP_STATE.settings || {};

  container.innerHTML = `
    <div class="max-w-3xl mx-auto space-y-6">
      <div class="bg-white rounded-2xl p-6 border border-slate-200/70 shadow-2xs">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0A3D91] to-[#1976D2] text-white font-extrabold text-2xl flex items-center justify-center shadow-md">
              ${user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 class="text-lg font-extrabold text-slate-800">${user.name}</h2>
              <p class="text-xs text-slate-500">${user.email}</p>
              <span class="inline-block mt-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold ${isAdmin ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-[#0D47A1]'}">
                ${isAdmin ? 'Administrator Panitia RT' : 'Peserta Kurban Terdaftar'}
              </span>
            </div>
          </div>

          <button onclick="handleLogout()"
            class="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white font-bold text-xs inline-flex items-center gap-2 transition-all cursor-pointer">
            <i data-lucide="log-out" class="w-4 h-4"></i>
            <span>Keluar Akun</span>
          </button>
        </div>

        ${isAdmin ? `
          <form id="form-update-settings" class="mt-6 space-y-4 text-xs">
            <h3 class="font-extrabold text-sm text-slate-800">Pengaturan Identitas, Tarif & Logo Kurban RT</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Nama Lingkungan RT / RW</label>
                <input type="text" id="set-rt" value="${s.namaRT || ''}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0D47A1]" />
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Tahun Pelaksanaan</label>
                <input type="text" id="set-tahun" value="${s.tahunHijriah || ''}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0D47A1]" />
              </div>
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Tanggal Idul Adha (untuk hitung mundur dashboard)</label>
              <input type="date" id="set-tanggal" value="${(s.tanggalIdulAdha || '').slice(0, 10)}" class="w-full sm:w-1/2 px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0D47A1]" />
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Tarif Patungan Sapi 1/7 (Rp)</label>
                <input type="number" id="set-sapi" value="${s.hargaSapiPatungan || 3500000}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0D47A1]" />
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Tarif Kambing Mandiri (Rp)</label>
                <input type="number" id="set-kambing" value="${s.hargaKambingMandiri || 3200000}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0D47A1]" />
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Kontak WhatsApp Panitia</label>
                <input type="text" id="set-kontak" value="${s.kontakPanitia || ''}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0D47A1]" />
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Lokasi Sekretariat / Masjid</label>
                <input type="text" id="set-alamat" value="${s.alamatSekretariat || ''}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0D47A1]" />
              </div>
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">URL Logo Aplikasi & KOP Surat Resmi</label>
              <div class="flex gap-2">
                <input type="url" id="set-logo" value="${s.logoUrl || ''}" placeholder="https://example.com/logo-rt.png" class="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0D47A1]" />
                <div class="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                  <img src="${s.logoUrl || 'https://placehold.co/128x128/0D47A1/FFFFFF?text=RT'}" class="w-full h-full object-cover" onerror="this.src='https://placehold.co/128x128/0D47A1/FFFFFF?text=RT'" />
                </div>
              </div>
              <p class="text-[11px] text-slate-400 mt-1">Masukkan URL gambar logo publik (PNG/JPG/SVG). Logo akan otomatis tampil di sidebar, header, kuitansi, dan KOP cetak laporan A4.</p>
            </div>
            <div class="pt-2 flex justify-end">
              <button type="submit" class="px-5 py-2.5 rounded-xl bg-[#0D47A1] hover:bg-blue-800 text-white font-bold cursor-pointer">
                Simpan Perubahan Pengaturan
              </button>
            </div>
          </form>

          <form id="form-admin-account" class="mt-8 pt-6 border-t border-slate-100 space-y-4 text-xs" autocomplete="off">
            <h3 class="font-extrabold text-sm text-slate-800">Akun Admin (Username & Kata Sandi)</h3>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Username Admin</label>
              <input type="text" id="acc-username" value="${user.email || ''}" required autocapitalize="none" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0D47A1]" />
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Kata Sandi Baru <span class="font-normal text-slate-400">(kosongkan jika tidak diganti)</span></label>
                <input type="password" id="acc-new" autocomplete="new-password" placeholder="Minimal 6 karakter" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0D47A1]" />
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Ulangi Kata Sandi Baru</label>
                <input type="password" id="acc-confirm" autocomplete="new-password" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0D47A1]" />
              </div>
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Kata Sandi Saat Ini <span class="text-rose-500">*</span></label>
              <input type="password" id="acc-current" required autocomplete="current-password" placeholder="Wajib untuk konfirmasi perubahan" class="w-full sm:w-1/2 px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0D47A1]" />
            </div>
            <div class="pt-2 flex justify-end">
              <button type="submit" class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer">
                Simpan Akun Admin
              </button>
            </div>
          </form>
        ` : `
          <div class="mt-6 space-y-3 text-xs">
            <h3 class="font-extrabold text-sm text-slate-800">Informasi Kepesertaan Anda</h3>
            <div class="p-4 rounded-2xl bg-[#F4F7FE] space-y-2">
              <div class="flex justify-between"><span class="text-slate-500">ID Peserta:</span><span class="font-bold">${user.wargaData?.idWarga}</span></div>
              <div class="flex justify-between"><span class="text-slate-500">Blok Rumah:</span><span class="font-bold">${user.wargaData?.blokRumah}</span></div>
              <div class="flex justify-between"><span class="text-slate-500">Paket Kurban:</span><span class="font-bold text-[#0D47A1]">${user.wargaData?.jenisKurban}</span></div>
              <div class="flex justify-between"><span class="text-slate-500">Kelompok Hewan:</span><span class="font-bold">${user.wargaData?.kelompokHewan}</span></div>
            </div>
          </div>
        `}
      </div>
    </div>
  `;

  const formAcc = document.getElementById('form-admin-account');
  if (formAcc) {
    formAcc.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = e.submitter || e.target.querySelector('[type=submit]');
      const newPass = document.getElementById('acc-new').value;
      if (newPass !== document.getElementById('acc-confirm').value) {
        showToast('Konfirmasi kata sandi baru tidak sama.', 'error');
        return;
      }
      await runBusy(btn, async () => {
        const res = await apiCall('admin_account_update', {
          username: document.getElementById('acc-username').value.trim(),
          newPassword: newPass,
          currentPassword: document.getElementById('acc-current').value
        });
        setToken(res.token);          // token lama memuat username lama
        applySnapshot(res.snapshot);
        showToast('Akun admin berhasil diperbarui!', 'success');
        renderMainApp();
      });
    });
  }

  const formSet = document.getElementById('form-update-settings');
  if (formSet) {
    formSet.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = e.submitter || e.target.querySelector('[type=submit]');
      await runBusy(btn, async () => {
        await apiCall('settings_update', {
          namaRT: document.getElementById('set-rt').value.trim(),
          tahunHijriah: document.getElementById('set-tahun').value.trim(),
          tanggalIdulAdha: document.getElementById('set-tanggal').value,
          hargaSapiPatungan: Number(document.getElementById('set-sapi').value),
          hargaKambingMandiri: Number(document.getElementById('set-kambing').value),
          kontakPanitia: document.getElementById('set-kontak').value.trim(),
          alamatSekretariat: document.getElementById('set-alamat').value.trim(),
          logoUrl: document.getElementById('set-logo').value.trim()
        });
        showToast('Pengaturan lingkungan RT & Logo berhasil disimpan!', 'success');
        renderMainApp();
      });
    });
  }
}
