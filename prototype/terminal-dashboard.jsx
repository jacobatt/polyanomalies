// Direction A — "Terminal"
// Dense, monospaced, ASCII grid lines, single green accent, status-bar feel.
// Hero is the live anomaly feed; secondary cells stack to the right.

const TermColors = {
  bg: '#0a0b0c',
  bgAlt: '#0e0f10',
  bgRow: '#111314',
  border: '#1f2123',
  borderHi: '#2a2c2f',
  fg: '#d8d8d2',
  fgDim: '#7a7c7d',
  fgFaint: '#4a4c4e',
  green: '#22c55e',
  greenDim: '#16a34a',
  red: '#ef4444',
  amber: '#eab308',
  blue: '#60a5fa',
};

function TerminalDashboard({ width, height, openTrade, openMarket, openWallet, openAlerts }) {
  const trades = useLiveFeed(window.MOCK.TRADES, 5500);
  const [threshold, setThreshold] = React.useState(0);
  const [query, setQuery] = React.useState('');
  const [sideFilter, setSideFilter] = React.useState('ALL');
  const [windowH, setWindowH] = React.useState(24);

  const filtered = React.useMemo(() => {
    return trades.filter(t => t.score >= threshold)
      .filter(t => sideFilter === 'ALL' || t.side === sideFilter)
      .filter(t => !query || (t.market.title + ' ' + (t.wallet.pseudonym||'') + ' ' + (t.wallet.name||'')).toLowerCase().includes(query.toLowerCase()));
  }, [trades, threshold, sideFilter, query]);

  const kpis = React.useMemo(() => {
    const totalNotional = filtered.reduce((s, t) => s + t.notional, 0);
    const whales = filtered.filter(t => t.notional >= 1_000_000).length;
    const counter = filtered.filter(t => t.counterTrend).length;
    const markets = new Set(filtered.map(t => t.market.id)).size;
    return { totalNotional, whales, counter, markets, n: filtered.length };
  }, [filtered]);

  // top wallets by notional
  const topWallets = React.useMemo(() => {
    const map = new Map();
    filtered.forEach(t => {
      const k = t.wallet.wallet;
      const cur = map.get(k) || { wallet: t.wallet, notional: 0, count: 0, markets: new Set() };
      cur.notional += t.notional; cur.count += 1; cur.markets.add(t.market.id);
      map.set(k, cur);
    });
    return [...map.values()].sort((a,b)=>b.notional-a.notional).slice(0,8);
  }, [filtered]);

  // top markets by hits
  const topMarkets = React.useMemo(() => {
    const map = new Map();
    filtered.forEach(t => {
      const k = t.market.id;
      const cur = map.get(k) || { market: t.market, hits: 0, notional: 0 };
      cur.hits += 1; cur.notional += t.notional;
      map.set(k, cur);
    });
    return [...map.values()].sort((a,b)=>b.notional-a.notional).slice(0,6);
  }, [filtered]);

  return (
    <div style={{
      width, height, background: TermColors.bg, color: TermColors.fg,
      fontFamily: '"JetBrains Mono", "IBM Plex Mono", monospace',
      fontSize: 11.5, lineHeight: 1.45, display: 'flex', flexDirection: 'column',
      letterSpacing: '0.01em',
    }}>
      {/* TOP CHROME */}
      <div style={{ height: 28, borderBottom: '1px solid '+TermColors.border, display: 'flex', alignItems: 'center', padding: '0 10px', gap: 14, fontSize: 10.5, color: TermColors.fgDim }}>
        <span style={{ color: TermColors.green, fontWeight: 600 }}>polyAnomalies</span>
        <span style={{ color: TermColors.fgFaint }}>v0.3.1</span>
        <span style={{ marginLeft: 18, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <LivePulse color={TermColors.green} size={6} />
          <span style={{ color: TermColors.green }}>LIVE</span>
          <span>· {fmt.hhmm(window.MOCK.NOW)} UTC</span>
        </span>
        <span style={{ marginLeft: 'auto', color: TermColors.fgDim }}>db: <span style={{color:TermColors.fg}}>supabase/trades</span></span>
        <span>rows: <span style={{color:TermColors.fg}}>1,284,902</span></span>
        <span>lag: <span style={{color:TermColors.green}}>3s</span></span>
        <button onClick={openAlerts} style={{ background: 'transparent', border: '1px solid '+TermColors.border, color: TermColors.fgDim, padding: '2px 8px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 10.5 }}>
          [alerts]
        </button>
      </div>

      {/* CONTROL BAR */}
      <div style={{ height: 36, borderBottom: '1px solid '+TermColors.border, display: 'flex', alignItems: 'center', padding: '0 10px', gap: 12, background: TermColors.bgAlt }}>
        <Field label="window">
          {[6,24,72,168].map(h => (
            <button key={h} onClick={()=>setWindowH(h)} style={{
              background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11,
              color: windowH===h ? TermColors.green : TermColors.fgDim, padding: '2px 4px',
            }}>{h}h</button>
          ))}
        </Field>
        <Field label="score">
          <input type="range" min="0" max="6" step="0.25" value={threshold} onChange={e=>setThreshold(+e.target.value)}
            style={{ width: 80, accentColor: TermColors.green }} />
          <span style={{ color: TermColors.fg, width: 28 }}>{threshold.toFixed(2)}</span>
        </Field>
        <Field label="side">
          {['ALL','BUY','SELL'].map(s => (
            <button key={s} onClick={()=>setSideFilter(s)} style={{
              background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11,
              color: sideFilter===s ? TermColors.green : TermColors.fgDim, padding: '2px 4px',
            }}>{s}</button>
          ))}
        </Field>
        <Field label="filter">
          <input type="text" value={query} onChange={e=>setQuery(e.target.value)} placeholder="market | wallet"
            style={{ background: TermColors.bg, border: '1px solid '+TermColors.border, color: TermColors.fg,
              fontFamily: 'inherit', fontSize: 11, padding: '2px 6px', width: 180, outline: 'none' }} />
        </Field>
        <span style={{ marginLeft: 'auto', color: TermColors.fgDim, fontSize: 10.5 }}>
          showing <span style={{color:TermColors.fg}}>{kpis.n}</span> / {trades.length} trades
        </span>
      </div>

      {/* KPI STRIP */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', borderBottom: '1px solid '+TermColors.border }}>
        <Kpi label="trades" value={kpis.n} />
        <Kpi label="notional" value={fmt.usd(kpis.totalNotional, {compact:true})} accent />
        <Kpi label=">$1M" value={kpis.whales} />
        <Kpi label="counter-trend" value={kpis.counter} />
        <Kpi label="markets" value={kpis.markets} />
      </div>

      {/* MAIN GRID: feed (hero) + side stack */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'minmax(0, 1.65fr) minmax(0, 1fr)', minHeight: 0 }}>
        {/* FEED */}
        <div style={{ borderRight: '1px solid '+TermColors.border, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <SectionHead title="anomaly_feed" right={<><span style={{color:TermColors.fgDim}}>sorted by</span> <span style={{color:TermColors.green}}>ts↓</span></>} />
          {/* table header */}
          <div style={{ display: 'grid',
            gridTemplateColumns: '64px 60px 1fr 130px 60px 90px 90px 56px',
            gap: 8, padding: '6px 12px', borderBottom: '1px solid '+TermColors.border,
            color: TermColors.fgDim, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <span>time</span>
            <span>side</span>
            <span>market · outcome</span>
            <span>wallet</span>
            <span style={{textAlign:'right'}}>price</span>
            <span style={{textAlign:'right'}}>notional</span>
            <span>signals</span>
            <span style={{textAlign:'right'}}>score</span>
          </div>
          <div className="ab-scroll" style={{ overflowY: 'auto', minHeight: 0, flex: 1 }}>
            {filtered.slice(0, 80).map((t, i) => (
              <div key={t.id} className={t._new ? 'pa-row-in' : ''} onClick={()=>openTrade && openTrade(t)} style={{
                display: 'grid',
                gridTemplateColumns: '64px 60px 1fr 130px 60px 90px 90px 56px',
                gap: 8, padding: '5px 12px',
                borderBottom: '1px solid '+TermColors.border,
                color: TermColors.fg, fontSize: 11.5,
                cursor: 'pointer',
                background: i%2===1 ? TermColors.bgRow : 'transparent',
              }}>
                <span style={{ color: TermColors.fgDim }}>{fmt.hhmm(t.ts)}</span>
                <span style={{ color: t.side==='BUY' ? TermColors.green : TermColors.red, fontWeight: 600 }}>{t.side}</span>
                <span style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  <span>{t.market.title}</span>
                  <span style={{color:TermColors.fgFaint}}> · {t.outcome}</span>
                </span>
                <span style={{ color: TermColors.fgDim, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>
                  {t.wallet.pseudonym || t.wallet.name || fmt.shortAddr(t.wallet.wallet)}
                </span>
                <span style={{ textAlign: 'right', color: TermColors.fgDim }}>{fmt.prob(t.price)}</span>
                <span style={{ textAlign: 'right', color: t.notional>=1_000_000 ? TermColors.amber : TermColors.fg }}>
                  {fmt.usd(t.notional, {compact:true})}
                </span>
                <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {t.counterTrend && <Tag color={TermColors.amber}>CTR</Tag>}
                  {t.notional >= 1_000_000 && <Tag color={TermColors.green}>WHALE</Tag>}
                  {t.notional >= 5_000_000 && <Tag color={TermColors.red}>MEGA</Tag>}
                </span>
                <span style={{ textAlign: 'right', color: TermColors.green, fontWeight: 600 }}>
                  {t.score.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT STACK */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {/* TOP MARKETS */}
          <div style={{ borderBottom: '1px solid '+TermColors.border, flex: '0 0 auto' }}>
            <SectionHead title="hot_markets" right={<span style={{color:TermColors.fgDim}}>by notional</span>} />
            <div>
              {topMarkets.map((m, i) => {
                const series = window.MOCK.SERIES[m.market.id].slice(-40).map(p=>p.p);
                return (
                  <div key={m.market.id} onClick={()=>openMarket && openMarket(m.market)} style={{
                    display: 'grid', gridTemplateColumns: '20px 1fr 80px 60px 40px',
                    gap: 8, padding: '6px 12px',
                    borderBottom: '1px solid '+TermColors.border,
                    cursor: 'pointer',
                    background: i%2===1 ? TermColors.bgRow : 'transparent',
                  }}>
                    <span style={{ color: TermColors.fgFaint }}>{(i+1).toString().padStart(2,'0')}</span>
                    <span style={{ overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>
                      {m.market.title}
                    </span>
                    <span style={{ color: TermColors.fg }}>
                      <Sparkline values={series} width={70} height={16} color={TermColors.green} fill={TermColors.green} />
                    </span>
                    <span style={{ textAlign:'right', color: TermColors.amber }}>{fmt.usd(m.notional, {compact:true})}</span>
                    <span style={{ textAlign:'right', color: TermColors.fgDim }}>{m.hits}×</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TOP WALLETS */}
          <div style={{ borderBottom: '1px solid '+TermColors.border, flex: '1 1 0', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <SectionHead title="top_wallets" right={<span style={{color:TermColors.fgDim}}>{topWallets.length} active</span>} />
            <div className="ab-scroll" style={{ overflowY: 'auto', flex: 1 }}>
              {topWallets.map((w, i) => (
                <div key={w.wallet.wallet} onClick={()=>openWallet && openWallet(w.wallet)} style={{
                  display: 'grid', gridTemplateColumns: '20px 1fr 70px 30px 40px',
                  gap: 8, padding: '6px 12px',
                  borderBottom: '1px solid '+TermColors.border,
                  cursor: 'pointer',
                  background: i%2===1 ? TermColors.bgRow : 'transparent',
                }}>
                  <span style={{ color: TermColors.fgFaint }}>{(i+1).toString().padStart(2,'0')}</span>
                  <span>
                    <div style={{ color: TermColors.fg }}>{w.wallet.pseudonym || w.wallet.name || fmt.shortAddr(w.wallet.wallet)}</div>
                    <div style={{ color: TermColors.fgFaint, fontSize: 10 }}>{fmt.shortAddr(w.wallet.wallet)}</div>
                  </span>
                  <span style={{ textAlign:'right', color: TermColors.green }}>{fmt.usd(w.notional, {compact:true})}</span>
                  <span style={{ textAlign:'right', color: TermColors.fgDim }}>{w.count}t</span>
                  <span style={{ textAlign:'right', color: TermColors.fgDim }}>{w.markets.size}m</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* STATUS BAR */}
      <div style={{ height: 22, borderTop: '1px solid '+TermColors.border, background: TermColors.bgAlt,
        display: 'flex', alignItems: 'center', padding: '0 10px', gap: 14, color: TermColors.fgDim, fontSize: 10 }}>
        <span style={{ color: TermColors.green }}>● connected</span>
        <span>polymarket-data-api</span>
        <span style={{ color: TermColors.fgFaint }}>|</span>
        <span>cron */5min</span>
        <span style={{ color: TermColors.fgFaint }}>|</span>
        <span>last_ingest <span style={{color:TermColors.fg}}>2m12s</span> ago</span>
        <span style={{ marginLeft:'auto' }}>q: {kpis.n} rows · {(filtered.reduce((s,t)=>s+t.notional,0)/1e9).toFixed(2)}B notional / 24h</span>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: TermColors.fgDim, fontSize: 10.5 }}>
      <span style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <span style={{ color: TermColors.fgFaint }}>·</span>
      {children}
    </span>
  );
}

function Kpi({ label, value, accent }) {
  return (
    <div style={{ padding: '10px 14px', borderRight: '1px solid '+TermColors.border }}>
      <div style={{ color: TermColors.fgDim, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      <div style={{ color: accent ? TermColors.green : TermColors.fg, fontSize: 20, fontWeight: 600, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}

function SectionHead({ title, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '6px 12px', background: TermColors.bgAlt, borderBottom: '1px solid '+TermColors.border,
      color: TermColors.fgDim, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
      <span><span style={{ color: TermColors.green }}>▸</span> {title}</span>
      <span>{right}</span>
    </div>
  );
}

function Tag({ children, color }) {
  return (
    <span style={{
      fontSize: 9, padding: '1px 4px', borderRadius: 1,
      border: '1px solid '+color, color, letterSpacing: '0.05em',
    }}>{children}</span>
  );
}

window.TerminalDashboard = TerminalDashboard;
