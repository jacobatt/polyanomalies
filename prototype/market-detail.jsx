// Per-market detail screen — opens when user clicks a market anywhere.
// Stand-alone artboard variant; also openable as overlay from dashboards.
//
// Structure: header (title + outcome chips + price), big chart with anomaly
// dots, secondary stats column, recent trades table for this market.

const MdC = {
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

function MarketDetail({ width, height, market: marketArg }) {
  const market = marketArg || window.MOCK.MARKETS[0];
  const series = window.MOCK.SERIES[market.id];
  const trades = window.MOCK.TRADES.filter(t => t.market.id === market.id).sort((a,b)=>b.ts-a.ts);
  const [hovered, setHovered] = React.useState(null);

  // Plot dimensions
  const chartW = width - 48 - 320 - 12; // minus padding/right column
  const chartH = 280;
  const minP = Math.min(...series.map(p=>p.p));
  const maxP = Math.max(...series.map(p=>p.p));
  const span = maxP - minP || 1;
  const tMin = series[0].t, tMax = series[series.length-1].t;
  const xOf = (t) => ((t - tMin) / (tMax - tMin)) * chartW;
  const yOf = (p) => chartH - ((p - minP) / span) * chartH;

  const path = series.map((pt,i)=>(i===0?'M':'L') + xOf(pt.t).toFixed(1) + ',' + yOf(pt.p).toFixed(1)).join(' ');
  const fillPath = path + ` L${chartW},${chartH} L0,${chartH} Z`;

  const flagged = trades.filter(t => t.score >= 1.5);

  const buys = trades.filter(t=>t.side==='BUY').reduce((s,t)=>s+t.notional,0);
  const sells = trades.filter(t=>t.side==='SELL').reduce((s,t)=>s+t.notional,0);
  const flow = buys - sells;

  return (
    <div style={{ width, height, background: MdC.bg, color: MdC.fg, fontFamily: '"IBM Plex Sans", sans-serif', fontSize: 12.5, display: 'flex', flexDirection: 'column' }}>
      {/* HEADER */}
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid '+MdC.border }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: MdC.fgDim, fontSize: 11, fontFamily: 'IBM Plex Mono', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          <span style={{ color: MdC.green }}>← Markets</span>
          <span style={{ color: MdC.fgFaint }}>/</span>
          <span>{market.category}</span>
          <span style={{ color: MdC.fgFaint }}>/</span>
          <span>{market.slug}</span>
          <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 6, alignItems:'center' }}>
            <LivePulse color={MdC.green} size={6} /> live
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, marginTop: 10 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.015em', maxWidth: 700 }}>{market.title}</h1>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, alignItems: 'flex-end' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: MdC.fgDim, fontSize: 10, fontFamily: 'IBM Plex Mono', textTransform:'uppercase', letterSpacing:'0.1em' }}>Yes</div>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 28, color: MdC.green, fontWeight: 600 }}>{(market.price*100).toFixed(0)}¢</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: MdC.fgDim, fontSize: 10, fontFamily: 'IBM Plex Mono', textTransform:'uppercase', letterSpacing:'0.1em' }}>No</div>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 28, color: MdC.red, fontWeight: 600 }}>{((1-market.price)*100).toFixed(0)}¢</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: MdC.fgDim, fontSize: 10, fontFamily: 'IBM Plex Mono', textTransform:'uppercase', letterSpacing:'0.1em' }}>24h Δ</div>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 16, color: market.drift>=0?MdC.green:MdC.red, fontWeight: 600 }}>
                {market.drift>=0?'+':''}{(market.drift*100).toFixed(1)}¢
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 320px', minHeight: 0 }}>
        {/* CHART + TABLE */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, borderRight: '1px solid '+MdC.border }}>
          <div style={{ padding: '20px 24px 8px' }}>
            <div style={{ display: 'flex', gap: 18, color: MdC.fgDim, fontSize: 11, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
              <span style={{ color: MdC.fg }}>24h</span>
              <span>7d</span>
              <span>30d</span>
              <span>All</span>
              <span style={{ marginLeft: 'auto', color: MdC.fgFaint }}>{flagged.length} anomalies plotted</span>
            </div>
            {/* CHART SVG */}
            <svg width={chartW} height={chartH} style={{ display: 'block', overflow: 'visible' }} onMouseLeave={()=>setHovered(null)}>
              {/* gridlines */}
              {[0.25, 0.5, 0.75].map(g => {
                const p = minP + g * span;
                return (
                  <g key={g}>
                    <line x1="0" x2={chartW} y1={yOf(p)} y2={yOf(p)} stroke={MdC.border} strokeDasharray="2 4" />
                    <text x={chartW + 4} y={yOf(p)+3} fill={MdC.fgFaint} fontSize="10" fontFamily="IBM Plex Mono">{(p*100).toFixed(0)}¢</text>
                  </g>
                );
              })}
              {/* fill + line */}
              <path d={fillPath} fill={MdC.green} opacity="0.12" />
              <path d={path} stroke={MdC.green} strokeWidth="1.5" fill="none" />
              {/* anomaly dots */}
              {flagged.slice(0, 60).map((t, i) => {
                const x = xOf(t.ts);
                if (x < 0 || x > chartW) return null;
                const y = yOf(t.price);
                const sz = 3 + Math.min(7, t.score * 0.8);
                const col = t.notional >= 1_000_000 ? MdC.amber : (t.counterTrend ? MdC.red : MdC.green);
                return (
                  <g key={t.id} onMouseEnter={()=>setHovered({t,x,y})}>
                    <circle cx={x} cy={y} r={sz} fill={col} fillOpacity={0.18} />
                    <circle cx={x} cy={y} r={sz*0.45} fill={col} />
                  </g>
                );
              })}
              {hovered && (
                <g>
                  <line x1={hovered.x} x2={hovered.x} y1="0" y2={chartH} stroke={MdC.fgFaint} strokeDasharray="2 3"/>
                  <rect x={Math.min(chartW-180, hovered.x+8)} y={Math.max(0, hovered.y-50)} width="180" height="60" fill={MdC.surface} stroke={MdC.border} rx="4"/>
                  <text x={Math.min(chartW-180, hovered.x+8)+8} y={Math.max(0,hovered.y-50)+16} fill={MdC.fg} fontSize="10.5" fontFamily="IBM Plex Mono">
                    {hovered.t.side} · {fmt.usd(hovered.t.notional,{compact:true})} @ {fmt.prob(hovered.t.price)}
                  </text>
                  <text x={Math.min(chartW-180, hovered.x+8)+8} y={Math.max(0,hovered.y-50)+30} fill={MdC.fgDim} fontSize="10" fontFamily="IBM Plex Mono">
                    {hovered.t.wallet.pseudonym || fmt.shortAddr(hovered.t.wallet.wallet)}
                  </text>
                  <text x={Math.min(chartW-180, hovered.x+8)+8} y={Math.max(0,hovered.y-50)+44} fill={MdC.green} fontSize="10" fontFamily="IBM Plex Mono">
                    score {hovered.t.score.toFixed(2)} · {fmt.ago(hovered.t.ts)} ago
                  </text>
                </g>
              )}
            </svg>
            {/* legend */}
            <div style={{ display:'flex', gap: 16, fontSize: 10.5, color: MdC.fgDim, fontFamily: 'IBM Plex Mono', marginTop: 14 }}>
              <Legend color={MdC.green} label="Anomaly" />
              <Legend color={MdC.amber} label="Whale (≥$1M)" />
              <Legend color={MdC.red} label="Counter-trend" />
              <span style={{ marginLeft:'auto' }}>marker size ∝ score</span>
            </div>
          </div>

          {/* TRADE TABLE */}
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', borderTop: '1px solid '+MdC.border, marginTop: 8 }}>
            <div style={{ padding: '12px 24px', display: 'flex', alignItems: 'center' }}>
              <div style={{ fontWeight: 600 }}>Trades on this market</div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, color: MdC.fgDim, fontSize: 11.5, fontFamily: 'IBM Plex Mono' }}>
                <span>Anomalies only</span>
                <input type="checkbox" defaultChecked style={{ accentColor: MdC.green }} />
              </div>
            </div>
            <div className="ab-scroll" style={{ overflow: 'auto', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '70px 60px 1fr 100px 90px 60px', gap: 10, padding: '6px 24px', color: MdC.fgFaint, fontSize: 10, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid '+MdC.border }}>
                <span>Time</span><span>Side</span><span>Wallet</span><span style={{textAlign:'right'}}>Notional</span><span>Signals</span><span style={{textAlign:'right'}}>Score</span>
              </div>
              {flagged.slice(0, 40).map(t => (
                <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '70px 60px 1fr 100px 90px 60px', gap: 10, padding: '8px 24px', borderBottom: '1px solid '+MdC.border, fontSize: 12.5 }}>
                  <span style={{ color: MdC.fgDim, fontFamily: 'IBM Plex Mono' }}>{fmt.hhmmShort(t.ts)}</span>
                  <span style={{ color: t.side==='BUY'?MdC.green:MdC.red, fontFamily: 'IBM Plex Mono', fontWeight: 600 }}>{t.side}</span>
                  <span style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow:'ellipsis', fontFamily: 'IBM Plex Mono' }}>
                    {t.wallet.pseudonym || fmt.shortAddr(t.wallet.wallet)}
                  </span>
                  <span style={{ textAlign: 'right', fontFamily: 'IBM Plex Mono', color: t.notional>=1_000_000?MdC.amber:MdC.fg, fontWeight: 600 }}>{fmt.usd(t.notional,{compact:true})}</span>
                  <span style={{ display: 'flex', gap: 4 }}>
                    {t.counterTrend && <DeskTag bg="rgba(245,158,11,0.15)" color={MdC.amber}>CTR</DeskTag>}
                    {t.notional>=1_000_000 && <DeskTag bg="rgba(34,197,94,0.15)" color={MdC.green}>WHALE</DeskTag>}
                  </span>
                  <span style={{ textAlign: 'right', color: MdC.green, fontFamily:'IBM Plex Mono', fontWeight: 700 }}>{t.score.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN STATS */}
        <div style={{ padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: 18, overflow: 'auto' }}>
          <Stat label="24h volume" value={fmt.usd(buys+sells,{compact:true})} />
          <Stat label="Net flow" value={fmt.usd(flow,{compact:true,sign:true})} accent={flow>=0?MdC.green:MdC.red} sub={`${trades.length} trades`} />
          <div>
            <div style={{ color: MdC.fgFaint, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily:'IBM Plex Mono', marginBottom: 8 }}>BUY / SELL split</div>
            <div style={{ display: 'flex', height: 8, borderRadius: 2, overflow: 'hidden', background: MdC.surface }}>
              <div style={{ width: (buys/(buys+sells)*100)+'%', background: MdC.green }} />
              <div style={{ width: (sells/(buys+sells)*100)+'%', background: MdC.red }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, fontFamily: 'IBM Plex Mono' }}>
              <span style={{ color: MdC.green }}>Buy {fmt.usd(buys,{compact:true})}</span>
              <span style={{ color: MdC.red }}>Sell {fmt.usd(sells,{compact:true})}</span>
            </div>
          </div>

          <div>
            <div style={{ color: MdC.fgFaint, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily:'IBM Plex Mono', marginBottom: 10 }}>Anomaly mix</div>
            <Stat inline label="Whale prints (≥$1M)" value={trades.filter(t=>t.notional>=1_000_000).length} />
            <Stat inline label="Counter-trend" value={trades.filter(t=>t.counterTrend).length} />
            <Stat inline label="Score ≥ 5" value={trades.filter(t=>t.score>=5).length} />
            <Stat inline label="Unique wallets" value={new Set(trades.map(t=>t.wallet.wallet)).size} />
          </div>

          <div>
            <div style={{ color: MdC.fgFaint, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily:'IBM Plex Mono', marginBottom: 8 }}>Top wallets in market</div>
            {(() => {
              const map = new Map();
              trades.forEach(t => {
                const k = t.wallet.wallet;
                const cur = map.get(k) || { wallet: t.wallet, notional: 0, count: 0 };
                cur.notional += t.notional; cur.count++;
                map.set(k,cur);
              });
              const list = [...map.values()].sort((a,b)=>b.notional-a.notional).slice(0,5);
              return list.map(w => (
                <div key={w.wallet.wallet} style={{ display:'flex', justifyContent:'space-between', padding: '8px 0', borderBottom: '1px solid '+MdC.border, fontSize: 12 }}>
                  <span style={{ overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis', flex: 1 }}>{w.wallet.pseudonym || fmt.shortAddr(w.wallet.wallet)}</span>
                  <span style={{ fontFamily:'IBM Plex Mono', color: MdC.green, fontWeight: 600 }}>{fmt.usd(w.notional,{compact:true})}</span>
                </div>
              ));
            })()}
          </div>

          <button style={{ background: MdC.green, color: '#062a13', border:'none', padding:'10px', cursor:'pointer', fontFamily:'inherit', fontWeight: 600, borderRadius: 6 }}>
            + Add alert for this market
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, accent, inline }) {
  if (inline) {
    return (
      <div style={{ display:'flex', justifyContent:'space-between', padding: '6px 0', borderBottom: '1px solid '+MdC.border, fontSize: 12 }}>
        <span style={{ color: MdC.fgDim }}>{label}</span>
        <span style={{ fontFamily: 'IBM Plex Mono', fontWeight: 600 }}>{value}</span>
      </div>
    );
  }
  return (
    <div>
      <div style={{ color: MdC.fgFaint, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily:'IBM Plex Mono' }}>{label}</div>
      <div style={{ fontSize: 22, fontFamily: 'IBM Plex Mono', fontWeight: 600, color: accent || MdC.fg, marginTop: 2 }}>{value}</div>
      {sub && <div style={{ color: MdC.fgDim, fontSize: 11, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Legend({ color, label }) {
  return <span style={{ display: 'inline-flex', alignItems:'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: color }}/>{label}</span>;
}

window.MarketDetail = MarketDetail;
