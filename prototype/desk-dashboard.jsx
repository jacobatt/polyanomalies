// Direction B — "Trading Desk"
// Modern dark with mixed sans + mono. Card-based layout, subtle borders,
// generous (but still dense) spacing. Hero: live feed with chart strip.

const DeskC = {
  bg: '#0d1014',
  surface: '#13171c',
  surface2: '#181d23',
  border: 'rgba(255,255,255,0.06)',
  borderHi: 'rgba(255,255,255,0.10)',
  fg: '#e6e8eb',
  fgDim: '#9aa0a8',
  fgFaint: '#5a6068',
  green: '#22c55e',
  greenSoft: 'rgba(34,197,94,0.12)',
  red: '#ef4444',
  redSoft: 'rgba(239,68,68,0.12)',
  amber: '#f59e0b',
  panel: '#11151a',
};

function DeskDashboard({ width, height, openTrade, openMarket, openWallet, openAlerts }) {
  const trades = useLiveFeed(window.MOCK.TRADES, 4500);
  const [threshold, setThreshold] = React.useState(0);
  const [query, setQuery] = React.useState('');
  const [windowH, setWindowH] = React.useState(24);

  const filtered = React.useMemo(() => {
    return trades.filter(t => t.score >= threshold)
      .filter(t => !query || (t.market.title + ' ' + (t.wallet.pseudonym||'') + ' ' + (t.wallet.name||'')).toLowerCase().includes(query.toLowerCase()));
  }, [trades, threshold, query]);

  const totalNotional = filtered.reduce((s,t)=>s+t.notional,0);
  const whales = filtered.filter(t=>t.notional>=1_000_000).length;
  const counter = filtered.filter(t=>t.counterTrend).length;
  const markets = new Set(filtered.map(t=>t.market.id)).size;

  // 24h notional histogram by hour (for sparkline strip)
  const histo = React.useMemo(() => {
    const buckets = new Array(24).fill(0);
    const now = window.MOCK.NOW;
    filtered.forEach(t => {
      const h = Math.min(23, Math.max(0, 23 - Math.floor((now - t.ts) / 3600000)));
      buckets[h] += t.notional;
    });
    return buckets;
  }, [filtered]);

  const topMarkets = React.useMemo(() => {
    const map = new Map();
    filtered.forEach(t => {
      const k = t.market.id;
      const cur = map.get(k) || { market: t.market, hits: 0, notional: 0, buys: 0, sells: 0 };
      cur.hits++; cur.notional += t.notional;
      if (t.side==='BUY') cur.buys += t.notional; else cur.sells += t.notional;
      map.set(k, cur);
    });
    return [...map.values()].sort((a,b)=>b.notional-a.notional).slice(0,5);
  }, [filtered]);

  const topWallets = React.useMemo(() => {
    const map = new Map();
    filtered.forEach(t => {
      const k = t.wallet.wallet;
      const cur = map.get(k) || { wallet: t.wallet, notional: 0, count: 0, markets: new Set() };
      cur.notional += t.notional; cur.count++; cur.markets.add(t.market.id);
      map.set(k,cur);
    });
    return [...map.values()].sort((a,b)=>b.notional-a.notional).slice(0,6);
  }, [filtered]);

  return (
    <div style={{
      width, height, background: DeskC.bg, color: DeskC.fg,
      fontFamily: '"IBM Plex Sans", -apple-system, system-ui, sans-serif',
      fontSize: 12.5, display: 'flex', flexDirection: 'column',
    }}>
      {/* TOP NAV */}
      <div style={{ height: 44, borderBottom: '1px solid '+DeskC.border, display: 'flex', alignItems: 'center', padding: '0 18px', gap: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: DeskC.green, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a1a0d', fontWeight: 800, fontFamily: 'IBM Plex Mono', fontSize: 12 }}>P</div>
          <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' }}>PolyAnomalies</span>
          <span style={{ color: DeskC.fgFaint, fontSize: 11, fontFamily: 'IBM Plex Mono', marginLeft: 4 }}>v0.3</span>
        </div>
        <nav style={{ display: 'flex', gap: 2, marginLeft: 8 }}>
          {['Live Feed','Markets','Wallets','Backtest','Methods'].map((x,i)=>(
            <span key={x} style={{
              fontSize: 12.5, padding: '6px 12px', borderRadius: 6, color: i===0?DeskC.fg:DeskC.fgDim,
              background: i===0 ? DeskC.surface : 'transparent', cursor: 'pointer',
            }}>{x}</span>
          ))}
        </nav>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display:'flex', alignItems:'center', gap: 6, color: DeskC.fgDim, fontSize: 11.5 }}>
            <LivePulse color={DeskC.green} size={6} />
            <span>Live · 3s lag</span>
          </div>
          <div style={{ position:'relative' }}>
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search markets, wallets…"
              style={{ background: DeskC.surface, border: '1px solid '+DeskC.border, borderRadius: 6,
                color: DeskC.fg, fontFamily: 'inherit', fontSize: 12, padding: '6px 10px 6px 28px',
                width: 220, outline: 'none' }} />
            <span style={{ position:'absolute', left: 9, top: 7, color: DeskC.fgFaint }}><Icon.search size={14} /></span>
          </div>
          <button onClick={openAlerts} style={{
            background: DeskC.surface, border: '1px solid '+DeskC.border, borderRadius: 6,
            color: DeskC.fgDim, padding: '6px 10px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12,
            display: 'flex', alignItems: 'center', gap: 6,
          }}><Icon.bell size={13} /> Alerts <span style={{ background: DeskC.green, color: '#062a13', borderRadius: 99, fontSize: 10, padding: '0 5px', fontWeight: 600 }}>3</span></button>
        </div>
      </div>

      {/* CONTROL ROW */}
      <div style={{ display: 'flex', alignItems:'center', padding: '12px 18px', gap: 10, borderBottom: '1px solid '+DeskC.border }}>
        <div style={{ fontSize: 18, fontWeight: 600, letterSpacing:'-0.01em', marginRight: 10 }}>Anomaly monitor</div>
        <div style={{ display: 'flex', background: DeskC.surface, borderRadius: 6, padding: 2 }}>
          {[6,24,72,168].map(h => (
            <button key={h} onClick={()=>setWindowH(h)} style={{
              border:'none', background: windowH===h ? DeskC.surface2 : 'transparent',
              color: windowH===h ? DeskC.fg : DeskC.fgDim, fontFamily:'inherit', fontSize: 11.5,
              padding: '4px 10px', borderRadius: 4, cursor: 'pointer',
            }}>{h<=24?h+'h':Math.floor(h/24)+'d'}</button>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap: 8, background: DeskC.surface, padding: '4px 12px', borderRadius: 6 }}>
          <span style={{ color: DeskC.fgDim, fontSize: 11.5 }}>Score ≥</span>
          <input type="range" min="0" max="6" step="0.25" value={threshold} onChange={e=>setThreshold(+e.target.value)}
            style={{ width: 100, accentColor: DeskC.green }} />
          <span style={{ fontFamily:'IBM Plex Mono', fontSize: 11.5, fontWeight: 600, width: 32 }}>{threshold.toFixed(2)}</span>
        </div>
        <span style={{ color: DeskC.fgDim, fontSize: 11.5, marginLeft: 'auto' }}>
          <span style={{ color: DeskC.fg, fontWeight: 600 }}>{filtered.length}</span> of {trades.length} trades match
        </span>
      </div>

      {/* KPI BAND */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1fr', gap: 12, padding: '14px 18px' }}>
        <DeskKpi label="24h NOTIONAL" value={fmt.usd(totalNotional, {compact:true})} accent
          chart={<MiniBars values={histo} width={160} height={28} color={DeskC.green} />}
          delta="+12.4% vs prior 24h"
        />
        <DeskKpi label="ANOMALIES" value={filtered.length} delta="+8 last hour" />
        <DeskKpi label="WHALE TRADES" value={whales} sub="≥ $1M" />
        <DeskKpi label="COUNTER-TREND" value={counter} sub={`${(counter/Math.max(1,filtered.length)*100).toFixed(0)}%`} />
        <DeskKpi label="MARKETS TOUCHED" value={markets} sub="of 142 active" />
      </div>

      {/* MAIN GRID */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 12, padding: '0 18px 18px', minHeight: 0 }}>
        {/* FEED CARD */}
        <Card title="Live anomaly feed" right={
          <div style={{ display:'flex', gap: 8, alignItems:'center', color: DeskC.fgDim, fontSize: 11.5 }}>
            <LivePulse color={DeskC.green} size={6} />
            <span>auto-refresh on · click row to inspect</span>
          </div>
        }>
          <div style={{ display: 'grid',
            gridTemplateColumns: '60px 56px 1fr 110px 70px 90px 90px 50px',
            gap: 10, padding: '8px 14px', color: DeskC.fgFaint, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.08em',
            borderBottom: '1px solid '+DeskC.border,
          }}>
            <span>Time</span><span>Side</span><span>Market · Outcome</span><span>Wallet</span>
            <span style={{textAlign:'right'}}>Price</span>
            <span style={{textAlign:'right'}}>Notional</span>
            <span>Signals</span>
            <span style={{textAlign:'right'}}>Score</span>
          </div>
          <div className="ab-scroll" style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
            {filtered.slice(0, 60).map((t) => (
              <div key={t.id} className={t._new ? 'pa-row-in' : ''} onClick={()=>openTrade && openTrade(t)} style={{
                display: 'grid', gridTemplateColumns: '60px 56px 1fr 110px 70px 90px 90px 50px',
                gap: 10, padding: '10px 14px',
                borderBottom: '1px solid '+DeskC.border,
                cursor: 'pointer', fontSize: 12.5,
              }}>
                <span style={{ color: DeskC.fgDim, fontFamily: 'IBM Plex Mono', fontSize: 11.5 }}>{fmt.hhmmShort(t.ts)}</span>
                <span style={{
                  alignSelf: 'start',
                  fontFamily: 'IBM Plex Mono', fontSize: 10.5, fontWeight: 600,
                  padding: '2px 6px', borderRadius: 3, letterSpacing: '0.04em',
                  color: t.side==='BUY' ? DeskC.green : DeskC.red,
                  background: t.side==='BUY' ? DeskC.greenSoft : DeskC.redSoft,
                  width: 'fit-content',
                }}>{t.side}</span>
                <span style={{ overflow: 'hidden' }}>
                  <div style={{ overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{t.market.title}</div>
                  <div style={{ color: DeskC.fgFaint, fontSize: 10.5 }}>{t.market.category} · {t.outcome}</div>
                </span>
                <span style={{ overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>
                  <div>{t.wallet.pseudonym || t.wallet.name || ''}</div>
                  <div style={{ color: DeskC.fgFaint, fontSize: 10.5, fontFamily: 'IBM Plex Mono' }}>{fmt.shortAddr(t.wallet.wallet)}</div>
                </span>
                <span style={{ textAlign: 'right', fontFamily: 'IBM Plex Mono', color: DeskC.fgDim }}>{fmt.prob(t.price)}</span>
                <span style={{ textAlign: 'right', fontFamily: 'IBM Plex Mono', fontWeight: 600, color: t.notional>=1_000_000 ? DeskC.amber : DeskC.fg }}>
                  {fmt.usd(t.notional, {compact:true})}
                </span>
                <span style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap:'wrap' }}>
                  {t.counterTrend && <DeskTag bg="rgba(245,158,11,0.15)" color={DeskC.amber}>CTR</DeskTag>}
                  {t.notional>=1_000_000 && <DeskTag bg={DeskC.greenSoft} color={DeskC.green}>WHALE</DeskTag>}
                  {t.notional>=5_000_000 && <DeskTag bg={DeskC.redSoft} color={DeskC.red}>MEGA</DeskTag>}
                </span>
                <span style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'IBM Plex Mono', fontWeight: 700, color: DeskC.green, fontSize: 13 }}>
                    {t.score.toFixed(2)}
                  </div>
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* RIGHT STACK */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
          <Card title="Hot markets" subtitle="By notional in window">
            <div className="ab-scroll" style={{ overflow:'auto' }}>
              {topMarkets.map((m,i)=>{
                const series = window.MOCK.SERIES[m.market.id].slice(-50).map(p=>p.p);
                return (
                  <div key={m.market.id} onClick={()=>openMarket && openMarket(m.market)} style={{
                    display: 'grid', gridTemplateColumns: '1fr 70px 90px',
                    alignItems: 'center', gap: 10, padding: '12px 14px',
                    borderBottom: '1px solid '+DeskC.border, cursor: 'pointer',
                  }}>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis', fontWeight: 500 }}>{m.market.title}</div>
                      <div style={{ color: DeskC.fgFaint, fontSize: 10.5, marginTop: 2 }}>
                        {m.market.category} · {m.hits} flagged · buys {fmt.usd(m.buys,{compact:true})} / sells {fmt.usd(m.sells,{compact:true})}
                      </div>
                    </div>
                    <Sparkline values={series} width={64} height={22} color={DeskC.green} fill={DeskC.green} />
                    <div style={{ textAlign: 'right', fontFamily: 'IBM Plex Mono', fontWeight: 600, color: DeskC.amber }}>{fmt.usd(m.notional,{compact:true})}</div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card title="Top wallets" subtitle="By notional in window" flex>
            <div className="ab-scroll" style={{ overflow:'auto', flex: 1, minHeight: 0 }}>
              {topWallets.map((w,i)=>(
                <div key={w.wallet.wallet} onClick={()=>openWallet && openWallet(w.wallet)} style={{
                  display: 'grid', gridTemplateColumns: '24px 1fr 80px 60px',
                  alignItems: 'center', gap: 10, padding: '11px 14px',
                  borderBottom: '1px solid '+DeskC.border, cursor: 'pointer',
                }}>
                  <span style={{ color: DeskC.fgFaint, fontFamily:'IBM Plex Mono', fontSize: 11 }}>{i+1}</span>
                  <div style={{ overflow:'hidden' }}>
                    <div style={{ fontWeight: 500 }}>{w.wallet.pseudonym || w.wallet.name || fmt.shortAddr(w.wallet.wallet)}</div>
                    <div style={{ color: DeskC.fgFaint, fontSize: 10.5, fontFamily:'IBM Plex Mono' }}>{fmt.shortAddr(w.wallet.wallet)}</div>
                  </div>
                  <div style={{ textAlign:'right', fontFamily:'IBM Plex Mono', fontWeight: 600, color: DeskC.green }}>{fmt.usd(w.notional,{compact:true})}</div>
                  <div style={{ textAlign:'right', color: DeskC.fgDim, fontSize: 11 }}>{w.count}t · {w.markets.size}m</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Card({ title, subtitle, right, children, flex }) {
  return (
    <div style={{
      background: DeskC.surface, borderRadius: 10, border: '1px solid '+DeskC.border,
      display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: flex ? '1 1 0' : '0 0 auto', minHeight: 0,
    }}>
      <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', borderBottom: '1px solid '+DeskC.border }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13.5 }}>{title}</div>
          {subtitle && <div style={{ color: DeskC.fgDim, fontSize: 11, marginTop: 2 }}>{subtitle}</div>}
        </div>
        <div style={{ marginLeft: 'auto' }}>{right}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>{children}</div>
    </div>
  );
}

function DeskKpi({ label, value, sub, delta, accent, chart }) {
  return (
    <div style={{ background: DeskC.surface, borderRadius: 10, border: '1px solid '+DeskC.border, padding: '12px 14px' }}>
      <div style={{ display: 'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div style={{ color: DeskC.fgDim, fontSize: 10.5, letterSpacing: '0.08em' }}>{label}</div>
        {delta && <div style={{ color: DeskC.green, fontSize: 10.5, fontFamily: 'IBM Plex Mono' }}>{delta}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 6 }}>
        <div style={{ fontSize: 24, fontWeight: 600, color: accent ? DeskC.green : DeskC.fg, letterSpacing: '-0.02em', fontFamily: 'IBM Plex Sans' }}>{value}</div>
        {sub && <div style={{ color: DeskC.fgDim, fontSize: 11 }}>{sub}</div>}
      </div>
      {chart && <div style={{ marginTop: 4 }}>{chart}</div>}
    </div>
  );
}

function MiniBars({ values, width, height, color }) {
  const max = Math.max(...values, 1);
  const bw = width / values.length;
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {values.map((v,i)=>{
        const h = (v / max) * height;
        return <rect key={i} x={i*bw} y={height-h} width={Math.max(1, bw-2)} height={h} fill={color} opacity={0.55+0.45*(v/max)} rx={1} />;
      })}
    </svg>
  );
}

function DeskTag({ children, bg, color }) {
  return <span style={{ background: bg, color, padding: '1px 5px', borderRadius: 3, fontFamily: 'IBM Plex Mono', fontSize: 9.5, fontWeight: 600, letterSpacing: '0.04em' }}>{children}</span>;
}

window.DeskDashboard = DeskDashboard;
