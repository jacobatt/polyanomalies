// Direction C — "Editorial"
// More typographic, asymmetric layout, oversized hero numbers, headline-style
// market titles, monospace metadata. Still dark, still dense, but reads like
// a financial broadsheet rather than a terminal.

const EdC = {
  bg: '#0c0d0e',
  surface: '#0f1112',
  surface2: '#141618',
  border: 'rgba(255,255,255,0.07)',
  fg: '#ecebe6',
  fgDim: '#9a978f',
  fgFaint: '#5a5852',
  green: '#22c55e',
  red: '#ef4444',
  amber: '#eab308',
  rule: 'rgba(255,255,255,0.08)',
};

function EditorialDashboard({ width, height, openTrade, openMarket, openWallet, openAlerts }) {
  const trades = useLiveFeed(window.MOCK.TRADES, 6000);
  const [threshold, setThreshold] = React.useState(0);
  const [query, setQuery] = React.useState('');

  const filtered = React.useMemo(() => trades.filter(t => t.score >= threshold)
    .filter(t => !query || (t.market.title + ' ' + (t.wallet.pseudonym||'')).toLowerCase().includes(query.toLowerCase())),
    [trades, threshold, query]);

  const totalNotional = filtered.reduce((s,t)=>s+t.notional,0);
  const whales = filtered.filter(t=>t.notional>=1_000_000).length;
  const counter = filtered.filter(t=>t.counterTrend).length;

  const featured = filtered.find(t => t.notional >= 1_000_000) || filtered[0];

  const topMarkets = React.useMemo(() => {
    const map = new Map();
    filtered.forEach(t => {
      const k = t.market.id;
      const cur = map.get(k) || { market: t.market, hits: 0, notional: 0 };
      cur.hits++; cur.notional += t.notional;
      map.set(k,cur);
    });
    return [...map.values()].sort((a,b)=>b.notional-a.notional).slice(0,4);
  }, [filtered]);

  return (
    <div style={{
      width, height, background: EdC.bg, color: EdC.fg,
      fontFamily: '"IBM Plex Sans", -apple-system, system-ui, sans-serif',
      fontSize: 13, display: 'flex', flexDirection: 'column',
    }}>
      {/* MASTHEAD */}
      <div style={{ padding: '16px 24px 12px', borderBottom: '1px solid '+EdC.rule, display: 'flex', alignItems: 'flex-end', gap: 18 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: EdC.fgFaint, fontSize: 10.5, fontFamily: 'IBM Plex Mono', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            <span>No. 0312</span>
            <span>·</span>
            <span>Sat, 09 May 2026</span>
            <span>·</span>
            <span>14:32 UTC</span>
            <span style={{ display:'inline-flex', alignItems:'center', gap:6, color: EdC.green, marginLeft: 6 }}>
              <LivePulse color={EdC.green} size={6}/> LIVE
            </span>
          </div>
          <h1 style={{ margin: '6px 0 0', fontSize: 30, fontWeight: 600, letterSpacing: '-0.025em', fontFamily: 'Fraunces, Georgia, serif' }}>
            PolyAnomalies <span style={{ color: EdC.fgDim, fontWeight: 300 }}>· Anomaly Monitor</span>
          </h1>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="search the feed"
              style={{ background: 'transparent', border: 'none', borderBottom: '1px solid '+EdC.border,
                color: EdC.fg, fontFamily: 'inherit', fontSize: 12, padding: '6px 4px 6px 22px',
                width: 200, outline: 'none' }} />
            <span style={{ position:'absolute', left: 2, top: 8, color: EdC.fgFaint }}><Icon.search size={13}/></span>
          </div>
          <button onClick={openAlerts} style={{ background:'transparent', border:'1px solid '+EdC.border, color: EdC.fg, padding:'6px 12px', borderRadius: 0, cursor:'pointer', fontFamily:'inherit', fontSize: 12, display:'inline-flex', alignItems:'center', gap:6 }}>
            <Icon.bell size={13}/> Alerts
          </button>
        </div>
      </div>

      {/* OVERSIZED KPI BAND */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', borderBottom: '1px solid '+EdC.rule }}>
        <BigKpi
          eyebrow="24h notional flagged"
          big={fmt.usd(totalNotional, { compact: true })}
          delta="↑ 12.4% w/w"
          accent
          rightBorder
        />
        <BigKpi eyebrow="Trades in feed" big={filtered.length} sub={`score ≥ ${threshold.toFixed(2)}`} rightBorder />
        <BigKpi eyebrow="Whale prints" big={whales} sub="$1M+" rightBorder />
        <BigKpi eyebrow="Counter-trend" big={counter} sub={`${(counter/Math.max(1,filtered.length)*100).toFixed(0)}% of feed`} />
      </div>

      {/* CONTROL */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 24px', borderBottom: '1px solid '+EdC.rule, gap: 16, color: EdC.fgDim, fontFamily: 'IBM Plex Mono', fontSize: 11 }}>
        <span style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>Filter</span>
        <span style={{ color: EdC.fgFaint }}>·</span>
        <span>Score ≥</span>
        <input type="range" min="0" max="6" step="0.25" value={threshold} onChange={e=>setThreshold(+e.target.value)} style={{ width: 140, accentColor: EdC.green }}/>
        <span style={{ color: EdC.fg, fontWeight: 600 }}>{threshold.toFixed(2)}</span>
        <span style={{ color: EdC.fgFaint }}>·</span>
        <span>Window 24h</span>
        <span style={{ marginLeft: 'auto', color: EdC.fgFaint }}>showing {filtered.length} of {trades.length}</span>
      </div>

      {/* MAIN — LEAD STORY + FEED */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1.2fr', minHeight: 0 }}>
        {/* LEAD STORY */}
        <div style={{ borderRight: '1px solid '+EdC.rule, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0, overflow: 'hidden' }}>
          <div style={{ color: EdC.green, fontSize: 10, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', letterSpacing: '0.18em' }}>
            ▌ Lead anomaly · score {featured ? featured.score.toFixed(2) : '0'}
          </div>
          {featured && (
            <>
              <h2 style={{ margin: 0, fontFamily: 'Fraunces, Georgia, serif', fontSize: 26, lineHeight: 1.15, fontWeight: 500, letterSpacing: '-0.015em', textWrap: 'pretty' }}>
                {featured.market.title}
              </h2>
              <div style={{ display: 'flex', gap: 14, color: EdC.fgDim, fontSize: 11.5, fontFamily: 'IBM Plex Mono' }}>
                <span style={{ color: featured.side==='BUY' ? EdC.green : EdC.red, fontWeight: 600 }}>{featured.side} {featured.outcome}</span>
                <span>· {fmt.usd(featured.notional, {compact:true})}</span>
                <span>· @ {fmt.prob(featured.price)}</span>
                <span>· {fmt.ago(featured.ts)} ago</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 4 }}>
                <DataCell label="Wallet" value={featured.wallet.pseudonym || fmt.shortAddr(featured.wallet.wallet)} sub={fmt.shortAddr(featured.wallet.wallet)} />
                <DataCell label="Notional z-score" value={featured.notionalScore.toFixed(2)} sub="vs market 30d" />
                <DataCell label="Counter-trend" value={featured.counterTrend ? 'Yes' : 'No'} sub={featured.counterTrend?'+3.0 to score':'—'} accent={featured.counterTrend?EdC.amber:null} />
                <DataCell label="Market category" value={featured.market.category} sub={featured.market.slug} />
              </div>

              <div style={{ marginTop: 8, padding: '12px 0', borderTop: '1px dashed '+EdC.border, borderBottom: '1px dashed '+EdC.border }}>
                <div style={{ color: EdC.fgFaint, fontSize: 10, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
                  Price · 24h
                </div>
                <Sparkline values={window.MOCK.SERIES[featured.market.id].slice(-120).map(p=>p.p)} width={420} height={60} color={EdC.green} fill={EdC.green} strokeWidth={1.5} />
              </div>

              <div>
                <div style={{ color: EdC.fgFaint, fontSize: 10, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
                  Hot markets
                </div>
                {topMarkets.map((m,i)=>(
                  <div key={m.market.id} onClick={()=>openMarket && openMarket(m.market)} style={{
                    display:'grid', gridTemplateColumns: '20px 1fr 80px',
                    gap: 10, padding: '8px 0', borderBottom: '1px solid '+EdC.rule, cursor:'pointer',
                  }}>
                    <span style={{ color: EdC.fgFaint, fontFamily:'IBM Plex Mono', fontSize: 10.5 }}>{(i+1).toString().padStart(2,'0')}</span>
                    <span style={{ overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{m.market.title}</span>
                    <span style={{ textAlign:'right', fontFamily:'IBM Plex Mono', color: EdC.amber }}>{fmt.usd(m.notional,{compact:true})}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* FEED COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ padding: '16px 24px 8px', display: 'flex', alignItems: 'baseline', gap: 10, borderBottom: '1px solid '+EdC.rule }}>
            <div style={{ color: EdC.green, fontSize: 10, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', letterSpacing: '0.18em' }}>▌ The feed</div>
            <div style={{ color: EdC.fgFaint, fontSize: 10.5, fontFamily: 'IBM Plex Mono', marginLeft: 'auto' }}>updates every ~6s</div>
          </div>
          <div className="ab-scroll" style={{ overflowY: 'auto', flex: 1 }}>
            {filtered.slice(0, 50).map((t, i) => (
              <div key={t.id} className={t._new ? 'pa-row-in' : ''} onClick={()=>openTrade && openTrade(t)} style={{
                padding: '12px 24px', borderBottom: '1px solid '+EdC.rule, cursor:'pointer',
                display: 'grid', gridTemplateColumns: '70px 1fr 90px',
                gap: 14,
              }}>
                <div style={{ color: EdC.fgFaint, fontFamily:'IBM Plex Mono', fontSize: 10.5, letterSpacing:'0.04em' }}>
                  <div>{fmt.hhmmShort(t.ts)}</div>
                  <div style={{ color: EdC.fgFaint, opacity: 0.7 }}>{fmt.ago(t.ts)} ago</div>
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 2, flexWrap:'wrap' }}>
                    <span style={{
                      fontFamily:'IBM Plex Mono', fontSize: 9.5, fontWeight: 600,
                      color: t.side==='BUY'?EdC.green:EdC.red, letterSpacing:'0.06em',
                      border: '1px solid currentColor', padding: '0 4px',
                    }}>{t.side} {t.outcome.toUpperCase()}</span>
                    {t.counterTrend && <span style={{ fontFamily:'IBM Plex Mono', fontSize: 9.5, fontWeight: 600, color: EdC.amber, border:'1px solid currentColor', padding:'0 4px', letterSpacing:'0.06em' }}>CTR</span>}
                    {t.notional>=1_000_000 && <span style={{ fontFamily:'IBM Plex Mono', fontSize: 9.5, fontWeight: 600, color: EdC.green, background: EdC.green, color: '#0a1a0d', padding:'0 4px', letterSpacing:'0.06em' }}>WHALE</span>}
                    <span style={{ color: EdC.fgFaint, fontFamily:'IBM Plex Mono', fontSize: 10 }}>{t.market.category}</span>
                  </div>
                  <div style={{ fontFamily:'Fraunces, Georgia, serif', fontSize: 14.5, lineHeight: 1.25, fontWeight: 500, textWrap:'pretty' }}>{t.market.title}</div>
                  <div style={{ color: EdC.fgDim, fontSize: 11, marginTop: 2, fontFamily:'IBM Plex Mono' }}>
                    by {t.wallet.pseudonym || t.wallet.name || fmt.shortAddr(t.wallet.wallet)} · @ {fmt.prob(t.price)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 22, fontWeight: 500, color: t.notional>=1_000_000?EdC.amber:EdC.fg, letterSpacing: '-0.02em' }}>
                    {fmt.usd(t.notional,{compact:true})}
                  </div>
                  <div style={{ marginTop: 4, color: EdC.green, fontFamily: 'IBM Plex Mono', fontSize: 11.5, fontWeight: 600 }}>
                    score {t.score.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BigKpi({ eyebrow, big, sub, delta, accent, rightBorder }) {
  return (
    <div style={{ padding: '18px 22px 18px', borderRight: rightBorder ? '1px solid '+EdC.rule : 'none' }}>
      <div style={{ color: EdC.fgFaint, fontSize: 10, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', letterSpacing: '0.14em' }}>{eyebrow}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 6 }}>
        <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 38, fontWeight: 500, letterSpacing: '-0.025em', color: accent ? EdC.green : EdC.fg, lineHeight: 1 }}>{big}</div>
        {delta && <div style={{ color: EdC.green, fontFamily: 'IBM Plex Mono', fontSize: 11 }}>{delta}</div>}
      </div>
      {sub && <div style={{ color: EdC.fgDim, fontSize: 11, fontFamily: 'IBM Plex Mono', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function DataCell({ label, value, sub, accent }) {
  return (
    <div style={{ padding: '10px 12px', background: EdC.surface, border: '1px solid '+EdC.border }}>
      <div style={{ color: EdC.fgFaint, fontSize: 10, fontFamily:'IBM Plex Mono', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
      <div style={{ color: accent || EdC.fg, fontSize: 16, fontWeight: 500, marginTop: 2, fontFamily: 'IBM Plex Sans' }}>{value}</div>
      {sub && <div style={{ color: EdC.fgDim, fontSize: 10.5, fontFamily:'IBM Plex Mono', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

window.EditorialDashboard = EditorialDashboard;
