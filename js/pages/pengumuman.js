// =========================================================================
// 12. HALAMAN 5: PENGUMUMAN & INFO PANITIA RT
// =========================================================================
function renderPengumumanView(container) {
  const isAdmin = APP_STATE.currentUser.role === 'admin';

  container.innerHTML = `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/70 shadow-2xs">
        <div>
          <h2 class="text-lg font-extrabold text-slate-800">Papan Pengumuman Panitia Kurban RT</h2>
          <p class="text-xs text-slate-500 mt-0.5">Informasi resmi batas pelunasan, kuota kelompok hewan, dan edaran pengurus RT.</p>
        </div>
        ${isAdmin ? `
          <button onclick="openModalTambahPengumuman()"
            class="px-4 py-2.5 rounded-xl bg-[#0D47A1] hover:bg-blue-800 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer">
            <i data-lucide="megaphone" class="w-4 h-4"></i>
            <span>Buat Pengumuman</span>
          </button>
        ` : ''}
      </div>

      <div class="space-y-4">
        ${APP_STATE.pengumuman.map(ann => `
          <div class="bg-white rounded-2xl p-6 border border-slate-200/70 shadow-2xs">
            <div class="flex items-start justify-between gap-4">
              <div class="flex items-start gap-3.5">
                <div class="w-11 h-11 rounded-2xl bg-blue-50 text-[#0D47A1] flex items-center justify-center shrink-0">
                  <i data-lucide="megaphone" class="w-5 h-5"></i>
                </div>
                <div>
                  <span class="text-[11px] font-bold text-[#0D47A1]">${ann.tanggalPost} • Oleh ${ann.penulis}</span>
                  <h3 class="font-extrabold text-base text-slate-800 mt-0.5">${ann.judul}</h3>
                  <p class="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">${ann.isiPesan}</p>
                </div>
              </div>
              ${isAdmin ? `
                <button onclick="hapusPengumuman('${ann._docId}')" class="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

window.openModalTambahPengumuman = function () {
  openModal(`
    <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
      <div class="flex items-center justify-between pb-4 border-b border-slate-100">
        <h3 class="font-extrabold text-base text-slate-800">Publikasikan Pengumuman RT</h3>
        <button onclick="closeModal()" class="text-slate-400 hover:text-slate-700 cursor-pointer"><i data-lucide="x" class="w-5 h-5"></i></button>
      </div>
      <form id="form-tambah-ann" class="space-y-4 mt-4 text-xs">
        <div>
          <label class="block font-bold text-slate-700 mb-1">Judul Pengumuman</label>
          <input type="text" id="ann-judul" required placeholder="Contoh: Jadwal Penimbangan Hewan Kurban" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0D47A1]" />
        </div>
        <div>
          <label class="block font-bold text-slate-700 mb-1">Isi Pesan / Edaran</label>
          <textarea id="ann-isi" rows="4" required placeholder="Tuliskan informasi lengkap untuk warga..." class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0D47A1]"></textarea>
        </div>
        <div class="pt-3 flex justify-end gap-2">
          <button type="button" onclick="closeModal()" class="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold cursor-pointer">Batal</button>
          <button type="submit" class="px-5 py-2.5 rounded-xl bg-[#0D47A1] text-white font-bold cursor-pointer">Terbitkan</button>
        </div>
      </form>
    </div>
  `);

  document.getElementById('form-tambah-ann').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.submitter || e.target.querySelector('[type=submit]');
    await runBusy(btn, async () => {
      await apiCall('pengumuman_add', {
        judul: document.getElementById('ann-judul').value.trim(),
        isiPesan: document.getElementById('ann-isi').value.trim()
      });
      closeModal();
      showToast('Pengumuman berhasil diterbitkan ke warga!', 'success');
      renderActivePageContent();
    });
  });
};

window.hapusPengumuman = async function (docId) {
  if (!confirm('Hapus pengumuman ini?')) return;
  await runBusy(null, async () => {
    await apiCall('pengumuman_delete', { docId });
    showToast('Pengumuman dihapus.', 'info');
    renderActivePageContent();
  });
};
