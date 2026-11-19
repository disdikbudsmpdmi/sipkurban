// =========================================================================
// KAS & IURAN: pembungkus menu Iuran (tab Setoran | Pengeluaran) + info bayar warga
// =========================================================================
const INPUT_CLS = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0D47A1]';
const KATEGORI_KELUAR = ['Pembelian Hewan', 'Upah Jagal', 'Perlengkapan', 'Konsumsi', 'Transport', 'Lainnya'];

function tabBarHTML(menu, tabs) {
  const cur = APP_STATE.tab[menu];
  return `<div class="flex flex-wrap gap-2 no-print">${tabs.map(([id, label, icon]) => `
    <button onclick="setTab('${menu}','${id}')" class="px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer ${
      cur === id ? 'bg-[#0D47A1] text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:text-[#0D47A1]'}">
      <i data-lucide="${icon}" class="w-4 h-4"></i>${label}</button>`).join('')}</div>`;
}
window.setTab = function (menu, tab) { APP_STATE.tab[menu] = tab; renderActivePageContent(); };

window.cetakKartuSaya = function () {
  APP_STATE.reportFilter.type = 'pribadi_warga';
  APP_STATE.activeMenu = 'laporan';
  renderMainApp();
};

function renderIuranView(container) {
  const isAdmin = APP_STATE.currentUser.role === 'admin';
  if (!isAdmin) APP_STATE.tab.iuran = 'setoran';
  const info = APP_STATE.settings?.infoBayar || '';
  const kontak = APP_STATE.settings?.kontakPanitia || '';

  const header = isAdmin
    ? tabBarHTML('iuran', [['setoran', 'Setoran', 'wallet'], ['pengeluaran', 'Pengeluaran', 'receipt']])
    : `<div class="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-2xs flex flex-col sm:flex-row sm:items-start justify-between gap-4">
         <div class="min-w-0">
           <h3 class="font-extrabold text-sm text-slate-800 flex items-center gap-2"><i data-lucide="banknote" class="w-4 h-4 text-[#0D47A1]"></i>Cara Pembayaran</h3>
           <p class="text-xs text-slate-600 mt-1.5 whitespace-pre-line">${info || `Info rekening belum diisi panitia.${kontak ? ' Hubungi: ' + kontak : ''}`}</p>
         </div>
         <button onclick="cetakKartuSaya()" class="shrink-0 px-4 py-2.5 rounded-xl bg-[#0D47A1] hover:bg-blue-800 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer no-print">
           <i data-lucide="printer" class="w-4 h-4"></i><span>Cetak Kartu Kendali</span></button>
       </div>`;

  container.innerHTML = `<div class="space-y-4">${header}<div id="tab-body"></div></div>`;
  const body = document.getElementById('tab-body');
  if (isAdmin && APP_STATE.tab.iuran === 'pengeluaran') renderPengeluaranView(body);
  else renderSetoranView(body);
}

function renderPengeluaranView(container) {
  const masuk = Number(APP_STATE.ringkasan?.totalTerkumpul || 0);
  const list = APP_STATE.pengeluaran;
  const keluar = list.reduce((s, x) => s + Number(x.nominal || 0), 0);
  const saldo = masuk - keluar;
  const card = (t, v, c) => `<div class="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-2xs"><div class="text-[11px] font-bold text-slate-400">${t}</div><div class="text-lg font-extrabold ${c} mt-1">${formatRupiah(v)}</div></div>`;

  container.innerHTML = `
    <div class="space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        ${card('Kas Masuk (Setoran)', masuk, 'text-emerald-600')}
        ${card('Kas Keluar', keluar, 'text-rose-600')}
        ${card('Saldo Kas', saldo, saldo < 0 ? 'text-rose-600' : 'text-[#0D47A1]')}
      </div>
      <div class="bg-white rounded-2xl border border-slate-200/70 shadow-2xs overflow-hidden">
        <div class="p-4 flex items-center justify-between gap-3 border-b border-slate-100">
          <h3 class="font-extrabold text-sm text-slate-800">Pengeluaran Panitia (${list.length})</h3>
          <button onclick="openModalPengeluaran()" class="px-4 py-2.5 rounded-xl bg-[#0D47A1] hover:bg-blue-800 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer">
            <i data-lucide="plus-circle" class="w-4 h-4"></i><span>Catat Pengeluaran</span></button>
        </div>
        <div class="overflow-x-auto"><table class="w-full text-left border-collapse">
          <thead><tr class="bg-[#F4F7FE] text-slate-500 text-[11px] font-extrabold uppercase tracking-wider">
            <th class="py-3.5 px-4">No & Tanggal</th><th class="py-3.5 px-4">Kategori</th><th class="py-3.5 px-4">Keterangan</th><th class="py-3.5 px-4">Nominal</th><th class="py-3.5 px-4 text-right">Aksi</th></tr></thead>
          <tbody class="divide-y divide-slate-100 text-xs">
            ${list.length === 0 ? '<tr><td colspan="5" class="py-8 text-center text-slate-400">Belum ada pengeluaran tercatat.</td></tr>' : list.map(x => `
              <tr class="hover:bg-blue-50/30">
                <td class="py-3.5 px-4"><div class="font-extrabold text-[#0D47A1]">${x.idPengeluaran}</div><div class="text-[11px] text-slate-400">${fmtTgl(x.tanggal)}</div></td>
                <td class="py-3.5 px-4"><span class="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[11px]">${x.kategori}</span></td>
                <td class="py-3.5 px-4 text-slate-700">${x.keterangan}</td>
                <td class="py-3.5 px-4 font-extrabold text-rose-600">${formatRupiah(x.nominal)}</td>
                <td class="py-3.5 px-4 text-right whitespace-nowrap">
                  <button onclick="openModalPengeluaran('${x._docId}')" title="Edit" class="p-1.5 rounded-lg bg-blue-50 hover:bg-[#0D47A1] text-[#0D47A1] hover:text-white cursor-pointer"><i data-lucide="pencil" class="w-3.5 h-3.5"></i></button>
                  <button onclick="hapusPengeluaran('${x._docId}')" title="Hapus" class="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white cursor-pointer"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
                </td></tr>`).join('')}
          </tbody></table></div>
      </div>
    </div>`;
}

window.openModalPengeluaran = function (docId = '') {
  const e = APP_STATE.pengeluaran.find(x => x._docId === docId);
  const v = e || { tanggal: new Date().toISOString().split('T')[0], kategori: KATEGORI_KELUAR[0], keterangan: '', nominal: '' };
  openModal(`
    <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
      <div class="flex items-center justify-between pb-4 border-b border-slate-100">
        <h3 class="font-extrabold text-base text-slate-800">${e ? 'Edit' : 'Catat'} Pengeluaran</h3>
        <button onclick="closeModal()" class="text-slate-400 hover:text-slate-700 cursor-pointer"><i data-lucide="x" class="w-5 h-5"></i></button>
      </div>
      <form id="form-pengeluaran" class="space-y-4 mt-4 text-xs">
        <div class="grid grid-cols-2 gap-3">
          <div><label class="block font-bold text-slate-700 mb-1">Tanggal</label><input type="date" id="klr-tgl" required value="${v.tanggal}" class="${INPUT_CLS}" /></div>
          <div><label class="block font-bold text-slate-700 mb-1">Kategori</label>
            <select id="klr-kat" class="${INPUT_CLS}">${KATEGORI_KELUAR.map(k => `<option ${k === v.kategori ? 'selected' : ''}>${k}</option>`).join('')}</select></div>
        </div>
        <div><label class="block font-bold text-slate-700 mb-1">Keterangan</label><input type="text" id="klr-ket" required maxlength="150" value="${v.keterangan}" placeholder="Contoh: DP sapi 2 ekor" class="${INPUT_CLS}" /></div>
        <div><label class="block font-bold text-slate-700 mb-1">Nominal (Rp)</label><input type="number" id="klr-nom" required min="1" value="${v.nominal}" class="${INPUT_CLS}" /></div>
        <div class="pt-2 flex justify-end gap-2">
          <button type="button" onclick="closeModal()" class="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold cursor-pointer">Batal</button>
          <button type="submit" class="px-5 py-2.5 rounded-xl bg-[#0D47A1] text-white font-bold cursor-pointer">Simpan</button>
        </div>
      </form>
    </div>`);
  document.getElementById('form-pengeluaran').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const btn = ev.submitter || ev.target.querySelector('[type=submit]');
    const payload = {
      tanggal: document.getElementById('klr-tgl').value, kategori: document.getElementById('klr-kat').value,
      keterangan: document.getElementById('klr-ket').value.trim(), nominal: Number(document.getElementById('klr-nom').value)
    };
    await runBusy(btn, async () => {
      await apiCall(e ? 'pengeluaran_update' : 'pengeluaran_add', e ? { docId, ...payload } : payload);
      closeModal();
      showToast('Pengeluaran berhasil disimpan.', 'success');
      renderActivePageContent();
    });
  });
};

window.hapusPengeluaran = async function (docId) {
  const x = APP_STATE.pengeluaran.find(i => i._docId === docId);
  if (!x || !confirm(`Hapus pengeluaran ${x.idPengeluaran} (${formatRupiah(x.nominal)})?`)) return;
  await runBusy(null, async () => {
    await apiCall('pengeluaran_delete', { docId });
    showToast('Pengeluaran dihapus.', 'info');
    renderActivePageContent();
  });
};
