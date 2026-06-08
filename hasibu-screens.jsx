/* Hasibu — screens (exports to window) */
const { useState, useEffect, useMemo, useRef } = React;

/* ============ LOGIN (Google) ============ */
function LoginScreen({ onGoogle, busy, error }) {
  const H = window.HASIBU;
  const demo = H.isDemo();
  return (
    <div className="login">
      <div className="login-top">
        <div className="brand">
          <div className="brand-mark"><HIcon.spark width="20" height="20" /></div>
          <div className="brand-name">Hasibu</div>
        </div>
        <h1 className="login-title">Mutaba'ah<br />Yaumiyah</h1>
        <p className="login-sub">Catat amalan harianmu tiap pekan. Tenang, pribadi, dan terukur.</p>
      </div>

      <div className="login-card">
        <div className="login-feats">
          <div className="login-feat"><HIcon.check width="17" height="17" /><span>Tersimpan aman di akun Google-mu</span></div>
          <div className="login-feat"><HIcon.check width="17" height="17" /><span>Sinkron otomatis di HP &amp; laptop</span></div>
          <div className="login-feat"><HIcon.check width="17" height="17" /><span>Hanya kamu yang melihat catatanmu</span></div>
        </div>

        {error && <div className="form-err">{error}</div>}

        <button className="btn-google" onClick={onGoogle} disabled={busy}>
          {busy
            ? <><HIcon.spinner width="20" height="20" />Menghubungkan…</>
            : <><HIcon.google width="20" height="20" />Lanjutkan dengan Google</>}
        </button>

        <p className="login-note">
          {demo
            ? 'Mode demo — login disimulasikan & data tersimpan di perangkat ini. Setelah dihubungkan ke Firebase, login Google asli & sinkronisasi aktif.'
            : 'Dengan masuk, kamu setuju menyimpan catatan mutaba\u2019ah di akun Google-mu.'}
        </p>
      </div>
    </div>
  );
}

/* ============ HOME ============ */
function HomeScreen({ user, period, onOpenPekan, refreshKey }) {
  const H = window.HASIBU;
  const weeks = H.weeksOfMonth(period.year, period.month);
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 11) return 'Selamat pagi';
    if (h < 15) return 'Selamat siang';
    if (h < 19) return 'Selamat sore';
    return 'Selamat malam';
  })();
  const sapaan = user.nama ? user.nama.split(' ')[0] : (user.email ? user.email.split('@')[0] : 'Sahabat');

  const thisEntry = H.getEntry(user.uid, period.year, period.month, period.pekan);
  const thisScore = H.entryScore(thisEntry);
  const filledCount = weeks.filter((w) => H.getEntry(user.uid, period.year, period.month, w.pekan)).length;

  return (
    <div className="screen">
      <header className="home-hd">
        <div>
          <div className="home-greet">{greeting},</div>
          <div className="home-name">{sapaan}</div>
        </div>
        {user.foto
          ? <img className="home-av" src={user.foto} alt="" referrerPolicy="no-referrer" />
          : <div className="home-av home-av-letter">{sapaan.slice(0, 1).toUpperCase()}</div>}
      </header>

      {/* Kartu pekan ini */}
      <section className="card hero" onClick={() => onOpenPekan(period.month, period.pekan)}>
        <div className="hero-left">
          <div className="hero-eyebrow"><HIcon.calendar width="16" height="16" />Pekan ini</div>
          <div className="hero-title">Pekan {period.pekan} · {H.BULAN[period.month]}</div>
          <div className="hero-range">{H.rangeLabel(period.week)}</div>
          <div className={'hero-status ' + (thisEntry ? 'done' : 'todo')}>
            {thisEntry ? <><HIcon.check width="16" height="16" />Sudah diisi</> : 'Belum diisi — yuk isi sekarang'}
          </div>
        </div>
        <div className="hero-right">
          <ScoreRing value={thisScore} size={78} stroke={8} />
        </div>
      </section>

      <button className="btn-primary block" onClick={() => onOpenPekan(period.month, period.pekan)}>
        {thisEntry ? 'Perbarui mutaba\u2019ah pekan ini' : 'Isi mutaba\u2019ah pekan ini'}<HIcon.chevron />
      </button>

      {/* Pembagian pekan bulan ini */}
      <section className="block-sec">
        <div className="sec-head">
          <h2>Pembagian Pekan</h2>
          <span className="sec-meta">{H.BULAN[period.month]} {period.year} · {filledCount}/{weeks.length} terisi</span>
        </div>
        <div className="weeklist">
          {weeks.map((w) => {
            const en = H.getEntry(user.uid, period.year, period.month, w.pekan);
            const sc = H.entryScore(en);
            const isNow = w.pekan === period.pekan;
            return (
              <button key={w.pekan} className="weekrow" data-now={isNow}
                onClick={() => onOpenPekan(period.month, w.pekan)}>
                <span className="weekrow-no">P{w.pekan}</span>
                <span className="weekrow-main">
                  <span className="weekrow-range">{H.rangeLabel(w)}</span>
                  <ToneBar entry={en} />
                </span>
                <span className="weekrow-end">
                  {en ? <span className="weekrow-score">{sc}%</span> : <span className="weekrow-todo">isi</span>}
                  <HIcon.chevron width="18" height="18" />
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

/* ============ FORM ============ */
function FormScreen({ user, year, month, pekan, onDone, onCancel }) {
  const H = window.HASIBU;
  const existing = H.getEntry(user.uid, year, month, pekan);
  const [amalan, setAmalan] = useState(existing?.amalan || {});
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const week = H.weeksOfMonth(year, month).find((w) => w.pekan === pekan);

  const required = [...H.AMALAN.map((a) => a.key)];
  const missing = required.filter((k) => !amalan[k]).length;
  const total = required.length;
  const done = total - missing;

  function set(k, v) { setAmalan((p) => ({ ...p, [k]: v })); }

  async function save() {
    setTouched(true);
    if (missing > 0) return;
    const entry = {
      id: H.entryId(year, month, pekan),
      year, month, pekan,
      amalan,
      ts: Date.now(),
    };
    setSaving(true);
    await H.saveEntry(user.uid, entry);
    setSaving(false);
    onDone();
  }

  return (
    <div className="screen form">
      <header className="subhd">
        <button className="iconbtn" onClick={onCancel}><HIcon.back /></button>
        <div className="subhd-mid">
          <div className="subhd-title">Pekan {pekan} · {H.BULAN[month]}</div>
          <div className="subhd-sub">{week ? H.rangeLabel(week) : ''}</div>
        </div>
        <div className="subhd-prog">{done}/{total}</div>
      </header>

      <div className="form-body">
        {H.AMALAN.map((a) => (
          <ColorChoice key={a.key} amalan={a} value={amalan[a.key]} onChange={(v) => set(a.key, v)} />
        ))}

        {touched && missing > 0 && (
          <div className="form-err">Masih ada {missing} item yang belum dipilih.</div>
        )}
      </div>

      <div className="form-foot">
        <button className="btn-primary block" onClick={save} disabled={saving}>
          {saving
            ? <><HIcon.spinner width="18" height="18" />Menyimpan…</>
            : (existing ? 'Simpan perubahan' : 'Simpan mutaba\u2019ah')}
        </button>
      </div>
    </div>
  );
}

/* ============ HISTORY ============ */
function HistoryScreen({ user, onOpenPekan, refreshKey }) {
  const H = window.HASIBU;
  const entries = H.loadEntries(user.uid).slice().reverse();

  // group by month
  const groups = [];
  for (const e of entries) {
    const key = `${e.year}-${e.month}`;
    let g = groups.find((x) => x.key === key);
    if (!g) { g = { key, year: e.year, month: e.month, items: [] }; groups.push(g); }
    g.items.push(e);
  }

  return (
    <div className="screen">
      <header className="screen-hd"><h1>Riwayat</h1>
        <span className="screen-hd-meta">{entries.length} catatan</span></header>

      {entries.length === 0 && (
        <div className="empty">
          <HIcon.history width="34" height="34" />
          <p>Belum ada catatan. Isi mutaba'ah pekan ini dari Beranda.</p>
        </div>
      )}

      {groups.map((g) => (
        <section className="block-sec" key={g.key}>
          <div className="sec-head"><h2>{H.BULAN[g.month]} {g.year}</h2></div>
          <div className="weeklist">
            {g.items.map((e) => {
              const week = H.weeksOfMonth(e.year, e.month).find((w) => w.pekan === e.pekan);
              const sc = H.entryScore(e);
              return (
                <button key={e.id} className="weekrow" onClick={() => onOpenPekan(e.month, e.pekan, e.year)}>
                  <span className="weekrow-no">P{e.pekan}</span>
                  <span className="weekrow-main">
                    <span className="weekrow-range">{week ? H.rangeLabel(week) : ''}</span>
                    <ToneBar entry={e} />
                  </span>
                  <span className="weekrow-end"><span className="weekrow-score">{sc}%</span><HIcon.chevron width="18" height="18" /></span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

/* ============ PROGRESS ============ */
function ProgressScreen({ user, refreshKey }) {
  const H = window.HASIBU;
  const entries = H.loadEntries(user.uid);
  const scores = entries.map((e) => H.entryScore(e));
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

  // distribusi per amalan
  const dist = H.AMALAN.map((a) => {
    const c = { hijau: 0, kuning: 0, merah: 0 };
    entries.forEach((e) => { const v = e.amalan?.[a.key]; if (v) c[v] += 1; });
    return { label: a.label, c, total: c.hijau + c.kuning + c.merah };
  });

  // tren skor (maks 12 terakhir)
  const trend = entries.slice(-12).map((e) => ({ pekan: e.pekan, month: e.month, score: H.entryScore(e) }));

  return (
    <div className="screen">
      <header className="screen-hd"><h1>Progres</h1>
        <span className="screen-hd-meta">{entries.length} pekan</span></header>

      {entries.length === 0 ? (
        <div className="empty"><HIcon.chart width="34" height="34" />
          <p>Belum ada data. Mulai isi mutaba'ah untuk melihat progresmu.</p></div>
      ) : (
        <>
          <section className="card prog-top">
            <ScoreRing value={avg} size={92} stroke={9} />
            <div className="prog-top-txt">
              <div className="prog-top-label">Rata-rata skor</div>
              <div className="prog-top-sub">dari {entries.length} pekan terisi</div>
              <div className="prog-legend">
                <span><Dot tone="hijau" /> Hijau</span>
                <span><Dot tone="kuning" /> Kuning</span>
                <span><Dot tone="merah" /> Merah</span>
              </div>
            </div>
          </section>

          {/* Tren */}
          <section className="block-sec">
            <div className="sec-head"><h2>Tren skor</h2><span className="sec-meta">{trend.length} pekan terakhir</span></div>
            <div className="card trendcard">
              <div className="trend">
                {trend.map((t, i) => (
                  <div className="trend-col" key={i} title={`${t.score}%`}>
                    <div className="trend-bar" style={{ height: Math.max(6, t.score) + '%' }} data-tone={t.score >= 70 ? 'hijau' : t.score >= 45 ? 'kuning' : 'merah'} />
                    <span className="trend-x">P{t.pekan}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Distribusi per amalan */}
          <section className="block-sec">
            <div className="sec-head"><h2>Konsistensi per amalan</h2></div>
            <div className="card distcard">
              {dist.map((d) => (
                <div className="distrow" key={d.label}>
                  <div className="distrow-top">
                    <span className="distrow-label">{d.label}</span>
                    <span className="distrow-meta">{d.c.hijau}/{d.total} hijau</span>
                  </div>
                  <div className="distbar">
                    {['hijau', 'kuning', 'merah'].map((t) => d.c[t] > 0 && (
                      <span key={t} data-tone={t} style={{ flex: d.c[t] }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

/* ============ PROFILE ============ */
function ProfileScreen({ user, onLogout, onReset }) {
  const H = window.HASIBU;
  const count = H.loadEntries(user.uid).length;
  const demo = H.isDemo();
  const nama = user.nama || (user.email ? user.email.split('@')[0] : 'Pengguna');
  return (
    <div className="screen">
      <header className="screen-hd"><h1>Profil</h1></header>
      <section className="card profile">
        {user.foto
          ? <img className="profile-av profile-av-img" src={user.foto} alt="" referrerPolicy="no-referrer" />
          : <div className="profile-av">{nama.slice(0, 1).toUpperCase()}</div>}
        <div className="profile-name">{nama}</div>
        {user.email && <div className="profile-email">{user.email}</div>}
        <div className="profile-stat">{count} pekan tercatat</div>
      </section>

      <div className="profile-actions">
        <button className="btn-ghost" onClick={onLogout}><HIcon.logout />Keluar</button>
        <button className="btn-danger" onClick={onReset}>Hapus semua data saya</button>
      </div>
      <p className="login-note center">
        {demo
          ? 'Mode demo — data tersimpan lokal di perangkat ini.'
          : 'Catatan mutaba\u2019ah-mu tersimpan & sinkron di akun Google ini.'}
      </p>
    </div>
  );
}

Object.assign(window, {
  LoginScreen, HomeScreen, FormScreen, HistoryScreen, ProgressScreen, ProfileScreen,
});
