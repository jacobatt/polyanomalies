// Display formatters. Ported from prototype/shared.jsx. All inputs operate
// on millisecond timestamps — DB rows arrive in seconds, the mapper converts.

interface UsdOptions {
  compact?: boolean;
  sign?: boolean;
}

export const fmt = {
  usd(v: number | null | undefined, opts: UsdOptions = {}): string {
    const { compact = false, sign = false } = opts;
    if (v == null) return "—";
    const s = sign && v > 0 ? "+" : "";
    if (compact) {
      const abs = Math.abs(v);
      if (abs >= 1e6) return s + "$" + (v / 1e6).toFixed(2) + "M";
      if (abs >= 1e3) return s + "$" + (v / 1e3).toFixed(1) + "k";
      return s + "$" + v.toFixed(0);
    }
    return s + "$" + Math.round(v).toLocaleString("en-US");
  },

  num(v: number | null | undefined, decimals: number = 0): string {
    if (v == null) return "—";
    return v.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  },

  pct(v: number, decimals: number = 1): string {
    return (v * 100).toFixed(decimals) + "%";
  },

  prob(v: number): string {
    return (v * 100).toFixed(0) + "¢";
  },

  ago(ts: number, now: number = Date.now()): string {
    const sec = Math.max(0, Math.round((now - ts) / 1000));
    if (sec < 60) return sec + "s";
    const m = Math.round(sec / 60);
    if (m < 60) return m + "m";
    const h = Math.round(m / 60);
    if (h < 24) return h + "h";
    return Math.round(h / 24) + "d";
  },

  hhmm(ts: number): string {
    const d = new Date(ts);
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mm = String(d.getUTCMinutes()).padStart(2, "0");
    const ss = String(d.getUTCSeconds()).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  },

  hhmmShort(ts: number): string {
    const d = new Date(ts);
    return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  },

  shortAddr(addr: string): string {
    return addr.slice(0, 6) + "…" + addr.slice(-4);
  },
};
