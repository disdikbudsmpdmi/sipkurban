// =========================================================================
// 9. HALAMAN 2: DATA PESERTA & PEMBAGIAN KELOMPOK HEWAN KURBAN
// =========================================================================
function renderPesertaView(container) {
  const isAdmin = APP_STATE.currentUser.role === 'admin';
  const q = APP_STATE.searchQuery;

  const filteredWarga = APP_STATE.warga.filter(w =>
    w.namaLengkap.toLowerCase().includes(q) ||
    w.blokRumah.toLowerCase().includes(q) ||
    w.idWarga.toLowerCase().includes(q) ||
    w.kelompokHewan.toLowerCase().includes(q)
  );

  container.innerHTML = `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/70 shadow-2xs">
        <div>
          <h2 class="text-lg font-extrabold text-slate-800">Peserta & Kelompok Hewan Kurban</h2>
          <p class="text-xs text-slate-500 mt-0.5">Daftar shohibul kurban serta alokasi kelompok patungan sapi (1/7) & kambing mandiri.</p>
        </div>
        ${isAdmin ? `
          <div class="flex flex-wrap gap-2.5">
            <button onclick="openModalPengingatMassal()"
              class="px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer">
              <i data-lucide="message-circle" class="w-4 h-4"></i>
              <span>Ingatkan Tagihan (${daftarBelumLunas().length})</span>
            </button>
            <button onclick="openModalTambahKelompok()"
              class="px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0D47A1] text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer">
              <i data-lucide="folder-plus" class="w-4 h-4"></i>
              <span>Tambah Kelompok</span>
            </button>
            <button onclick="openModalTambahPeserta()"
              class="px-4 py-2.5 rounded-xl bg-[#0D47A1] hover:bg-blue-800 text-white text-xs font-bold inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer">
              <i data-lucide="user-plus" class="w-4 h-4"></i>
              <span>Daftarkan Warga</span>
            </button>
          </div>
        ` : ''}
      </div>

      <!-- Kartu Kelompok Hewan Kurban -->
      <div>
        <h3 class="text-sm font-extrabold text-slate-700 mb-3">Alokasi Kelompok Hewan Kurban</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          ${APP_STATE.kelompok.map(klp => {
            const anggota = getAnggotaKelompok(klp.namaKelompok);
            const terisi = anggota.length;
            const penuh = terisi >= klp.kapasitas;
            return `
              <div class="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-2xs flex flex-col justify-between">
                <div>
                  <div class="flex items-start justify-between gap-2">
                    <span class="px-2.5 py-1 rounded-lg text-[10px] font-extrabold ${klp.jenisHewan === 'Sapi Patungan' ? 'bg-blue-50 text-[#0D47A1]' : 'bg-emerald-50 text-emerald-700'}">
                      ${klp.jenisHewan}
                    </span>
                    <span class="text-xs font-extrabold ${penuh ? 'text-rose-600' : 'text-emerald-600'}">
                      ${terisi}/${klp.kapasitas} Slot
                    </span>
                  </div>
                  ${isAdmin ? `
                    <div class="flex justify-end gap-1 mt-2 -mb-1">
                      <button onclick="openModalEditKelompok('${klp._docId}')" title="Edit Kelompok"
                        class="p-1.5 rounded-lg bg-blue-50 hover:bg-[#0D47A1] text-[#0D47A1] hover:text-white transition-all cursor-pointer">
                        <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
                      </button>
                      <button onclick="hapusKelompok('${klp._docId}')" title="Hapus Kelompok"
                        class="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white transition-all cursor-pointer">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                      </button>
                    </div>
                  ` : ''}
                  <h4 class="font-extrabold text-sm text-slate-800 mt-3">${klp.namaKelompok}</h4>
                  <p class="text-[11px] text-slate-400 mt-0.5">Status: <strong class="text-slate-600">${klp.statusPengadaan}</strong></p>

                  <div class="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                    ${anggota.length === 0
                      ? '<p class="text-[11px] text-slate-400 italic">Belum ada peserta terdaftar.</p>'
                      : anggota.map((a, idx) => `
                        <div class="flex items-center justify-between text-xs">
                          <span class="text-slate-700 font-medium truncate">${idx + 1}. ${a.namaLengkap}</span>
                          ${isAdmin ? `<span class="text-[10px] font-bold ${a.statusLunas ? 'text-emerald-600' : 'text-amber-600'}">
                            ${a.statusLunas ? 'Lunas' : 'Cicilan'}
                          </span>` : ''}
                        </div>
                      `).join('')}
                  </div>
                </div>

                <div class="mt-4 pt-3 border-t border-slate-100">
                  <div class="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full bg-[#0D47A1] rounded-full" style="width: ${Math.min(100, Math.round((terisi / klp.kapasitas) * 100))}%"></div>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Tabel Daftar Warga Peserta Kurban -->
      <div class="bg-white rounded-2xl border border-slate-200/70 shadow-2xs overflow-hidden">
        <div class="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 class="font-extrabold text-sm text-slate-800">${isAdmin ? `Daftar Peserta Kurban RT (${filteredWarga.length})` : 'Data Kepesertaan Anda'}</h3>
          <input type="text" value="${APP_STATE.searchQuery}" oninput="handleGlobalSearch(this.value)"
            placeholder="Filter nama / blok / kelompok..."
            class="px-3.5 py-2 rounded-xl bg-[#F4F7FE] border border-slate-200 text-xs outline-none focus:border-[#0D47A1] w-full sm:w-64" />
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-[#F4F7FE] text-slate-500 text-[11px] font-extrabold uppercase tracking-wider">
                <th class="py-3.5 px-4">ID & Nama Warga</th>
                <th class="py-3.5 px-4">Paket & Kelompok</th>
                <th class="py-3.5 px-4">Progres Iuran</th>
                <th class="py-3.5 px-4">Status</th>
                ${isAdmin ? '<th class="py-3.5 px-4 text-right">Aksi</th>' : ''}
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-xs">
              ${filteredWarga.map(w => {
                const pct = w.targetIuran > 0 ? Math.min(100, Math.round((w.totalTerbayar / w.targetIuran) * 100)) : 0;
                const lunas = w.statusLunas || w.totalTerbayar >= w.targetIuran;
                return `
                  <tr class="hover:bg-blue-50/30 transition-colors">
                    <td class="py-3.5 px-4">
                      <div class="font-extrabold text-slate-800">${w.namaLengkap}</div>
                      <div class="text-[11px] text-slate-400">${w.idWarga} • ${w.blokRumah}${w.noHp ? ' • ' + w.noHp : ''}</div>
                    </td>
                    <td class="py-3.5 px-4">
                      <div class="font-bold text-[#0D47A1]">${w.jenisKurban}</div>
                      <div class="text-[11px] text-slate-500">${w.kelompokHewan}</div>
                    </td>
                    <td class="py-3.5 px-4 min-w-[180px]">
                      <div class="flex justify-between text-[11px] mb-1">
                        <span class="font-bold text-slate-700">${formatRupiah(w.totalTerbayar)}</span>
                        <span class="text-slate-400">${pct}%</span>
                      </div>
                      <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div class="h-full ${lunas ? 'bg-emerald-500' : 'bg-[#0D47A1]'} rounded-full" style="width: ${pct}%"></div>
                      </div>
                      <div class="text-[10px] text-slate-400 mt-1">Target: ${formatRupiah(w.targetIuran)}</div>
                    </td>
                    <td class="py-3.5 px-4">
                      <span class="px-2.5 py-1 rounded-full text-[10px] font-extrabold ${lunas ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}">
                        ${lunas ? 'Lunas' : 'Cicilan'}
                      </span>
                    </td>
                    ${isAdmin ? `
                      <td class="py-3.5 px-4 text-right whitespace-nowrap">
                        ${!lunas && w.noHp ? `
                        <button onclick="openModalPengingat('${w.idWarga}')" title="Ingatkan via WhatsApp"
                          class="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white transition-all cursor-pointer mr-1 align-middle">
                          <i data-lucide="message-circle" class="w-3.5 h-3.5"></i>
                        </button>` : ''}
                        <button onclick="openModalTambahSetoran('${w.idWarga}')" title="Catat Setoran"
                          class="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-[#0D47A1] text-[#0D47A1] hover:text-white font-bold text-[11px] transition-all cursor-pointer mr-1">
                          + Setor
                        </button>
                        <button onclick="openModalEditPeserta('${w._docId}')" title="Edit Peserta"
                          class="p-1.5 rounded-lg bg-blue-50 hover:bg-[#0D47A1] text-[#0D47A1] hover:text-white transition-all cursor-pointer mr-1">
                          <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
                        </button>
                        <button onclick="hapusPeserta('${w._docId}')" title="Hapus Peserta"
                          class="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white transition-all cursor-pointer">
                          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                        </button>
                      </td>
                    ` : ''}
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

window.openModalTambahPeserta = function () {
  window._editPesertaDocId = null;
  const s = APP_STATE.settings;
  const hargaSapi = s?.hargaSapiPatungan || 3500000;
  const hargaKambing = s?.hargaKambingMandiri || 3200000;

  openModal(`
    <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200">
      <div class="flex items-center justify-between pb-4 border-b border-slate-100">
        <h3 class="font-extrabold text-base text-slate-800">Daftarkan Peserta Kurban Baru</h3>
        <button onclick="closeModal()" class="text-slate-400 hover:text-slate-700 cursor-pointer"><i data-lucide="x" class="w-5 h-5"></i></button>
      </div>
      <form id="form-tambah-peserta" class="space-y-4 mt-4 text-xs">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Nama Lengkap Warga</label>
            <input type="text" id="inp-nama" required placeholder="Contoh: Ahmad Hidayat" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0D47A1]" />
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Blok & Nomor Rumah</label>
            <input type="text" id="inp-blok" required placeholder="Contoh: Blok C1 / No. 08" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0D47A1]" />
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Nomor HP / WhatsApp</label>
            <input type="text" id="inp-hp" required placeholder="0812xxxxxxxx" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0D47A1]" />
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">PIN Login Warga (6 Digit)</label>
            <input type="text" id="inp-pin" inputmode="numeric" maxlength="6" pattern="[0-9]{6}" placeholder="Kosongkan = dibuat otomatis" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0D47A1]" />
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Paket Hewan Kurban</label>
            <select id="inp-jenis" onchange="onJenisPesertaChange(this.value)"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0D47A1]">
              <option value="Sapi Patungan">Sapi Patungan (1/7)</option>
              <option value="Kambing">Kambing Mandiri</option>
            </select>
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Target Iuran (Rp)</label>
            <input type="number" id="inp-target" required value="${hargaSapi}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0D47A1]" />
          </div>
        </div>
        <div>
          <label class="block font-bold text-slate-700 mb-1">Alokasi Kelompok Hewan</label>
          <select id="inp-kelompok" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0D47A1]">
            ${kelompokOptionsHTML('Sapi Patungan')}
          </select>
        </div>
        <div class="pt-3 flex justify-end gap-2">
          <button type="button" onclick="closeModal()" class="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold cursor-pointer">Batal</button>
          <button type="submit" class="px-5 py-2.5 rounded-xl bg-[#0D47A1] text-white font-bold cursor-pointer">Simpan Peserta</button>
        </div>
      </form>
    </div>
  `);

  document.getElementById('form-tambah-peserta').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.submitter || e.target.querySelector('[type=submit]');
    await runBusy(btn, async () => {
      const res = await apiCall('warga_add', {
        namaLengkap: document.getElementById('inp-nama').value.trim(),
        blokRumah: document.getElementById('inp-blok').value.trim(),
        noHp: document.getElementById('inp-hp').value.trim(),
        pinLogin: document.getElementById('inp-pin').value.trim(),
        jenisKurban: document.getElementById('inp-jenis').value,
        kelompokHewan: document.getElementById('inp-kelompok').value,
        targetIuran: Number(document.getElementById('inp-target').value)
      });
      closeModal();
      showToast(`Warga ${res.namaLengkap} (${res.idWarga}) berhasil didaftarkan!`, 'success');
      renderActivePageContent();
      if (res.pinAwal) openModalPinAwal(res);
    });
  });
};

// Hanya tampilkan kelompok yang jenis hewannya cocok dengan paket yang dipilih.
function kelompokOptionsHTML(jenis, selected = '', excludeDocId = '') {
  const list = APP_STATE.kelompok.filter(k => k.jenisHewan === jenis);
  if (list.length === 0) return '<option value="">(Belum ada kelompok untuk paket ini)</option>';
  return list.map(k => {
    const terisi = APP_STATE.warga.filter(w => w.kelompokHewan === k.namaKelompok && w._docId !== excludeDocId).length;
    const penuh = terisi >= k.kapasitas;
    return `<option value="${k.namaKelompok}" ${k.namaKelompok === selected ? 'selected' : ''} ${penuh ? 'disabled' : ''}>${k.namaKelompok} (${terisi}/${k.kapasitas}${penuh ? ' • penuh' : ''})</option>`;
  }).join('');
}

window.onJenisPesertaChange = function (jenis) {
  const s = APP_STATE.settings;
  const harga = jenis === 'Sapi Patungan' ? (s?.hargaSapiPatungan || 3500000) : (s?.hargaKambingMandiri || 3200000);
  document.getElementById('inp-target').value = harga;
  document.getElementById('inp-kelompok').innerHTML = kelompokOptionsHTML(jenis, '', window._editPesertaDocId || '');
};

window.openModalTambahKelompok = function () {
  openModal(`
    <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
      <div class="flex items-center justify-between pb-4 border-b border-slate-100">
        <h3 class="font-extrabold text-base text-slate-800">Tambah Kelompok Hewan Kurban</h3>
        <button onclick="closeModal()" class="text-slate-400 hover:text-slate-700 cursor-pointer"><i data-lucide="x" class="w-5 h-5"></i></button>
      </div>
      <form id="form-tambah-kelompok" class="space-y-4 mt-4 text-xs">
        <div>
          <label class="block font-bold text-slate-700 mb-1">Nama Kelompok</label>
          <input type="text" id="klp-nama" required placeholder="Contoh: Kelompok Sapi PO 3" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0D47A1]" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Jenis Hewan</label>
            <select id="klp-jenis" onchange="document.getElementById('klp-kapasitas').value = this.value === 'Sapi Patungan' ? 7 : 10"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0D47A1]">
              <option value="Sapi Patungan">Sapi Patungan</option>
              <option value="Kambing">Kambing</option>
            </select>
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Kapasitas Slot</label>
            <input type="number" id="klp-kapasitas" required value="7" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0D47A1]" />
          </div>
        </div>
        <div>
          <label class="block font-bold text-slate-700 mb-1">Status Pengadaan</label>
          <input type="text" id="klp-status" required value="Pendaftaran Anggota" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0D47A1]" />
        </div>
        <div class="pt-3 flex justify-end gap-2">
          <button type="button" onclick="closeModal()" class="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold cursor-pointer">Batal</button>
          <button type="submit" class="px-5 py-2.5 rounded-xl bg-[#0D47A1] text-white font-bold cursor-pointer">Simpan Kelompok</button>
        </div>
      </form>
    </div>
  `);

  document.getElementById('form-tambah-kelompok').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.submitter || e.target.querySelector('[type=submit]');
    await runBusy(btn, async () => {
      await apiCall('kelompok_add', {
        namaKelompok: document.getElementById('klp-nama').value.trim(),
        jenisHewan: document.getElementById('klp-jenis').value,
        kapasitas: Number(document.getElementById('klp-kapasitas').value),
        statusPengadaan: document.getElementById('klp-status').value.trim()
      });
      closeModal();
      showToast('Kelompok hewan kurban berhasil ditambahkan!', 'success');
      renderActivePageContent();
    });
  });
};

window.hapusPeserta = async function (docId) {
  const w = APP_STATE.warga.find(x => x._docId === docId);
  if (!w) return;
  const extra = Number(w.totalTerbayar) > 0
    ? `\n\nPeserta ini sudah menyetor ${formatRupiah(w.totalTerbayar)}. Riwayat setorannya tetap tersimpan di mutasi kas.`
    : '';
  if (!confirm(`Hapus peserta "${unesc(w.namaLengkap)}" dari daftar?${extra}`)) return;
  await runBusy(null, async () => {
    await apiCall('warga_delete', { docId });
    showToast(`Peserta ${w.namaLengkap} telah dihapus dari daftar.`, 'info');
    renderActivePageContent();
  });
};

// -------------------------------------------------------------------------
// EDIT PESERTA
// -------------------------------------------------------------------------
window.openModalEditPeserta = function (docId) {
  const w = APP_STATE.warga.find(x => x._docId === docId);
  if (!w) return;
  window._editPesertaDocId = docId;
  const inp = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0D47A1]';

  openModal(`
    <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
      <div class="flex items-center justify-between pb-4 border-b border-slate-100">
        <h3 class="font-extrabold text-base text-slate-800">Edit Peserta (${w.idWarga})</h3>
        <button onclick="closeModal()" class="text-slate-400 hover:text-slate-700 cursor-pointer"><i data-lucide="x" class="w-5 h-5"></i></button>
      </div>
      <form id="form-edit-peserta" class="space-y-4 mt-4 text-xs">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Nama Lengkap Warga</label>
            <input type="text" id="inp-nama" required value="${w.namaLengkap}" class="${inp}" />
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Blok & Nomor Rumah</label>
            <input type="text" id="inp-blok" required value="${w.blokRumah}" class="${inp}" />
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Nomor HP / WhatsApp</label>
            <input type="text" id="inp-hp" required value="${w.noHp || ''}" class="${inp}" />
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">PIN Baru (opsional)</label>
            <input type="text" id="inp-pin" inputmode="numeric" maxlength="6" pattern="[0-9]{6}" placeholder="6 digit, kosongkan jika tidak diubah" class="${inp}" />
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Paket Hewan Kurban</label>
            <select id="inp-jenis" onchange="onJenisPesertaChange(this.value)" class="${inp}">
              <option value="Sapi Patungan" ${w.jenisKurban === 'Sapi Patungan' ? 'selected' : ''}>Sapi Patungan (1/7)</option>
              <option value="Kambing" ${w.jenisKurban === 'Kambing' ? 'selected' : ''}>Kambing Mandiri</option>
            </select>
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Target Iuran (Rp)</label>
            <input type="number" id="inp-target" required value="${w.targetIuran}" class="${inp}" />
          </div>
        </div>
        <div>
          <label class="block font-bold text-slate-700 mb-1">Alokasi Kelompok Hewan</label>
          <select id="inp-kelompok" class="${inp}">
            ${kelompokOptionsHTML(w.jenisKurban, w.kelompokHewan, docId)}
          </select>
        </div>
        <p class="text-[11px] text-slate-400">Total terbayar (${formatRupiah(w.totalTerbayar)}) tidak berubah. Status lunas dihitung ulang dari target iuran.</p>
        <div class="pt-3 flex justify-end gap-2">
          <button type="button" onclick="closeModal()" class="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold cursor-pointer">Batal</button>
          <button type="submit" class="px-5 py-2.5 rounded-xl bg-[#0D47A1] text-white font-bold cursor-pointer">Simpan Perubahan</button>
        </div>
      </form>
    </div>
  `);

  document.getElementById('form-edit-peserta').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.submitter || e.target.querySelector('[type=submit]');
    await runBusy(btn, async () => {
      await apiCall('warga_update', {
        docId,
        namaLengkap: document.getElementById('inp-nama').value.trim(),
        blokRumah: document.getElementById('inp-blok').value.trim(),
        noHp: document.getElementById('inp-hp').value.trim(),
        newPin: document.getElementById('inp-pin').value.trim(),
        jenisKurban: document.getElementById('inp-jenis').value,
        kelompokHewan: document.getElementById('inp-kelompok').value,
        targetIuran: Number(document.getElementById('inp-target').value)
      });
      window._editPesertaDocId = null;
      closeModal();
      showToast('Data peserta berhasil diperbarui!', 'success');
      renderActivePageContent();
    });
  });
};

// -------------------------------------------------------------------------
// EDIT & HAPUS KELOMPOK
// -------------------------------------------------------------------------
window.openModalEditKelompok = function (docId) {
  const klp = APP_STATE.kelompok.find(k => k._docId === docId);
  if (!klp) return;
  const jumlah = APP_STATE.warga.filter(w => w.kelompokHewan === klp.namaKelompok).length;
  const inp = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0D47A1]';

  openModal(`
    <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
      <div class="flex items-center justify-between pb-4 border-b border-slate-100">
        <h3 class="font-extrabold text-base text-slate-800">Edit Kelompok Hewan Kurban</h3>
        <button onclick="closeModal()" class="text-slate-400 hover:text-slate-700 cursor-pointer"><i data-lucide="x" class="w-5 h-5"></i></button>
      </div>
      <form id="form-edit-kelompok" class="space-y-4 mt-4 text-xs">
        <div>
          <label class="block font-bold text-slate-700 mb-1">Nama Kelompok</label>
          <input type="text" id="klp-nama" required value="${klp.namaKelompok}" class="${inp}" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Jenis Hewan</label>
            <select id="klp-jenis" ${jumlah > 0 ? 'disabled' : ''} class="${inp} disabled:bg-slate-50 disabled:text-slate-400">
              <option value="Sapi Patungan" ${klp.jenisHewan === 'Sapi Patungan' ? 'selected' : ''}>Sapi Patungan</option>
              <option value="Kambing" ${klp.jenisHewan === 'Kambing' ? 'selected' : ''}>Kambing</option>
            </select>
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Kapasitas Slot</label>
            <input type="number" id="klp-kapasitas" required min="${Math.max(1, jumlah)}" value="${klp.kapasitas}" class="${inp}" />
          </div>
        </div>
        ${jumlah > 0 ? `<p class="text-[11px] text-slate-400">Jenis hewan terkunci & kapasitas minimal ${jumlah} karena sudah ada ${jumlah} peserta.</p>` : ''}
        <div>
          <label class="block font-bold text-slate-700 mb-1">Status Pengadaan</label>
          <input type="text" id="klp-status" required value="${klp.statusPengadaan}" class="${inp}" />
        </div>
        <div class="pt-3 flex justify-end gap-2">
          <button type="button" onclick="closeModal()" class="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold cursor-pointer">Batal</button>
          <button type="submit" class="px-5 py-2.5 rounded-xl bg-[#0D47A1] text-white font-bold cursor-pointer">Simpan Perubahan</button>
        </div>
      </form>
    </div>
  `);

  document.getElementById('form-edit-kelompok').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.submitter || e.target.querySelector('[type=submit]');
    await runBusy(btn, async () => {
      await apiCall('kelompok_update', {
        docId,
        namaKelompok: document.getElementById('klp-nama').value.trim(),
        jenisHewan: document.getElementById('klp-jenis').value,
        kapasitas: Number(document.getElementById('klp-kapasitas').value),
        statusPengadaan: document.getElementById('klp-status').value.trim()
      });
      closeModal();
      showToast('Kelompok hewan kurban berhasil diperbarui!', 'success');
      renderActivePageContent();
    });
  });
};

window.hapusKelompok = async function (docId) {
  const klp = APP_STATE.kelompok.find(k => k._docId === docId);
  if (!klp) return;
  const jumlah = APP_STATE.warga.filter(w => w.kelompokHewan === klp.namaKelompok).length;
  if (jumlah > 0) {
    showToast(`Kelompok masih memiliki ${jumlah} peserta. Pindahkan atau hapus pesertanya terlebih dahulu.`, 'error');
    return;
  }
  if (!confirm(`Hapus kelompok "${unesc(klp.namaKelompok)}"?`)) return;
  await runBusy(null, async () => {
    await apiCall('kelompok_delete', { docId });
    showToast('Kelompok hewan telah dihapus.', 'info');
    renderActivePageContent();
  });
};


// =========================================================================
// PENGINGAT TAGIHAN VIA WHATSAPP (tanpa API: membuka wa.me dengan pesan siap kirim)
// =========================================================================
const WA_INFO_KEY = 'sipkurban_info_bayar';
const _waTerkirim = new Set();   // penanda sesi: peserta yang sudah dibuka WA-nya

function getInfoBayar() {
  try { return localStorage.getItem(WA_INFO_KEY) || ''; } catch (e) { return ''; }
}
function setInfoBayar(v) {
  try { localStorage.setItem(WA_INFO_KEY, v); } catch (e) {}
}

function sisaTagihan(w) {
  return Math.max(0, Number(w.targetIuran || 0) - Number(w.totalTerbayar || 0));
}

function daftarBelumLunas() {
  return APP_STATE.warga.filter(w => !(w.statusLunas || w.totalTerbayar >= w.targetIuran) && normalisasiNoWa(w.noHp));
}

// 0812-xxx / +62812xxx / 62812xxx / 812xxx  ->  62812xxx (format wa.me)
function normalisasiNoWa(noHp) {
  let d = String(unesc(noHp || '')).replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('62')) { /* sudah kode negara */ }
  else if (d.startsWith('0')) d = '62' + d.slice(1);
  else if (d.startsWith('8')) d = '62' + d;
  return d.length >= 10 ? d : '';
}

function linkWa(noHp, pesan) {
  const no = normalisasiNoWa(noHp);
  return no ? `https://wa.me/${no}?text=${encodeURIComponent(pesan)}` : '';
}

function buatPesanPengingat(w, infoBayar) {
  const s = APP_STATE.settings || {};
  const namaRT = unesc(s.namaRT || 'RT');
  const kontak = unesc(s.kontakPanitia || '');
  const baris = [
    `Assalamualaikum Bapak/Ibu ${unesc(w.namaLengkap)},`,
    '',
    `Kami dari panitia kurban ${namaRT} menyampaikan pengingat iuran kurban Bapak/Ibu (${unesc(w.jenisKurban)} - ${unesc(w.kelompokHewan)}).`,
    '',
    `Target iuran : ${formatRupiah(w.targetIuran)}`,
    `Sudah dibayar: ${formatRupiah(w.totalTerbayar)}`,
    `Sisa tagihan : ${formatRupiah(sisaTagihan(w))}`
  ];
  if (infoBayar && infoBayar.trim()) baris.push('', 'Pembayaran dapat melalui:', infoBayar.trim());
  baris.push('', 'Mohon abaikan pesan ini apabila sudah melakukan pembayaran.');
  if (kontak) baris.push(`Info lebih lanjut hubungi panitia: ${kontak}`);
  baris.push('', 'Terima kasih. Wassalamualaikum warahmatullahi wabarakatuh.');
  return baris.join('\n');
}

// --- Pengingat untuk satu warga: pesan bisa diedit sebelum dikirim ---
window.openModalPengingat = function (idWarga) {
  const w = APP_STATE.warga.find(x => x.idWarga === idWarga);
  if (!w) return;
  const info = getInfoBayar();
  openModal(`
    <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
      <div class="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h3 class="font-extrabold text-base text-slate-800">Ingatkan via WhatsApp</h3>
          <p class="text-[11px] text-slate-400 mt-0.5">${w.namaLengkap} • sisa ${formatRupiah(sisaTagihan(w))}</p>
        </div>
        <button onclick="closeModal()" class="text-slate-400 hover:text-slate-700 cursor-pointer"><i data-lucide="x" class="w-5 h-5"></i></button>
      </div>
      <div class="space-y-4 mt-4 text-xs">
        <div>
          <label class="block font-bold text-slate-700 mb-1">Info pembayaran (rekening / QRIS) — tersimpan di perangkat ini</label>
          <textarea id="wa-info" rows="2" placeholder="Contoh: BSI 1234567890 a.n. Bendahara Kurban"
            class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0D47A1] resize-none">${info}</textarea>
        </div>
        <div>
          <label class="block font-bold text-slate-700 mb-1">Isi pesan (boleh diedit)</label>
          <textarea id="wa-pesan" rows="12" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0D47A1] font-mono text-[11px] leading-relaxed"></textarea>
        </div>
        <div class="pt-2 flex flex-wrap justify-end gap-2">
          <button type="button" onclick="closeModal()" class="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold cursor-pointer">Tutup</button>
          <button type="button" onclick="salinPesanPengingat()" class="px-4 py-2.5 rounded-xl bg-blue-50 text-[#0D47A1] font-bold cursor-pointer">Salin Pesan</button>
          <button type="button" onclick="kirimPengingatDariModal('${w.idWarga}')" class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer inline-flex items-center gap-2">
            <i data-lucide="send" class="w-4 h-4"></i><span>Buka WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  `);
  const ta = document.getElementById('wa-pesan');
  ta.value = buatPesanPengingat(w, info);
  // Mengubah info pembayaran menyusun ulang pesan (suntingan manual setelahnya tetap aman).
  document.getElementById('wa-info').addEventListener('input', (e) => {
    setInfoBayar(e.target.value);
    ta.value = buatPesanPengingat(w, e.target.value);
  });
};

window.salinPesanPengingat = async function () {
  const teks = document.getElementById('wa-pesan').value;
  try {
    await navigator.clipboard.writeText(teks);
    showToast('Pesan disalin.', 'success');
  } catch (e) {
    document.getElementById('wa-pesan').select();
    showToast('Salin otomatis tidak didukung. Teks sudah dipilih, tekan Ctrl+C.', 'info');
  }
};

window.kirimPengingatDariModal = function (idWarga) {
  const w = APP_STATE.warga.find(x => x.idWarga === idWarga);
  if (!w) return;
  const url = linkWa(w.noHp, document.getElementById('wa-pesan').value);
  if (!url) { showToast('Nomor HP warga tidak valid untuk WhatsApp.', 'error'); return; }
  _waTerkirim.add(idWarga);
  window.open(url, '_blank', 'noopener');
};

// --- Pengingat massal: daftar belum lunas, kirim satu per satu ---
window.openModalPengingatMassal = function () {
  const daftar = daftarBelumLunas();
  const totalSisa = daftar.reduce((a, w) => a + sisaTagihan(w), 0);
  const info = getInfoBayar();
  openModal(`
    <div class="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
      <div class="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h3 class="font-extrabold text-base text-slate-800">Ingatkan Tagihan Warga</h3>
          <p class="text-[11px] text-slate-400 mt-0.5">${daftar.length} warga belum lunas • total sisa ${formatRupiah(totalSisa)}</p>
        </div>
        <button onclick="closeModal()" class="text-slate-400 hover:text-slate-700 cursor-pointer"><i data-lucide="x" class="w-5 h-5"></i></button>
      </div>
      <div class="mt-4 text-xs space-y-4">
        <div>
          <label class="block font-bold text-slate-700 mb-1">Info pembayaran (rekening / QRIS) — ikut dalam pesan</label>
          <textarea id="wa-info" rows="2" placeholder="Contoh: BSI 1234567890 a.n. Bendahara Kurban"
            oninput="setInfoBayar(this.value)"
            class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0D47A1] resize-none">${info}</textarea>
        </div>
        ${daftar.length === 0 ? '<p class="text-slate-400 italic text-center py-6">Semua warga yang punya nomor HP valid sudah lunas.</p>' : `
        <p class="text-[11px] text-slate-500">WhatsApp dibuka satu per satu (browser memblokir banyak jendela sekaligus). Pesan bisa dicek dulu sebelum menekan kirim di WhatsApp.</p>
        <div class="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
          ${daftar.map(w => `
            <div id="wa-row-${w.idWarga}" class="flex items-center justify-between gap-3 px-3.5 py-2.5 ${_waTerkirim.has(w.idWarga) ? 'bg-emerald-50/60' : ''}">
              <div class="min-w-0">
                <div class="font-bold text-slate-800 truncate">${w.namaLengkap}</div>
                <div class="text-[11px] text-slate-400">${w.blokRumah} • sisa <strong class="text-amber-700">${formatRupiah(sisaTagihan(w))}</strong></div>
              </div>
              <div class="flex items-center gap-1.5 shrink-0">
                <span id="wa-done-${w.idWarga}" class="text-[10px] font-bold text-emerald-600 ${_waTerkirim.has(w.idWarga) ? '' : 'hidden'}">Sudah dibuka</span>
                <button onclick="kirimPengingatCepat('${w.idWarga}')"
                  class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer inline-flex items-center gap-1.5">
                  <i data-lucide="send" class="w-3.5 h-3.5"></i><span>Kirim</span>
                </button>
              </div>
            </div>
          `).join('')}
        </div>`}
        <div class="flex justify-end"><button type="button" onclick="closeModal()" class="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold cursor-pointer">Tutup</button></div>
      </div>
    </div>
  `);
};

window.kirimPengingatCepat = function (idWarga) {
  const w = APP_STATE.warga.find(x => x.idWarga === idWarga);
  if (!w) return;
  const infoEl = document.getElementById('wa-info');
  const url = linkWa(w.noHp, buatPesanPengingat(w, infoEl ? infoEl.value : getInfoBayar()));
  if (!url) { showToast('Nomor HP warga tidak valid untuk WhatsApp.', 'error'); return; }
  _waTerkirim.add(idWarga);
  window.open(url, '_blank', 'noopener');
  const row = document.getElementById('wa-row-' + idWarga);
  if (row) row.classList.add('bg-emerald-50/60');
  const done = document.getElementById('wa-done-' + idWarga);
  if (done) done.classList.remove('hidden');
};

// --- PIN awal otomatis: tampilkan sekali agar bisa diberikan ke warga ---
window.openModalPinAwal = function (res) {
  const w = APP_STATE.warga.find(x => x.idWarga === res.idWarga);
  const s = APP_STATE.settings || {};
  const alamatApp = location.origin + location.pathname;
  const pesan = [
    `Assalamualaikum Bapak/Ibu ${unesc(res.namaLengkap)},`,
    '',
    `Akun portal kurban ${unesc(s.namaRT || 'RT')} sudah dibuat.`,
    `Alamat : ${alamatApp}`,
    `ID Warga: ${res.idWarga} (atau gunakan nomor HP)`,
    `PIN     : ${res.pinAwal}`,
    '',
    'Mohon PIN dijaga dan tidak dibagikan kepada orang lain. Terima kasih.'
  ].join('\n');
  const url = w ? linkWa(w.noHp, pesan) : '';
  openModal(`
    <div class="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 text-center">
      <div class="w-12 h-12 mx-auto rounded-full bg-emerald-50 flex items-center justify-center mb-3">
        <i data-lucide="key-round" class="w-6 h-6 text-emerald-600"></i>
      </div>
      <h3 class="font-extrabold text-base text-slate-800">PIN Login Dibuat Otomatis</h3>
      <p class="text-xs text-slate-500 mt-1">PIN ini hanya ditampilkan sekali dan tidak bisa dilihat lagi. Berikan kepada ${res.namaLengkap}.</p>
      <div class="my-4 py-4 rounded-2xl bg-slate-50 border border-slate-200">
        <div class="text-[11px] text-slate-400">${res.idWarga}</div>
        <div class="text-3xl font-extrabold tracking-[0.3em] text-[#0D47A1] mt-1">${res.pinAwal}</div>
      </div>
      <div class="flex flex-wrap justify-center gap-2 text-xs">
        ${url ? `<button onclick="window.open(${JSON.stringify(url).replace(/"/g, '&quot;')}, '_blank', 'noopener')" class="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer inline-flex items-center gap-2"><i data-lucide="send" class="w-4 h-4"></i><span>Kirim via WhatsApp</span></button>` : ''}
        <button onclick="closeModal()" class="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold cursor-pointer">Selesai</button>
      </div>
      <p class="text-[10px] text-slate-400 mt-3">Jika PIN hilang, buka Edit Peserta lalu isi PIN Baru.</p>
    </div>
  `);
};
