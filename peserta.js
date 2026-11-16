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
            const anggota = APP_STATE.warga.filter(w => w.kelompokHewan === klp.namaKelompok);
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
                  <h4 class="font-extrabold text-sm text-slate-800 mt-3">${klp.namaKelompok}</h4>
                  <p class="text-[11px] text-slate-400 mt-0.5">Status: <strong class="text-slate-600">${klp.statusPengadaan}</strong></p>

                  <div class="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                    ${anggota.length === 0
                      ? '<p class="text-[11px] text-slate-400 italic">Belum ada peserta terdaftar.</p>'
                      : anggota.map((a, idx) => `
                        <div class="flex items-center justify-between text-xs">
                          <span class="text-slate-700 font-medium truncate">${idx + 1}. ${a.namaLengkap}</span>
                          <span class="text-[10px] font-bold ${a.statusLunas ? 'text-emerald-600' : 'text-amber-600'}">
                            ${a.statusLunas ? 'Lunas' : 'Cicilan'}
                          </span>
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
          <h3 class="font-extrabold text-sm text-slate-800">Daftar Peserta Kurban RT (${filteredWarga.length})</h3>
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
                        <button onclick="openModalTambahSetoran('${w.idWarga}')" title="Catat Setoran"
                          class="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-[#0D47A1] text-[#0D47A1] hover:text-white font-bold text-[11px] transition-all cursor-pointer mr-1">
                          + Setor
                        </button>
                        <button onclick="openModalEditPeserta('${w._docId}')" title="Edit Peserta / Reset PIN"
                          class="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-700 text-slate-600 hover:text-white transition-all cursor-pointer mr-1">
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
            <label class="block font-bold text-slate-700 mb-1">PIN Login Warga (4 Digit)</label>
            <input type="text" id="inp-pin" required value="1234" maxlength="6" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0D47A1]" />
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
        pinLogin: document.getElementById('inp-pin').value.trim() || '1234',
        jenisKurban: document.getElementById('inp-jenis').value,
        kelompokHewan: document.getElementById('inp-kelompok').value,
        targetIuran: Number(document.getElementById('inp-target').value)
      });
      closeModal();
      showToast(`Warga ${res.namaLengkap} (${res.idWarga}) berhasil didaftarkan!`, 'success');
      renderActivePageContent();
    });
  });
};

// Hanya tampilkan kelompok yang jenis hewannya cocok dengan paket yang dipilih.
function kelompokOptionsHTML(jenis) {
  const list = APP_STATE.kelompok.filter(k => k.jenisHewan === jenis);
  if (list.length === 0) return '<option value="">(Belum ada kelompok untuk paket ini)</option>';
  return list.map(k => {
    const terisi = APP_STATE.warga.filter(w => w.kelompokHewan === k.namaKelompok).length;
    const penuh = terisi >= k.kapasitas;
    return `<option value="${k.namaKelompok}" ${penuh ? 'disabled' : ''}>${k.namaKelompok} (${terisi}/${k.kapasitas}${penuh ? ' • penuh' : ''})</option>`;
  }).join('');
}

window.onJenisPesertaChange = function (jenis) {
  const s = APP_STATE.settings;
  const harga = jenis === 'Sapi Patungan' ? (s?.hargaSapiPatungan || 3500000) : (s?.hargaKambingMandiri || 3200000);
  document.getElementById('inp-target').value = harga;
  document.getElementById('inp-kelompok').innerHTML = kelompokOptionsHTML(jenis);
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

// Opsi kelompok untuk form edit: peserta yang sedang diedit tidak dihitung "terisi".
function kelompokOptionsEditHTML(jenis, w) {
  const list = APP_STATE.kelompok.filter(k => k.jenisHewan === jenis);
  if (list.length === 0) return '<option value="">(Belum ada kelompok untuk paket ini)</option>';
  return list.map(k => {
    const terisi = APP_STATE.warga.filter(x => x.kelompokHewan === k.namaKelompok && x._docId !== w._docId).length;
    const penuh = terisi >= k.kapasitas;
    return `<option value="${k.namaKelompok}" ${penuh ? 'disabled' : ''} ${k.namaKelompok === w.kelompokHewan ? 'selected' : ''}>${k.namaKelompok} (${terisi}/${k.kapasitas}${penuh ? ' • penuh' : ''})</option>`;
  }).join('');
}

window.onJenisEditPesertaChange = function (jenis) {
  const w = APP_STATE.warga.find(x => x._docId === window._editPesertaId);
  if (!w) return;
  const s = APP_STATE.settings;
  if (jenis !== w.jenisKurban) {
    document.getElementById('edt-target').value = jenis === 'Sapi Patungan' ? (s?.hargaSapiPatungan || 3500000) : (s?.hargaKambingMandiri || 3200000);
  } else {
    document.getElementById('edt-target').value = w.targetIuran;
  }
  document.getElementById('edt-kelompok').innerHTML = kelompokOptionsEditHTML(jenis, w);
};

window.openModalEditPeserta = function (docId) {
  const w = APP_STATE.warga.find(x => x._docId === docId);
  if (!w) return;
  window._editPesertaId = docId;
  const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0D47A1]';

  openModal(`
    <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h3 class="font-extrabold text-base text-slate-800">Edit Peserta</h3>
          <p class="text-[11px] text-slate-400">${w.idWarga}</p>
        </div>
        <button onclick="closeModal()" class="text-slate-400 hover:text-slate-700 cursor-pointer"><i data-lucide="x" class="w-5 h-5"></i></button>
      </div>
      <form id="form-edit-peserta" class="space-y-4 mt-4 text-xs">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Nama Lengkap Warga</label>
            <input type="text" id="edt-nama" required value="${w.namaLengkap}" class="${inputCls}" />
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Blok & Nomor Rumah</label>
            <input type="text" id="edt-blok" required value="${w.blokRumah}" class="${inputCls}" />
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Nomor HP / WhatsApp</label>
            <input type="text" id="edt-hp" required value="${w.noHp || ''}" class="${inputCls}" />
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Reset PIN Login <span class="font-normal text-slate-400">(opsional)</span></label>
            <input type="text" id="edt-pin" maxlength="6" inputmode="numeric" autocomplete="off" placeholder="Kosongkan = tidak diubah" class="${inputCls}" />
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Paket Hewan Kurban</label>
            <select id="edt-jenis" onchange="onJenisEditPesertaChange(this.value)" class="${inputCls}">
              <option value="Sapi Patungan" ${w.jenisKurban === 'Sapi Patungan' ? 'selected' : ''}>Sapi Patungan (1/7)</option>
              <option value="Kambing" ${w.jenisKurban === 'Kambing' ? 'selected' : ''}>Kambing Mandiri</option>
            </select>
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Target Iuran (Rp)</label>
            <input type="number" id="edt-target" required value="${w.targetIuran}" class="${inputCls}" />
          </div>
        </div>
        <div>
          <label class="block font-bold text-slate-700 mb-1">Alokasi Kelompok Hewan</label>
          <select id="edt-kelompok" class="${inputCls}">${kelompokOptionsEditHTML(w.jenisKurban, w)}</select>
        </div>
        <p class="text-[11px] text-slate-400">Total terbayar (${formatRupiah(w.totalTerbayar)}) tidak berubah; status lunas dihitung ulang dari target baru.</p>
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
      const newPin = document.getElementById('edt-pin').value.trim();
      await apiCall('warga_update', {
        docId,
        namaLengkap: document.getElementById('edt-nama').value.trim(),
        blokRumah: document.getElementById('edt-blok').value.trim(),
        noHp: document.getElementById('edt-hp').value.trim(),
        jenisKurban: document.getElementById('edt-jenis').value,
        kelompokHewan: document.getElementById('edt-kelompok').value,
        targetIuran: Number(document.getElementById('edt-target').value),
        newPin
      });
      closeModal();
      showToast(newPin ? 'Data peserta & PIN berhasil diperbarui!' : 'Data peserta berhasil diperbarui!', 'success');
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
