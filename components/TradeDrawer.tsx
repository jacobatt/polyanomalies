"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import type { Trade, TradeDetail, PricePoint } from "@/lib/types";
import { fmt } from "@/lib/fmt";
import { useUrlState } from "@/lib/urlState";
import { WalletAvatar } from "@/components/WalletAvatar";

// Right-side drawer overlay driven by ?trade=<id>. Mounts on every page via
// Shell. Search-param-based rather than path-based parallel routes — the URL
// spec is a query param, not a path segment, so an intercepted parallel
// route doesn't cleanly apply. Closes on ESC, backdrop click, close button;
// state survives back/forward because the URL is the source of truth.
export function TradeDrawer() {
  const { params, setParam } = useUrlState();
  const tradeId = params.get("trade");
  const close = () => setParam("trade", null);

  const [detail, setDetail] = useState<TradeDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch on tradeId change. setState-in-effect is the canonical pattern
  // for async data fetching keyed off a URL param; the lint rule is
  // designed for synchronous derive-from-prop cases.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!tradeId) {
      setDetail(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/trades/${encodeURIComponent(tradeId)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: TradeDetail) => {
        if (!cancelled) setDetail(d);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tradeId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // ESC closes; lock body scroll while open.
  useEffect(() => {
    if (!tradeId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tradeId]);

  if (!tradeId) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        onClick={close}
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-label="Trade detail"
        className="absolute right-0 top-0 flex h-full w-[460px] flex-col border-l border-border-hi bg-bg"
        style={{ boxShadow: "-12px 0 32px rgba(0,0,0,0.4)" }}
      >
        {loading && !detail && <DrawerLoading onClose={close} />}
        {error && !loading && <DrawerError message={error} onClose={close} />}
        {detail && <DrawerBody detail={detail} onClose={close} />}
      </aside>
    </div>
  );
}

function DrawerLoading({ onClose }: { onClose: () => void }) {
  return (
    <>
      <DrawerHeader onClose={onClose} />
      <div className="flex flex-1 items-center justify-center text-fg-dim">
        Loading…
      </div>
    </>
  );
}

function DrawerError({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <>
      <DrawerHeader onClose={onClose} />
      <div className="flex flex-1 items-center justify-center px-6 text-center text-red">
        Couldn’t load trade: {message}
      </div>
    </>
  );
}

function DrawerHeader({
  onClose,
  trade,
}: {
  onClose: () => void;
  trade?: Trade;
}) {
  return (
    <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
      {trade && (
        <>
          <span
            className={clsx(
              "rounded-[3px] px-1.5 py-0.5 font-mono text-[10.5px] font-semibold tracking-[0.04em]",
              trade.side === "BUY"
                ? "bg-green-soft text-green"
                : "bg-red-soft text-red",
            )}
          >
            {trade.side} {(trade.outcome ?? "").toUpperCase()}
          </span>
          <span className="font-mono text-[11px] text-fg-dim">
            {fmt.hhmm(trade.ts)} UTC · {fmt.ago(trade.ts)} ago
          </span>
        </>
      )}
      <button
        onClick={onClose}
        type="button"
        aria-label="Close"
        className="ml-auto rounded p-1 text-fg-dim hover:bg-surface hover:text-fg"
      >
        <CloseIcon />
      </button>
    </div>
  );
}

function DrawerBody({
  detail,
  onClose,
}: {
  detail: TradeDetail;
  onClose: () => void;
}) {
  const t = detail.trade;
  const score = t.score ?? 0;
  const ns = t.notionalScore ?? 0;
  return (
    <>
      <DrawerHeader trade={t} onClose={onClose} />
      <div className="flex flex-1 flex-col gap-[18px] overflow-y-auto px-5 py-[18px]">
        {/* Market */}
        <section>
          <SectionLabel>Market{t.market.category ? ` · ${t.market.category}` : ""}</SectionLabel>
          <h2 className="mt-1.5 text-[16px] font-semibold leading-tight">
            {t.market.title}
          </h2>
          <Link
            href={`/markets/${encodeURIComponent(t.market.id)}`}
            className="mt-1.5 inline-flex items-center gap-1 font-mono text-[11px] text-green no-underline"
          >
            View market <ExtIcon />
          </Link>
        </section>

        {/* Stats */}
        <div className="grid gap-2.5" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
          <DrawerStat
            label="Notional"
            value={fmt.usd(t.notional, { compact: true })}
            sub={"$" + fmt.num(t.notional, 0)}
            accent={t.notional >= 1_000_000 ? "amber" : undefined}
          />
          <DrawerStat
            label="Price"
            value={fmt.prob(t.price)}
            sub={"size " + fmt.num(t.size, 0)}
          />
          <DrawerStat
            label="Score"
            value={score.toFixed(2)}
            sub={`size ${ns.toFixed(2)}${t.counterTrend ? " + ctr 3.0" : ""}`}
            accent="green"
          />
        </div>

        {/* Signals */}
        <section>
          <SectionLabel>Signals</SectionLabel>
          <div className="mt-2 flex flex-col gap-1.5">
            <SignalRow
              on={t.notional >= 1_000_000}
              label="Whale print"
              detail="≥ $1M notional"
            />
            <SignalRow
              on={t.notional >= 5_000_000}
              label="Mega whale"
              detail="≥ $5M — top 1% of last 30d"
            />
            <SignalRow
              on={t.counterTrend}
              label="Counter-trend"
              detail="Direction opposes 1h price drift"
            />
            <SignalRow
              on={ns >= 2}
              label="Size outlier"
              detail={`log-size ${ns.toFixed(2)} (≥ 2 = $5M+)`}
            />
          </div>
        </section>

        {/* Mini chart */}
        {detail.series.length >= 2 && (
          <section>
            <SectionLabel>Price · this market · this trade marked</SectionLabel>
            <div className="mt-2">
              <MiniChart series={detail.series} focal={{ ts: t.ts, price: t.price }} />
            </div>
          </section>
        )}

        {/* Wallet */}
        <section>
          <SectionLabel>Wallet</SectionLabel>
          <div className="mt-2 flex items-center gap-2.5 rounded-[8px] border border-border bg-surface p-3">
            <WalletAvatar
              wallet={t.wallet.wallet}
              pseudonym={t.wallet.pseudonym}
              size={36}
            />
            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="font-medium">
                {t.wallet.pseudonym ?? t.wallet.name ?? fmt.shortAddr(t.wallet.wallet)}
              </div>
              <div className="font-mono text-[11px] text-fg-dim">
                {fmt.shortAddr(t.wallet.wallet)}
              </div>
            </div>
            <Link
              href={`/wallets/${encodeURIComponent(t.wallet.wallet)}`}
              className="rounded-md border border-border bg-surface-2 px-2.5 py-1.5 text-[11px] no-underline hover:border-border-hi"
            >
              Open profile
            </Link>
          </div>
        </section>

        <RelatedTrades title={`Same wallet — recent (${detail.sameWallet.length})`} items={detail.sameWallet} />
        <RelatedTrades title={`Same market — recent (${detail.sameMarket.length})`} items={detail.sameMarket} />

        {/* Tx */}
        <section>
          <SectionLabel>Transaction</SectionLabel>
          <div className="mt-1.5 flex items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-2 font-mono text-[11px] text-fg-dim">
            <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
              {t.transactionHash}
            </span>
            <a
              href={`https://polygonscan.com/tx/${t.transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-green no-underline"
            >
              polygonscan <ExtIcon />
            </a>
          </div>
        </section>
      </div>
    </>
  );
}

function DrawerStat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "green" | "amber";
}) {
  return (
    <div className="rounded-[8px] border border-border bg-surface px-3 py-2.5">
      <div className="font-mono text-[10px] tracking-[0.08em] text-fg-faint uppercase">
        {label}
      </div>
      <div
        className={clsx(
          "mt-1 font-mono text-[18px] font-semibold",
          accent === "green" && "text-green",
          accent === "amber" && "text-amber",
          !accent && "text-fg",
        )}
      >
        {value}
      </div>
      {sub && (
        <div className="mt-0.5 font-mono text-[10.5px] text-fg-dim">{sub}</div>
      )}
    </div>
  );
}

function SignalRow({
  on,
  label,
  detail,
}: {
  on: boolean;
  label: string;
  detail: string;
}) {
  return (
    <div
      className={clsx(
        "flex items-center gap-2.5 rounded-md border px-2.5 py-2",
        on ? "border-border bg-surface" : "border-[rgba(255,255,255,0.04)]",
      )}
    >
      <span
        className={clsx(
          "flex h-4 w-4 flex-none items-center justify-center rounded-full border",
          on ? "border-green bg-green" : "border-fg-faint",
        )}
      >
        {on && (
          <svg width="9" height="9" viewBox="0 0 9 9">
            <path
              d="M1.5 4.5 L3.5 6.5 L7.5 2.5"
              stroke="#062a13"
              strokeWidth="1.6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <div className="flex-1">
        <div
          className={clsx(
            "text-[12.5px]",
            on ? "font-medium text-fg" : "text-fg-dim",
          )}
        >
          {label}
        </div>
        <div className="font-mono text-[10.5px] text-fg-faint">{detail}</div>
      </div>
    </div>
  );
}

function MiniChart({
  series,
  focal,
}: {
  series: PricePoint[];
  focal: { ts: number; price: number };
}) {
  const W = 360;
  const H = 100;
  const minP = Math.min(...series.map((p) => p.price));
  const maxP = Math.max(...series.map((p) => p.price));
  const span = maxP - minP || 1;
  const minTs = series[0].ts;
  const maxTs = series[series.length - 1].ts;
  const tsSpan = maxTs - minTs || 1;
  const xOf = (ts: number) => ((ts - minTs) / tsSpan) * W;
  const yOf = (p: number) => H - ((p - minP) / span) * H;
  const d = series
    .map((p, i) => `${i ? "L" : "M"}${xOf(p.ts).toFixed(1)},${yOf(p.price).toFixed(1)}`)
    .join(" ");
  const tx = Math.max(0, Math.min(W, xOf(focal.ts)));
  const ty = Math.max(0, Math.min(H, yOf(focal.price)));
  return (
    <svg width={W} height={H} style={{ display: "block" }}>
      <path d={`${d} L${W},${H} L0,${H} Z`} fill="var(--green)" opacity="0.1" />
      <path d={d} stroke="var(--green)" strokeWidth="1.4" fill="none" />
      <line
        x1={tx}
        x2={tx}
        y1="0"
        y2={H}
        stroke="var(--amber)"
        strokeDasharray="2 3"
      />
      <circle cx={tx} cy={ty} r="6" fill="var(--amber)" fillOpacity="0.25" />
      <circle cx={tx} cy={ty} r="3" fill="var(--amber)" />
    </svg>
  );
}

function RelatedTrades({ title, items }: { title: string; items: Trade[] }) {
  return (
    <section>
      <SectionLabel>{title}</SectionLabel>
      <div className="mt-1.5 overflow-hidden rounded-[8px] border border-border bg-surface">
        {items.length === 0 ? (
          <div className="px-3 py-3.5 text-center text-[11.5px] text-fg-dim">
            No related trades.
          </div>
        ) : (
          items.map((t, i) => (
            <Link
              key={t.id}
              href={`/?trade=${encodeURIComponent(t.id)}`}
              scroll={false}
              className={clsx(
                "grid items-center gap-2 px-2.5 py-2 text-[12px] no-underline hover:bg-surface-2",
                i > 0 && "border-t border-border",
              )}
              style={{ gridTemplateColumns: "50px 1fr 70px" }}
            >
              <span
                className={clsx(
                  "font-mono text-[10.5px] font-semibold",
                  t.side === "BUY" ? "text-green" : "text-red",
                )}
              >
                {t.side}
              </span>
              <span className="overflow-hidden whitespace-nowrap text-ellipsis text-fg">
                {t.market.title}
              </span>
              <span
                className={clsx(
                  "text-right font-mono font-semibold",
                  t.notional >= 1_000_000 ? "text-amber" : "text-fg",
                )}
              >
                {fmt.usd(t.notional, { compact: true })}
              </span>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[10px] tracking-[0.1em] text-fg-faint uppercase">
      {children}
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M3 3 L11 11 M11 3 L3 11"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ExtIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path
        d="M3 3 H7 V7 M7 3 L3 7"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
