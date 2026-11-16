// =========================================================================
// KONFIGURASI FRONTEND — satu-satunya file yang perlu Anda ubah saat deploy
// =========================================================================
const CONFIG = {
  // URL Web App Google Apps Script (berakhiran /exec).
  // Contoh: 'https://script.google.com/macros/s/AKfycb.../exec'
  API_URL: 'https://script.google.com/macros/s/AKfycbwF3Flyy1lZAvjh16MrN3c5KSudNxN3CkY6cM2TMe2AndVj7PpjyMg2j5P5Tt-e9KSgeQ/exec',

  // Tampilkan tombol "Isi Akun Demo" di halaman login.
  // WAJIB false setelah Anda mengganti kredensial admin & PIN bawaan.
  DEMO_HINTS: false,

  // Batas waktu tunggu respons server (ms). Apps Script bisa lambat saat cold start.
  REQUEST_TIMEOUT_MS: 45000
};
