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
| `ADMIN_PASSWORD` | `admin123` | **ganti!** |
| `ADMIN_NAME` | `H. Hendra (Ketua Panitia)` | nama di kuitansi/pengumuman |
| `TOKEN_SECRET`, `PIN_SALT` | otomatis | jangan diubah (mengubah `PIN_SALT` membuat semua PIN lama tidak berlaku) |

PIN warga data contoh = `1234` — hapus/ganti data contoh sebelum produksi. PIN disimpan sebagai hash di kolom `pinHash`.

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
- **Privasi warga:** warga hanya melihat transaksi miliknya dan tidak menerima No. HP/PIN warga lain. Laporan *Mutasi Kas* khusus admin.
- **Data:** boleh diedit langsung di Spreadsheet (jangan ubah header/kolom `_docId`). Hapus baris = hapus data.
- **Kecepatan:** Apps Script punya *cold start* 1–5 detik; indikator loading di atas layar menandakan permintaan berjalan.
- **Backup:** gunakan File → Version history di Spreadsheet.
# sipkurban
