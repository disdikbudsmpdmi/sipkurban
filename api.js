// =========================================================================
// LAPISAN API — komunikasi ke backend Google Apps Script (JSON over POST)
// Content-Type "text/plain" sengaja dipakai agar browser tidak mengirim
// preflight CORS (Apps Script Web App tidak mendukung OPTIONS).
// =========================================================================
const TOKEN_KEY = 'sipkurban_token';

class ApiError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code || 'ERROR';
  }
}

function getToken() {
  try { return sessionStorage.getItem(TOKEN_KEY); } catch (e) { return null; }
}
function setToken(t) {
  try { t ? sessionStorage.setItem(TOKEN_KEY, t) : sessionStorage.removeItem(TOKEN_KEY); } catch (e) {}
}

let _pending = 0;
function setLoading(on) {
  _pending = Math.max(0, _pending + (on ? 1 : -1));
  const bar = document.getElementById('loading-bar');
  if (bar) bar.classList.toggle('active', _pending > 0);
}

async function apiCall(action, payload = {}) {
  if (!CONFIG.API_URL) {
    throw new ApiError('API_URL belum diisi. Buka js/config.js dan isi dengan URL Web App Apps Script.', 'NO_CONFIG');
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), CONFIG.REQUEST_TIMEOUT_MS || 45000);
  setLoading(true);

  let json;
  try {
    const res = await fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, payload, token: getToken() }),
      redirect: 'follow',
      signal: ctrl.signal
    });
    const text = await res.text();
    try {
      json = JSON.parse(text);
    } catch (e) {
      throw new ApiError('Server tidak mengembalikan JSON. Pastikan Web App di-deploy dengan akses "Anyone" dan URL berakhiran /exec.', 'BAD_RESPONSE');
    }
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err && err.name === 'AbortError') throw new ApiError('Server terlalu lama merespons. Coba lagi.', 'TIMEOUT');
    throw new ApiError('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.', 'NETWORK');
  } finally {
    clearTimeout(timer);
    setLoading(false);
  }

  if (!json.ok) {
    if (json.code === 'UNAUTHORIZED') handleSessionExpired(json.error);
    throw new ApiError(json.error || 'Permintaan gagal.', json.code);
  }
  if (json.snapshot) applySnapshot(json.snapshot);
  return json.data;
}

function handleSessionExpired(message) {
  if (!APP_STATE.currentUser) return;   // sudah di halaman login
  setToken(null);
  APP_STATE.currentUser = null;
  renderLoginView();
  showToast(message || 'Sesi berakhir. Silakan masuk kembali.', 'error');
}
