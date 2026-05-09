// Shared mock data for the PolyAnomalies design canvas.
// Realistic-looking trades, markets, and wallets — no real polymarket
// data, generated deterministically from a tiny PRNG so layouts are stable.

(function () {
  // ---- deterministic PRNG ---------------------------------------------------
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rnd = mulberry32(20260509);
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const range = (lo, hi) => lo + rnd() * (hi - lo);
  const irange = (lo, hi) => Math.floor(range(lo, hi + 1));

  // ---- markets --------------------------------------------------------------
  const MARKETS = [
    { id: 'm-btc-150', title: 'Bitcoin above $150,000 by Dec 31, 2026', slug: 'btc-150k-eoy-2026', category: 'Crypto', price: 0.42, drift: -0.011 },
    { id: 'm-fed-jun', title: 'Fed cuts rates at June 2026 meeting', slug: 'fed-cut-jun-2026', category: 'Macro', price: 0.71, drift: 0.024 },
    { id: 'm-mid26', title: 'Republicans hold House majority after 2026 midterms', slug: 'gop-house-2026', category: 'Politics', price: 0.38, drift: -0.018 },
    { id: 'm-apple-3t', title: 'Apple market cap above $4T by EOY 2026', slug: 'aapl-4t-eoy-2026', category: 'Markets', price: 0.55, drift: 0.008 },
    { id: 'm-arsenal', title: 'Arsenal wins 2025-26 Premier League', slug: 'arsenal-pl-2526', category: 'Sports', price: 0.18, drift: -0.005 },
    { id: 'm-lakers', title: 'Lakers win 2026 NBA Finals', slug: 'lakers-2026-nba', category: 'Sports', price: 0.09, drift: -0.012 },
    { id: 'm-gpt5', title: 'OpenAI releases GPT-5 before Aug 1, 2026', slug: 'gpt5-aug-2026', category: 'Tech', price: 0.61, drift: 0.031 },
    { id: 'm-eth-8k', title: 'Ethereum above $8,000 on July 1, 2026', slug: 'eth-8k-jul-2026', category: 'Crypto', price: 0.27, drift: -0.022 },
    { id: 'm-recess', title: 'US recession (NBER) called in 2026', slug: 'recession-2026', category: 'Macro', price: 0.31, drift: 0.014 },
    { id: 'm-starship', title: 'Starship achieves Mars orbit before 2028', slug: 'starship-mars-2028', category: 'Tech', price: 0.22, drift: 0.006 },
    { id: 'm-tiktok', title: 'TikTok banned or divested in US by EOY 2026', slug: 'tiktok-2026', category: 'Politics', price: 0.44, drift: -0.009 },
    { id: 'm-oil-90', title: 'WTI crude above $90 on Aug 1, 2026', slug: 'wti-90-aug-2026', category: 'Markets', price: 0.36, drift: 0.018 },
  ];

  // ---- wallets --------------------------------------------------------------
  const WALLETS = [
    { wallet: '0xa3f192c4d8e7b6a5f4e3d2c1b0a9f8e7d6c5b4a3', name: null, pseudonym: 'PrincessCaroline' },
    { wallet: '0x1bc8e4f29a7d3c5b6e8f0a2c4d6e8f1a3c5b7d9e', name: 'Theo', pseudonym: 'Theo4' },
    { wallet: '0xfeed0c0ffee5c0ffee5c0ffee5c0ffee5c0ffeed', name: null, pseudonym: '0xMidas' },
    { wallet: '0x77e8a5b3c1d9e7f5b3a1c9d7e5b3a1c9d7e5b3a1', name: null, pseudonym: 'fredi66' },
    { wallet: '0xcafe1234beef5678dead9012face3456abad7890', name: null, pseudonym: 'whaletail' },
    { wallet: '0x42d3a1f9c5e2b8d4a6c1f9e3b7d5a2c8f4e1b6d3', name: 'Diana K', pseudonym: 'dianak' },
    { wallet: '0x9b2e4f6a8c0d2e4f6a8c0d2e4f6a8c0d2e4f6a8c', name: null, pseudonym: 'septicTunna' },
    { wallet: '0x3a7d5b8e2c9f1a4d7b0e3c6f9a2d5b8e1c4f7a0d', name: null, pseudonym: 'leverage_lou' },
    { wallet: '0xb33ff00d1234567890abcdef1234567890abcdef', name: null, pseudonym: 'beefking' },
    { wallet: '0x5c8e1b4d7a0f3c6e9b2d5a8c1f4e7b0d3a6c9f2e', name: null, pseudonym: 'OptimusFrance' },
    { wallet: '0xdeadbeef1337f00dcafebabe5ca1ab1eaccede1f', name: null, pseudonym: 'mikrochirurg' },
    { wallet: '0x6e9c2b5f8a1d4e7c0b3f6a9d2e5c8b1f4a7d0e3c', name: null, pseudonym: 'foldemequity' },
  ];

  // ---- trade feed -----------------------------------------------------------
  const NOW = new Date('2026-05-09T14:32:11Z').getTime();
  const TRADES = [];

  // Generate ~140 trades spanning 24h
  for (let i = 0; i < 140; i++) {
    const m = pick(MARKETS);
    const w = pick(WALLETS);
    const minutesAgo = Math.floor(rnd() * 60 * 24);
    const ts = NOW - minutesAgo * 60 * 1000;
    const side = rnd() < 0.55 ? 'BUY' : 'SELL';
    const outcomeIndex = rnd() < 0.7 ? 0 : 1;
    const outcome = outcomeIndex === 0 ? 'Yes' : 'No';
    // Notional skewed: most $50k-300k, some whales $1M-8M
    const r = rnd();
    let notional;
    if (r < 0.65) notional = 50_000 + rnd() * 250_000;
    else if (r < 0.92) notional = 300_000 + rnd() * 700_000;
    else notional = 1_000_000 + rnd() * 7_000_000;

    const price = Math.max(0.02, Math.min(0.98, m.price + range(-0.04, 0.04)));
    const size = notional / price;

    // Counter-trend if random < 0.22
    const counterTrend = rnd() < 0.22;
    // Notional score: log10(notional/50k)
    const notionalScore = Math.log10(notional / 50_000);
    const score = notionalScore + (counterTrend ? 3 : 0);

    TRADES.push({
      id: 'tx-' + i.toString(16).padStart(4, '0'),
      ts,
      market: m,
      wallet: w,
      side,
      outcome,
      outcomeIndex,
      price: +price.toFixed(3),
      size: +size.toFixed(2),
      notional: +notional.toFixed(2),
      counterTrend,
      notionalScore: +notionalScore.toFixed(2),
      score: +score.toFixed(2),
    });
  }
  // sort newest first
  TRADES.sort((a, b) => b.ts - a.ts);

  // ---- price series for drill-down -----------------------------------------
  // Make a 24h price walk for each market plus the trades-on-it
  const SERIES = {};
  MARKETS.forEach((m) => {
    const points = 240; // 1 point per ~6 min over 24h
    const arr = [];
    let p = m.price + range(-0.06, 0.06);
    for (let i = 0; i < points; i++) {
      const t = NOW - (points - i) * 6 * 60 * 1000;
      p = Math.max(0.02, Math.min(0.98, p + range(-0.012, 0.012) + m.drift / points));
      arr.push({ t, p: +p.toFixed(4) });
    }
    SERIES[m.id] = arr;
  });

  // ---- wallet PnL curve mock -----------------------------------------------
  // For wallet drilldown – 90-day equity curve
  const PNL = {};
  WALLETS.forEach((w) => {
    const arr = [];
    let v = 0;
    const trend = range(-0.4, 1.6);
    for (let i = 0; i < 90; i++) {
      v += range(-1.2, 1.2 + trend * 0.04);
      arr.push({ d: i, v: +v.toFixed(2) });
    }
    PNL[w.wallet] = arr;
  });

  // ---- expose ---------------------------------------------------------------
  window.MOCK = { MARKETS, WALLETS, TRADES, SERIES, PNL, NOW };
})();
