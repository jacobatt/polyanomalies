// Wallet profile — drill into a single trader. PnL curve, market exposure,
// recent activity, anomaly score over time.

const WlC = {
  bg: '#0d1014',
  surface: '#13171c',
  surface2: '#181d23',
  border: 'rgba(255,255,255,0.07)',
  fg: '#e6e8eb',
  fgDim: '#9aa0a8',
  fgFaint: '#5a6068',
  green: '#22c55e',
  red: '#ef4444',
  amber: '#f59e0b',
};

function WalletProfile({ width, height, wallet: walletArg }) {
  const wallet = walletArg || window.MOCK.WALLETS[0];
  const trades = window.MOCK.TRADES.filter(t => t.wallet.wallet === wallet.wallet);
  const pnl = window.MOCK.PNL[wallet.wallet] || [];

  const totalNotional = trades.reduce((s,t)=>s+t.notional,0);
  const buys = trades.filter(t=>t.side==='BUY').length;
  const sells = trades.filter(t=>t.side==='SELL').length;
  const markets = new Set(trades.map(t=>t.market.id)).size;
  const anomalies = trades.filter(t=>t.score>=3).length;
  const peakScore = trades.reduce((m,t)=>Math.max(m,t.score),0);

  const finalPnl = pnl.length ? pnl[pnl.length-1].v : 0;

  // PnL chart
  const chartW = 720;
  const chartH = 200;
  const minV = Math.min(...pnl.map(p=>p.v), 0);
  const maxV = Math.max(...pnl.map(p=>p.v), 1);
  const span = maxV - minV || 1;
  const xOf = (i) => (i / (pnl.length - 1)) * chartW;
  const yOf = (v) => chartH - ((v - minV) / span) * chartH;
  const path = pnl.map((p,i)=>(i===0?'M':'L') + xOf(i).toFixed(1) + ',' + yOf(p.v).toFixed(1)).join(' ');
  const fillPath = path + ` L${chartW},${chartH} L0,${chartH} Z`;
  const zeroY = yOf(0);

  // exposure by market
  const exposure = React.useMemo(() => {
    const m = new Map();
    trades.forEach(t => {
      const cur = m.get(t.market.id) || { market: t.market, notional: 0, count: 0, side: { BUY: 0, SELL: 0 } };
      cur.notional += t.notional; cur.count++; cur.side[t.side] += t.notional;
      m.set(t.market.id, cur);
    });
    return [...m.values()].sort((a,b)=>b.notional-a.notional);
  }, [trades]);

  return (
    <div style={{ width, height, background: WlC.bg, color: WlC.fg, fontFamily: '"IBM Plex Sans", sans-serif', fontSize: 12.5, display: 'flex', flexDirection: 'column' }}>
      {/* HEADER */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid '+WlC.border, display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ width: 56, height: 56, borderRadius: 12, background: 'linear-gradient(135deg, oklch(0.6 0.18 145), oklch(0.4 0.15 165))', display:'flex', alignItems:'center', justifyContent:'center', color: '#0a1a0d', fontFamily: 'IBM Plex Mono', fontSize: 22, fontWeight: 700 }}>
          {(wallet.pseudonym || wallet.name || '0x')[0].toUpperCase()}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.015em' }}>{wallet.pseudonym || wallet.name || 'Unknown trader'}</h1>
            <DeskTag bg="rgba(34,197,94,0.15)" color={WlC.green}>WHALE</DeskTag>
            {peakScore >= 5 && <DeskTag bg="rgba(245,158,11,0.15)" color={WlC.amber}>WATCHLIST</DeskTag>}
          </div>
          <div style={{ color: WlC.fgDim, fontSize: 12, fontFamily: 'IBM Plex Mono', marginTop: 4 }}>
            {wallet.wallet}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <button style={{ background: WlC.surface, color: WlC.fg, border: '1px solid '+WlC.border, padding: '8px 12px', cursor:'pointer', fontFamily:'inherit', fontSize: 12, borderRadius: 6, display:'flex', gap:6, alignItems:'center' }}><Icon.bell size={13}/> Watch</button>
          <button style={{ background: WlC.surface, color: WlC.fg, border: '1px solid '+WlC.border, padding: '8px 12px', cursor:'pointer', fontFamily:'inherit', fontSize: 12, borderRadius: 6, display:'flex', gap:6, alignItems:'center' }}>Polymarket profile <Icon.ext size={11}/></button>
        </div>
      </div>

      {/* KPI ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', borderBottom: '1px solid '+WlC.border }}>
        <WKpi label="90d PnL" value={fmt.usd(finalPnl*1000, {compact:true, sign:true})} accent={finalPnl>=0?WlC.green:WlC.red} />
        <WKpi label="Total notional" value={fmt.usd(totalNotional, {compact:true})} />
        <WKpi label="Trades (24h)" value={trades.length} />
        <WKpi label="Markets" value={markets} />
        <WKpi label="Buy/Sell" value={`${buys} / ${sells}`} />
        <WKpi label="Peak score" value={peakScore.toFixed(2)} accent={peakScore>=5?WlC.amber:WlC.fg} />
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 360px', minHeight: 0 }}>
        <div style={{ padding: '20px 24px', borderRight: '1px solid '+WlC.border, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <div style={{ color: WlC.fgDim, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'IBM Plex Mono' }}>Equity curve · 90d</div>
            <div style={{ marginLeft: 'auto', fontFamily: 'IBM Plex Mono', fontSize: 11, color: WlC.fgDim }}>
              <span style={{ color: WlC.fg }}>{fmt.usd(finalPnl*1000,{compact:true,sign:true})}</span> realized
            </div>
          </div>
          <svg width={chartW} height={chartH} style={{ marginTop: 12 }}>
            <line x1="0" x2={chartW} y1={zeroY} y2={zeroY} stroke={WlC.border} strokeDasharray="2 4" />
            <path d={fillPath} fill={finalPnl>=0?WlC.green:WlC.red} opacity="0.12" />
            <path d={path} stroke={finalPnl>=0?WlC.green:WlC.red} strokeWidth="1.5" fill="none" />
          </svg>

          <div style={{ marginTop: 24, color: WlC.fgDim, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'IBM Plex Mono' }}>Recent trades</div>
          <div className="ab-scroll" style={{ overflow: 'auto', flex: 1, marginTop: 8, minHeight: 0 }}>
            <div style={{ display:'grid', gridTemplateColumns: '60px 56px 1fr 100px 60px', gap: 10, padding: '6px 0', color: WlC.fgFaint, fontSize: 10, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid '+WlC.border }}>
              <span>Time</span><span>Side</span><span>Market</span><span style={{textAlign:'right'}}>Notional</span><span style={{textAlign:'right'}}>Score</span>
            </div>
            {trades.slice(0,18).map(t=>(
              <div key={t.id} style={{ display:'grid', gridTemplateColumns: '60px 56px 1fr 100px 60px', gap: 10, padding: '8px 0', borderBottom: '1px solid '+WlC.border, fontSize: 12.5 }}>
                <span style={{ color: WlC.fgDim, fontFamily: 'IBM Plex Mono' }}>{fmt.hhmmShort(t.ts)}</span>
                <span style={{ color: t.side==='BUY'?WlC.green:WlC.red, fontFamily:'IBM Plex Mono', fontWeight: 600 }}>{t.side}</span>
                <span style={{ overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{t.market.title}</span>
                <span style={{ textAlign:'right', fontFamily:'IBM Plex Mono', color: t.notional>=1_000_000?WlC.amber:WlC.fg, fontWeight: 600 }}>{fmt.usd(t.notional,{compact:true})}</span>
                <span style={{ textAlign:'right', fontFamily:'IBM Plex Mono', color: WlC.green, fontWeight: 700 }}>{t.score.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: EXPOSURE */}
        <div style={{ padding: '20px', overflow: 'auto' }}>
          <div style={{ color: WlC.fgFaint, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily:'IBM Plex Mono', marginBottom: 14 }}>Market exposure</div>
          {exposure.slice(0, 10).map(m => {
            const total = m.side.BUY + m.side.SELL || 1;
            return (
              <div key={m.market.id} style={{ marginBottom: 14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', gap: 8, marginBottom: 5 }}>
                  <span style={{ overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis', fontSize: 12 }}>{m.market.title}</span>
                  <span style={{ fontFamily:'IBM Plex Mono', color: WlC.fg, fontWeight: 600, flex: '0 0 auto' }}>{fmt.usd(m.notional,{compact:true})}</span>
                </div>
                <div style={{ display: 'flex', height: 5, borderRadius: 1, overflow: 'hidden', background: WlC.surface }}>
                  <div style={{ width: (m.side.BUY/total*100)+'%', background: WlC.green }} />
                  <div style={{ width: (m.side.SELL/total*100)+'%', background: WlC.red }} />
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', color: WlC.fgFaint, fontSize: 10, fontFamily: 'IBM Plex Mono', marginTop: 3 }}>
                  <span>{m.count} trades</span>
                  <span>{m.market.category}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function WKpi({ label, value, accent }) {
  return (
    <div style={{ padding: '14px 18px', borderRight: '1px solid '+WlC.border }}>
      <div style={{ color: WlC.fgFaint, fontSize: 10, textTransform:'uppercase', letterSpacing:'0.1em', fontFamily:'IBM Plex Mono' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600, fontFamily: 'IBM Plex Mono', color: accent || WlC.fg, marginTop: 4 }}>{value}</div>
    </div>
  );
}

window.WalletProfile = WalletProfile;
