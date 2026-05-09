// Polish round for Direction B (Trading Desk):
//   1. TradeDrawer    — full side-drawer for inspecting a single trade
//   2. DeskStates     — empty / loading / error / no-results
//   3. MobileDesk     — narrow-viewport layout (375 / 414)

const PC = {
  bg: '#0d1014',
  surface: '#13171c',
  surface2: '#181d23',
  border: 'rgba(255,255,255,0.07)',
  borderHi: 'rgba(255,255,255,0.10)',
  fg: '#e6e8eb',
  fgDim: '#9aa0a8',
  fgFaint: '#5a6068',
  green: '#22c55e',
  greenSoft: 'rgba(34,197,94,0.12)',
  red: '#ef4444',
  redSoft: 'rgba(239,68,68,0.12)',
  amber: '#f59e0b',
};

// ---------------------------------------------------------------------------
// 1) Trade detail side-drawer
// ---------------------------------------------------------------------------
function TradeDrawer({ width, height, trade: tradeArg }) {
  const trade = tradeArg || window.MOCK.TRADES.find(t => t.notional >= 1_000_000) || window.MOCK.TRADES[0];
  const series = window.MOCK.SERIES[trade.market.id];
  const related = window.MOCK.TRADES
    .filter(t => t.wallet.wallet === trade.wallet.wallet && t.id !== trade.id)
    .slice(0, 6);
  const sameMarket = window.MOCK.TRADES
    .filter(t => t.market.id === trade.market.id && t.id !== trade.id)
    .slice(0, 6);

  // mini chart
  const chartW = 360, chartH = 110;
  const minP = Math.min(...series.map(p=>p.p));
  const maxP = Math.max(...series.map(p=>p.p));
  const span = maxP - minP || 1;
  const xOf = i => (i / (series.length-1)) * chartW;
  const yOf = p => chartH - ((p - minP) / span) * chartH;
  const pathD = series.map((pt,i)=>(i===0?'M':'L') + xOf(i).toFixed(1) + ',' + yOf(pt.p).toFixed(1)).join(' ');
  // mark trade time on chart
  const tIdx = Math.floor(((trade.ts - series[0].t) / (series[series.length-1].t - series[0].t)) * (series.length-1));
  const tx = xOf(Math.max(0, Math.min(series.length-1, tIdx)));
  const ty = yOf(trade.price);

  // Backdrop + drawer in same artboard
  const drawerW = 460;

  return (
    <div style={{ width, height, background: PC.bg, color: PC.fg, fontFamily:'"IBM Plex Sans", sans-serif', fontSize: 12.5, position: 'relative', overflow: 'hidden' }}>
      {/* faded dashboard underneath (decorative — just a hint) */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.45, pointerEvents:'none' }}>
        <DeskDashboard width={width} height={height} />
      </div>
      {/* dim */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }} />

      {/* DRAWER */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: drawerW, height: '100%', background: PC.bg, borderLeft: '1px solid '+PC.borderHi, boxShadow: '-12px 0 32px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column' }}>
        {/* header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid '+PC.border, display:'flex', alignItems:'center', gap: 10 }}>
          <span style={{
            fontFamily:'IBM Plex Mono', fontSize: 10.5, fontWeight: 600, padding: '2px 6px', borderRadius: 3,
            color: trade.side==='BUY'?PC.green:PC.red, background: trade.side==='BUY'?PC.greenSoft:PC.redSoft, letterSpacing:'0.04em',
          }}>{trade.side} {trade.outcome.toUpperCase()}</span>
          <span style={{ color: PC.fgDim, fontFamily: 'IBM Plex Mono', fontSize: 11 }}>{fmt.hhmm(trade.ts)} UTC · {fmt.ago(trade.ts)} ago</span>
          <button style={{ marginLeft:'auto', background:'transparent', border:'none', color: PC.fgDim, cursor:'pointer', padding: 4, borderRadius: 4 }}><Icon.close size={14} /></button>
        </div>

        {/* body */}
        <div className="ab-scroll" style={{ overflow:'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* market */}
          <div>
            <div style={{ color: PC.fgFaint, fontSize: 10, textTransform:'uppercase', letterSpacing:'0.1em', fontFamily: 'IBM Plex Mono' }}>Market · {trade.market.category}</div>
            <div style={{ fontWeight: 600, fontSize: 16, lineHeight: 1.3, marginTop: 6, textWrap: 'pretty' }}>{trade.market.title}</div>
            <a style={{ color: PC.green, fontSize: 11, fontFamily:'IBM Plex Mono', marginTop: 6, display:'inline-flex', alignItems:'center', gap: 4, cursor:'pointer' }}>
              View market <Icon.ext size={10} />
            </a>
          </div>

          {/* big numbers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <DrawerStat label="Notional" value={fmt.usd(trade.notional, {compact:true})} accent={trade.notional>=1_000_000?PC.amber:PC.fg} sub={'$' + fmt.num(trade.notional, 0)} />
            <DrawerStat label="Price" value={fmt.prob(trade.price)} sub={'size ' + fmt.num(trade.size, 0)} />
            <DrawerStat label="Score" value={trade.score.toFixed(2)} accent={PC.green} sub={`size ${trade.notionalScore.toFixed(2)}${trade.counterTrend?' + ctr 3.0':''}`} />
          </div>

          {/* signals */}
          <div>
            <div style={{ color: PC.fgFaint, fontSize: 10, textTransform:'uppercase', letterSpacing:'0.1em', fontFamily: 'IBM Plex Mono', marginBottom: 8 }}>Signals</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <SignalRow on={trade.notional>=1_000_000} label="Whale print" detail="≥ $1M notional" />
              <SignalRow on={trade.notional>=5_000_000} label="Mega whale" detail="≥ $5M — top 1% of last 30d" />
              <SignalRow on={trade.counterTrend} label="Counter-trend" detail="Direction opposes 1h price drift" />
              <SignalRow on={trade.notionalScore>=2} label="Size outlier" detail={`${trade.notionalScore.toFixed(2)}σ above market mean`} />
            </div>
          </div>

          {/* mini chart */}
          <div>
            <div style={{ color: PC.fgFaint, fontSize: 10, textTransform:'uppercase', letterSpacing:'0.1em', fontFamily: 'IBM Plex Mono', marginBottom: 8 }}>Price · 24h · this trade marked</div>
            <svg width={chartW} height={chartH} style={{ display:'block' }}>
              <path d={pathD + ` L${chartW},${chartH} L0,${chartH} Z`} fill={PC.green} opacity="0.1" />
              <path d={pathD} stroke={PC.green} strokeWidth="1.4" fill="none" />
              <line x1={tx} x2={tx} y1="0" y2={chartH} stroke={PC.amber} strokeDasharray="2 3" />
              <circle cx={tx} cy={ty} r="6" fill={PC.amber} fillOpacity="0.25" />
              <circle cx={tx} cy={ty} r="3" fill={PC.amber} />
            </svg>
          </div>

          {/* wallet */}
          <div>
            <div style={{ color: PC.fgFaint, fontSize: 10, textTransform:'uppercase', letterSpacing:'0.1em', fontFamily: 'IBM Plex Mono', marginBottom: 8 }}>Wallet</div>
            <div style={{ background: PC.surface, border: '1px solid '+PC.border, borderRadius: 8, padding: 12, display:'flex', alignItems:'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, oklch(0.55 0.16 145), oklch(0.4 0.14 165))', display:'flex', alignItems:'center', justifyContent:'center', color: '#0a1a0d', fontFamily: 'IBM Plex Mono', fontSize: 14, fontWeight: 700 }}>
                {(trade.wallet.pseudonym || '0x')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, overflow:'hidden' }}>
                <div style={{ fontWeight: 500 }}>{trade.wallet.pseudonym || trade.wallet.name || fmt.shortAddr(trade.wallet.wallet)}</div>
                <div style={{ color: PC.fgDim, fontSize: 11, fontFamily:'IBM Plex Mono' }}>{fmt.shortAddr(trade.wallet.wallet)}</div>
              </div>
              <button style={{ background: PC.surface2, border: '1px solid '+PC.border, color: PC.fg, fontFamily:'inherit', fontSize: 11, padding: '6px 10px', borderRadius: 6, cursor:'pointer' }}>Open profile</button>
            </div>
          </div>

          {/* same wallet recent */}
          <CollapsibleList title={`Same wallet — recent (${related.length})`} items={related} />
          {/* same market recent */}
          <CollapsibleList title={`Same market — recent (${sameMarket.length})`} items={sameMarket} />

          {/* tx + actions */}
          <div>
            <div style={{ color: PC.fgFaint, fontSize: 10, textTransform:'uppercase', letterSpacing:'0.1em', fontFamily: 'IBM Plex Mono', marginBottom: 6 }}>Transaction</div>
            <div style={{ background: PC.surface, border: '1px solid '+PC.border, borderRadius: 6, padding: '8px 10px', fontFamily:'IBM Plex Mono', fontSize: 11, color: PC.fgDim, display:'flex', alignItems:'center', gap: 8 }}>
              <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex: 1 }}>0x4f3a9b7c2e1d8f6a5b4c3d2e1f0a9b8c7d6e5f4a</span>
              <span style={{ color: PC.green, cursor:'pointer', display:'inline-flex', gap:4, alignItems:'center' }}>polygonscan <Icon.ext size={10}/></span>
            </div>
          </div>
        </div>

        {/* sticky footer actions */}
        <div style={{ padding: 14, borderTop: '1px solid '+PC.border, display: 'flex', gap: 8, background: PC.bg }}>
          <button style={{ background: PC.green, color: '#062a13', border: 'none', padding: '9px 14px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, borderRadius: 6, flex: 1 }}>Add alert for this wallet</button>
          <button style={{ background: PC.surface2, border: '1px solid '+PC.border, color: PC.fg, fontFamily:'inherit', fontSize: 12, padding: '9px 12px', borderRadius: 6, cursor:'pointer' }}>Pin to feed</button>
        </div>
      </div>
    </div>
  );
}

function DrawerStat({ label, value, sub, accent }) {
  return (
    <div style={{ background: PC.surface, border: '1px solid '+PC.border, borderRadius: 8, padding: '10px 12px' }}>
      <div style={{ color: PC.fgFaint, fontSize: 10, textTransform:'uppercase', letterSpacing:'0.08em', fontFamily: 'IBM Plex Mono' }}>{label}</div>
      <div style={{ fontFamily: 'IBM Plex Mono', fontWeight: 600, fontSize: 18, color: accent || PC.fg, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ color: PC.fgDim, fontSize: 10.5, fontFamily:'IBM Plex Mono', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function SignalRow({ on, label, detail }) {
  return (
    <div style={{ display: 'flex', alignItems:'center', gap: 10, padding: '8px 10px', background: on ? PC.surface : 'transparent', border: '1px solid ' + (on ? PC.border : 'rgba(255,255,255,0.04)'), borderRadius: 6 }}>
      <span style={{
        width: 16, height: 16, borderRadius: '50%',
        border: '1px solid ' + (on ? PC.green : PC.fgFaint),
        background: on ? PC.green : 'transparent',
        display: 'flex', alignItems:'center', justifyContent:'center', flex: '0 0 auto',
      }}>
        {on && <svg width="9" height="9" viewBox="0 0 9 9"><path d="M1.5 4.5 L3.5 6.5 L7.5 2.5" stroke="#062a13" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ color: on ? PC.fg : PC.fgDim, fontSize: 12.5, fontWeight: on ? 500 : 400 }}>{label}</div>
        <div style={{ color: PC.fgFaint, fontSize: 10.5, fontFamily:'IBM Plex Mono' }}>{detail}</div>
      </div>
    </div>
  );
}

function CollapsibleList({ title, items }) {
  return (
    <div>
      <div style={{ color: PC.fgFaint, fontSize: 10, textTransform:'uppercase', letterSpacing:'0.1em', fontFamily: 'IBM Plex Mono', marginBottom: 6 }}>{title}</div>
      <div style={{ background: PC.surface, border: '1px solid '+PC.border, borderRadius: 8, overflow:'hidden' }}>
        {items.length === 0 && (
          <div style={{ padding: 14, color: PC.fgDim, fontSize: 11.5, textAlign:'center' }}>No related trades.</div>
        )}
        {items.map((t,i) => (
          <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '50px 1fr 70px', gap: 8, padding: '8px 10px', borderTop: i===0?'none':'1px solid '+PC.border, fontSize: 12 }}>
            <span style={{ color: t.side==='BUY'?PC.green:PC.red, fontFamily:'IBM Plex Mono', fontWeight: 600, fontSize: 10.5 }}>{t.side}</span>
            <span style={{ overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{t.market.title}</span>
            <span style={{ textAlign:'right', fontFamily:'IBM Plex Mono', fontWeight: 600, color: t.notional>=1_000_000?PC.amber:PC.fg }}>{fmt.usd(t.notional,{compact:true})}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2) Empty / loading / error states (4-up artboard)
// ---------------------------------------------------------------------------
function DeskStates({ width, height }) {
  // Render a 2x2 grid of states inside one artboard
  const cellW = (width - 16*3) / 2;
  const cellH = (height - 16*3) / 2;
  return (
    <div style={{ width, height, background: PC.bg, padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 16, fontFamily:'"IBM Plex Sans", sans-serif' }}>
      <StateCell w={cellW} h={cellH} title="Cold start · DB empty" subtitle="Run python ingest.py to seed">
        <EmptyState
          icon="archive"
          headline="No trades ingested yet"
          sub="The last cron run inserted 0 rows. Trigger a manual fetch or wait for the next 5-min window."
          cta="Run ingestion now"
          secondary="View ingest logs"
        />
      </StateCell>
      <StateCell w={cellW} h={cellH} title="No matches · filters" subtitle="The 24h feed has trades, just not these">
        <EmptyState
          icon="filter"
          headline="No anomalies match your filters"
          sub="Score threshold ≥ 4.5 with category = Sports leaves nothing in the 24h window."
          cta="Reset to defaults"
          secondary="Loosen score threshold"
        />
      </StateCell>
      <StateCell w={cellW} h={cellH} title="Loading · first paint" subtitle="Skeleton shimmer + KPI stubs">
        <LoadingState />
      </StateCell>
      <StateCell w={cellW} h={cellH} title="Connection error" subtitle="Supabase unreachable">
        <ErrorState />
      </StateCell>
    </div>
  );
}

function StateCell({ w, h, title, subtitle, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
      <div>
        <div style={{ color: PC.green, fontSize: 10, fontFamily:'IBM Plex Mono', textTransform:'uppercase', letterSpacing:'0.14em' }}>▌ {title}</div>
        <div style={{ color: PC.fgDim, fontSize: 11, marginTop: 2 }}>{subtitle}</div>
      </div>
      <div style={{ flex: 1, background: PC.surface, border: '1px solid '+PC.border, borderRadius: 10, overflow: 'hidden', minHeight: 0 }}>
        {children}
      </div>
    </div>
  );
}

function EmptyState({ icon, headline, sub, cta, secondary }) {
  return (
    <div style={{ height: '100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap: 14, padding: 30, textAlign: 'center', color: PC.fg }}>
      <div style={{ width: 56, height: 56, borderRadius: 12, background: PC.surface2, border: '1px solid '+PC.border, display:'flex', alignItems:'center', justifyContent:'center', color: PC.fgDim }}>
        {icon === 'filter' ? <Icon.filter size={22} /> : (
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 6 H19 V18 H3 Z" stroke="currentColor" strokeWidth="1.4" /><path d="M3 6 L5 3 H17 L19 6" stroke="currentColor" strokeWidth="1.4" /><path d="M9 11 H13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
        )}
      </div>
      <div style={{ fontSize: 16, fontWeight: 600 }}>{headline}</div>
      <div style={{ color: PC.fgDim, fontSize: 12.5, maxWidth: 320 }}>{sub}</div>
      <div style={{ display:'flex', gap: 8, marginTop: 4 }}>
        <button style={{ background: PC.green, color: '#062a13', border: 'none', padding: '8px 14px', borderRadius: 6, cursor: 'pointer', fontFamily:'inherit', fontSize: 12, fontWeight: 600 }}>{cta}</button>
        <button style={{ background: PC.surface2, color: PC.fg, border: '1px solid '+PC.border, padding: '8px 14px', borderRadius: 6, cursor: 'pointer', fontFamily:'inherit', fontSize: 12 }}>{secondary}</button>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ height: '100%', display:'flex', flexDirection:'column', padding: 14, gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ background: PC.surface2, border: '1px solid '+PC.border, borderRadius: 8, padding: 12 }}>
            <Shimmer w="60%" h={9} />
            <div style={{ height: 10 }} />
            <Shimmer w="80%" h={20} />
          </div>
        ))}
      </div>
      <div style={{ flex: 1, background: PC.surface2, border: '1px solid '+PC.border, borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Shimmer w="40%" h={10} />
        {[0,1,2,3,4,5].map(i => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 60px', gap: 10, alignItems:'center' }}>
            <Shimmer w="100%" h={9} />
            <Shimmer w={(60+(i*7)%30)+'%'} h={9} />
            <Shimmer w="100%" h={9} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Shimmer({ w, h }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: 3,
      background: 'linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.10), rgba(255,255,255,0.04))',
      backgroundSize: '200% 100%',
      animation: 'pa-shimmer 1.4s ease-in-out infinite',
    }} />
  );
}

function ErrorState() {
  return (
    <div style={{ height: '100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap: 14, padding: 30, textAlign: 'center', color: PC.fg }}>
      <div style={{ width: 56, height: 56, borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', display:'flex', alignItems:'center', justifyContent:'center', color: PC.red }}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M11 4 L20 18 H2 Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
          <path d="M11 9 V13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          <circle cx="11" cy="15.5" r="0.9" fill="currentColor"/>
        </svg>
      </div>
      <div style={{ fontSize: 16, fontWeight: 600 }}>Couldn't reach the database</div>
      <div style={{ color: PC.fgDim, fontSize: 12.5, maxWidth: 340 }}>Last successful query was <span style={{color:PC.fg, fontFamily:'IBM Plex Mono'}}>4m 12s ago</span>. Supabase may be paused after a long idle. We're retrying every 10s.</div>
      <div style={{ background: PC.bg, border: '1px solid '+PC.border, borderRadius: 6, padding: '8px 12px', color: PC.red, fontFamily:'IBM Plex Mono', fontSize: 11, marginTop: 4 }}>
        psycopg2.OperationalError: connection refused
      </div>
      <div style={{ display:'flex', gap: 8, marginTop: 4 }}>
        <button style={{ background: PC.green, color: '#062a13', border: 'none', padding: '8px 14px', borderRadius: 6, cursor: 'pointer', fontFamily:'inherit', fontSize: 12, fontWeight: 600 }}>Retry now</button>
        <button style={{ background: PC.surface2, color: PC.fg, border: '1px solid '+PC.border, padding: '8px 14px', borderRadius: 6, cursor: 'pointer', fontFamily:'inherit', fontSize: 12 }}>View status page</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3) Mobile / narrow layout
// ---------------------------------------------------------------------------
function MobileDesk({ width = 390, height = 844 }) {
  const trades = useLiveFeed(window.MOCK.TRADES, 5500);
  const [tab, setTab] = React.useState('feed');
  const [threshold, setThreshold] = React.useState(0);
  const filtered = trades.filter(t=>t.score>=threshold);

  const totalNotional = filtered.reduce((s,t)=>s+t.notional,0);
  const whales = filtered.filter(t=>t.notional>=1_000_000).length;

  return (
    <div style={{ width, height, background: PC.bg, color: PC.fg, fontFamily:'"IBM Plex Sans", sans-serif', fontSize: 12.5, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Status bar fake */}
      <div style={{ height: 44, padding: '0 18px', display: 'flex', alignItems: 'center', justifyContent:'space-between', fontFamily: 'IBM Plex Mono', fontSize: 12, fontWeight: 600 }}>
        <span>14:32</span>
        <span style={{ color: PC.fgDim }}>● ● ●</span>
      </div>

      {/* App bar */}
      <div style={{ padding: '6px 16px 12px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid '+PC.border }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: PC.green, color: '#0a1a0d', display:'flex', alignItems:'center', justifyContent:'center', fontWeight: 800, fontFamily: 'IBM Plex Mono' }}>P</div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>PolyAnomalies</div>
          <div style={{ display:'flex', alignItems:'center', gap: 6, color: PC.fgDim, fontSize: 10.5, fontFamily: 'IBM Plex Mono' }}>
            <LivePulse color={PC.green} size={5} /> Live · 3s lag
          </div>
        </div>
        <button style={{ marginLeft: 'auto', background: PC.surface, border: '1px solid '+PC.border, color: PC.fgDim, width: 34, height: 34, borderRadius: 8, display:'flex', alignItems:'center', justifyContent:'center', cursor: 'pointer' }}><Icon.bell size={16}/></button>
      </div>

      {/* KPI row — horizontal scroll */}
      <div style={{ padding: '12px 16px 4px', display: 'flex', gap: 8, overflowX: 'auto' }} className="ab-scroll">
        <MKpi label="24h NOTIONAL" value={fmt.usd(totalNotional,{compact:true})} accent />
        <MKpi label="ANOMALIES" value={filtered.length} />
        <MKpi label="WHALES" value={whales} />
        <MKpi label="MARKETS" value={new Set(filtered.map(t=>t.market.id)).size} />
      </div>

      {/* threshold pill */}
      <div style={{ padding: '8px 16px', display: 'flex', gap: 8, alignItems:'center', background: PC.surface, margin: '8px 16px', borderRadius: 8 }}>
        <span style={{ fontSize: 11, color: PC.fgDim }}>Score ≥</span>
        <input type="range" min="0" max="6" step="0.25" value={threshold} onChange={e=>setThreshold(+e.target.value)} style={{ flex: 1, accentColor: PC.green }} />
        <span style={{ fontFamily:'IBM Plex Mono', fontSize: 11, fontWeight: 600, width: 28, textAlign:'right' }}>{threshold.toFixed(2)}</span>
      </div>

      {/* tabs */}
      <div style={{ padding: '4px 16px 0', display: 'flex', gap: 4, borderBottom: '1px solid '+PC.border }}>
        {[['feed','Feed'],['markets','Markets'],['wallets','Wallets']].map(([k,v]) => (
          <button key={k} onClick={()=>setTab(k)} style={{
            background: 'transparent', border: 'none', color: tab===k?PC.fg:PC.fgDim, fontFamily:'inherit', fontSize: 13, fontWeight: tab===k?600:400,
            padding: '10px 4px', borderBottom: '2px solid '+(tab===k?PC.green:'transparent'), cursor: 'pointer',
          }}>{v}</button>
        ))}
      </div>

      {/* List */}
      <div className="ab-scroll" style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        {tab === 'feed' && filtered.slice(0, 30).map(t => (
          <div key={t.id} className={t._new?'pa-row-in':''} style={{ padding: '12px 16px', borderBottom: '1px solid '+PC.border }}>
            <div style={{ display: 'flex', alignItems:'center', gap: 8, marginBottom: 4 }}>
              <span style={{
                fontFamily:'IBM Plex Mono', fontSize: 9.5, fontWeight: 600, padding: '1px 5px', borderRadius: 3,
                color: t.side==='BUY'?PC.green:PC.red, background: t.side==='BUY'?PC.greenSoft:PC.redSoft, letterSpacing:'0.04em',
              }}>{t.side}</span>
              <span style={{ color: PC.fgFaint, fontFamily:'IBM Plex Mono', fontSize: 10.5 }}>{fmt.hhmmShort(t.ts)} · {fmt.ago(t.ts)} ago</span>
              <span style={{ marginLeft: 'auto', color: PC.green, fontFamily:'IBM Plex Mono', fontSize: 11, fontWeight: 700 }}>{t.score.toFixed(2)}</span>
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.3, fontWeight: 500, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{t.market.title}</div>
            <div style={{ display:'flex', gap: 8, alignItems:'baseline', marginTop: 4 }}>
              <span style={{ fontFamily:'IBM Plex Mono', fontSize: 13, fontWeight: 600, color: t.notional>=1_000_000?PC.amber:PC.fg }}>{fmt.usd(t.notional,{compact:true})}</span>
              <span style={{ color: PC.fgDim, fontFamily:'IBM Plex Mono', fontSize: 10.5 }}>@ {fmt.prob(t.price)}</span>
              <span style={{ marginLeft: 'auto', color: PC.fgDim, fontSize: 10.5, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis', maxWidth: 120 }}>
                {t.wallet.pseudonym || fmt.shortAddr(t.wallet.wallet)}
              </span>
            </div>
            {(t.counterTrend || t.notional>=1_000_000) && (
              <div style={{ display: 'flex', gap: 4, marginTop: 5 }}>
                {t.counterTrend && <DeskTag bg="rgba(245,158,11,0.15)" color={PC.amber}>CTR</DeskTag>}
                {t.notional>=1_000_000 && <DeskTag bg={PC.greenSoft} color={PC.green}>WHALE</DeskTag>}
                {t.notional>=5_000_000 && <DeskTag bg={PC.redSoft} color={PC.red}>MEGA</DeskTag>}
              </div>
            )}
          </div>
        ))}
        {tab === 'markets' && (() => {
          const map = new Map();
          filtered.forEach(t => {
            const cur = map.get(t.market.id) || { market: t.market, notional: 0, hits: 0 };
            cur.notional += t.notional; cur.hits++;
            map.set(t.market.id, cur);
          });
          return [...map.values()].sort((a,b)=>b.notional-a.notional).slice(0,12).map((m,i)=>(
            <div key={m.market.id} style={{ padding: '12px 16px', borderBottom: '1px solid '+PC.border, display: 'grid', gridTemplateColumns: '24px 1fr 80px', gap: 10, alignItems:'center' }}>
              <span style={{ color: PC.fgFaint, fontFamily:'IBM Plex Mono', fontSize: 11 }}>{(i+1).toString().padStart(2,'0')}</span>
              <div>
                <div style={{ fontSize: 12.5, lineHeight: 1.3, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{m.market.title}</div>
                <div style={{ color: PC.fgDim, fontSize: 10.5, fontFamily:'IBM Plex Mono', marginTop: 2 }}>{m.market.category} · {m.hits} flagged</div>
              </div>
              <div style={{ textAlign:'right', fontFamily:'IBM Plex Mono', fontWeight: 600, color: PC.amber }}>{fmt.usd(m.notional,{compact:true})}</div>
            </div>
          ));
        })()}
        {tab === 'wallets' && (() => {
          const map = new Map();
          filtered.forEach(t => {
            const cur = map.get(t.wallet.wallet) || { wallet: t.wallet, notional: 0, count: 0 };
            cur.notional += t.notional; cur.count++;
            map.set(t.wallet.wallet, cur);
          });
          return [...map.values()].sort((a,b)=>b.notional-a.notional).slice(0,12).map((w,i)=>(
            <div key={w.wallet.wallet} style={{ padding: '12px 16px', borderBottom: '1px solid '+PC.border, display: 'grid', gridTemplateColumns: '24px 1fr 80px', gap: 10, alignItems:'center' }}>
              <span style={{ color: PC.fgFaint, fontFamily:'IBM Plex Mono', fontSize: 11 }}>{i+1}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{w.wallet.pseudonym || w.wallet.name || fmt.shortAddr(w.wallet.wallet)}</div>
                <div style={{ color: PC.fgDim, fontSize: 10.5, fontFamily:'IBM Plex Mono' }}>{fmt.shortAddr(w.wallet.wallet)} · {w.count}t</div>
              </div>
              <div style={{ textAlign:'right', fontFamily:'IBM Plex Mono', fontWeight: 600, color: PC.green }}>{fmt.usd(w.notional,{compact:true})}</div>
            </div>
          ));
        })()}
      </div>

      {/* Bottom safe area */}
      <div style={{ height: 28, borderTop: '1px solid '+PC.border, background: PC.bg }} />
    </div>
  );
}

function MKpi({ label, value, accent }) {
  return (
    <div style={{ background: PC.surface, border: '1px solid '+PC.border, borderRadius: 8, padding: '10px 12px', minWidth: 100, flex: '0 0 auto' }}>
      <div style={{ color: PC.fgFaint, fontSize: 9.5, letterSpacing:'0.08em' }}>{label}</div>
      <div style={{ fontFamily:'IBM Plex Mono', fontWeight: 600, fontSize: 17, color: accent ? PC.green : PC.fg, marginTop: 3 }}>{value}</div>
    </div>
  );
}

// shimmer keyframes (one-time)
if (!document.getElementById('pa-shimmer-kf')) {
  const s = document.createElement('style');
  s.id = 'pa-shimmer-kf';
  s.textContent = `@keyframes pa-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`;
  document.head.appendChild(s);
}

window.TradeDrawer = TradeDrawer;
window.DeskStates = DeskStates;
window.MobileDesk = MobileDesk;
