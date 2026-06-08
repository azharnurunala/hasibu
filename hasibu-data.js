/* Hasibu — data layer (plain JS, attaches to window)
 * - amalan config (persis form Google)
 * - kalkulasi pembagian pekan (Pekan 1 mulai Ahad pertama tiap bulan)
 * - storage per-user (localStorage), terisolasi per Nomor Punggung + Kode Kelas
 */
(function () {
  const NS = 'hasibu';

  const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const BULAN_PENDEK = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const HARI = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  // Amalan persis seperti form. value: 'hijau' | 'kuning' | 'merah'
  const AMALAN = [
    {
      key: 'tilawah', label: 'Tilawah',
      levels: { hijau: '≥ 7 juz', kuning: '≥ 4 juz', merah: '< 4 juz' },
    },
    {
      key: 'qiyamul_lail', label: 'Qiyamul Lail',
      levels: { hijau: '> 2×', kuning: '1–2×', merah: '0' },
    },
    {
      key: 'sholat', label: 'Sholat Berjamaah di Masjid',
      sub: 'Laki-laki — atau Sholat di awal waktu (Perempuan)',
      levels: { hijau: '> 20×', kuning: '7–20×', merah: '1–6×' },
    },
    {
      key: 'puasa', label: 'Puasa',
      levels: { hijau: '> 1×', kuning: '1×', merah: '0×' },
    },
    {
      key: 'olahraga', label: 'Olah Raga',
      levels: { hijau: '> 1×', kuning: '1×', merah: '0×' },
    },
  ];

  // IBR — binary
  const IBR = {
    key: 'ibr', label: 'IBR',
    options: [
      { v: 'lunas', label: 'Lunas', tone: 'hijau' },
      { v: 'belum', label: 'Belum Lunas', tone: 'merah' },
    ],
  };

  const TONE_SCORE = { hijau: 3, kuning: 2, merah: 1 };
  const TONE_LABEL = { hijau: 'Hijau', kuning: 'Kuning', merah: 'Merah' };

  // ---- Kalkulasi pekan ----
  function midnight(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }

  // tanggal Ahad pertama di bulan (1-indexed)
  function firstSundayDate(year, month) {
    const first = new Date(year, month, 1);
    const offset = (7 - first.getDay()) % 7; // getDay 0 = Ahad
    return 1 + offset;
  }

  // daftar pekan: {pekan, startDate, endDate, startD, endLabel}
  function weeksOfMonth(year, month) {
    const fs = firstSundayDate(year, month);
    const lastDay = new Date(year, month + 1, 0).getDate();
    const weeks = [];
    let day = fs, n = 1;
    while (day <= lastDay) {
      const startDate = new Date(year, month, day);
      const endDate = new Date(year, month, day + 6); // bisa lewat ke bulan depan
      weeks.push({ pekan: n, startDate, endDate });
      day += 7; n += 1;
    }
    return weeks;
  }

  // periode saat ini berdasarkan tanggal hari ini
  function currentPeriod(today) {
    const t = midnight(today || new Date());
    let y = t.getFullYear(), m = t.getMonth();
    const weeks = weeksOfMonth(y, m);
    for (const w of weeks) {
      if (t >= midnight(w.startDate) && t <= midnight(w.endDate)) {
        return { year: y, month: m, pekan: w.pekan, week: w };
      }
    }
    // sebelum Ahad pertama → pekan terakhir bulan sebelumnya
    let pm = m - 1, py = y; if (pm < 0) { pm = 11; py -= 1; }
    const pw = weeksOfMonth(py, pm); const last = pw[pw.length - 1];
    return { year: py, month: pm, pekan: last.pekan, week: last };
  }

  function fmtDate(d) { return `${d.getDate()} ${BULAN_PENDEK[d.getMonth()]}`; }
  function rangeLabel(w) { return `${fmtDate(w.startDate)} – ${fmtDate(w.endDate)}`; }

  // ============================================================
  // FIREBASE (auth Google + Firestore) dengan fallback MODE DEMO
  // ============================================================
  let _fbReady = false, _auth = null, _db = null;
  function cloudEnabled() {
    if (_fbReady) return true;
    if (!window.HASIBU_FIREBASE_ENABLED) return false;
    if (!window.firebase || !firebase.initializeApp) return false;
    try {
      if (!firebase.apps || !firebase.apps.length) {
        firebase.initializeApp(window.HASIBU_FIREBASE_CONFIG);
      }
      _auth = firebase.auth();
      _db = firebase.firestore();
      _fbReady = true;
      return true;
    } catch (e) { console.warn('[Hasibu] Firebase init gagal — pakai mode demo.', e); return false; }
  }
  function isDemo() { return !cloudEnabled(); }

  function mapUser(u) {
    return { uid: u.uid, nama: u.displayName || '', email: u.email || '', foto: u.photoURL || '' };
  }

  // ---- Storage (cache lokal, di-key per uid) ----
  function userKey(uid) { return `${NS}:data:${uid}`; }
  function entryId(year, month, pekan) { return `${year}-${String(month + 1).padStart(2, '0')}-P${pekan}`; }

  function loadEntries(uid) {
    try { return JSON.parse(localStorage.getItem(userKey(uid)) || '[]'); }
    catch (e) { return []; }
  }
  function writeLocal(uid, all) { localStorage.setItem(userKey(uid), JSON.stringify(all)); }

  async function saveEntry(uid, entry) {
    const all = loadEntries(uid);
    const idx = all.findIndex((e) => e.id === entry.id);
    if (idx >= 0) all[idx] = entry; else all.push(entry);
    all.sort((a, b) => (a.year - b.year) || (a.month - b.month) || (a.pekan - b.pekan));
    writeLocal(uid, all);
    await push(uid, all);          // sinkron ke cloud (no-op di mode demo)
    return all;
  }
  function getEntry(uid, year, month, pekan) {
    const id = entryId(year, month, pekan);
    return loadEntries(uid).find((e) => e.id === id) || null;
  }
  async function clearAll(uid) {
    localStorage.removeItem(userKey(uid));
    if (cloudEnabled()) {
      try { await _db.collection('hasibu').doc(uid).set({ entries: [], updatedAt: Date.now() }, { merge: true }); }
      catch (e) { console.warn('[Hasibu] gagal hapus di cloud', e); }
    }
  }

  // ---- Sinkronisasi cloud ----
  async function pull(uid) {
    if (!cloudEnabled()) return;
    try {
      const snap = await _db.collection('hasibu').doc(uid).get();
      const remote = snap.exists ? (snap.data().entries || []) : [];
      writeLocal(uid, remote);
    } catch (e) { console.warn('[Hasibu] pull gagal', e); }
  }
  async function push(uid, all) {
    if (!cloudEnabled()) return;
    try {
      await _db.collection('hasibu').doc(uid)
        .set({ entries: all || loadEntries(uid), updatedAt: Date.now() }, { merge: true });
    } catch (e) { console.warn('[Hasibu] push gagal', e); }
  }

  // ---- Auth ----
  // onAuth(cb): cb(user|null). Mengembalikan fungsi unsubscribe.
  function onAuth(cb) {
    if (cloudEnabled()) {
      return _auth.onAuthStateChanged((u) => cb(u ? mapUser(u) : null));
    }
    // mode demo: pakai sesi tersimpan di localStorage (abaikan sesi format lama tanpa uid)
    const s = loadSession();
    cb(s && s.uid ? s : null);
    return function () {};
  }
  async function signInGoogle() {
    if (cloudEnabled()) {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const res = await _auth.signInWithPopup(provider);
      return mapUser(res.user);
    }
    // mode demo: akun simulasi
    const u = { uid: 'demo-google-user', nama: 'Pengguna Demo', email: 'demo@hasibu.app', foto: '' };
    saveSession(u);
    return u;
  }
  async function signOutUser() {
    if (cloudEnabled()) { await _auth.signOut(); return; }
    clearSession();
  }

  // ---- Session (hanya dipakai di mode demo) ----
  function loadSession() {
    try { return JSON.parse(localStorage.getItem(`${NS}:session`) || 'null'); }
    catch (e) { return null; }
  }
  function saveSession(u) { localStorage.setItem(`${NS}:session`, JSON.stringify(u)); }
  function clearSession() { localStorage.removeItem(`${NS}:session`); }

  // skor satu entry (0..100) berdasar amalan + ibr
  function entryScore(entry) {
    if (!entry || !entry.amalan) return null;
    let got = 0, max = 0;
    for (const a of AMALAN) {
      const v = entry.amalan[a.key];
      max += 3;
      if (v) got += TONE_SCORE[v] || 0;
    }
    return Math.round((got / max) * 100);
  }

  window.HASIBU = {
    NS, BULAN, BULAN_PENDEK, HARI, AMALAN, IBR, TONE_SCORE, TONE_LABEL,
    firstSundayDate, weeksOfMonth, currentPeriod, fmtDate, rangeLabel,
    userKey, entryId, loadEntries, saveEntry, getEntry, clearAll, entryScore,
    cloudEnabled, isDemo, onAuth, signInGoogle, signOutUser, pull, push,
  };
})();
