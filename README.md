# SIPKURBAN RT — Fullstack (Frontend statis + Google Apps Script + Google Spreadsheet)

```
sipkurban/
├── index.html               ← halaman utama (di folder root)
├── manifest.webmanifest     ← PWA
├── sw.js                    ← service worker
├── assets/icon.svg
├── css/style.css
├── js/
│   ├── config.js            ← ★ isi API_URL di sini
│   ├── state.js             ← state, helper, applySnapshot
│   ├── api.js               ← fetch ke Apps Script
│   ├── auth.js              ← login & logout
│   ├── layout.js            ← sidebar, topbar, navigasi
│   ├── app.js               ← bootstrap
│   └── pages/               ← dashboard, peserta, iuran, laporan, jadwal, pengumuman, profil
└── backend/
    ├── Code.gs              ← seluruh backend (API JSON)
    └── appsscript.json      ← manifest Apps Script
```

## 1. Deploy backend (Apps Script + Spreadsheet)

1. Buat **Google Spreadsheet** kosong → menu **Extensions → Apps Script**.
2. Ganti isi `Code.gs` dengan `backend/Code.gs`.
3. **Project Settings → Show "appsscript.json" manifest file** → ganti isinya dengan `backend/appsscript.json`.
4. Pilih fungsi **`setup`** → **Run** → setujui izin. Ini membuat 6 sheet beserta data contoh.
5. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Salin URL berakhiran `/exec`.

> Setiap mengubah `Code.gs`, buat **New version** pada deployment (Deploy → Manage deployments → Edit → New version), kalau tidak, URL lama tetap menjalankan kode lama.

## 2. Ganti kredensial bawaan (WAJIB sebelum dipakai warga)

**Project Settings → Script properties:**

| Properti | Isi bawaan | Keterangan |
|---|---|---|
| `ADMIN_EMAIL` | `admin@rt05.id` | email login admin |
| `ADMIN_PASSWORD` | acak 12 karakter (instalasi baru) | tampil di *Executions/Execution log* saat `setup` berjalan; ganti lewat menu **Profil**. Instalasi lama yang masih `admin123` akan melihat banner peringatan merah di dashboard |
| `ADMIN_NAME` | `H. Hendra (Ketua Panitia)` | nama di kuitansi/pengumuman |
| `TOKEN_SECRET`, `PIN_SALT` | otomatis | jangan diubah (mengubah `PIN_SALT` membuat semua PIN lama tidak berlaku) |

PIN warga data contoh = `1234` — hapus/ganti data contoh sebelum produksi. PIN disimpan sebagai hash di kolom `pinHash`.

**PIN warga baru = 6 digit.** Saat mendaftarkan warga, kolom PIN boleh dikosongkan: server membuat PIN acak dan menampilkannya **sekali** (lengkap dengan tombol kirim via WhatsApp). PIN lama 4 digit tetap bisa dipakai login; PIN baru dari admin wajib 6 digit. Warga belum bisa mengganti PIN sendiri — kalau lupa, admin mengisi *PIN Baru* di Edit Peserta.

## 3. Hubungkan & deploy frontend

Edit `js/config.js`:

```js
API_URL: 'https://script.google.com/macros/s/XXXX/exec',
DEMO_HINTS: false,   // sembunyikan tombol "Isi Akun Demo"
```

Jalankan lokal: `npx serve .` (atau `python3 -m http.server`), lalu buka `http://localhost:3000`.
Hosting: GitHub Pages, Netlify, Cloudflare Pages, atau hosting biasa — cukup unggah seluruh folder (kecuali `backend/`).

## Catatan teknis

- **Keamanan:** login diverifikasi server; token bertanda tangan HMAC berlaku 12 jam; gagal login 5× memblokir 15 menit; semua aksi tulis hanya untuk admin; nominal, saldo, status lunas, nomor kuitansi & ID dihitung server.
- **Privasi warga:** server hanya mengirim data **dirinya sendiri** ke warga biasa (profil, progres iuran, transaksi). Warga lain hanya muncul sebagai *nama* pada daftar anggota kelompok hewan, tanpa blok, HP, nominal, atau status lunas. Total RT di dashboard dihitung server (`ringkasan`). Laporan *Rekapitulasi*, *Kelompok Hewan*, dan *Mutasi Kas* khusus admin; warga hanya bisa mencetak Kartu Kendali pribadi.
- **Pengingat WhatsApp:** admin membuka *Peserta → Ingatkan Tagihan* (massal) atau ikon WhatsApp di baris warga (satuan). Aplikasi hanya membuka `wa.me` dengan pesan siap kirim; pengiriman tetap dengan menekan tombol kirim di WhatsApp. Info rekening/QRIS disimpan di browser admin (localStorage), bukan di server.
- **Ikon & library:** ikon PWA kini lokal (`assets/icon-*.png`). Tailwind dan Lucide dipin ke versi tetap di `index.html`.
- **Data:** boleh diedit langsung di Spreadsheet (jangan ubah header/kolom `_docId`). Hapus baris = hapus data.
- **Kecepatan:** Apps Script punya *cold start* 1–5 detik; indikator loading di atas layar menandakan permintaan berjalan.
- **Backup:** gunakan File → Version history di Spreadsheet.
# sipkurban
