// =========================================================================
// KONFIGURASI FRONTEND — satu-satunya file yang perlu Anda ubah saat deploy
// =========================================================================
const CONFIG = {
  // URL Web App Google Apps Script (berakhiran /exec).
  // Contoh: 'https://script.google.com/macros/s/AKfycb.../exec'
  API_URL: '',

  // Tampilkan tombol "Isi Akun Demo" di halaman login.
  // WAJIB false setelah Anda mengganti kredensial admin & PIN bawaan.
  DEMO_HINTS: true,

  // Batas waktu tunggu respons server (ms). Apps Script bisa lambat saat cold start.
  REQUEST_TIMEOUT_MS: 45000
};
