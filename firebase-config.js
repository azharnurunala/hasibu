/* ============================================================
 * Hasibu — Konfigurasi Firebase
 * ------------------------------------------------------------
 * GANTI nilai di bawah dengan konfigurasi project Firebase-mu.
 * Selama masih berisi "PASTE_..." aplikasi berjalan dalam
 * MODE DEMO (login Google disimulasikan, data hanya di
 * perangkat ini). Setelah diisi dengan benar dan di-deploy,
 * login Google + sinkronisasi lintas perangkat aktif otomatis.
 *
 * Cara mendapatkan nilai ini ada di file SETUP.md.
 * ============================================================ */
window.HASIBU_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDyaECoSP-ckm3cOSwhcnv2AenscY_-0lg",
  authDomain: "hasibu-3e8c8.firebaseapp.com",
  projectId: "hasibu-3e8c8",
  storageBucket: "hasibu-3e8c8.firebasestorage.app",
  messagingSenderId: "484112357632",
  appId: "1:484112357632:web:193afc6ffdd3bfbd03bbe5",
};

/* Aktif kalau konfigurasi sudah benar-benar diisi (bukan placeholder).
 * Tambahkan ?demo=1 di URL untuk memaksa mode demo (mencoba tampilan tanpa login). */
window.HASIBU_FIREBASE_ENABLED = (function () {
  try {
    if (location.search.indexOf('demo=1') !== -1) return false;
    var c = window.HASIBU_FIREBASE_CONFIG || {};
    return Object.values(c).every(function (v) {
      return typeof v === "string" && v && v.indexOf("PASTE_") === -1;
    });
  } catch (e) { return false; }
})();
