// Main canvas — assembles all artboards into the design canvas.

const { DesignCanvas, DCSection, DCArtboard } = window;

function App() {
  // shared open* handlers — they flash a small toast since artboards already
  // exist for these surfaces in the canvas. In a real prototype we'd open a
  // side drawer; in the canvas we tell the user which artboard to look at.
  const [toast, setToast] = React.useState(null);
  React.useEffect(() => {
    if (!toast) return;
    const id = setTimeout(()=>setToast(null), 2400);
    return () => clearTimeout(id);
  }, [toast]);

  const openTrade = (t) => setToast({ kind: 'trade', label: 'Trade detail', sub: `${t.side} ${fmt.usd(t.notional,{compact:true})} on ${t.market.title.slice(0,40)}…`, hint: 'In a live build this opens a side drawer; for the canvas, see the Trade drawer artboard below.' });
  const openMarket = (m) => setToast({ kind: 'market', label: 'Open market detail', sub: m.title, hint: 'Jump to the “Per-market detail” artboard.' });
  const openWallet = (w) => setToast({ kind: 'wallet', label: 'Open wallet profile', sub: w.pseudonym || fmt.shortAddr(w.wallet), hint: 'Jump to the “Wallet profile” artboard.' });
  const openAlerts = () => setToast({ kind: 'alerts', label: 'Open alert configuration', sub: 'Settings · Alerts', hint: 'Jump to the “Alert configuration” artboard.' });

  // Pick a featured market, wallet, trade for the secondary artboards
  const featuredMarket = window.MOCK.MARKETS[1]; // Fed cuts rates
  const featuredWallet = window.MOCK.WALLETS[0]; // PrincessCaroline

  return (
    <>
      <DesignCanvas
        title="PolyAnomalies"
        subtitle="Whale & anomaly monitor for prediction markets — three visual directions, plus drill-downs"
      >
        <DCSection id="dashboards" title="Main dashboard · 3 directions" subtitle="All three are dark, dense, single-green-accent — they vary in typographic system and spatial language. The hero is the live anomaly feed.">
          <DCArtboard id="terminal" label="A · Terminal" width={1480} height={920}>
            <TerminalDashboard width={1480} height={920}
              openTrade={openTrade} openMarket={openMarket} openWallet={openWallet} openAlerts={openAlerts} />
          </DCArtboard>
          <DCArtboard id="desk" label="B · Trading desk" width={1480} height={920}>
            <DeskDashboard width={1480} height={920}
              openTrade={openTrade} openMarket={openMarket} openWallet={openWallet} openAlerts={openAlerts} />
          </DCArtboard>
          <DCArtboard id="editorial" label="C · Editorial" width={1480} height={920}>
            <EditorialDashboard width={1480} height={920}
              openTrade={openTrade} openMarket={openMarket} openWallet={openWallet} openAlerts={openAlerts} />
          </DCArtboard>
        </DCSection>

        <DCSection id="market" title="Per-market detail" subtitle="Drill-down opened by clicking a market in any dashboard. Big chart with anomaly dots, hover for context, recent trades for that market.">
          <DCArtboard id="market-detail" label="Market detail · Fed cuts rates" width={1280} height={840}>
            <MarketDetail width={1280} height={840} market={featuredMarket} />
          </DCArtboard>
        </DCSection>

        <DCSection id="wallet" title="Wallet profile" subtitle="A trader's PnL curve, market exposure, and recent activity. Linkable from the feed and top-wallets card.">
          <DCArtboard id="wallet-profile" label="Wallet · PrincessCaroline" width={1280} height={780}>
            <WalletProfile width={1280} height={780} wallet={featuredWallet} />
          </DCArtboard>
        </DCSection>

        <DCSection id="alerts" title="Alert configuration" subtitle="Define rules over notional / score / counter-trend / wallet / market. Live preview shows which trades from the last 24h would have fired.">
          <DCArtboard id="alert-config" label="Settings · Alerts" width={1280} height={780}>
            <AlertConfig width={1280} height={780} />
          </DCArtboard>
        </DCSection>

        <DCSection id="polish" title="Polish round · B" subtitle="Closing the loop on direction B: full trade-detail drawer, the empty/loading/error states the dashboard will spend real time in, and a narrow-viewport layout for phones.">
          <DCArtboard id="trade-drawer" label="Trade detail drawer (over B)" width={1480} height={920}>
            <TradeDrawer width={1480} height={920} />
          </DCArtboard>
          <DCArtboard id="states" label="Empty · loading · error states" width={1280} height={820}>
            <DeskStates width={1280} height={820} />
          </DCArtboard>
          <DCArtboard id="mobile" label="Mobile · 390×844" width={390} height={844}>
            <MobileDesk width={390} height={844} />
          </DCArtboard>
        </DCSection>
      </DesignCanvas>

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#0d1014', color: '#e6e8eb', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10, padding: '10px 14px', boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
          fontFamily: '"IBM Plex Sans", sans-serif', fontSize: 12.5, zIndex: 9999, maxWidth: 480,
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          <div style={{ fontWeight: 600 }}>{toast.label}</div>
          <div style={{ color: '#9aa0a8' }}>{toast.sub}</div>
          <div style={{ color: '#5a6068', fontSize: 11, fontFamily: 'IBM Plex Mono' }}>{toast.hint}</div>
        </div>
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
