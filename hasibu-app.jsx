/* Hasibu — app root + tweaks */
const { useState, useEffect, useMemo } = React;

const HASIBU_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "tema": "tenang",
  "accent": "#2563EB",
  "radius": 18
}/*EDITMODE-END*/;

function App() {
  const H = window.HASIBU;
  const [t, setTweak] = useTweaks(HASIBU_TWEAK_DEFAULTS);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [loginErr, setLoginErr] = useState('');
  const [tab, setTab] = useState('home');
  const [form, setForm] = useState(null); // {year,month,pekan}
  const [refreshKey, setRefreshKey] = useState(0);

  const period = useMemo(() => H.currentPeriod(new Date()), []);

  // dengarkan status auth (Firebase atau sesi demo)
  useEffect(() => {
    const unsub = H.onAuth(async (u) => {
      if (u) { setSyncing(true); await H.pull(u.uid); setSyncing(false); }
      setUser(u);
      setAuthReady(true);
      setRefreshKey((k) => k + 1);
    });
    return unsub;
  }, []);

  const rootStyle = { '--accent': t.accent, '--radius': t.radius + 'px' };

  async function login() {
    setLoginErr(''); setSigningIn(true);
    try {
      const u = await H.signInGoogle();
      if (H.isDemo()) {          // di mode demo onAuth tidak fire — set manual
        setSyncing(true); await H.pull(u.uid); setSyncing(false);
        setUser(u); setTab('home');
      }
      // di mode Firebase, onAuthStateChanged akan mengisi user
    } catch (e) {
      console.warn(e);
      setLoginErr('Login dibatalkan atau gagal. Coba lagi.');
    } finally { setSigningIn(false); }
  }

  async function logout() {
    await H.signOutUser();
    setForm(null); setTab('home');
    if (H.isDemo()) setUser(null);
  }

  async function reset() {
    if (!user) return;
    if (!confirm('Hapus semua catatan mutaba\u2019ah Anda?')) return;
    await H.clearAll(user.uid);
    setRefreshKey((k) => k + 1);
  }

  function openPekan(month, pekan, year) {
    setForm({ year: year || period.year, month, pekan });
  }
  function formDone() { setForm(null); setRefreshKey((k) => k + 1); setTab('home'); }

  // splash saat status auth belum siap
  if (!authReady) {
    return (
      <div className="app" data-tema={t.tema} style={rootStyle}>
        <div className="phone"><div className="splash"><HIcon.spinner width="26" height="26" /></div></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app" data-tema={t.tema} style={rootStyle}>
        <div className="phone"><LoginScreen onGoogle={login} busy={signingIn} error={loginErr} /></div>
        <HasibuTweaks t={t} setTweak={setTweak} />
      </div>
    );
  }

  if (form) {
    return (
      <div className="app" data-tema={t.tema} style={rootStyle}>
        <div className="phone">
          <FormScreen user={user} {...form} onDone={formDone} onCancel={() => setForm(null)} />
        </div>
        <HasibuTweaks t={t} setTweak={setTweak} />
      </div>
    );
  }

  return (
    <div className="app" data-tema={t.tema} style={rootStyle}>
      <div className="phone">
        {syncing && <div className="syncbar"><HIcon.spinner width="14" height="14" />Menyinkronkan…</div>}
        <div className="scroll" key={tab + ':' + refreshKey}>
          {tab === 'home' && <HomeScreen user={user} period={period} onOpenPekan={openPekan} refreshKey={refreshKey} />}
          {tab === 'history' && <HistoryScreen user={user} onOpenPekan={openPekan} refreshKey={refreshKey} />}
          {tab === 'progress' && <ProgressScreen user={user} refreshKey={refreshKey} />}
          {tab === 'profile' && <ProfileScreen user={user} onLogout={logout} onReset={reset} />}
        </div>
        <BottomNav tab={tab} onTab={setTab} />
      </div>
      <HasibuTweaks t={t} setTweak={setTweak} />
    </div>
  );
}

function HasibuTweaks({ t, setTweak }) {
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Tampilan" />
      <TweakRadio label="Tema" value={t.tema}
        options={['tenang', 'garis', 'kartu']}
        onChange={(v) => setTweak('tema', v)} />
      <TweakColor label="Warna aksen" value={t.accent}
        options={['#2563EB', '#1E5B94', '#0E7490', '#3949AB', '#1F7A6D']}
        onChange={(v) => setTweak('accent', v)} />
      <TweakSlider label="Kelengkungan" value={t.radius} min={6} max={28} step={1} unit="px"
        onChange={(v) => setTweak('radius', v)} />
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
