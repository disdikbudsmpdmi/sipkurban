// =========================================================================
// 10. HALAMAN 3: CATAT & RIWAYAT IURAN + KUITANSI DIGITAL SIAP CETAK
// =========================================================================
function renderSetoranView(container) {
  const user = APP_STATE.currentUser;
  const isAdmin = user.role === 'admin';
  const q = APP_STATE.searchQuery;

  let listTrx = isAdmin
    ? APP_STATE.transaksi
    : APP_STATE.transaksi.filter(t => t.idWarga === user.wargaData.idWarga);

  if (q) {
    listTrx = listTrx.filter(t =>
      t.namaWarga.toLowerCase().includes(q) ||
      t.idTransaksi.toLowerCase().includes(q) ||
      t.metodeBayar.toLowerCase().includes(q)
    );
  }

  container.innerHTML = `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/70 shadow-2xs">
        <div>
          <h2 class="text-lg font-extrabold text-slate-800">${isAdmin ? 'Pencatatan & Mutasi Setoran Iuran' : 'Riwayat Setoran & Kuitansi Digital'}</h2>
          <p class="text-xs text-slate-500 mt-0.5">Setiap setoran otomatis memperbarui saldo pelunasan dan menghasilkan kuitansi resmi panitia RT.</p>
        </div>
        ${isAdmin ? `
          <button onclick="openModalTambahSetoran()"
            class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0A3D91] to-[#1976D2] text-white text-xs font-bold inline-flex items-center gap-2 shadow-md shadow-blue-900/15 cursor-pointer">
            <i data-lucide="plus-circle" class="w-4 h-4"></i>
            <span>Catat Setoran Baru</span>
          </button>
        ` : ''}
      </div>

      <!-- Tabel Mutasi Transaksi -->
      <div class="bg-white rounded-2xl border border-slate-200/70 shadow-2xs overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-[#F4F7FE] text-slate-500 text-[11px] font-extrabold uppercase tracking-wider">
                <th class="py-3.5 px-4">No. Kuitansi & Tanggal</th>
                <th class="py-3.5 px-4">Nama Peserta</th>
                <th class="py-3.5 px-4">Metode Bayar</th>
                <th class="py-3.5 px-4">Nominal Setoran</th>
                <th class="py-3.5 px-4 text-right">${isAdmin ? 'Aksi & Kuitansi' : 'Kuitansi'}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-xs">
              ${listTrx.length === 0 ? `
                <tr><td colspan="5" class="py-8 text-center text-slate-400">Belum ada riwayat transaksi setoran ditemukan.</td></tr>
              ` : listTrx.map(t => `
                <tr class="hover:bg-blue-50/30 transition-colors">
                  <td class="py-3.5 px-4">
                    <div class="font-extrabold text-[#0D47A1]">${t.idTransaksi}</div>
                    <div class="text-[11px] text-slate-400">${fmtTgl(t.tanggalSetor)}</div>
                  </td>
                  <td class="py-3.5 px-4">
                    <div class="font-bold text-slate-800">${t.namaWarga}</div>
                    <div class="text-[11px] text-slate-400">${t.idWarga} • ${t.catatan || '-'}</div>
                  </td>
                  <td class="py-3.5 px-4">
                    <span class="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[11px]">${t.metodeBayar}</span>
                  </td>
                  <td class="py-3.5 px-4 font-extrabold text-emerald-600 text-sm">
                    +${formatRupiah(t.nominal)}
                  </td>
                  <td class="py-3.5 px-4 text-right whitespace-nowrap">
                    ${isAdmin ? `
                      <button onclick="openModalEditSetoran('${t._docId}')" title="Edit Setoran"
                        class="p-1.5 rounded-lg bg-blue-50 hover:bg-[#0D47A1] text-[#0D47A1] hover:text-white transition-all cursor-pointer mr-1 align-middle">
                        <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
                      </button>
                      <button onclick="hapusSetoran('${t._docId}')" title="Hapus Setoran"
                        class="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white transition-all cursor-pointer mr-1 align-middle">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                      </button>
                    ` : ''}
                    <button onclick="openModalKuitansi('${t.idTransaksi}')"
                      class="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-[#0D47A1] text-[#0D47A1] hover:text-white font-bold text-[11px] inline-flex items-center gap-1.5 transition-all cursor-pointer">
                      <i data-lucide="printer" class="w-3.5 h-3.5"></i>
                      <span>Lihat & Cetak</span>
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

window.openModalTambahSetoran = function (preselectIdWarga = '') {
  const today = new Date().toISOString().split('T')[0];
  openModal(`
    <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
      <div class="flex items-center justify-between pb-4 border-b border-slate-100">
        <h3 class="font-extrabold text-base text-slate-800">Catat Setoran Iuran Kurban</h3>
        <button onclick="closeModal()" class="text-slate-400 hover:text-slate-700 cursor-pointer"><i data-lucide="x" class="w-5 h-5"></i></button>
      </div>
      <form id="form-tambah-setoran" class="space-y-4 mt-4 text-xs">
        <div>
          <label class="block font-bold text-slate-700 mb-1">Pilih Warga Peserta Kurban</label>
          <select id="trx-warga" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0D47A1]">
            ${APP_STATE.warga.map(w => {
              const sisa = Math.max(0, w.targetIuran - w.totalTerbayar);
              return `<option value="${w.idWarga}" ${w.idWarga === preselectIdWarga ? 'selected' : ''}>
                ${w.namaLengkap} (${w.idWarga}) — Sisa: ${formatRupiah(sisa)}
              </option>`;
            }).join('')}
          </select>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Nominal Setoran (Rp)</label>
            <input type="number" id="trx-nominal" required min="50000" step="10000" placeholder="500000"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0D47A1]" />
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Tanggal Setor</label>
            <input type="date" id="trx-tanggal" required value="${today}"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0D47A1]" />
          </div>
        </div>
        <div>
          <label class="block font-bold text-slate-700 mb-1">Metode Pembayaran</label>
          <select id="trx-metode" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0D47A1]">
            <option value="Tunai">Tunai (Langsung ke Bendahara)</option>
            <option value="Transfer BCA">Transfer Bank BCA</option>
            <option value="Transfer BSI">Transfer Bank BSI</option>
            <option value="Transfer Mandiri">Transfer Bank Mandiri</option>
            <option value="QRIS Masjid">QRIS Panitia Kurban</option>
          </select>
        </div>
        <div>
          <label class="block font-bold text-slate-700 mb-1">Catatan / Keterangan</label>
          <input type="text" id="trx-catatan" placeholder="Contoh: Cicilan ke-2 atau Pelunasan"
            class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0D47A1]" />
        </div>
        <div class="pt-3 flex justify-end gap-2">
          <button type="button" onclick="closeModal()" class="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold cursor-pointer">Batal</button>
          <button type="submit" class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer">Simpan & Terbitkan Kuitansi</button>
        </div>
      </form>
    </div>
  `);

  document.getElementById('form-tambah-setoran').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.submitter || e.target.querySelector('[type=submit]');
    const idWarga = document.getElementById('trx-warga').value;
    const nominal = Number(document.getElementById('trx-nominal').value);
    const wargaObj = APP_STATE.warga.find(w => w.idWarga === idWarga);

    await runBusy(btn, async () => {
      const res = await apiCall('transaksi_add', {
        idWarga,
        nominal,
        metodeBayar: document.getElementById('trx-metode').value,
        tanggalSetor: document.getElementById('trx-tanggal').value,
        catatan: document.getElementById('trx-catatan').value.trim()
      });
      closeModal();
      showToast(`Setoran ${formatRupiah(nominal)} untuk ${wargaObj ? wargaObj.namaLengkap : 'peserta'} berhasil dicatat!`, 'success');
      renderActivePageContent();
      setTimeout(() => openModalKuitansi(res.idTransaksi), 250);
    });
  });
};

window.openModalKuitansi = function (idTransaksi) {
  const trx = APP_STATE.transaksi.find(t => t.idTransaksi === idTransaksi);
  if (!trx) return;
  const warga = APP_STATE.warga.find(w => w.idWarga === trx.idWarga);
  const rtName = APP_STATE.settings?.namaRT || 'RT 05 / RW 03 Perumahan Griya Asri';
  const logoUrl = APP_STATE.settings?.logoUrl || 'https://placehold.co/128x128/0D47A1/FFFFFF?text=RT05';

  openModal(`
    <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
      <div id="receipt-printable" class="space-y-5">
        <!-- Header Kop Kuitansi -->
        <div class="flex items-center justify-between border-b-2 border-dashed border-slate-200 pb-4">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-xl bg-white border border-slate-200 text-[#0D47A1] flex items-center justify-center font-extrabold overflow-hidden shrink-0 shadow-2xs">
              <img src="${logoUrl}" alt="Logo Kuitansi" class="w-full h-full object-cover" onerror="this.src='https://placehold.co/128x128/0D47A1/FFFFFF?text=RT'" />
            </div>
            <div>
              <div class="font-extrabold text-sm text-[#0A3D91]">PANITIA KURBAN ${rtName.toUpperCase()}</div>
              <div class="text-[11px] text-slate-500">Bukti Penerimaan Iuran / Tabungan Kurban</div>
            </div>
          </div>
          <div class="text-right">
            <span class="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-extrabold text-xs border border-emerald-200">SAH / TERCATAT</span>
            <div class="text-[11px] font-bold text-slate-400 mt-1">${trx.idTransaksi}</div>
          </div>
        </div>

        <!-- Rincian Kuitansi -->
        <div class="bg-[#F4F7FE] rounded-2xl p-4 space-y-2.5 text-xs">
          <div class="flex justify-between">
            <span class="text-slate-500">Telah Diterima Dari:</span>
            <span class="font-extrabold text-slate-800">${trx.namaWarga} (${trx.idWarga})</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Alamat / Blok:</span>
            <span class="font-semibold text-slate-700">${warga?.blokRumah || '-'}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Paket & Kelompok:</span>
            <span class="font-semibold text-slate-700">${warga?.jenisKurban || '-'} (${warga?.kelompokHewan || '-'})</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Tanggal & Metode:</span>
            <span class="font-semibold text-slate-700">${fmtTgl(trx.tanggalSetor)} • ${trx.metodeBayar}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Keterangan:</span>
            <span class="font-semibold text-slate-700">${trx.catatan || '-'}</span>
          </div>
        </div>

        <!-- Nominal Besar -->
        <div class="p-4 rounded-2xl bg-gradient-to-r from-[#0A3D91] to-[#1976D2] text-white flex items-center justify-between">
          <div>
            <div class="text-[11px] text-blue-100">Nominal Setoran Diterima</div>
            <div class="text-xl sm:text-2xl font-extrabold mt-0.5">${formatRupiah(trx.nominal)}</div>
          </div>
          <div class="text-right text-[11px] text-blue-100">
            <div>Total Terkumpul:</div>
            <div class="font-bold text-white">${formatRupiah(warga?.totalTerbayar || trx.nominal)}</div>
          </div>
        </div>

        <div class="flex items-center justify-between pt-2 text-[11px] text-slate-500">
          <div>Dicatat oleh: <strong class="text-slate-700">${trx.dicatatOleh}</strong></div>
          <div>Idul Adha ${APP_STATE.settings?.tahunHijriah || '1448 H'}</div>
        </div>
      </div>

      <!-- Tombol Aksi Kuitansi (Tidak ikut tercetak saat Print) -->
      <div class="mt-6 pt-4 border-t border-slate-100 flex justify-end gap-2.5 no-print">
        <button onclick="closeModal()" class="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer">
          Tutup
        </button>
        <button onclick="document.body.classList.remove('printing-report'); window.print();"
          class="px-5 py-2.5 rounded-xl bg-[#0D47A1] hover:bg-blue-800 text-white font-bold text-xs inline-flex items-center gap-2 cursor-pointer">
          <i data-lucide="printer" class="w-4 h-4"></i>
          <span>Cetak / Simpan PDF</span>
        </button>
      </div>
    </div>
  `);
};


// -------------------------------------------------------------------------
// EDIT & HAPUS SETORAN (khusus admin)
// -------------------------------------------------------------------------
window.openModalEditSetoran = function (docId) {
  const t = APP_STATE.transaksi.find(x => x._docId === docId);
  if (!t) return;
  const inp = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0D47A1]';
  const metode = ['Tunai', 'Transfer BCA', 'Transfer BSI', 'Transfer Mandiri', 'QRIS Masjid'];

  openModal(`
    <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
      <div class="flex items-center justify-between pb-4 border-b border-slate-100">
        <h3 class="font-extrabold text-base text-slate-800">Edit Setoran ${t.idTransaksi}</h3>
        <button onclick="closeModal()" class="text-slate-400 hover:text-slate-700 cursor-pointer"><i data-lucide="x" class="w-5 h-5"></i></button>
      </div>
      <form id="form-edit-setoran" class="space-y-4 mt-4 text-xs">
        <div class="px-3.5 py-2.5 rounded-xl bg-[#F4F7FE] text-slate-600">
          Peserta: <strong class="text-slate-800">${t.namaWarga} (${t.idWarga})</strong>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Nominal Setoran (Rp)</label>
            <input type="number" id="trx-nominal" required min="1" value="${t.nominal}" class="${inp}" />
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Tanggal Setor</label>
            <input type="date" id="trx-tanggal" required value="${t.tanggalSetor}" class="${inp}" />
          </div>
        </div>
        <div>
          <label class="block font-bold text-slate-700 mb-1">Metode Pembayaran</label>
          <select id="trx-metode" class="${inp}">
            ${metode.map(m => `<option value="${m}" ${m === t.metodeBayar ? 'selected' : ''}>${m}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block font-bold text-slate-700 mb-1">Catatan / Keterangan</label>
          <input type="text" id="trx-catatan" value="${t.catatan || ''}" class="${inp}" />
        </div>
        <p class="text-[11px] text-slate-400">Total terbayar & status lunas peserta akan disesuaikan otomatis. Salah peserta? Hapus setoran lalu catat ulang.</p>
        <div class="pt-3 flex justify-end gap-2">
          <button type="button" onclick="closeModal()" class="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold cursor-pointer">Batal</button>
          <button type="submit" class="px-5 py-2.5 rounded-xl bg-[#0D47A1] text-white font-bold cursor-pointer">Simpan Perubahan</button>
        </div>
      </form>
    </div>
  `);

  document.getElementById('form-edit-setoran').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.submitter || e.target.querySelector('[type=submit]');
    await runBusy(btn, async () => {
      await apiCall('transaksi_update', {
        docId,
        nominal: Number(document.getElementById('trx-nominal').value),
        metodeBayar: document.getElementById('trx-metode').value,
        tanggalSetor: document.getElementById('trx-tanggal').value,
        catatan: document.getElementById('trx-catatan').value.trim()
      });
      closeModal();
      showToast('Setoran berhasil diperbarui!', 'success');
      renderActivePageContent();
    });
  });
};

window.hapusSetoran = async function (docId) {
  const t = APP_STATE.transaksi.find(x => x._docId === docId);
  if (!t) return;
  if (!confirm(`Hapus setoran ${t.idTransaksi} (${formatRupiah(t.nominal)}) milik ${unesc(t.namaWarga)}?\n\nSaldo terbayar peserta akan dikurangi sesuai nominal tersebut.`)) return;
  await runBusy(null, async () => {
    await apiCall('transaksi_delete', { docId });
    showToast(`Setoran ${t.idTransaksi} telah dihapus.`, 'info');
    renderActivePageContent();
  });
};
