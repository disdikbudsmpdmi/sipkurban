/**
 * ============================================================================
 * SIPKURBAN RT — Backend Google Apps Script (Web App JSON API)
 * Database : Google Spreadsheet (satu sheet per koleksi)
 * Frontend : index.html + css/ + js/ (hosting statis apa pun)
 *
 * Cara pakai singkat (detail lengkap ada di README.md):
 *  1. Buat Google Spreadsheet kosong -> Extensions -> Apps Script.
 *  2. Tempel file ini sebagai Code.gs, dan isi appsscript.json (Project Settings
 *     -> centang "Show appsscript.json manifest file in editor").
 *  3. Jalankan fungsi setup() sekali dan setujui izin akses.
 *  4. Deploy -> New deployment -> Web app
 *       Execute as: Me | Who has access: Anyone
 *  5. Salin URL /exec ke js/config.js (API_URL) di frontend.
 *
 * Kredensial admin & rahasia token disimpan di Script Properties
 * (Project Settings -> Script properties), TIDAK di Spreadsheet.
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// KONFIGURASI
// ---------------------------------------------------------------------------
var TOKEN_TTL_SEC = 12 * 60 * 60;   // masa berlaku sesi login: 12 jam
var MAX_FAILS = 5;                  // maksimal gagal login berturut-turut
var LOCK_SEC = 15 * 60;             // durasi blokir setelah gagal login (detik)
var SETUP_FLAG = 'SETUP_V1';

var JENIS_KURBAN = ['Sapi Patungan', 'Kambing'];
var STATUS_JADWAL = ['Akan Datang', 'Berlangsung', 'Selesai'];
var METODE_BAYAR = ['Tunai', 'Transfer BCA', 'Transfer BSI', 'Transfer Mandiri', 'QRIS Masjid'];
var BULAN_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
var DEFAULT_LOGO = 'https://placehold.co/128x128/0D47A1/FFFFFF?text=RT05';

/**
 * Skema sheet. types: n = angka, b = boolean, (kosong) = teks.
 * Kolom teks diformat "plain text" agar nomor HP "0812..." tidak kehilangan
 * angka 0 dan tanggal "2026-11-10" tidak diubah menjadi objek Date.
 * Kolom ids disanitasi (hanya huruf/angka/_/-) karena dipakai di atribut HTML.
 */
var SCHEMA = {
  settings_kurban: {
    cols: ['_docId', 'namaRT', 'tahunHijriah', 'tanggalIdulAdha', 'hargaSapiPatungan', 'hargaKambingMandiri', 'kontakPanitia', 'alamatSekretariat', 'logoUrl'],
    types: { hargaSapiPatungan: 'n', hargaKambingMandiri: 'n' },
    ids: ['_docId']
  },
  kelompok_hewan: {
    cols: ['_docId', 'idKelompok', 'namaKelompok', 'jenisHewan', 'kapasitas', 'hargaTotal', 'statusPengadaan'],
    types: { kapasitas: 'n', hargaTotal: 'n' },
    ids: ['_docId', 'idKelompok']
  },
  users_warga: {
    cols: ['_docId', 'idWarga', 'namaLengkap', 'blokRumah', 'noHp', 'pinHash', 'jenisKurban', 'kelompokHewan', 'targetIuran', 'totalTerbayar', 'statusLunas'],
    types: { targetIuran: 'n', totalTerbayar: 'n', statusLunas: 'b' },
    ids: ['_docId', 'idWarga']
  },
  transaksi_iuran: {
    cols: ['_docId', 'idTransaksi', 'idWarga', 'namaWarga', 'nominal', 'metodeBayar', 'tanggalSetor', 'dicatatOleh', 'catatan'],
    types: { nominal: 'n' },
    ids: ['_docId', 'idTransaksi', 'idWarga']
  },
  jadwal_kurban: {
    cols: ['_docId', 'idJadwal', 'tanggal', 'waktu', 'judulKegiatan', 'lokasi', 'status'],
    types: {},
    ids: ['_docId', 'idJadwal']
  },
  pengumuman: {
    cols: ['_docId', 'idPengumuman', 'judul', 'isiPesan', 'tanggalPost', 'penulis', 'dibuatPada'],
    types: {},
    ids: ['_docId', 'idPengumuman']
  }
};

// ---------------------------------------------------------------------------
// ENTRY POINT WEB APP
// ---------------------------------------------------------------------------
function doGet() {
  return json_({ ok: true, data: { app: 'SIPKURBAN RT API', status: 'online' } });
}

function doPost(e) {
  try {
    var raw = (e && e.postData && e.postData.contents) || '{}';
    var body;
    try { body = JSON.parse(raw); } catch (parseErr) { throw new ApiError_('Format permintaan tidak valid.', 'BAD_REQUEST'); }
    return json_(handle_(body));
  } catch (err) {
    return json_(errorResponse_(err));
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function ApiError_(message, code) {
  this.message = message;
  this.code = code || 'BAD_REQUEST';
}

function errorResponse_(err) {
  if (err instanceof ApiError_) return { ok: false, error: err.message, code: err.code };
  console.error(err && err.stack ? err.stack : err);
  return { ok: false, error: 'Terjadi kesalahan pada server. Coba lagi beberapa saat.', code: 'SERVER_ERROR' };
}

// ---------------------------------------------------------------------------
// ROUTER
// auth: public | user (warga/admin) | admin ; snapshot: kirim ulang data terbaru
// ---------------------------------------------------------------------------
var ROUTES = {
  public_info:        { auth: 'public', fn: actPublicInfo_ },
  login_warga:        { auth: 'public', fn: actLoginWarga_ },
  login_admin:        { auth: 'public', fn: actLoginAdmin_ },
  bootstrap:          { auth: 'user',   fn: actBootstrap_ },
  warga_add:          { auth: 'admin',  fn: actWargaAdd_,         snapshot: true },
  warga_delete:       { auth: 'admin',  fn: actWargaDelete_,      snapshot: true },
  warga_update:       { auth: 'admin',  fn: actWargaUpdate_,      snapshot: true },
  kelompok_add:       { auth: 'admin',  fn: actKelompokAdd_,      snapshot: true },
  transaksi_add:      { auth: 'admin',  fn: actTransaksiAdd_,     snapshot: true },
  jadwal_add:         { auth: 'admin',  fn: actJadwalAdd_,        snapshot: true },
  jadwal_set_status:  { auth: 'admin',  fn: actJadwalSetStatus_,  snapshot: true },
  pengumuman_add:     { auth: 'admin',  fn: actPengumumanAdd_,    snapshot: true },
  pengumuman_delete:  { auth: 'admin',  fn: actPengumumanDelete_, snapshot: true },
  settings_update:    { auth: 'admin',  fn: actSettingsUpdate_,   snapshot: true },
  admin_account_update: { auth: 'admin', fn: actAdminAccountUpdate_ }
};

function handle_(body) {
  ensureSetup_();
  var route = ROUTES[body.action];
  if (!route) throw new ApiError_('Aksi tidak dikenal.', 'NOT_FOUND');
  var payload = body.payload || {};
  var user = null;
  if (route.auth !== 'public') {
    user = authUser_(body.token);
    if (route.auth === 'admin' && user.role !== 'admin') {
      throw new ApiError_('Hanya admin panitia yang dapat melakukan aksi ini.', 'FORBIDDEN');
    }
  }
  var data = route.fn(payload, user);
  var out = { ok: true, data: data === undefined ? null : data };
  if (route.snapshot) out.snapshot = buildSnapshot_(user);
  return out;
}

// ---------------------------------------------------------------------------
// AUTENTIKASI (token bertanda tangan HMAC, tanpa state di server)
// ---------------------------------------------------------------------------
function props_() { return PropertiesService.getScriptProperties(); }

function sha256Hex_(text) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8);
  return bytes.map(function (b) { var v = (b < 0 ? b + 256 : b).toString(16); return v.length === 1 ? '0' + v : v; }).join('');
}

function hashPin_(pin) {
  return sha256Hex_(props_().getProperty('PIN_SALT') + ':' + String(pin));
}

function safeEq_(a, b) {
  a = String(a); b = String(b);
  var diff = a.length ^ b.length;
  var n = Math.max(a.length, b.length);
  for (var i = 0; i < n; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

function signToken_(claims) {
  claims.exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SEC;
  var payload = Utilities.base64EncodeWebSafe(JSON.stringify(claims), Utilities.Charset.UTF_8);
  var sig = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(payload, props_().getProperty('TOKEN_SECRET')));
  return payload + '.' + sig;
}

function verifyToken_(token) {
  if (!token || typeof token !== 'string' || token.indexOf('.') < 0) return null;
  var parts = token.split('.');
  if (parts.length !== 2) return null;
  var expected = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(parts[0], props_().getProperty('TOKEN_SECRET')));
  if (!safeEq_(parts[1], expected)) return null;
  try {
    var claims = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString());
    if (!claims.exp || claims.exp < Math.floor(Date.now() / 1000)) return null;
    return claims;
  } catch (e) {
    return null;
  }
}

function authUser_(token) {
  var claims = verifyToken_(token);
  if (!claims) throw new ApiError_('Sesi login berakhir. Silakan masuk kembali.', 'UNAUTHORIZED');
  if (claims.role === 'admin') {
    return { role: 'admin', name: claims.name, email: claims.email };
  }
  if (claims.role === 'warga') {
    var w = readAll_('users_warga').filter(function (x) { return x.idWarga === claims.id; })[0];
    if (!w) throw new ApiError_('Akun peserta tidak ditemukan. Silakan masuk kembali.', 'UNAUTHORIZED');
    return { role: 'warga', id: w.idWarga, name: w.namaLengkap, warga: w };
  }
  throw new ApiError_('Sesi login tidak valid.', 'UNAUTHORIZED');
}

function throttleKey_(ident) { return 'fail_' + sha256Hex_(String(ident).toLowerCase()).slice(0, 40); }

function checkThrottle_(key) {
  var n = Number(CacheService.getScriptCache().get(key) || 0);
  if (n >= MAX_FAILS) throw new ApiError_('Terlalu banyak percobaan gagal. Coba lagi dalam 15 menit.', 'THROTTLED');
}
function addFail_(key) {
  var cache = CacheService.getScriptCache();
  cache.put(key, String(Number(cache.get(key) || 0) + 1), LOCK_SEC);
}
function clearFail_(key) { CacheService.getScriptCache().remove(key); }

function digits_(s) { return String(s || '').replace(/\D/g, ''); }

/** Samakan 62812..., +62812..., 0812... menjadi 0812... */
function normPhone_(s) {
  var d = digits_(s);
  if (d.indexOf('62') === 0) d = '0' + d.slice(2);
  return d;
}

function actPublicInfo_() {
  var s = readAll_('settings_kurban')[0] || {};
  return forClient_({ namaRT: s.namaRT || '', tahunHijriah: s.tahunHijriah || '', logoUrl: s.logoUrl || '' });
}

function actLoginWarga_(p) {
  var ident = String(p.identifier || '').trim();
  var pin = String(p.pin || '').trim();
  if (!ident || !pin) throw new ApiError_('ID Warga/No. HP dan PIN wajib diisi.', 'BAD_REQUEST');
  var key = throttleKey_(ident);
  checkThrottle_(key);

  var identLower = ident.toLowerCase();
  var identPhone = normPhone_(ident);
  var pinHash = hashPin_(pin);
  var found = readAll_('users_warga').filter(function (w) {
    var byId = w.idWarga.toLowerCase() === identLower;
    var byPhone = identPhone.length >= 8 && normPhone_(w.noHp) === identPhone;
    return (byId || byPhone) && safeEq_(w.pinHash, pinHash);
  })[0];

  if (!found) {
    addFail_(key);
    throw new ApiError_('ID Warga / No. HP atau PIN tidak cocok. Silakan periksa kembali.', 'INVALID_CREDENTIALS');
  }
  clearFail_(key);
  var user = { role: 'warga', id: found.idWarga, name: found.namaLengkap, warga: found };
  var token = signToken_({ role: 'warga', id: found.idWarga });
  return { token: token, snapshot: buildSnapshot_(user) };
}

function actLoginAdmin_(p) {
  var email = String(p.email || '').trim().toLowerCase();
  var password = String(p.password || '');
  if (!email || !password) throw new ApiError_('Email dan kata sandi wajib diisi.', 'BAD_REQUEST');
  var key = throttleKey_('admin:' + email);
  checkThrottle_(key);

  var pr = props_();
  var okEmail = safeEq_(email, String(pr.getProperty('ADMIN_EMAIL') || '').toLowerCase());
  var okPass = safeEq_(password, pr.getProperty('ADMIN_PASSWORD') || '');
  if (!(okEmail && okPass)) {
    addFail_(key);
    throw new ApiError_('Email atau kata sandi Admin salah.', 'INVALID_CREDENTIALS');
  }
  clearFail_(key);
  var name = pr.getProperty('ADMIN_NAME') || 'Panitia Kurban RT';
  var user = { role: 'admin', name: name, email: email };
  var token = signToken_({ role: 'admin', name: name, email: email });
  return { token: token, snapshot: buildSnapshot_(user) };
}

/**
 * Ganti username & kata sandi admin. Wajib menyertakan kata sandi saat ini.
 * Username disimpan di Script Property ADMIN_EMAIL (nama properti dipertahankan
 * agar kompatibel dengan instalasi lama). newPassword boleh kosong = tidak diganti.
 */
function actAdminAccountUpdate_(p, user) {
  var pr = props_();
  var current = String(p.currentPassword || '');
  if (!current) throw new ApiError_('Kata sandi saat ini wajib diisi.', 'BAD_REQUEST');

  var key = throttleKey_('admin-acc:' + String(user.email || ''));
  checkThrottle_(key);
  if (!safeEq_(current, pr.getProperty('ADMIN_PASSWORD') || '')) {
    addFail_(key);
    throw new ApiError_('Kata sandi saat ini salah.', 'INVALID_CREDENTIALS');
  }
  clearFail_(key);

  var username = reqStr_(p.username, 'Username', 60).toLowerCase();
  if (/\s/.test(username)) throw new ApiError_('Username tidak boleh mengandung spasi.', 'BAD_REQUEST');
  if (username.length < 4) throw new ApiError_('Username minimal 4 karakter.', 'BAD_REQUEST');

  var newPass = String(p.newPassword || '');
  if (newPass) {
    if (newPass.length < 6) throw new ApiError_('Kata sandi baru minimal 6 karakter.', 'BAD_REQUEST');
    if (newPass.length > 100) throw new ApiError_('Kata sandi baru terlalu panjang.', 'BAD_REQUEST');
  }

  return withLock_(function () {
    pr.setProperty('ADMIN_EMAIL', username);
    if (newPass) pr.setProperty('ADMIN_PASSWORD', newPass);
    var name = pr.getProperty('ADMIN_NAME') || user.name;
    if (p.name !== undefined) {
      name = reqStr_(p.name, 'Nama tampilan', 80);
      pr.setProperty('ADMIN_NAME', name);
    }
    var token = signToken_({ role: 'admin', name: name, email: username });
    return { token: token, snapshot: buildSnapshot_({ role: 'admin', name: name, email: username }) };
  });
}

function actBootstrap_(p, user) {
  return buildSnapshot_(user);
}

// ---------------------------------------------------------------------------
// SNAPSHOT DATA UNTUK FRONTEND
// Warga hanya melihat transaksi miliknya & tidak melihat PIN / No. HP warga lain.
// ---------------------------------------------------------------------------
function stripWarga_(w, keepPhone) {
  var o = {};
  Object.keys(w).forEach(function (k) { if (k !== 'pinHash') o[k] = w[k]; });
  if (!keepPhone) o.noHp = '';
  return o;
}

function buildSnapshot_(user) {
  var isAdmin = user.role === 'admin';
  var settings = readAll_('settings_kurban')[0] || null;
  var wargaRaw = readAll_('users_warga');
  var trxRaw = readAll_('transaksi_iuran');
  var kelompok = readAll_('kelompok_hewan');
  var jadwal = readAll_('jadwal_kurban');
  var pengumuman = readAll_('pengumuman').sort(function (a, b) {
    return String(b.dibuatPada).localeCompare(String(a.dibuatPada));
  });

  // Tren setoran bulanan (agregat seluruh RT, aman dilihat warga)
  var perBulan = {};
  trxRaw.forEach(function (t) {
    var ym = String(t.tanggalSetor).slice(0, 7);
    if (/^\d{4}-\d{2}$/.test(ym)) perBulan[ym] = (perBulan[ym] || 0) + Number(t.nominal || 0);
  });
  var running = 0;
  var tren = Object.keys(perBulan).sort().map(function (ym) {
    running += perBulan[ym];
    return { bulan: ym, total: perBulan[ym], kumulatif: running };
  });

  var wargaOut = wargaRaw.map(function (w) {
    return stripWarga_(w, isAdmin || (user.role === 'warga' && w.idWarga === user.id));
  });
  var trxOut = isAdmin ? trxRaw : trxRaw.filter(function (t) { return t.idWarga === user.id; });

  var userView = isAdmin
    ? { role: 'admin', name: user.name, email: user.email }
    : {
        role: 'warga',
        name: user.warga.namaLengkap,
        email: user.warga.idWarga + ' • ' + user.warga.blokRumah,
        wargaData: stripWarga_(user.warga, true)
      };

  return forClient_({
    user: userView,
    settings: settings,
    warga: wargaOut,
    transaksi: trxOut,
    kelompok: kelompok,
    jadwal: jadwal,
    pengumuman: pengumuman,
    tren: tren
  });
}

/** Escape HTML pada semua string sebelum dikirim, karena frontend merender lewat innerHTML. */
function forClient_(value) {
  if (typeof value === 'string') {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  if (Array.isArray(value)) return value.map(forClient_);
  if (value && typeof value === 'object') {
    var o = {};
    Object.keys(value).forEach(function (k) { o[k] = forClient_(value[k]); });
    return o;
  }
  return value;
}

// ---------------------------------------------------------------------------
// VALIDASI INPUT
// ---------------------------------------------------------------------------
function reqStr_(v, label, max) {
  var s = String(v === undefined || v === null ? '' : v).trim();
  if (!s) throw new ApiError_(label + ' wajib diisi.', 'BAD_REQUEST');
  if (s.length > (max || 200)) throw new ApiError_(label + ' terlalu panjang (maks ' + (max || 200) + ' karakter).', 'BAD_REQUEST');
  return s;
}
function optStr_(v, max) {
  var s = String(v === undefined || v === null ? '' : v).trim();
  return s.slice(0, max || 200);
}
function posNum_(v, label) {
  var n = Number(v);
  if (!isFinite(n) || n <= 0 || n > 1000000000) throw new ApiError_(label + ' harus berupa angka lebih dari 0.', 'BAD_REQUEST');
  return Math.round(n);
}
function isValidIsoDate_(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  var d = new Date(s + 'T00:00:00Z');
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function withLock_(fn) {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(20000); } catch (e) { throw new ApiError_('Server sedang sibuk. Coba lagi sebentar.', 'BUSY'); }
  try { return fn(); } finally { lock.releaseLock(); }
}

function nextNumber_(list, field, prefix) {
  var max = 0;
  list.forEach(function (x) {
    var v = String(x[field] || '');
    if (v.indexOf(prefix) === 0) {
      var n = parseInt(v.slice(prefix.length), 10);
      if (!isNaN(n) && n > max) max = n;
    }
  });
  return String(max + 1).padStart(3, '0');
}

// ---------------------------------------------------------------------------
// AKSI ADMIN
// ---------------------------------------------------------------------------
function actWargaAdd_(p, user) {
  var nama = reqStr_(p.namaLengkap, 'Nama lengkap', 80);
  var blok = reqStr_(p.blokRumah, 'Blok rumah', 40);
  var hp = reqStr_(p.noHp, 'Nomor HP', 20);
  if (normPhone_(hp).length < 8) throw new ApiError_('Nomor HP tidak valid.', 'BAD_REQUEST');
  var pin = String(p.pinLogin || '1234').trim();
  if (!/^\d{4,6}$/.test(pin)) throw new ApiError_('PIN harus 4–6 digit angka.', 'BAD_REQUEST');
  var jenis = String(p.jenisKurban || '');
  if (JENIS_KURBAN.indexOf(jenis) < 0) throw new ApiError_('Jenis kurban tidak valid.', 'BAD_REQUEST');
  var target = posNum_(p.targetIuran, 'Target iuran');
  var namaKlp = reqStr_(p.kelompokHewan, 'Kelompok hewan', 100);

  return withLock_(function () {
    var kelompok = readAll_('kelompok_hewan').filter(function (k) { return k.namaKelompok === namaKlp; })[0];
    if (!kelompok) throw new ApiError_('Kelompok hewan tidak ditemukan.', 'BAD_REQUEST');
    if (kelompok.jenisHewan !== jenis) throw new ApiError_('Kelompok "' + namaKlp + '" untuk ' + kelompok.jenisHewan + ', tidak cocok dengan paket ' + jenis + '.', 'BAD_REQUEST');

    var wargaList = readAll_('users_warga');
    var terisi = wargaList.filter(function (w) { return w.kelompokHewan === namaKlp; }).length;
    if (terisi >= kelompok.kapasitas) throw new ApiError_('Kelompok "' + namaKlp + '" sudah penuh (' + terisi + '/' + kelompok.kapasitas + ').', 'BAD_REQUEST');

    var phone = normPhone_(hp);
    if (wargaList.some(function (w) { return normPhone_(w.noHp) === phone; })) {
      throw new ApiError_('Nomor HP sudah terdaftar pada peserta lain.', 'DUPLICATE');
    }

    var idWarga = 'RT05-' + nextNumber_(wargaList, 'idWarga', 'RT05-');
    appendObj_('users_warga', {
      _docId: Utilities.getUuid(),
      idWarga: idWarga,
      namaLengkap: nama,
      blokRumah: blok,
      noHp: hp,
      pinHash: hashPin_(pin),
      jenisKurban: jenis,
      kelompokHewan: namaKlp,
      targetIuran: target,
      totalTerbayar: 0,
      statusLunas: false
    });
    return { idWarga: idWarga, namaLengkap: nama };
  });
}

/**
 * Edit data peserta + (opsional) reset PIN login.
 * newPin kosong = PIN tidak diubah. Status lunas dihitung ulang dari target baru.
 */
function actWargaUpdate_(p) {
  var docId = reqStr_(p.docId, 'ID dokumen', 80);
  var nama = reqStr_(p.namaLengkap, 'Nama lengkap', 80);
  var blok = reqStr_(p.blokRumah, 'Blok rumah', 40);
  var hp = reqStr_(p.noHp, 'Nomor HP', 20);
  if (normPhone_(hp).length < 8) throw new ApiError_('Nomor HP tidak valid.', 'BAD_REQUEST');
  var jenis = String(p.jenisKurban || '');
  if (JENIS_KURBAN.indexOf(jenis) < 0) throw new ApiError_('Jenis kurban tidak valid.', 'BAD_REQUEST');
  var target = posNum_(p.targetIuran, 'Target iuran');
  var namaKlp = reqStr_(p.kelompokHewan, 'Kelompok hewan', 100);
  var newPin = String(p.newPin || '').trim();
  if (newPin && !/^\d{4,6}$/.test(newPin)) throw new ApiError_('PIN harus 4–6 digit angka.', 'BAD_REQUEST');

  return withLock_(function () {
    var wargaList = readAll_('users_warga');
    var warga = wargaList.filter(function (w) { return w._docId === docId; })[0];
    if (!warga) throw new ApiError_('Peserta tidak ditemukan.', 'NOT_FOUND');

    var kelompok = readAll_('kelompok_hewan').filter(function (k) { return k.namaKelompok === namaKlp; })[0];
    if (!kelompok) throw new ApiError_('Kelompok hewan tidak ditemukan.', 'BAD_REQUEST');
    if (kelompok.jenisHewan !== jenis) throw new ApiError_('Kelompok "' + namaKlp + '" untuk ' + kelompok.jenisHewan + ', tidak cocok dengan paket ' + jenis + '.', 'BAD_REQUEST');
    var terisi = wargaList.filter(function (w) { return w.kelompokHewan === namaKlp && w._docId !== docId; }).length;
    if (terisi >= kelompok.kapasitas) throw new ApiError_('Kelompok "' + namaKlp + '" sudah penuh (' + terisi + '/' + kelompok.kapasitas + ').', 'BAD_REQUEST');

    var phone = normPhone_(hp);
    if (wargaList.some(function (w) { return w._docId !== docId && normPhone_(w.noHp) === phone; })) {
      throw new ApiError_('Nomor HP sudah terdaftar pada peserta lain.', 'DUPLICATE');
    }

    var updates = {
      namaLengkap: nama, blokRumah: blok, noHp: hp,
      jenisKurban: jenis, kelompokHewan: namaKlp, targetIuran: target,
      statusLunas: Number(warga.totalTerbayar || 0) >= target
    };
    if (newPin) updates.pinHash = hashPin_(newPin);
    updateRow_('users_warga', docId, updates);

    // Samakan nama pada riwayat transaksi (kolom namaWarga bersifat salinan).
    if (nama !== warga.namaLengkap) {
      readAll_('transaksi_iuran').forEach(function (t) {
        if (t.idWarga === warga.idWarga) updateRow_('transaksi_iuran', t._docId, { namaWarga: nama });
      });
    }
    return null;
  });
}

function actWargaDelete_(p) {
  var docId = reqStr_(p.docId, 'ID dokumen', 80);
  return withLock_(function () {
    if (!deleteRow_('users_warga', docId)) throw new ApiError_('Peserta tidak ditemukan.', 'NOT_FOUND');
    return null;
  });
}

function actKelompokAdd_(p) {
  var nama = reqStr_(p.namaKelompok, 'Nama kelompok', 100);
  var jenis = String(p.jenisHewan || '');
  if (JENIS_KURBAN.indexOf(jenis) < 0) throw new ApiError_('Jenis hewan tidak valid.', 'BAD_REQUEST');
  var kapasitas = Math.round(Number(p.kapasitas));
  if (!(kapasitas >= 1 && kapasitas <= 50)) throw new ApiError_('Kapasitas slot harus 1–50.', 'BAD_REQUEST');
  var status = reqStr_(p.statusPengadaan, 'Status pengadaan', 100);

  return withLock_(function () {
    var list = readAll_('kelompok_hewan');
    if (list.some(function (k) { return k.namaKelompok.toLowerCase() === nama.toLowerCase(); })) {
      throw new ApiError_('Nama kelompok sudah dipakai.', 'DUPLICATE');
    }
    var s = readAll_('settings_kurban')[0] || {};
    var hargaTotal = jenis === 'Sapi Patungan'
      ? Number(s.hargaSapiPatungan || 3500000) * kapasitas
      : Number(s.hargaKambingMandiri || 3200000);
    var id = 'KLP-' + nextNumber_(list, 'idKelompok', 'KLP-');
    appendObj_('kelompok_hewan', {
      _docId: Utilities.getUuid(),
      idKelompok: id,
      namaKelompok: nama,
      jenisHewan: jenis,
      kapasitas: kapasitas,
      hargaTotal: hargaTotal,
      statusPengadaan: status
    });
    return { idKelompok: id };
  });
}

function actTransaksiAdd_(p, user) {
  var idWarga = reqStr_(p.idWarga, 'Warga', 40);
  var nominal = posNum_(p.nominal, 'Nominal setoran');
  var metode = String(p.metodeBayar || '');
  if (METODE_BAYAR.indexOf(metode) < 0) throw new ApiError_('Metode pembayaran tidak valid.', 'BAD_REQUEST');
  var tanggal = String(p.tanggalSetor || '');
  if (!isValidIsoDate_(tanggal)) throw new ApiError_('Tanggal setor tidak valid.', 'BAD_REQUEST');
  var catatan = optStr_(p.catatan, 150) || 'Setoran iuran kurban';

  return withLock_(function () {
    var warga = readAll_('users_warga').filter(function (w) { return w.idWarga === idWarga; })[0];
    if (!warga) throw new ApiError_('Peserta tidak ditemukan.', 'NOT_FOUND');

    var trxList = readAll_('transaksi_iuran');
    var year = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy');
    var prefix = 'INV-' + year + '-';
    var idTransaksi = prefix + nextNumber_(trxList, 'idTransaksi', prefix);

    appendObj_('transaksi_iuran', {
      _docId: Utilities.getUuid(),
      idTransaksi: idTransaksi,
      idWarga: warga.idWarga,
      namaWarga: warga.namaLengkap,
      nominal: nominal,
      metodeBayar: metode,
      tanggalSetor: tanggal,
      dicatatOleh: user.name,
      catatan: catatan
    });

    var newTotal = Number(warga.totalTerbayar || 0) + nominal;
    updateRow_('users_warga', warga._docId, {
      totalTerbayar: newTotal,
      statusLunas: newTotal >= Number(warga.targetIuran || 0)
    });
    return { idTransaksi: idTransaksi };
  });
}

function actJadwalAdd_(p) {
  return withLock_(function () {
    var list = readAll_('jadwal_kurban');
    appendObj_('jadwal_kurban', {
      _docId: Utilities.getUuid(),
      idJadwal: 'JDW-' + nextNumber_(list, 'idJadwal', 'JDW-'),
      tanggal: reqStr_(p.tanggal, 'Tanggal', 40),
      waktu: reqStr_(p.waktu, 'Waktu', 40),
      judulKegiatan: reqStr_(p.judulKegiatan, 'Judul kegiatan', 150),
      lokasi: reqStr_(p.lokasi, 'Lokasi', 150),
      status: 'Akan Datang'
    });
    return null;
  });
}

function actJadwalSetStatus_(p) {
  var docId = reqStr_(p.docId, 'ID dokumen', 80);
  var status = String(p.status || '');
  if (STATUS_JADWAL.indexOf(status) < 0) throw new ApiError_('Status agenda tidak valid.', 'BAD_REQUEST');
  return withLock_(function () {
    if (!updateRow_('jadwal_kurban', docId, { status: status })) throw new ApiError_('Agenda tidak ditemukan.', 'NOT_FOUND');
    return { status: status };
  });
}

function actPengumumanAdd_(p, user) {
  var judul = reqStr_(p.judul, 'Judul pengumuman', 150);
  var isi = reqStr_(p.isiPesan, 'Isi pesan', 2000);
  return withLock_(function () {
    var list = readAll_('pengumuman');
    var now = new Date();
    var tz = Session.getScriptTimeZone();
    appendObj_('pengumuman', {
      _docId: Utilities.getUuid(),
      idPengumuman: 'ANN-' + nextNumber_(list, 'idPengumuman', 'ANN-'),
      judul: judul,
      isiPesan: isi,
      tanggalPost: formatTanggalId_(now, tz),
      penulis: user.name,
      dibuatPada: Utilities.formatDate(now, tz, "yyyy-MM-dd'T'HH:mm:ss")
    });
    return null;
  });
}

function actPengumumanDelete_(p) {
  var docId = reqStr_(p.docId, 'ID dokumen', 80);
  return withLock_(function () {
    if (!deleteRow_('pengumuman', docId)) throw new ApiError_('Pengumuman tidak ditemukan.', 'NOT_FOUND');
    return null;
  });
}

function actSettingsUpdate_(p) {
  var logo = optStr_(p.logoUrl, 500);
  if (logo && !/^https?:\/\//i.test(logo)) throw new ApiError_('URL logo harus diawali http:// atau https://', 'BAD_REQUEST');
  var tanggal = optStr_(p.tanggalIdulAdha, 30);
  if (tanggal && !/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?$/.test(tanggal)) throw new ApiError_('Format tanggal Idul Adha tidak valid.', 'BAD_REQUEST');
  if (tanggal && tanggal.length === 10) tanggal += 'T07:00:00';

  var updates = {
    namaRT: reqStr_(p.namaRT, 'Nama lingkungan RT/RW', 100),
    tahunHijriah: reqStr_(p.tahunHijriah, 'Tahun pelaksanaan', 40),
    hargaSapiPatungan: posNum_(p.hargaSapiPatungan, 'Tarif sapi patungan'),
    hargaKambingMandiri: posNum_(p.hargaKambingMandiri, 'Tarif kambing mandiri'),
    kontakPanitia: optStr_(p.kontakPanitia, 100),
    alamatSekretariat: optStr_(p.alamatSekretariat, 200),
    logoUrl: logo || DEFAULT_LOGO
  };
  if (tanggal) updates.tanggalIdulAdha = tanggal;

  return withLock_(function () {
    var s = readAll_('settings_kurban')[0];
    if (!s) throw new ApiError_('Data pengaturan tidak ditemukan.', 'NOT_FOUND');
    updateRow_('settings_kurban', s._docId, updates);
    return null;
  });
}

function formatTanggalId_(date, tz) {
  var d = Number(Utilities.formatDate(date, tz, 'd'));
  var m = Number(Utilities.formatDate(date, tz, 'M'));
  var y = Utilities.formatDate(date, tz, 'yyyy');
  return (d < 10 ? '0' + d : d) + ' ' + BULAN_ID[m - 1] + ' ' + y;
}

// ---------------------------------------------------------------------------
// LAPISAN PENYIMPANAN SPREADSHEET
// ---------------------------------------------------------------------------
function ss_() {
  var id = props_().getProperty('SPREADSHEET_ID');
  return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
}

function colLetter_(n) {
  var s = '';
  while (n > 0) { var r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

function textColA1_(name, rowStart, rowEnd) {
  var def = SCHEMA[name];
  var out = [];
  def.cols.forEach(function (c, i) {
    if (!def.types[c]) out.push(colLetter_(i + 1) + rowStart + ':' + colLetter_(i + 1) + rowEnd);
  });
  return out;
}

function initSheet_(sh, name) {
  var def = SCHEMA[name];
  sh.getRange(1, 1, 1, def.cols.length).setValues([def.cols])
    .setFontWeight('bold').setBackground('#0D47A1').setFontColor('#FFFFFF');
  sh.setFrozenRows(1);
  var maxRows = Math.max(sh.getMaxRows(), 2);
  sh.getRangeList(textColA1_(name, 2, maxRows)).setNumberFormat('@');
  if (name === 'users_warga') {
    sh.setColumnWidth(def.cols.indexOf('pinHash') + 1, 120);
  }
}

function getSheet_(name) {
  var ss = ss_();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    initSheet_(sh, name);
  }
  return sh;
}

function coerce_(val, type, tz) {
  if (type === 'n') return Number(val) || 0;
  if (type === 'b') return val === true || String(val).toUpperCase() === 'TRUE';
  if (val instanceof Date) return Utilities.formatDate(val, tz, 'yyyy-MM-dd');
  return val === null || val === undefined ? '' : String(val);
}

/** Baca seluruh baris sheet sebagai array objek (nilai mentah, kolom ID disanitasi). */
function readAll_(name) {
  var def = SCHEMA[name];
  var sh = getSheet_(name);
  var lastRow = sh.getLastRow();
  if (lastRow < 2) return [];
  var tz = Session.getScriptTimeZone();
  var values = sh.getRange(2, 1, lastRow - 1, def.cols.length).getValues();
  var out = [];
  values.forEach(function (row) {
    if (row[0] === '' || row[0] === null) return; // lewati baris tanpa _docId
    var o = {};
    def.cols.forEach(function (c, i) {
      var v = coerce_(row[i], def.types[c], tz);
      if (def.ids.indexOf(c) >= 0) v = String(v).replace(/[^\w\-]/g, '');
      o[c] = v;
    });
    out.push(o);
  });
  return out;
}

function toRow_(name, obj) {
  return SCHEMA[name].cols.map(function (c) { return obj[c] === undefined ? '' : obj[c]; });
}

function appendObj_(name, obj) {
  var sh = getSheet_(name);
  var def = SCHEMA[name];
  var r = Math.max(sh.getLastRow(), 1) + 1;
  sh.getRangeList(textColA1_(name, r, r)).setNumberFormat('@');
  sh.getRange(r, 1, 1, def.cols.length).setValues([toRow_(name, obj)]);
}

function findRowNumber_(sh, docId) {
  var lastRow = sh.getLastRow();
  if (lastRow < 2) return -1;
  var ids = sh.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]).replace(/[^\w\-]/g, '') === docId) return i + 2;
  }
  return -1;
}

function updateRow_(name, docId, updates) {
  var sh = getSheet_(name);
  var def = SCHEMA[name];
  var r = findRowNumber_(sh, docId);
  if (r < 0) return false;
  var range = sh.getRange(r, 1, 1, def.cols.length);
  var row = range.getValues()[0];
  def.cols.forEach(function (c, i) {
    if (updates[c] !== undefined) row[i] = updates[c];
  });
  sh.getRangeList(textColA1_(name, r, r)).setNumberFormat('@');
  range.setValues([row]);
  return true;
}

function deleteRow_(name, docId) {
  var sh = getSheet_(name);
  var r = findRowNumber_(sh, docId);
  if (r < 0) return false;
  sh.deleteRow(r);
  return true;
}

// ---------------------------------------------------------------------------
// SETUP & DATA AWAL (dijalankan otomatis pada permintaan pertama,
// atau manual dengan menjalankan fungsi setup() dari editor Apps Script)
// ---------------------------------------------------------------------------
function ensureSetup_() {
  if (props_().getProperty(SETUP_FLAG) === 'done') return;
  setup();
}

function setup() {
  var pr = props_();
  if (!pr.getProperty('TOKEN_SECRET')) pr.setProperty('TOKEN_SECRET', Utilities.getUuid() + Utilities.getUuid());
  if (!pr.getProperty('PIN_SALT')) pr.setProperty('PIN_SALT', Utilities.getUuid());
  if (!pr.getProperty('ADMIN_EMAIL')) pr.setProperty('ADMIN_EMAIL', 'admin@rt05.id');
  if (!pr.getProperty('ADMIN_PASSWORD')) pr.setProperty('ADMIN_PASSWORD', 'admin123');
  if (!pr.getProperty('ADMIN_NAME')) pr.setProperty('ADMIN_NAME', 'H. Hendra (Ketua Panitia)');

  Object.keys(SCHEMA).forEach(function (name) { getSheet_(name); });
  seedIfEmpty_();

  // Hapus sheet bawaan kosong ("Sheet1"/"Lembar1") agar rapi
  var ss = ss_();
  ['Sheet1', 'Lembar1'].forEach(function (n) {
    var sh = ss.getSheetByName(n);
    if (sh && ss.getSheets().length > 1 && sh.getLastRow() === 0) ss.deleteSheet(sh);
  });

  pr.setProperty(SETUP_FLAG, 'done');
  Logger.log('Setup selesai. Spreadsheet: ' + ss.getUrl());
  Logger.log('Admin default: ' + pr.getProperty('ADMIN_EMAIL') + ' / ' + pr.getProperty('ADMIN_PASSWORD') + '  -> SEGERA ganti di Script properties.');
}

function seedBatch_(name, objs) {
  if (!objs.length) return;
  var sh = getSheet_(name);
  var def = SCHEMA[name];
  var r = Math.max(sh.getLastRow(), 1) + 1;
  sh.getRangeList(textColA1_(name, r, r + objs.length - 1)).setNumberFormat('@');
  sh.getRange(r, 1, objs.length, def.cols.length).setValues(objs.map(function (o) { return toRow_(name, o); }));
}

function uid_() { return Utilities.getUuid(); }

function seedIfEmpty_() {
  if (readAll_('settings_kurban').length === 0) {
    seedBatch_('settings_kurban', [{
      _docId: uid_(),
      namaRT: 'RT 05 / RW 03 Perumahan Griya Asri',
      tahunHijriah: '1448 H / 2027 M',
      tanggalIdulAdha: '2027-05-17T07:00:00',
      hargaSapiPatungan: 3500000,
      hargaKambingMandiri: 3200000,
      kontakPanitia: '0812-8890-4521 (Pak H. Hendra)',
      alamatSekretariat: 'Masjid Al-Ikhlas Blok C No. 1, RT 05/RW 03',
      logoUrl: DEFAULT_LOGO
    }]);
  }

  if (readAll_('kelompok_hewan').length === 0) {
    seedBatch_('kelompok_hewan', [
      { _docId: uid_(), idKelompok: 'KLP-001', namaKelompok: 'Kelompok Sapi Limousin 1', jenisHewan: 'Sapi Patungan', kapasitas: 7, hargaTotal: 24500000, statusPengadaan: 'Sudah Dipesan (DP 50%)' },
      { _docId: uid_(), idKelompok: 'KLP-002', namaKelompok: 'Kelompok Sapi Bali 2', jenisHewan: 'Sapi Patungan', kapasitas: 7, hargaTotal: 24500000, statusPengadaan: 'Menunggu Pelunasan Warga' },
      { _docId: uid_(), idKelompok: 'KLP-003', namaKelompok: 'Kambing Etawa Mandiri', jenisHewan: 'Kambing', kapasitas: 10, hargaTotal: 3200000, statusPengadaan: 'Siap Antar H-1' }
    ]);
  }

  if (readAll_('users_warga').length === 0) {
    var pin = hashPin_('1234');
    function w(id, nama, blok, hp, jenis, klp, target, bayar) {
      return { _docId: uid_(), idWarga: id, namaLengkap: nama, blokRumah: blok, noHp: hp, pinHash: pin, jenisKurban: jenis, kelompokHewan: klp, targetIuran: target, totalTerbayar: bayar, statusLunas: bayar >= target };
    }
    seedBatch_('users_warga', [
      w('RT05-001', 'Budi Santoso', 'Blok A1 / No. 04', '081234567890', 'Sapi Patungan', 'Kelompok Sapi Limousin 1', 3500000, 3500000),
      w('RT05-002', 'H. Ahmad Fauzi', 'Blok A2 / No. 11', '081298765432', 'Sapi Patungan', 'Kelompok Sapi Limousin 1', 3500000, 3500000),
      w('RT05-003', 'Siti Rahmawati', 'Blok B1 / No. 07', '081345678901', 'Sapi Patungan', 'Kelompok Sapi Limousin 1', 3500000, 2500000),
      w('RT05-004', 'Dedi Kurniawan', 'Blok B3 / No. 15', '085612345678', 'Kambing', 'Kambing Etawa Mandiri', 3200000, 3200000),
      w('RT05-005', 'Eko Prasetyo', 'Blok C2 / No. 02', '087811223344', 'Sapi Patungan', 'Kelompok Sapi Bali 2', 3500000, 1750000),
      w('RT05-006', 'Rina Marlina', 'Blok C4 / No. 09', '082155667788', 'Kambing', 'Kambing Etawa Mandiri', 3200000, 2000000),
      w('RT05-007', 'Ir. Bambang Wijaya', 'Blok D1 / No. 01', '081199887766', 'Sapi Patungan', 'Kelompok Sapi Limousin 1', 3500000, 3500000)
    ]);
  }

  if (readAll_('transaksi_iuran').length === 0) {
    function t(n, idWarga, nama, nominal, metode, tgl, oleh, cat) {
      return { _docId: uid_(), idTransaksi: 'INV-2026-' + n, idWarga: idWarga, namaWarga: nama, nominal: nominal, metodeBayar: metode, tanggalSetor: tgl, dicatatOleh: oleh, catatan: cat };
    }
    seedBatch_('transaksi_iuran', [
      t('001', 'RT05-001', 'Budi Santoso', 1500000, 'Transfer BCA', '2026-08-12', 'Bendahara Panitia', 'Cicilan tahap 1 iuran sapi'),
      t('002', 'RT05-001', 'Budi Santoso', 2000000, 'Transfer BSI', '2026-10-05', 'Bendahara Panitia', 'Pelunasan patungan sapi kelompok 1'),
      t('003', 'RT05-002', 'H. Ahmad Fauzi', 3500000, 'Tunai', '2026-09-18', 'Ketua Panitia', 'Pembayaran lunas langsung'),
      t('004', 'RT05-003', 'Siti Rahmawati', 2500000, 'Transfer Mandiri', '2026-10-22', 'Bendahara Panitia', 'Setoran ke-2, sisa Rp 1.000.000'),
      t('005', 'RT05-004', 'Dedi Kurniawan', 3200000, 'QRIS Masjid', '2026-11-02', 'Bendahara Panitia', 'Lunas kurban kambing mandiri'),
      t('006', 'RT05-005', 'Eko Prasetyo', 1750000, 'Tunai', '2026-11-10', 'Bendahara Panitia', 'DP 50% patungan sapi'),
      t('007', 'RT05-006', 'Rina Marlina', 2000000, 'Transfer BSI', '2026-11-14', 'Bendahara Panitia', 'Cicilan awal kambing etawa'),
      t('008', 'RT05-007', 'Ir. Bambang Wijaya', 3500000, 'Transfer BCA', '2026-11-15', 'Bendahara Panitia', 'Lunas patungan sapi kelompok 1')
    ]);
  }

  if (readAll_('jadwal_kurban').length === 0) {
    seedBatch_('jadwal_kurban', [
      { _docId: uid_(), idJadwal: 'JDW-001', tanggal: '10 Nov 2026', waktu: '19:30 WIB', judulKegiatan: 'Rapat Pembentukan Panitia & Survei Peternak', lokasi: 'Aula Masjid Al-Ikhlas RT 05', status: 'Selesai' },
      { _docId: uid_(), idJadwal: 'JDW-002', tanggal: '01 Des 2026', waktu: '08:00 - 20:00 WIB', judulKegiatan: 'Pembukaan Tabungan & Cicilan Iuran Warga', lokasi: 'Sekretariat RT 05 / Online Transfer', status: 'Berlangsung' },
      { _docId: uid_(), idJadwal: 'JDW-003', tanggal: '16 Mei 2027', waktu: '16:00 WIB', judulKegiatan: 'Kedatangan Hewan Kurban & Pemeriksaan Kesehatan', lokasi: 'Halaman Parkir Masjid Al-Ikhlas', status: 'Akan Datang' },
      { _docId: uid_(), idJadwal: 'JDW-004', tanggal: '17 Mei 2027', waktu: '07:30 - 14:00 WIB', judulKegiatan: 'Penyembelihan & Distribusi Kupon Daging Warga', lokasi: 'Area Penyembelihan RT 05', status: 'Akan Datang' }
    ]);
  }

  if (readAll_('pengumuman').length === 0) {
    seedBatch_('pengumuman', [
      { _docId: uid_(), idPengumuman: 'ANN-001', judul: 'Batas Akhir Pelunasan Iuran Kurban Tahap 1', isiPesan: 'Assalamualaikum Wr. Wb. Diimbau kepada seluruh warga peserta kurban RT 05 agar dapat menyelesaikan minimal 75% setoran sebelum akhir bulan depan guna penguncian harga hewan di peternak.', tanggalPost: '15 Nov 2026', penulis: 'Ketua Panitia Kurban RT 05', dibuatPada: '2026-11-15T08:00:00' },
      { _docId: uid_(), idPengumuman: 'ANN-002', judul: 'Pendaftaran Kuota Kelompok Sapi Ke-2 Masih Dibuka', isiPesan: 'Tersisa 6 slot untuk Kelompok Sapi Bali 2 (Patungan 1/7 sebesar Rp 3.500.000). Warga yang ingin bergabung silakan hubungi Bendahara atau daftar melalui panitia.', tanggalPost: '12 Nov 2026', penulis: 'Sekretaris Panitia', dibuatPada: '2026-11-12T08:00:00' }
    ]);
  }
}
