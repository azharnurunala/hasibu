/* Hasibu — shared UI primitives (exports to window) */
const { useState, useEffect, useRef, useMemo } = React;

/* ---------- Icons (inline, stroke = currentColor) ---------- */
const Icon = {
  home: (p) => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20h14V9.5" /><path d="M9.5 20v-5h5v5" />
    </svg>
  ),
  history: (p) => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3.5 7.5A9 9 0 1 1 3 12" /><path d="M3 4v3.5h3.5" /><path d="M12 8v4l2.5 1.5" />
    </svg>
  ),
  chart: (p) => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M4 20V10" /><path d="M10 20V4" /><path d="M16 20v-7" /><path d="M3 20h18" />
    </svg>
  ),
  user: (p) => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="8" r="3.4" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </svg>
  ),
  check: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M4 12.5 9.5 18 20 6" />
    </svg>
  ),
  chevron: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  ),
  back: (p) => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  ),
  calendar: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M3.5 9.5h17M8 3.2v3.4M16 3.2v3.4" />
    </svg>
  ),
  logout: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" /><path d="M9 12h11M16 8l4 4-4 4" />
    </svg>
  ),
  spark: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" {...p}>
      <path d="M12 2.5l1.7 5.1 5.3.2-4.2 3.3 1.5 5.2L12 18.3 7.7 21.6l1.5-5.2-4.2-3.3 5.3-.2z" />
    </svg>
  ),
  google: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" {...p}>
      <path fill="#4285F4" d="M22.5 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.9a5.05 5.05 0 0 1-2.19 3.31v2.76h3.54c2.07-1.91 3.25-4.72 3.25-8.08z" />
      <path fill="#34A853" d="M12 23c2.95 0 5.43-.98 7.24-2.66l-3.54-2.76c-.98.66-2.24 1.05-3.7 1.05-2.85 0-5.26-1.92-6.12-4.5H2.23v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.88 14.13a6.6 6.6 0 0 1 0-4.26V7.03H2.23a11 11 0 0 0 0 9.94l3.65-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.6 0 3.05.55 4.18 1.63l3.14-3.14C17.43 2.1 14.95 1 12 1A11 11 0 0 0 2.23 7.03l3.65 2.84C6.74 7.3 9.15 5.38 12 5.38z" />
    </svg>
  ),
  spinner: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="spin" {...p}>
      <path d="M12 3a9 9 0 1 0 9 9" />
    </svg>
  ),
};

/* ---------- Small bits ---------- */
function Dot({ tone, size = 12 }) {
  return <span className="dot" data-tone={tone} style={{ width: size, height: size }} />;
}

function ToneBar({ entry }) {
  const H = window.HASIBU;
  const tones = H.AMALAN.map((a) => entry?.amalan?.[a.key]).filter(Boolean);
  return (
    <div className="tonebar">
      {tones.length === 0 && <span className="tonebar-empty">belum diisi</span>}
      {tones.map((t, i) => <span key={i} className="tonebar-seg" data-tone={t} />)}
    </div>
  );
}

/* skor ring */
function ScoreRing({ value, size = 64, stroke = 7 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - (value || 0) / 100);
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--accent)" strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
          transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: 'stroke-dashoffset .7s cubic-bezier(.2,.8,.2,1)' }} />
      </svg>
      <div className="ring-val">{value == null ? '–' : value}<span>%</span></div>
    </div>
  );
}

/* pilihan warna untuk satu amalan */
function ColorChoice({ amalan, value, onChange }) {
  const H = window.HASIBU;
  const tones = ['hijau', 'kuning', 'merah'];
  return (
    <div className="amalan">
      <div className="amalan-head">
        <span className="amalan-label">{amalan.label}</span>
        {amalan.sub && <span className="amalan-sub">{amalan.sub}</span>}
      </div>
      <div className="choice-row">
        {tones.map((t) => (
          <button key={t} type="button" className="choice" data-tone={t}
            aria-pressed={value === t} data-on={value === t}
            onClick={() => onChange(value === t ? null : t)}>
            <span className="choice-tone">{H.TONE_LABEL[t]}</span>
            <span className="choice-crit">{amalan.levels[t]}</span>
            <span className="choice-tick"><Icon.check width="15" height="15" /></span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Segmented({ options, value, onChange }) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button key={o.v} type="button" className="seg-btn" data-tone={o.tone}
          data-on={value === o.v} onClick={() => onChange(o.v)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function BottomNav({ tab, onTab }) {
  const items = [
    { id: 'home', label: 'Beranda', icon: Icon.home },
    { id: 'history', label: 'Riwayat', icon: Icon.history },
    { id: 'progress', label: 'Progres', icon: Icon.chart },
    { id: 'profile', label: 'Profil', icon: Icon.user },
  ];
  return (
    <nav className="bottomnav">
      {items.map((it) => {
        const I = it.icon;
        return (
          <button key={it.id} className="navbtn" data-on={tab === it.id} onClick={() => onTab(it.id)}>
            <I /><span>{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

Object.assign(window, {
  HIcon: Icon, Dot, ToneBar, ScoreRing, ColorChoice, Segmented, BottomNav,
});
