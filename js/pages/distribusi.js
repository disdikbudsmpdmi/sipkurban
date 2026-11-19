// =========================================================================
// JADWAL & DISTRIBUSI: pembungkus menu Jadwal (tab Agenda | Distribusi Daging)
// =========================================================================
const KATEGORI_PENERIMA = ['Shohibul Kurban', 'Warga', 'Dhuafa', 'Panitia'];

function renderJadwalView(container) {
  const isAdmin = APP_STATE.currentUser.role === 'admin';
  container.innerHTML = `<div class="space-y-4">${tabBarHTML('jadwal', [['agenda', 'Agenda', 'calendar-clock'], ['distribusi', isAdmin ? 'Distribusi Daging' : 'Kupon Daging', 'package']])}<div id="tab-body"></div></div>`;
  const body = document.getElementById('tab-body');
  if (APP_STATE.tab.jadwal === 'distribusi') renderDistribusiView(body);
  else renderAgendaView(body);
}

function renderDistribusiView(container) {
  const isAdmin = APP_STATE.currentUser.role === 'admin';
  const r = APP_STATE.ringkasan || {};
  const list = APP_STATE.distribusi;
  const total = Number(r.kuponTotal || 0), diambil = Number(r.kuponDiambil || 0);
  const card = (t, v) => `<div class="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-2xs"><div class="text-[11px] font-bold text-slate-400">${t}</div><div class="text-lg font-extrabold text-[#0D47A1] mt-1">${v}</div></div>`;
  const badge = s => s === 'Sudah Diambil' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200';

  const summary = `<div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
    ${card('Penerima', r.jumlahPenerima || 0)}${card('Total Kupon', total)}${card('Sudah Diambil', diambil)}${card('Belum Diambil', total - diambil)}</div>`;

  if (!isAdmin) {
    container.innerHTML = `<div class="space-y-4">${summary}
      <div class="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-2xs">
        <h3 class="font-extrabold text-sm text-slate-800 mb-3">Kupon Daging Anda</h3>
        ${list.length === 0 ? '<p class="text-xs text-slate-400">Belum ada kupon atas nama Anda. Panitia akan membagikan daftar penerima menjelang hari-H.</p>' : list.map(d => `
          <div class="flex items-center justify-between gap-3 py-2.5 border-t first:border-t-0 border-slate-100">
            <div><div class="text-xs font-extrabold text-slate-800">${d.idDistribusi} • ${d.jumlahKupon} kupon</div><div class="text-[11px] text-slate-400">${d.kategori}${d.catatan ? ' • ' + d.catatan : ''}</div></div>
            <span class="px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${badge(d.status)}">${d.status}</span>
          </div>`).join('')}
      </div></div>`;
    return;
  }

  container.innerHTML = `<div class="space-y-4">${summary}
    <div class="bg-white rounded-2xl border border-slate-200/70 shadow-2xs overflow-hidden">
      <div class="p-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100">
        <h3 class="font-extrabold text-sm text-slate-800">Daftar Penerima Daging (${list.length})</h3>
        <div class="flex flex-wrap gap-2">
          <button onclick="generateDistribusi()" class="px-4 py-2.5 rounded-xl bg-blue-50 text-[#0D47A1] hover:bg-blue-100 text-xs font-bold inline-flex items-center gap-2 cursor-pointer"><i data-lucide="wand-sparkles" class="w-4 h-4"></i><span>Buat dari Peserta</span></button>
          <button onclick="openModalDistribusi()" class="px-4 py-2.5 rounded-xl bg-[#0D47A1] hover:bg-blue-800 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer"><i data-lucide="plus-circle" class="w-4 h-4"></i><span>Tambah Penerima</span></button>
        </div>
      </div>
      <div class="overflow-x-auto"><table class="w-full text-left border-collapse">
        <thead><tr class="bg-[#F4F7FE] text-slate-500 text-[11px] font-extrabold uppercase tracking-wider">
          <th class="py-3.5 px-4">Penerima</th><th class="py-3.5 px-4">Kategori</th><th class="py-3.5 px-4">Kupon</th><th class="py-3.5 px-4">Status</th><th class="py-3.5 px-4 text-right">Aksi</th></tr></thead>
        <tbody class="divide-y divide-slate-100 text-xs">
          ${list.length === 0 ? '<tr><td colspan="5" class="py-8 text-center text-slate-400">Belum ada penerima. Gunakan "Buat dari Peserta" atau tambah manual.</td></tr>' : list.map(d => `
            <tr class="hover:bg-blue-50/30">
              <td class="py-3.5 px-4"><div class="font-extrabold text-slate-800">${d.namaPenerima}</div><div class="text-[11px] text-slate-400">${d.idDistribusi}${d.catatan ? ' • ' + d.catatan : ''}</div></td>
              <td class="py-3.5 px-4">${d.kategori}</td>
              <td class="py-3.5 px-4 font-extrabold">${d.jumlahKupon}</td>
              <td class="py-3.5 px-4"><button onclick="toggleDistribusi('${d._docId}')" title="Klik untuk ubah status" class="px-2.5 py-1 rounded-full text-[10px] font-extrabold border cursor-pointer ${badge(d.status)}">${d.status}</button></td>
              <td class="py-3.5 px-4 text-right whitespace-nowrap">
                <button onclick="openModalDistribusi('${d._docId}')" title="Edit" class="p-1.5 rounded-lg bg-blue-50 hover:bg-[#0D47A1] text-[#0D47A1] hover:text-white cursor-pointer"><i data-lucide="pencil" class="w-3.5 h-3.5"></i></button>
                <button onclick="hapusDistribusi('${d._docId}')" title="Hapus" class="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white cursor-pointer"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
              </td></tr>`).join('')}
        </tbody></table></div>
    </div></div>`;
}

window.toggleDistribusi = async function (docId) {
  const d = APP_STATE.distribusi.find(x => x._docId === docId);
  if (!d) return;
  await runBusy(null, async () => {
    await apiCall('distribusi_set_status', { docId, status: d.status === 'Sudah Diambil' ? 'Belum Diambil' : 'Sudah Diambil' });
    renderActivePageContent();
  });
};

window.generateDistribusi = async function () {
  const n = prompt('Jumlah kupon per peserta (shohibul kurban):', '1');
  if (n === null) return;
  await runBusy(null, async () => {
    const res = await apiCall('distribusi_generate', { jumlahKupon: Number(n) || 1 });
    showToast(res && res.added ? `${res.added} penerima ditambahkan.` : 'Semua peserta sudah punya kupon.', 'success');
    renderActivePageContent();
  });
};

window.openModalDistribusi = function (docId = '') {
  const e = APP_STATE.distribusi.find(x => x._docId === docId);
  const v = e || { namaPenerima: '', kategori: 'Warga', jumlahKupon: 1, idWarga: '', catatan: '' };
  openModal(`
    <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
      <div class="flex items-center justify-between pb-4 border-b border-slate-100">
        <h3 class="font-extrabold text-base text-slate-800">${e ? 'Edit' : 'Tambah'} Penerima Daging</h3>
        <button onclick="closeModal()" class="text-slate-400 hover:text-slate-700 cursor-pointer"><i data-lucide="x" class="w-5 h-5"></i></button>
      </div>
      <form id="form-distribusi" class="space-y-4 mt-4 text-xs">
        <div><label class="block font-bold text-slate-700 mb-1">Terkait Peserta (opsional)</label>
          <select id="dst-warga" class="${INPUT_CLS}" onchange="const w=APP_STATE.warga.find(x=>x.idWarga===this.value); if(w){document.getElementById('dst-nama').value=unesc(w.namaLengkap);}">
            <option value="">— bukan peserta —</option>
            ${APP_STATE.warga.map(w => `<option value="${w.idWarga}" ${w.idWarga === v.idWarga ? 'selected' : ''}>${w.namaLengkap} (${w.idWarga})</option>`).join('')}
          </select></div>
        <div><label class="block font-bold text-slate-700 mb-1">Nama Penerima</label><input type="text" id="dst-nama" required maxlength="100" value="${v.namaPenerima}" class="${INPUT_CLS}" /></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="block font-bold text-slate-700 mb-1">Kategori</label>
            <select id="dst-kat" class="${INPUT_CLS}">${KATEGORI_PENERIMA.map(k => `<option ${k === v.kategori ? 'selected' : ''}>${k}</option>`).join('')}</select></div>
          <div><label class="block font-bold text-slate-700 mb-1">Jumlah Kupon</label><input type="number" id="dst-kupon" required min="1" value="${v.jumlahKupon}" class="${INPUT_CLS}" /></div>
        </div>
        <div><label class="block font-bold text-slate-700 mb-1">Catatan</label><input type="text" id="dst-cat" maxlength="150" value="${v.catatan}" class="${INPUT_CLS}" /></div>
        <div class="pt-2 flex justify-end gap-2">
          <button type="button" onclick="closeModal()" class="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold cursor-pointer">Batal</button>
          <button type="submit" class="px-5 py-2.5 rounded-xl bg-[#0D47A1] text-white font-bold cursor-pointer">Simpan</button>
        </div>
      </form>
    </div>`);
  document.getElementById('form-distribusi').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const btn = ev.submitter || ev.target.querySelector('[type=submit]');
    const payload = {
      namaPenerima: document.getElementById('dst-nama').value.trim(), kategori: document.getElementById('dst-kat').value,
      jumlahKupon: Number(document.getElementById('dst-kupon').value), idWarga: document.getElementById('dst-warga').value,
      catatan: document.getElementById('dst-cat').value.trim()
    };
    await runBusy(btn, async () => {
      await apiCall(e ? 'distribusi_update' : 'distribusi_add', e ? { docId, ...payload } : payload);
      closeModal();
      showToast('Data penerima disimpan.', 'success');
      renderActivePageContent();
    });
  });
};

window.hapusDistribusi = async function (docId) {
  const d = APP_STATE.distribusi.find(x => x._docId === docId);
  if (!d || !confirm(`Hapus penerima ${unesc(d.namaPenerima)}?`)) return;
  await runBusy(null, async () => {
    await apiCall('distribusi_delete', { docId });
    showToast('Penerima dihapus.', 'info');
    renderActivePageContent();
  });
};
