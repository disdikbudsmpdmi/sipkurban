// =========================================================================
// 11. HALAMAN 4: JADWAL & DISTRIBUSI KURBAN
// =========================================================================
function renderJadwalView(container) {
  const isAdmin = APP_STATE.currentUser.role === 'admin';
  refreshJadwalStatus();

  container.innerHTML = `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/70 shadow-2xs">
        <div>
          <h2 class="text-lg font-extrabold text-slate-800">Jadwal Kegiatan & Distribusi Daging Kurban</h2>
          <p class="text-xs text-slate-500 mt-0.5">Rangkaian agenda panitia dari persiapan, penyembelihan, hingga pembagian kupon warga.</p>
        </div>
        ${isAdmin ? `
          <button onclick="openModalTambahJadwal()"
            class="px-4 py-2.5 rounded-xl bg-[#0D47A1] hover:bg-blue-800 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer">
            <i data-lucide="calendar-plus" class="w-4 h-4"></i>
            <span>Tambah Agenda</span>
          </button>
        ` : ''}
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${APP_STATE.jadwal.map(j => {
          const badgeColor = j.status === 'Selesai'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : (j.status === 'Berlangsung' ? 'bg-blue-50 text-[#0D47A1] border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200');
          return `
            <div class="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-2xs flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between gap-2 mb-3">
                  <span class="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#0D47A1]">
                    <i data-lucide="calendar" class="w-4 h-4"></i>
                    ${fmtTgl(j.tanggal)} • ${fmtWaktu(j.waktu)}
                  </span>
                  <span class="px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${badgeColor}">${j.status}</span>
                </div>
                <h3 class="font-extrabold text-sm text-slate-800">${j.judulKegiatan}</h3>
                <p class="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5">
                  <i data-lucide="map-pin" class="w-3.5 h-3.5 text-slate-400"></i>
                  ${j.lokasi}
                </p>
              </div>
              ${isAdmin ? `
                <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button onclick="openModalEditJadwal('${j._docId}')" title="Edit Agenda"
                    class="p-1.5 rounded-lg bg-blue-50 hover:bg-[#0D47A1] text-[#0D47A1] hover:text-white transition-all cursor-pointer">
                    <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
                  </button>
                  <button onclick="hapusJadwal('${j._docId}')" title="Hapus Agenda"
                    class="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white transition-all cursor-pointer">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                  </button>
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

window.openModalTambahJadwal = function () {
  openModal(`
    <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
      <div class="flex items-center justify-between pb-4 border-b border-slate-100">
        <h3 class="font-extrabold text-base text-slate-800">Tambah Agenda Kegiatan Kurban</h3>
        <button onclick="closeModal()" class="text-slate-400 hover:text-slate-700 cursor-pointer"><i data-lucide="x" class="w-5 h-5"></i></button>
      </div>
      <form id="form-tambah-jadwal" class="space-y-4 mt-4 text-xs">
        <div>
          <label class="block font-bold text-slate-700 mb-1">Judul Kegiatan</label>
          <input type="text" id="jdw-judul" required placeholder="Contoh: Pembagian Kupon Daging Warga" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0D47A1]" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Tanggal</label>
            <input type="date" id="jdw-tgl" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0D47A1]" />
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Waktu</label>
            <input type="time" id="jdw-waktu" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0D47A1]" />
          </div>
        </div>
        <div>
          <label class="block font-bold text-slate-700 mb-1">Lokasi</label>
          <input type="text" id="jdw-lokasi" required placeholder="Masjid Al-Ikhlas RT 05" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0D47A1]" />
        </div>
        <p class="text-[11px] text-slate-400">Pilih tanggal dan jam (WIB) dari kalender/jam agar status agenda terbaca otomatis.</p>
        <div class="pt-3 flex justify-end gap-2">
          <button type="button" onclick="closeModal()" class="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold cursor-pointer">Batal</button>
          <button type="submit" class="px-5 py-2.5 rounded-xl bg-[#0D47A1] text-white font-bold cursor-pointer">Simpan Agenda</button>
        </div>
      </form>
    </div>
  `);

  document.getElementById('form-tambah-jadwal').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.submitter || e.target.querySelector('[type=submit]');
    await runBusy(btn, async () => {
      if (!document.getElementById('jdw-tgl').value || !document.getElementById('jdw-waktu').value) {
        showToast('Tanggal dan waktu wajib diisi.', 'error');
        return;
      }
      await apiCall('jadwal_add', {
        tanggal: document.getElementById('jdw-tgl').value.trim(),
        waktu: document.getElementById('jdw-waktu').value.trim(),
        judulKegiatan: document.getElementById('jdw-judul').value.trim(),
        lokasi: document.getElementById('jdw-lokasi').value.trim()
      });
      closeModal();
      showToast('Agenda baru berhasil ditambahkan!', 'success');
      renderActivePageContent();
    });
  });
};

window.openModalEditJadwal = function (docId) {
  const j = APP_STATE.jadwal.find(x => x._docId === docId);
  if (!j) return;
  const inp = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0D47A1]';
  const tg = parseTanggalAgenda(j.tanggal);
  const tglIso = tg ? `${tg.y}-${String(tg.m + 1).padStart(2, '0')}-${String(tg.d).padStart(2, '0')}` : '';
  const jm = unesc(j.waktu).match(/(\d{1,2})[:.](\d{2})/);
  const jamVal = jm ? `${jm[1].padStart(2, '0')}:${jm[2]}` : '';

  openModal(`
    <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
      <div class="flex items-center justify-between pb-4 border-b border-slate-100">
        <h3 class="font-extrabold text-base text-slate-800">Edit Agenda Kegiatan</h3>
        <button onclick="closeModal()" class="text-slate-400 hover:text-slate-700 cursor-pointer"><i data-lucide="x" class="w-5 h-5"></i></button>
      </div>
      <form id="form-edit-jadwal" class="space-y-4 mt-4 text-xs">
        <div>
          <label class="block font-bold text-slate-700 mb-1">Judul Kegiatan</label>
          <input type="text" id="jdw-judul" required value="${j.judulKegiatan}" class="${inp}" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Tanggal</label>
            <input type="date" id="jdw-tgl" required value="${tglIso}" class="${inp}" />
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Waktu</label>
            <input type="time" id="jdw-waktu" required value="${jamVal}" class="${inp}" />
          </div>
        </div>
        <div>
          <label class="block font-bold text-slate-700 mb-1">Lokasi</label>
          <input type="text" id="jdw-lokasi" required value="${j.lokasi}" class="${inp}" />
        </div>
        <p class="text-[11px] text-slate-400">Status agenda otomatis mengikuti tanggal & jam (Akan Datang → Berlangsung → Selesai).</p>
        <div class="pt-3 flex justify-end gap-2">
          <button type="button" onclick="closeModal()" class="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold cursor-pointer">Batal</button>
          <button type="submit" class="px-5 py-2.5 rounded-xl bg-[#0D47A1] text-white font-bold cursor-pointer">Simpan Perubahan</button>
        </div>
      </form>
    </div>
  `);

  document.getElementById('form-edit-jadwal').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.submitter || e.target.querySelector('[type=submit]');
    await runBusy(btn, async () => {
      if (!document.getElementById('jdw-tgl').value || !document.getElementById('jdw-waktu').value) {
        showToast('Tanggal dan waktu wajib diisi.', 'error');
        return;
      }
      await apiCall('jadwal_update', {
        docId,
        tanggal: document.getElementById('jdw-tgl').value.trim(),
        waktu: document.getElementById('jdw-waktu').value.trim(),
        judulKegiatan: document.getElementById('jdw-judul').value.trim(),
        lokasi: document.getElementById('jdw-lokasi').value.trim(),
        status: j.status
      });
      closeModal();
      showToast('Agenda berhasil diperbarui!', 'success');
      renderActivePageContent();
    });
  });
};

window.hapusJadwal = async function (docId) {
  const j = APP_STATE.jadwal.find(x => x._docId === docId);
  if (!j) return;
  if (!confirm(`Hapus agenda "${unesc(j.judulKegiatan)}"?`)) return;
  await runBusy(null, async () => {
    await apiCall('jadwal_delete', { docId });
    showToast('Agenda telah dihapus.', 'info');
    renderActivePageContent();
  });
};
