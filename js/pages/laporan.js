// =========================================================================
// 8B. MENU CETAK LAPORAN RESMI PANITIA KURBAN RT (A4 PRINT + EXPORT CSV)
// =========================================================================
window.updateReportFilter = (key, value) => {
  APP_STATE.reportFilter[key] = value;
  renderActivePageContent();
};

window.printLaporanA4 = () => {
  document.body.classList.add('printing-report');
  window.print();
  setTimeout(() => {
    document.body.classList.remove('printing-report');
  }, 600);
};

window.exportLaporanCSV = () => {
  const f = APP_STATE.reportFilter;
  const user = APP_STATE.currentUser;
  const isAdmin = user.role === 'admin';
  let csvRows = [];
  let filename = 'laporan_kurban_rt.csv';

  const escapeCSV = (val) => `"${unesc(val ?? '').replace(/"/g, '""')}"`;

  if (f.type === 'rekap_warga') {
    filename = `Rekapitulasi_Iuran_Kurban_${fmtTgl(new Date())}.csv`;
    csvRows.push(['No', 'ID Warga', 'Nama Lengkap', 'Blok Rumah', 'No HP', 'Jenis Kurban', 'Kelompok Hewan', 'Target Iuran (Rp)', 'Total Terbayar (Rp)', 'Sisa Tagihan (Rp)', 'Status'].map(escapeCSV).join(','));
    const filtered = getFilteredWargaForReport();
    filtered.forEach((w, idx) => {
      const sisa = Math.max(0, Number(w.targetIuran) - Number(w.totalTerbayar));
      const status = (w.statusLunas || w.totalTerbayar >= w.targetIuran) ? 'LUNAS' : 'CICILAN';
      csvRows.push([
        idx + 1, w.idWarga, w.namaLengkap, w.blokRumah, w.noHp,
        w.jenisKurban, w.kelompokHewan, w.targetIuran, w.totalTerbayar, sisa, status
      ].map(escapeCSV).join(','));
    });
  } else if (f.type === 'mutasi_kas') {
    filename = `Mutasi_Kas_Iuran_Kurban_${fmtTgl(new Date())}.csv`;
    csvRows.push(['No', 'No Kuitansi', 'Tanggal Setor', 'ID Warga', 'Nama Warga', 'Nominal (Rp)', 'Metode Bayar', 'Dicatat Oleh', 'Catatan'].map(escapeCSV).join(','));
    const filtered = getFilteredTransaksiForReport();
    filtered.forEach((t, idx) => {
      csvRows.push([
        idx + 1, t.idTransaksi, fmtTgl(t.tanggalSetor), t.idWarga, t.namaWarga,
        t.nominal, t.metodeBayar, t.dicatatOleh, t.catatan || '-'
      ].map(escapeCSV).join(','));
    });
  } else if (f.type === 'kelompok_hewan') {
    filename = `Daftar_Kelompok_Hewan_Kurban_${fmtTgl(new Date())}.csv`;
    csvRows.push(['No', 'Kode Kelompok', 'Nama Kelompok', 'Jenis Hewan', 'Kapasitas', 'Terisi', 'Status Pengadaan', 'Daftar Nama Anggota'].map(escapeCSV).join(','));
    const filteredKlp = APP_STATE.kelompok.filter(k => f.jenisKurban === 'semua' || k.jenisHewan === f.jenisKurban);
    filteredKlp.forEach((k, idx) => {
      const anggota = APP_STATE.warga.filter(w => w.kelompokHewan === k.namaKelompok).map(a => a.namaLengkap).join('; ');
      const count = APP_STATE.warga.filter(w => w.kelompokHewan === k.namaKelompok).length;
      csvRows.push([
        idx + 1, k.idKelompok, k.namaKelompok, k.jenisHewan, k.kapasitas, count, k.statusPengadaan, anggota || 'Belum ada'
      ].map(escapeCSV).join(','));
    });
  } else if (f.type === 'pribadi_warga') {
    const targetWarga = !isAdmin && user.wargaData
      ? user.wargaData
      : (APP_STATE.warga.find(w => w.idWarga === f.selectedWargaId) || APP_STATE.warga[0]);
    filename = `Kartu_Kendali_Iuran_${(targetWarga?.namaLengkap || 'Warga').replace(/\s+/g, '_')}.csv`;
    csvRows.push(['No', 'No Kuitansi', 'Tanggal Setor', 'Nominal (Rp)', 'Metode Bayar', 'Penerima', 'Catatan'].map(escapeCSV).join(','));
    const trxWarga = targetWarga ? APP_STATE.transaksi.filter(t => t.idWarga === targetWarga.idWarga) : [];
    trxWarga.forEach((t, idx) => {
      csvRows.push([
        idx + 1, t.idTransaksi, fmtTgl(t.tanggalSetor), t.nominal, t.metodeBayar, t.dicatatOleh, t.catatan || '-'
      ].map(escapeCSV).join(','));
    });
  }

  const csvContent = '\uFEFF' + csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(`File "${filename}" berhasil diunduh!`, 'success');
};

function getFilteredWargaForReport() {
  const f = APP_STATE.reportFilter;
  return APP_STATE.warga.filter(w => {
    const isLunas = w.statusLunas || Number(w.totalTerbayar) >= Number(w.targetIuran);
    if (f.statusLunas === 'lunas' && !isLunas) return false;
    if (f.statusLunas === 'belum' && isLunas) return false;
    if (f.jenisKurban !== 'semua' && w.jenisKurban !== f.jenisKurban) return false;
    return true;
  });
}

function getFilteredTransaksiForReport() {
  const f = APP_STATE.reportFilter;
  return APP_STATE.transaksi.filter(t => {
    const wargaObj = APP_STATE.warga.find(w => w.idWarga === t.idWarga);
    if (f.jenisKurban !== 'semua' && wargaObj && wargaObj.jenisKurban !== f.jenisKurban) return false;
    if (f.statusLunas !== 'semua' && wargaObj) {
      const isLunas = wargaObj.statusLunas || Number(wargaObj.totalTerbayar) >= Number(wargaObj.targetIuran);
      if (f.statusLunas === 'lunas' && !isLunas) return false;
      if (f.statusLunas === 'belum' && isLunas) return false;
    }
    if (f.metodeBayar !== 'semua') {
      if (f.metodeBayar === 'Tunai' && t.metodeBayar !== 'Tunai') return false;
      if (f.metodeBayar === 'Transfer' && t.metodeBayar === 'Tunai') return false;
    }
    if (f.tglMulai && (t.tanggalSetor || '') < f.tglMulai) return false;
    if (f.tglSelesai && (t.tanggalSetor || '') > f.tglSelesai) return false;
    return true;
  });
}

function renderLaporanView(container) {
  const user = APP_STATE.currentUser;
  const isAdmin = user.role === 'admin';
  const f = APP_STATE.reportFilter;
  if (!isAdmin && f.type === 'mutasi_kas') f.type = 'pribadi_warga';   // ledger kas hanya untuk panitia
  const s = APP_STATE.settings;
  const rtName = s?.namaRT || 'RT 05 / RW 03 Perumahan Griya Asri';
  const tahunHijriah = s?.tahunHijriah || '1448 H / 2027 M';
  const tanggalCetak = fmtTgl(new Date());

  const totalTargetAll = APP_STATE.warga.reduce((acc, w) => acc + Number(w.targetIuran || 0), 0);
  const totalTerkumpulAll = APP_STATE.warga.reduce((acc, w) => acc + Number(w.totalTerbayar || 0), 0);
  const sisaAll = Math.max(0, totalTargetAll - totalTerkumpulAll);
  const countLunas = APP_STATE.warga.filter(w => w.statusLunas || w.totalTerbayar >= w.targetIuran).length;

  let judulDokumen = '';
  let subJudulDokumen = '';
  let bodyDokumenHTML = '';

  if (f.type === 'rekap_warga') {
    judulDokumen = 'LAPORAN REKAPITULASI IURAN & STATUS PELUNASAN WARGA';
    subJudulDokumen = `Filter Status: ${f.statusLunas === 'semua' ? 'Semua Peserta' : (f.statusLunas === 'lunas' ? 'Sudah Lunas' : 'Belum Lunas (Cicilan)')} • Paket: ${f.jenisKurban === 'semua' ? 'Semua Jenis Hewan' : f.jenisKurban}`;
    const list = getFilteredWargaForReport();
    const sumTarget = list.reduce((a, w) => a + Number(w.targetIuran || 0), 0);
    const sumBayar = list.reduce((a, w) => a + Number(w.totalTerbayar || 0), 0);
    const sumSisa = Math.max(0, sumTarget - sumBayar);

    bodyDokumenHTML = `
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse border border-slate-300 text-[11px]">
          <thead>
            <tr class="bg-slate-100 text-slate-800 font-extrabold uppercase">
              <th class="border border-slate-300 py-2 px-2.5 text-center w-9">No</th>
              <th class="border border-slate-300 py-2 px-2.5">ID Warga</th>
              <th class="border border-slate-300 py-2 px-2.5">Nama Shohibul Kurban</th>
              <th class="border border-slate-300 py-2 px-2.5">Blok / Alamat</th>
              <th class="border border-slate-300 py-2 px-2.5">Paket & Kelompok</th>
              <th class="border border-slate-300 py-2 px-2.5 text-right">Target Iuran</th>
              <th class="border border-slate-300 py-2 px-2.5 text-right">Terbayar</th>
              <th class="border border-slate-300 py-2 px-2.5 text-right">Sisa Tagihan</th>
              <th class="border border-slate-300 py-2 px-2.5 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            ${list.length === 0 ? `
              <tr><td colspan="9" class="border border-slate-300 py-6 text-center text-slate-500">Tidak ada data peserta yang sesuai dengan filter laporan.</td></tr>
            ` : list.map((w, i) => {
              const lunas = w.statusLunas || Number(w.totalTerbayar) >= Number(w.targetIuran);
              const sisa = Math.max(0, Number(w.targetIuran) - Number(w.totalTerbayar));
              return `
                <tr class="${i % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}">
                  <td class="border border-slate-300 py-2 px-2.5 text-center font-semibold">${i + 1}</td>
                  <td class="border border-slate-300 py-2 px-2.5 font-mono text-[10px]">${w.idWarga}</td>
                  <td class="border border-slate-300 py-2 px-2.5 font-bold text-slate-800">${w.namaLengkap}</td>
                  <td class="border border-slate-300 py-2 px-2.5">${w.blokRumah}</td>
                  <td class="border border-slate-300 py-2 px-2.5">
                    <span class="font-bold">${w.jenisKurban}</span><br/>
                    <span class="text-[10px] text-slate-500">${w.kelompokHewan}</span>
                  </td>
                  <td class="border border-slate-300 py-2 px-2.5 text-right">${formatRupiah(w.targetIuran)}</td>
                  <td class="border border-slate-300 py-2 px-2.5 text-right font-bold text-slate-800">${formatRupiah(w.totalTerbayar)}</td>
                  <td class="border border-slate-300 py-2 px-2.5 text-right ${sisa > 0 ? 'text-amber-700 font-semibold' : 'text-slate-400'}">${formatRupiah(sisa)}</td>
                  <td class="border border-slate-300 py-2 px-2.5 text-center">
                    <span class="px-2 py-0.5 rounded font-extrabold text-[10px] ${lunas ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
                      ${lunas ? 'LUNAS' : 'CICILAN'}
                    </span>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
          <tfoot>
            <tr class="bg-blue-50/80 font-extrabold text-slate-900">
              <td colspan="5" class="border border-slate-300 py-2.5 px-3 text-right uppercase">Total Keseluruhan (${list.length} Peserta)</td>
              <td class="border border-slate-300 py-2.5 px-2.5 text-right">${formatRupiah(sumTarget)}</td>
              <td class="border border-slate-300 py-2.5 px-2.5 text-right text-[#0D47A1]">${formatRupiah(sumBayar)}</td>
              <td class="border border-slate-300 py-2.5 px-2.5 text-right text-amber-800">${formatRupiah(sumSisa)}</td>
              <td class="border border-slate-300 py-2.5 px-2.5 text-center">${sumTarget > 0 ? Math.round((sumBayar / sumTarget) * 100) : 0}%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
  } else if (f.type === 'mutasi_kas') {
    judulDokumen = 'LAPORAN MUTASI KAS & RIWAYAT SETORAN IURAN KURBAN';
    const periodeTxt = (f.tglMulai || f.tglSelesai) ? `${fmtTgl(f.tglMulai) || 'Awal'} s/d ${fmtTgl(f.tglSelesai) || 'Sekarang'}` : 'Seluruh Periode';
    subJudulDokumen = `Periode: ${periodeTxt} • Metode Bayar: ${f.metodeBayar === 'semua' ? 'Semua Metode (Tunai & Transfer)' : f.metodeBayar}`;
    const listTrx = getFilteredTransaksiForReport();
    const totalKasMasuk = listTrx.reduce((a, t) => a + Number(t.nominal || 0), 0);

    bodyDokumenHTML = `
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse border border-slate-300 text-[11px]">
          <thead>
            <tr class="bg-slate-100 text-slate-800 font-extrabold uppercase">
              <th class="border border-slate-300 py-2 px-2.5 text-center w-9">No</th>
              <th class="border border-slate-300 py-2 px-2.5">No. Kuitansi</th>
              <th class="border border-slate-300 py-2 px-2.5">Tanggal</th>
              <th class="border border-slate-300 py-2 px-2.5">Nama Warga (ID)</th>
              <th class="border border-slate-300 py-2 px-2.5">Metode Bayar</th>
              <th class="border border-slate-300 py-2 px-2.5">Keterangan</th>
              <th class="border border-slate-300 py-2 px-2.5">Penerima</th>
              <th class="border border-slate-300 py-2 px-2.5 text-right">Nominal Masuk</th>
            </tr>
          </thead>
          <tbody>
            ${listTrx.length === 0 ? `
              <tr><td colspan="8" class="border border-slate-300 py-6 text-center text-slate-500">Tidak ada transaksi setoran pada rentang filter yang dipilih.</td></tr>
            ` : listTrx.map((t, i) => `
              <tr class="${i % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}">
                <td class="border border-slate-300 py-2 px-2.5 text-center">${i + 1}</td>
                <td class="border border-slate-300 py-2 px-2.5 font-bold text-[#0D47A1]">${t.idTransaksi}</td>
                <td class="border border-slate-300 py-2 px-2.5 whitespace-nowrap">${fmtTgl(t.tanggalSetor)}</td>
                <td class="border border-slate-300 py-2 px-2.5 font-bold">${t.namaWarga} <span class="font-normal text-slate-500">(${t.idWarga})</span></td>
                <td class="border border-slate-300 py-2 px-2.5">${t.metodeBayar}</td>
                <td class="border border-slate-300 py-2 px-2.5 text-slate-600">${t.catatan || '-'}</td>
                <td class="border border-slate-300 py-2 px-2.5 text-slate-600">${t.dicatatOleh}</td>
                <td class="border border-slate-300 py-2 px-2.5 text-right font-bold text-slate-800">${formatRupiah(t.nominal)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr class="bg-blue-50/80 font-extrabold text-slate-900">
              <td colspan="7" class="border border-slate-300 py-2.5 px-3 text-right uppercase">Total Kas Masuk (${listTrx.length} Transaksi)</td>
              <td class="border border-slate-300 py-2.5 px-2.5 text-right text-[#0D47A1] text-xs">${formatRupiah(totalKasMasuk)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
  } else if (f.type === 'kelompok_hewan') {
    judulDokumen = 'LAPORAN DAFTAR KELOMPOK HEWAN KURBAN & SHOHIBUL KURBAN';
    subJudulDokumen = `Rincian Pembagian Kelompok Sapi Patungan (1/7) & Kambing Mandiri • ${rtName}`;
    const listKlp = APP_STATE.kelompok.filter(k => f.jenisKurban === 'semua' || k.jenisHewan === f.jenisKurban);

    bodyDokumenHTML = `
      <div class="space-y-4">
        ${listKlp.map((k, idx) => {
          const anggota = APP_STATE.warga.filter(w => w.kelompokHewan === k.namaKelompok);
          const totalDanaKelompok = anggota.reduce((a, w) => a + Number(w.totalTerbayar || 0), 0);
          const totalTargetKelompok = anggota.reduce((a, w) => a + Number(w.targetIuran || 0), 0);
          return `
            <div class="border border-slate-300 rounded-lg overflow-hidden break-inside-avoid">
              <div class="bg-slate-100 px-3.5 py-2.5 border-b border-slate-300 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <span class="font-extrabold text-[#0A3D91]">${idx + 1}. ${k.namaKelompok}</span>
                  <span class="ml-2 px-2 py-0.5 rounded bg-white border border-slate-300 text-[10px] font-bold">${k.jenisHewan}</span>
                </div>
                <div class="text-[11px] font-bold text-slate-700">
                  Kuota: ${anggota.length}/${k.kapasitas} Orang • Status: <span class="text-[#0D47A1]">${k.statusPengadaan}</span>
                </div>
              </div>
              <table class="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr class="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <th class="py-1.5 px-3 w-10 text-center border-r border-slate-200">Slot</th>
                    <th class="py-1.5 px-3 border-r border-slate-200">Nama Shohibul Kurban</th>
                    <th class="py-1.5 px-3 border-r border-slate-200">Blok Rumah</th>
                    <th class="py-1.5 px-3 text-right border-r border-slate-200">Dana Terkumpul</th>
                    <th class="py-1.5 px-3 text-center">Status Bayar</th>
                  </tr>
                </thead>
                <tbody>
                  ${anggota.length === 0 ? `
                    <tr><td colspan="5" class="py-3 px-3 text-center text-slate-400 italic">Belum ada peserta yang ditempatkan di kelompok ini.</td></tr>
                  ` : anggota.map((a, aIdx) => {
                    const lunas = a.statusLunas || Number(a.totalTerbayar) >= Number(a.targetIuran);
                    return `
                      <tr class="border-t border-slate-200">
                        <td class="py-1.5 px-3 text-center border-r border-slate-200 font-semibold">${aIdx + 1}</td>
                        <td class="py-1.5 px-3 border-r border-slate-200 font-bold">${a.namaLengkap}</td>
                        <td class="py-1.5 px-3 border-r border-slate-200">${a.blokRumah}</td>
                        <td class="py-1.5 px-3 text-right border-r border-slate-200 font-semibold">${formatRupiah(a.totalTerbayar)}</td>
                        <td class="py-1.5 px-3 text-center font-bold ${lunas ? 'text-emerald-700' : 'text-amber-700'}">${lunas ? 'LUNAS' : 'CICILAN'}</td>
                      </tr>
                    `;
                  }).join('')}
                  <tr class="border-t border-slate-300 bg-blue-50/60 font-extrabold">
                    <td colspan="3" class="py-1.5 px-3 text-right border-r border-slate-200">Total Kesiapan Dana Kelompok:</td>
                    <td class="py-1.5 px-3 text-right border-r border-slate-200 text-[#0D47A1]">${formatRupiah(totalDanaKelompok)}</td>
                    <td class="py-1.5 px-3 text-center text-[10px]">dari ${formatRupiah(totalTargetKelompok)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } else {
    const targetWarga = !isAdmin && user.wargaData
      ? user.wargaData
      : (APP_STATE.warga.find(w => w.idWarga === f.selectedWargaId) || APP_STATE.warga[0]);
    const trxPribadi = targetWarga ? APP_STATE.transaksi.filter(t => t.idWarga === targetWarga.idWarga) : [];
    const lunasPribadi = targetWarga ? (targetWarga.statusLunas || Number(targetWarga.totalTerbayar) >= Number(targetWarga.targetIuran)) : false;
    const sisaPribadi = targetWarga ? Math.max(0, Number(targetWarga.targetIuran) - Number(targetWarga.totalTerbayar)) : 0;

    judulDokumen = 'KARTU KENDALI & REKAPITULASI IURAN KURBAN PRIBADI';
    subJudulDokumen = `Bukti Riwayat Tabungan / Cicilan Shohibul Kurban • Tahun ${tahunHijriah}`;

    bodyDokumenHTML = targetWarga ? `
      <div class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl border border-slate-300 bg-slate-50/70 text-xs">
          <div class="space-y-1.5">
            <div class="flex justify-between"><span class="text-slate-500">ID Peserta:</span><span class="font-bold">${targetWarga.idWarga}</span></div>
            <div class="flex justify-between"><span class="text-slate-500">Nama Lengkap:</span><span class="font-extrabold text-slate-900">${targetWarga.namaLengkap}</span></div>
            <div class="flex justify-between"><span class="text-slate-500">Blok / Alamat:</span><span class="font-semibold">${targetWarga.blokRumah}</span></div>
            <div class="flex justify-between"><span class="text-slate-500">No. HP / WA:</span><span class="font-semibold">${targetWarga.noHp}</span></div>
          </div>
          <div class="space-y-1.5 sm:border-l sm:border-slate-300 sm:pl-4">
            <div class="flex justify-between"><span class="text-slate-500">Jenis Kurban:</span><span class="font-bold text-[#0D47A1]">${targetWarga.jenisKurban}</span></div>
            <div class="flex justify-between"><span class="text-slate-500">Kelompok Hewan:</span><span class="font-bold">${targetWarga.kelompokHewan}</span></div>
            <div class="flex justify-between"><span class="text-slate-500">Target Iuran:</span><span class="font-bold">${formatRupiah(targetWarga.targetIuran)}</span></div>
            <div class="flex justify-between"><span class="text-slate-500">Status Pelunasan:</span><span class="font-extrabold ${lunasPribadi ? 'text-emerald-700' : 'text-amber-700'}">${lunasPribadi ? 'LUNAS (100%)' : 'CICILAN (Sisa ' + formatRupiah(sisaPribadi) + ')'}</span></div>
          </div>
        </div>

        <table class="w-full text-left border-collapse border border-slate-300 text-[11px]">
          <thead>
            <tr class="bg-slate-100 text-slate-800 font-extrabold uppercase">
              <th class="border border-slate-300 py-2 px-2.5 text-center w-10">No</th>
              <th class="border border-slate-300 py-2 px-2.5">No. Kuitansi</th>
              <th class="border border-slate-300 py-2 px-2.5">Tanggal Setor</th>
              <th class="border border-slate-300 py-2 px-2.5">Metode Bayar</th>
              <th class="border border-slate-300 py-2 px-2.5">Catatan</th>
              <th class="border border-slate-300 py-2 px-2.5">Diterima Oleh</th>
              <th class="border border-slate-300 py-2 px-2.5 text-right">Nominal Setoran</th>
            </tr>
          </thead>
          <tbody>
            ${trxPribadi.length === 0 ? `
              <tr><td colspan="7" class="border border-slate-300 py-5 text-center text-slate-400">Belum ada riwayat setoran tercatat untuk peserta ini.</td></tr>
            ` : trxPribadi.map((t, idx) => `
              <tr>
                <td class="border border-slate-300 py-2 px-2.5 text-center">${idx + 1}</td>
                <td class="border border-slate-300 py-2 px-2.5 font-bold text-[#0D47A1]">${t.idTransaksi}</td>
                <td class="border border-slate-300 py-2 px-2.5">${fmtTgl(t.tanggalSetor)}</td>
                <td class="border border-slate-300 py-2 px-2.5">${t.metodeBayar}</td>
                <td class="border border-slate-300 py-2 px-2.5">${t.catatan || '-'}</td>
                <td class="border border-slate-300 py-2 px-2.5">${t.dicatatOleh}</td>
                <td class="border border-slate-300 py-2 px-2.5 text-right font-bold">${formatRupiah(t.nominal)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr class="bg-blue-50/80 font-extrabold">
              <td colspan="6" class="border border-slate-300 py-2 px-3 text-right uppercase">Total Dana Terbayar:</td>
              <td class="border border-slate-300 py-2 px-2.5 text-right text-[#0D47A1]">${formatRupiah(targetWarga.totalTerbayar)}</td>
            </tr>
            <tr class="bg-slate-50 font-bold">
              <td colspan="6" class="border border-slate-300 py-2 px-3 text-right uppercase">Sisa Kekurangan Iuran:</td>
              <td class="border border-slate-300 py-2 px-2.5 text-right ${sisaPribadi > 0 ? 'text-amber-700' : 'text-emerald-700'}">${formatRupiah(sisaPribadi)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    ` : '<p class="text-xs text-slate-500">Data warga tidak ditemukan.</p>';
  }

  container.innerHTML = `
    <div class="space-y-6">
      
      <!-- PANEL KONFIGURASI & FILTER LAPORAN (NO-PRINT) -->
      <div class="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/70 shadow-xs no-print space-y-5">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 class="text-lg font-extrabold text-slate-800 flex items-center gap-2">
              <i data-lucide="printer" class="w-5 h-5 text-[#0D47A1]"></i>
              <span>Pusat Cetak & Ekspor Laporan Kurban RT</span>
            </h2>
            <p class="text-xs text-slate-500 mt-0.5">Pilih jenis laporan dan filter data, lalu cetak dokumen resmi berformat A4 atau ekspor ke file Excel (CSV).</p>
          </div>

          <div class="flex flex-wrap items-center gap-2.5">
            <button onclick="exportLaporanCSV()"
              class="px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs inline-flex items-center gap-2 transition-all cursor-pointer">
              <i data-lucide="file-spreadsheet" class="w-4 h-4"></i>
              <span>Export CSV (Excel)</span>
            </button>
            <button onclick="printLaporanA4()"
              class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0A3D91] to-[#1976D2] hover:opacity-95 text-white font-bold text-xs inline-flex items-center gap-2 shadow-md shadow-blue-900/15 transition-all cursor-pointer">
              <i data-lucide="printer" class="w-4 h-4"></i>
              <span>Cetak / Simpan PDF (Print A4)</span>
            </button>
          </div>
        </div>

        <!-- Grid Kontrol Filter -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Jenis Laporan Resmi</label>
            <select onchange="updateReportFilter('type', this.value)"
              class="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-[#F4F7FE] font-bold text-[#0D47A1] outline-none focus:border-[#0D47A1]">
              ${!isAdmin ? `<option value="pribadi_warga" ${f.type === 'pribadi_warga' ? 'selected' : ''}>Kartu Kendali Iuran Pribadi</option>` : ''}
              <option value="rekap_warga" ${f.type === 'rekap_warga' ? 'selected' : ''}>Rekapitulasi Iuran & Status Warga</option>
              ${isAdmin ? `<option value="mutasi_kas" ${f.type === 'mutasi_kas' ? 'selected' : ''}>Mutasi Kas & Riwayat Setoran</option>` : ''}
              <option value="kelompok_hewan" ${f.type === 'kelompok_hewan' ? 'selected' : ''}>Daftar Kelompok Hewan Kurban</option>
              ${isAdmin ? `<option value="pribadi_warga" ${f.type === 'pribadi_warga' ? 'selected' : ''}>Kartu Kendali Per Warga</option>` : ''}
            </select>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Status Pelunasan</label>
            <select onchange="updateReportFilter('statusLunas', this.value)" ${f.type === 'kelompok_hewan' || f.type === 'pribadi_warga' ? 'disabled' : ''}
              class="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white disabled:bg-slate-50 disabled:text-slate-400 outline-none focus:border-[#0D47A1]">
              <option value="semua" ${f.statusLunas === 'semua' ? 'selected' : ''}>Semua Status (Lunas & Cicilan)</option>
              <option value="lunas" ${f.statusLunas === 'lunas' ? 'selected' : ''}>Sudah Lunas (100%)</option>
              <option value="belum" ${f.statusLunas === 'belum' ? 'selected' : ''}>Belum Lunas / Cicilan</option>
            </select>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Jenis Hewan Kurban</label>
            <select onchange="updateReportFilter('jenisKurban', this.value)" ${f.type === 'pribadi_warga' ? 'disabled' : ''}
              class="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white disabled:bg-slate-50 disabled:text-slate-400 outline-none focus:border-[#0D47A1]">
              <option value="semua" ${f.jenisKurban === 'semua' ? 'selected' : ''}>Semua Paket Kurban</option>
              <option value="Sapi Patungan" ${f.jenisKurban === 'Sapi Patungan' ? 'selected' : ''}>Sapi Patungan (1/7)</option>
              <option value="Kambing" ${f.jenisKurban === 'Kambing' ? 'selected' : ''}>Kambing Mandiri</option>
            </select>
          </div>

          ${f.type === 'mutasi_kas' ? `
            <div>
              <label class="block font-bold text-slate-700 mb-1">Metode Pembayaran</label>
              <select onchange="updateReportFilter('metodeBayar', this.value)"
                class="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:border-[#0D47A1]">
                <option value="semua" ${f.metodeBayar === 'semua' ? 'selected' : ''}>Semua Metode</option>
                <option value="Tunai" ${f.metodeBayar === 'Tunai' ? 'selected' : ''}>Tunai (Bendahara)</option>
                <option value="Transfer" ${f.metodeBayar === 'Transfer' ? 'selected' : ''}>Transfer Bank / QRIS</option>
              </select>
            </div>
          ` : (f.type === 'pribadi_warga' && isAdmin ? `
            <div>
              <label class="block font-bold text-slate-700 mb-1">Pilih Peserta Warga</label>
              <select onchange="updateReportFilter('selectedWargaId', this.value)"
                class="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:border-[#0D47A1]">
                ${APP_STATE.warga.map(w => `<option value="${w.idWarga}" ${f.selectedWargaId === w.idWarga ? 'selected' : ''}>${w.namaLengkap} (${w.idWarga})</option>`).join('')}
              </select>
            </div>
          ` : `
            <div>
              <label class="block font-bold text-slate-700 mb-1">Format Kertas Cetak</label>
              <div class="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 font-semibold flex items-center gap-2">
                <i data-lucide="file-check" class="w-4 h-4 text-emerald-600"></i>
                <span>A4 Portrait (Siap Cetak)</span>
              </div>
            </div>
          `)}
        </div>

        ${f.type === 'mutasi_kas' ? `
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2 border-t border-slate-100 text-xs">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Dari Tanggal</label>
              <input type="date" value="${f.tglMulai}" onchange="updateReportFilter('tglMulai', this.value)"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-[#0D47A1]" />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Sampai Tanggal</label>
              <input type="date" value="${f.tglSelesai}" onchange="updateReportFilter('tglSelesai', this.value)"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-[#0D47A1]" />
            </div>
            <div class="sm:col-span-2 flex items-end">
              <button onclick="APP_STATE.reportFilter.tglMulai=''; APP_STATE.reportFilter.tglSelesai=''; APP_STATE.reportFilter.metodeBayar='semua'; renderActivePageContent();"
                class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold cursor-pointer">
                Reset Filter Tanggal
              </button>
            </div>
          </div>
        ` : ''}
      </div>

      <!-- PRATINJAU DOKUMEN LAPORAN RESMI PANITIA KURBAN RT (AREA PRINT A4) -->
      <div id="report-printable" class="bg-white rounded-2xl p-6 sm:p-10 border border-slate-200/90 shadow-sm max-w-5xl mx-auto">
        
        <!-- KOP SURAT PANITIA KURBAN RT -->
        <div class="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 border-b-4 border-double border-slate-800 pb-4 mb-6 text-center sm:text-left">
          <div class="flex flex-col sm:flex-row items-center gap-3.5">
            <div class="w-16 h-16 rounded-2xl bg-white border border-slate-300 text-[#0D47A1] flex items-center justify-center shrink-0 overflow-hidden shadow-sm print:border print:border-slate-800">
              <img src="${s?.logoUrl || 'https://placehold.co/128x128/0D47A1/FFFFFF?text=RT05'}" alt="Logo KOP" class="w-full h-full object-cover" onerror="this.src='https://placehold.co/128x128/0D47A1/FFFFFF?text=RT'" />
            </div>
            <div>
              <p class="text-[11px] font-bold uppercase tracking-widest text-slate-500">PANITIA PELAKSANA IBADAH KURBAN</p>
              <h1 class="text-lg sm:text-xl font-extrabold text-[#0A3D91] uppercase tracking-tight">${rtName}</h1>
              <p class="text-xs text-slate-600">${s?.alamatSekretariat || 'Sekretariat Masjid Al-Ikhlas'} • Telp/WA: ${s?.kontakPanitia || '0812-8890-4521'}</p>
            </div>
          </div>
          <div class="text-center sm:text-right shrink-0">
            <span class="inline-block px-3 py-1 rounded-lg bg-blue-50 text-[#0D47A1] border border-blue-200 text-xs font-extrabold">
              IDUL ADHA ${tahunHijriah}
            </span>
            <p class="text-[11px] text-slate-500 mt-1.5">Dicetak: ${tanggalCetak}</p>
          </div>
        </div>

        <!-- JUDUL LAPORAN -->
        <div class="text-center mb-6">
          <h2 class="text-base sm:text-lg font-extrabold text-slate-900 underline decoration-2 underline-offset-4">${judulDokumen}</h2>
          <p class="text-xs text-slate-500 mt-1.5">${subJudulDokumen}</p>
        </div>

        <!-- RINGKASAN KPI KOTAK RESMI -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div class="p-3 rounded-xl border border-slate-300 bg-slate-50/60">
            <p class="text-[10px] font-bold uppercase text-slate-500">Total Target Kas RT</p>
            <p class="text-sm font-extrabold text-slate-800 mt-0.5">${formatRupiah(totalTargetAll)}</p>
          </div>
          <div class="p-3 rounded-xl border border-slate-300 bg-blue-50/40">
            <p class="text-[10px] font-bold uppercase text-slate-500">Total Dana Terkumpul</p>
            <p class="text-sm font-extrabold text-[#0D47A1] mt-0.5">${formatRupiah(totalTerkumpulAll)}</p>
          </div>
          <div class="p-3 rounded-xl border border-slate-300 bg-amber-50/40">
            <p class="text-[10px] font-bold uppercase text-slate-500">Sisa Kekurangan</p>
            <p class="text-sm font-extrabold text-amber-800 mt-0.5">${formatRupiah(sisaAll)}</p>
          </div>
          <div class="p-3 rounded-xl border border-slate-300 bg-emerald-50/40">
            <p class="text-[10px] font-bold uppercase text-slate-500">Peserta Lunas</p>
            <p class="text-sm font-extrabold text-emerald-800 mt-0.5">${countLunas} dari ${APP_STATE.warga.length} Warga</p>
          </div>
        </div>

        <!-- TABEL KONTEN UTAMA LAPORAN -->
        ${bodyDokumenHTML}

        <!-- BLOK PENGESAHAN / TANDA TANGAN RESMI -->
        <div class="mt-10 pt-4 grid grid-cols-2 gap-8 text-xs text-center break-inside-avoid">
          <div>
            <p class="text-slate-600">Mengetahui,</p>
            <p class="font-bold text-slate-800">Ketua ${rtName.split('/')[0].trim()}</p>
            <div class="h-16"></div>
            <p class="font-extrabold text-slate-900 underline">( ${s?.namaKetuaRT ? s.namaKetuaRT : '_______________________'} )</p>
            <p class="text-[10px] text-slate-400 mt-0.5">Pengurus Lingkungan RT</p>
          </div>
          <div>
            <p class="text-slate-600">${tanggalCetak}</p>
            <p class="font-bold text-slate-800">Ketua / Bendahara Panitia Kurban</p>
            <div class="h-16"></div>
            <p class="font-extrabold text-slate-900 underline">( ${s?.namaKetuaPanitia || 'H. Iwin'} )</p>
            <p class="text-[10px] text-slate-400 mt-0.5">Panitia Pelaksana Kurban ${tahunHijriah}</p>
          </div>
        </div>

      </div>
    </div>
  `;
}

