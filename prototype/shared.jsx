// Shared utilities, formatters, and mini-chart primitives used across the
// three dashboard directions and the drill-down screens.

const fmt = {
  usd(v, opts = {}) {
    const { compact = false, sign = false } = opts;
    if (v == null) return '—';
    const s = sign && v > 0 ? '+' : '';
    if (compact) {
      const abs = Math.abs(v);
      if (abs >= 1e6) return s + '$' + (v / 1e6).toFixed(2) + 'M';
      if (abs >= 1e3) return s + '$' + (v / 1e3).toFixed(1) + 'k';
      return s + '$' + v.toFixed(0);
    }
    return s + '$' + Math.round(v).toLocaleString('en-US');
  },
  num(v, d = 0) {
    if (v == null) return '—';
    return v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  },
  pct(v, d = 1) { return (v * 100).toFixed(d) + '%'; },
  prob(v) { return (v * 100).toFixed(0) + '¢'; },
  ago(ts, now = Date.now()) {
    const sec = Math.max(0, Math.round((now - ts) / 1000));
    if (sec < 60) return sec + 's';
    const m = Math.round(sec / 60);
    if (m < 60) return m + 'm';
    const h = Math.round(m / 60);
    if (h < 24) return h + 'h';
    return Math.round(h / 24) + 'd';
  },
  hhmm(ts) {
    const d = new Date(ts);
    const hh = String(d.getUTCHours()).padStart(2, '0');
    const mm = String(d.getUTCMinutes()).padStart(2, '0');
    const ss = String(d.getUTCSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  },
  hhmmShort(ts) {
    const d = new Date(ts);
    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
  },
  shortAddr(a) { return a.slice(0, 6) + '…' + a.slice(-4); },
};

// Sparkline. Pure SVG, no chart lib. Pass values + {width,height,color,fill}.
function Sparkline({ values, width = 80, height = 24, color = '#22c55e', fill = null, strokeWidth = 1.25, baseline = false }) {
  if (!values || values.length < 2) return <svg width={width} height={height} />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const stepX = width / (values.length - 1);
  const pts = values.map((v, i) => [i * stepX, height - ((v - min) / span) * height]);
  const d = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(2) + ',' + p[1].toFixed(2)).join(' ');
  const fillD = fill ? d + ` L${width.toFixed(2)},${height} L0,${height} Z` : null;
  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      {baseline && <line x1="0" y1={height - 0.5} x2={width} y2={height - 0.5} stroke={color} opacity="0.15" />}
      {fillD && <path d={fillD} fill={fill} opacity="0.18" />}
      <path d={d} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// Score bar — horizontal red/orange ramp 0..10
function ScoreBar({ score, max = 10, height = 4, accent = '#22c55e' }) {
  const pct = Math.min(1, score / max);
  return (
    <div style={{ width: '100%', height, background: 'rgba(255,255,255,0.06)', borderRadius: 1, position: 'relative' }}>
      <div style={{ width: (pct * 100) + '%', height: '100%', background: accent, borderRadius: 1 }} />
    </div>
  );
}

// Live ticker pulse — small dot
function LivePulse({ color = '#22c55e', size = 7 }) {
  return (
    <span style={{ display: 'inline-flex', position: 'relative', width: size, height: size }}>
      <span style={{
        position: 'absolute', inset: 0, background: color, borderRadius: '50%',
        animation: 'pa-pulse 2s ease-out infinite',
      }} />
      <span style={{ position: 'absolute', inset: 0, background: color, borderRadius: '50%' }} />
    </span>
  );
}

// Inject keyframes
if (!document.getElementById('pa-keyframes')) {
  const s = document.createElement('style');
  s.id = 'pa-keyframes';
  s.textContent = `
@keyframes pa-pulse { 0% { transform: scale(1); opacity: 0.7 } 80%,100% { transform: scale(2.6); opacity: 0 } }
@keyframes pa-row-in { from { background: rgba(34,197,94,0.18); } to { background: transparent; } }
@keyframes pa-blink { 50% { opacity: 0.3 } }
.pa-row-in { animation: pa-row-in 1.6s ease-out 1; }
.pa-blink { animation: pa-blink 1.1s ease-in-out infinite; }
`;
  document.head.appendChild(s);
}

// Hook: return an array of trades with newest first, that "ticks" by
// inserting one new trade every `intervalMs`. Great for the live feed effect.
function useLiveFeed(seedTrades, intervalMs = 4000, maxLen = 200) {
  const [feed, setFeed] = React.useState(seedTrades.slice(0, 60));
  const cursor = React.useRef(60);
  React.useEffect(() => {
    const id = setInterval(() => {
      cursor.current = (cursor.current + 1) % seedTrades.length;
      const incoming = { ...seedTrades[cursor.current], ts: Date.now(), _new: true, id: 'tx-live-' + cursor.current + '-' + Date.now() };
      setFeed((cur) => [incoming, ...cur].slice(0, maxLen));
    }, intervalMs);
    return () => clearInterval(id);
  }, [seedTrades, intervalMs, maxLen]);
  return feed;
}

// Tiny chevron / icon set drawn as inline SVG
const Icon = {
  arrowUp: (p) => <svg width={p.size||10} height={p.size||10} viewBox="0 0 10 10"><path d="M5 1 L9 7 L1 7 Z" fill="currentColor" /></svg>,
  arrowDown: (p) => <svg width={p.size||10} height={p.size||10} viewBox="0 0 10 10"><path d="M5 9 L1 3 L9 3 Z" fill="currentColor" /></svg>,
  search: (p) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.4"/><path d="M9 9 L13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  bell: (p) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 14 14" fill="none"><path d="M3 6.5 a4 4 0 0 1 8 0 V9.5 L12 11 H2 L3 9.5 Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M5.5 12.5 a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.2"/></svg>,
  filter: (p) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 14 14" fill="none"><path d="M2 3 H12 L9 7 V11 L5 12 V7 Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>,
  close: (p) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 14 14" fill="none"><path d="M3 3 L11 11 M11 3 L3 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  ext: (p) => <svg width={p.size||10} height={p.size||10} viewBox="0 0 10 10" fill="none"><path d="M3 3 H7 V7 M7 3 L3 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
  dot: (p) => <svg width={p.size||6} height={p.size||6} viewBox="0 0 6 6"><circle cx="3" cy="3" r="2.5" fill="currentColor" /></svg>,
};

Object.assign(window, { fmt, Sparkline, ScoreBar, LivePulse, useLiveFeed, Icon });
