// Alert configuration — panel-style artboard. Lets the user define rules
// (notional/score/counter-trend/wallet/market) with a preview of which recent
// trades would have fired.

const AlC = {
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

function AlertConfig({ width, height }) {
  const [rules, setRules] = React.useState([
    { id: 'r1', name: 'Mega whale prints', enabled: true, minNotional: 5_000_000, minScore: 0, sides: ['BUY','SELL'], counterOnly: false, channel: 'discord', cooldown: 0, hits: 4 },
    { id: 'r2', name: 'Counter-trend whales · Politics', enabled: true, minNotional: 250_000, minScore: 4, sides: ['BUY','SELL'], counterOnly: true, channel: 'discord', cooldown: 10, category: 'Politics', hits: 11 },
    { id: 'r3', name: 'Watchlist: PrincessCaroline', enabled: true, minNotional: 0, minScore: 0, sides: ['BUY','SELL'], counterOnly: false, channel: 'telegram', cooldown: 0, watchlistWallet: 'PrincessCaroline', hits: 6 },
    { id: 'r4', name: 'Crypto market shifts', enabled: false, minNotional: 1_000_000, minScore: 3, sides: ['BUY','SELL'], counterOnly: false, channel: 'email', cooldown: 60, category: 'Crypto', hits: 2 },
  ]);
  const [selectedId, setSelectedId] = React.useState('r2');
  const selected = rules.find(r=>r.id===selectedId);

  function update(patch) {
    setRules(rules.map(r => r.id===selectedId ? {...r, ...patch} : r));
  }

  // simulate which trades would fire under the selected rule
  const matches = React.useMemo(() => {
    if (!selected) return [];
    return window.MOCK.TRADES.filter(t => {
      if (t.notional < selected.minNotional) return false;
      if (t.score < selected.minScore) return false;
      if (!selected.sides.includes(t.side)) return false;
      if (selected.counterOnly && !t.counterTrend) return false;
      if (selected.category && t.market.category !== selected.category) return false;
      if (selected.watchlistWallet && (t.wallet.pseudonym !== selected.watchlistWallet)) return false;
      return true;
    }).slice(0, 8);
  }, [selected]);

  return (
    <div style={{ width, height, background: AlC.bg, color: AlC.fg, fontFamily:'"IBM Plex Sans", sans-serif', fontSize: 12.5, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px 24px 14px', borderBottom: '1px solid '+AlC.border, display: 'flex', alignItems: 'flex-end' }}>
        <div>
          <div style={{ color: AlC.fgDim, fontSize: 11, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Settings · Alerts</div>
          <h1 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 600, letterSpacing: '-0.015em' }}>Alert rules</h1>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 18, alignItems:'center' }}>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: AlC.fgDim }}>
            <span style={{ color: AlC.green }}>{rules.filter(r=>r.enabled).length}</span> active · {rules.reduce((s,r)=>s+(r.hits||0),0)} fires (24h)
          </span>
          <button style={{ background: AlC.green, color: '#062a13', border: 'none', padding: '8px 14px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, borderRadius: 6 }}>+ New rule</button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '300px 1fr 320px', minHeight: 0 }}>
        {/* RULE LIST */}
        <div style={{ borderRight: '1px solid '+AlC.border, overflow:'auto' }}>
          {rules.map(r => (
            <div key={r.id} onClick={()=>setSelectedId(r.id)} style={{
              padding: '14px 18px', borderBottom: '1px solid '+AlC.border, cursor: 'pointer',
              background: r.id===selectedId ? AlC.surface : 'transparent',
              borderLeft: r.id===selectedId ? '2px solid '+AlC.green : '2px solid transparent',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: r.enabled?AlC.green:AlC.fgFaint }} />
                <span style={{ fontWeight: 500, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{r.name}</span>
              </div>
              <div style={{ marginTop: 6, color: AlC.fgDim, fontSize: 10.5, fontFamily: 'IBM Plex Mono' }}>
                ≥ {fmt.usd(r.minNotional,{compact:true})} · score ≥ {r.minScore.toFixed(1)}{r.counterOnly?' · CTR':''}
              </div>
              <div style={{ marginTop: 4, color: AlC.fgFaint, fontSize: 10.5, fontFamily: 'IBM Plex Mono' }}>
                {r.channel} · {r.hits||0} fires (24h)
              </div>
            </div>
          ))}
        </div>

        {/* EDITOR */}
        <div style={{ padding: '20px 24px', overflow: 'auto' }}>
          {selected && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Row>
                <Field2 label="Rule name">
                  <input value={selected.name} onChange={e=>update({name:e.target.value})}
                    style={{ background: AlC.surface, border: '1px solid '+AlC.border, color: AlC.fg, fontFamily:'inherit', fontSize: 13, padding: '8px 10px', borderRadius: 6, width: '100%', outline: 'none' }} />
                </Field2>
                <Field2 label="Status" width={140}>
                  <Toggle value={selected.enabled} onChange={v=>update({enabled:v})} />
                </Field2>
              </Row>

              <SectionTitle>Trigger conditions</SectionTitle>
              <Row>
                <Field2 label={`Min notional · ${fmt.usd(selected.minNotional,{compact:true})}`}>
                  <input type="range" min="0" max="10000000" step="50000" value={selected.minNotional} onChange={e=>update({minNotional:+e.target.value})}
                    style={{ width: '100%', accentColor: AlC.green }} />
                </Field2>
                <Field2 label={`Min score · ${selected.minScore.toFixed(1)}`}>
                  <input type="range" min="0" max="10" step="0.5" value={selected.minScore} onChange={e=>update({minScore:+e.target.value})}
                    style={{ width: '100%', accentColor: AlC.green }} />
                </Field2>
              </Row>

              <Row>
                <Field2 label="Side">
                  <div style={{ display: 'flex', gap: 4, background: AlC.surface, padding: 3, borderRadius: 6, width: 'fit-content' }}>
                    {['BUY','SELL'].map(s => {
                      const on = selected.sides.includes(s);
                      return (
                        <button key={s} onClick={()=>{
                          const n = on ? selected.sides.filter(x=>x!==s) : [...selected.sides, s];
                          if (n.length) update({sides:n});
                        }} style={{
                          background: on ? AlC.surface2 : 'transparent',
                          border: 'none', color: on ? (s==='BUY'?AlC.green:AlC.red) : AlC.fgDim,
                          padding: '6px 14px', borderRadius: 4, fontFamily: 'IBM Plex Mono', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        }}>{s}</button>
                      );
                    })}
                  </div>
                </Field2>
                <Field2 label="Counter-trend only">
                  <Toggle value={selected.counterOnly} onChange={v=>update({counterOnly:v})} />
                </Field2>
              </Row>

              <Row>
                <Field2 label="Category filter">
                  <select value={selected.category||''} onChange={e=>update({category:e.target.value||undefined})}
                    style={{ background: AlC.surface, border: '1px solid '+AlC.border, color: AlC.fg, fontFamily:'inherit', fontSize: 12, padding: '8px 10px', borderRadius: 6, width: '100%', outline: 'none' }}>
                    <option value="">— Any category —</option>
                    {['Politics','Crypto','Sports','Macro','Tech','Markets'].map(c=><option key={c}>{c}</option>)}
                  </select>
                </Field2>
                <Field2 label="Watchlist wallet">
                  <select value={selected.watchlistWallet||''} onChange={e=>update({watchlistWallet:e.target.value||undefined})}
                    style={{ background: AlC.surface, border: '1px solid '+AlC.border, color: AlC.fg, fontFamily:'inherit', fontSize: 12, padding: '8px 10px', borderRadius: 6, width: '100%', outline: 'none' }}>
                    <option value="">— Any wallet —</option>
                    {window.MOCK.WALLETS.map(w => <option key={w.wallet} value={w.pseudonym}>{w.pseudonym || fmt.shortAddr(w.wallet)}</option>)}
                  </select>
                </Field2>
              </Row>

              <SectionTitle>Delivery</SectionTitle>
              <Row>
                <Field2 label="Channel">
                  <div style={{ display: 'flex', gap: 4, background: AlC.surface, padding: 3, borderRadius: 6, width: 'fit-content' }}>
                    {[['discord','Discord'],['telegram','Telegram'],['email','Email'],['webhook','Webhook']].map(([k,v]) => (
                      <button key={k} onClick={()=>update({channel:k})} style={{
                        background: selected.channel===k ? AlC.surface2 : 'transparent',
                        border: 'none', color: selected.channel===k ? AlC.fg : AlC.fgDim,
                        padding: '6px 12px', borderRadius: 4, fontFamily: 'inherit', fontSize: 12, cursor: 'pointer',
                      }}>{v}</button>
                    ))}
                  </div>
                </Field2>
                <Field2 label={`Cooldown · ${selected.cooldown}m`}>
                  <input type="range" min="0" max="60" step="5" value={selected.cooldown} onChange={e=>update({cooldown:+e.target.value})}
                    style={{ width: '100%', accentColor: AlC.green }} />
                </Field2>
              </Row>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button style={{ background: AlC.green, color: '#062a13', border: 'none', padding: '10px 16px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, borderRadius: 6 }}>Save rule</button>
                <button style={{ background: 'transparent', color: AlC.fgDim, border: '1px solid '+AlC.border, padding: '10px 16px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, borderRadius: 6 }}>Send test alert</button>
                <button style={{ background: 'transparent', color: AlC.red, border: '1px solid '+AlC.border, padding: '10px 16px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, borderRadius: 6, marginLeft: 'auto' }}>Delete rule</button>
              </div>
            </div>
          )}
        </div>

        {/* PREVIEW */}
        <div style={{ borderLeft: '1px solid '+AlC.border, padding: '20px', overflow: 'auto' }}>
          <div style={{ color: AlC.fgFaint, fontSize: 10, textTransform:'uppercase', letterSpacing: '0.1em', fontFamily: 'IBM Plex Mono', marginBottom: 4 }}>Preview · last 24h</div>
          <div style={{ fontSize: 14, marginBottom: 14 }}>
            Would have fired <span style={{ color: AlC.green, fontWeight: 600, fontFamily: 'IBM Plex Mono' }}>{matches.length}</span> times
          </div>

          {matches.length === 0 && (
            <div style={{ padding: 14, color: AlC.fgDim, background: AlC.surface, border: '1px dashed '+AlC.border, borderRadius: 6, fontSize: 12 }}>
              No trades match these filters in the last 24 hours. Loosen the conditions or pick a more active wallet/category.
            </div>
          )}

          {matches.map(t => (
            <div key={t.id} style={{ padding: '10px 0', borderBottom: '1px solid '+AlC.border }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                <span style={{ color: t.side==='BUY'?AlC.green:AlC.red, fontFamily:'IBM Plex Mono', fontSize: 10.5, fontWeight: 600, letterSpacing:'0.06em' }}>{t.side}</span>
                <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: t.notional>=1_000_000?AlC.amber:AlC.fg, fontWeight: 600 }}>{fmt.usd(t.notional,{compact:true})}</span>
                <span style={{ marginLeft: 'auto', color: AlC.fgFaint, fontFamily: 'IBM Plex Mono', fontSize: 10.5 }}>{fmt.ago(t.ts)} ago</span>
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.35, overflow: 'hidden', textOverflow:'ellipsis', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{t.market.title}</div>
              <div style={{ color: AlC.fgFaint, fontSize: 10.5, fontFamily: 'IBM Plex Mono', marginTop: 3 }}>
                {t.wallet.pseudonym || fmt.shortAddr(t.wallet.wallet)} · score {t.score.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Row({ children }) {
  return <div style={{ display: 'flex', gap: 14 }}>{children}</div>;
}

function Field2({ label, children, width }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: width?'0 0 auto':'1 1 0', width }}>
      <span style={{ color: AlC.fgDim, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'IBM Plex Mono' }}>{label}</span>
      {children}
    </label>
  );
}

function SectionTitle({ children }) {
  return <div style={{ color: AlC.green, fontSize: 10, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', letterSpacing: '0.16em', marginTop: 4, paddingTop: 8, borderTop: '1px solid '+AlC.border }}>{children}</div>;
}

function Toggle({ value, onChange }) {
  return (
    <div onClick={()=>onChange(!value)} style={{
      width: 38, height: 22, borderRadius: 11, background: value?AlC.green:AlC.surface,
      position: 'relative', cursor: 'pointer', transition: 'background .15s',
    }}>
      <div style={{ position: 'absolute', top: 2, left: value?18:2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .15s' }}/>
    </div>
  );
}

window.AlertConfig = AlertConfig;
