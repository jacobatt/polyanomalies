import { notFound } from "next/navigation";
import Link from "next/link";
import { Shell } from "@/components/Shell";
import { Card } from "@/components/Card";
import { MarketChart } from "@/components/MarketChart";
import { MarketRecentTrades } from "@/components/MarketRecentTrades";
import { fetchMarketDetail } from "@/lib/queries";
import { fmt } from "@/lib/fmt";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await fetchMarketDetail(id).catch(() => null);
  return {
    title: detail ? `${detail.title} · PolyAnomalies` : "Market · PolyAnomalies",
  };
}

export default async function MarketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await fetchMarketDetail(id);
  if (!detail) notFound();

  return (
    <Shell>
      {/* Sticky page header */}
      <div className="sticky top-0 z-10 border-b border-border bg-bg/95 px-[18px] py-3 backdrop-blur">
        <Link
          href="/"
          className="font-mono text-[10.5px] tracking-[0.08em] text-fg-faint no-underline uppercase hover:text-fg-dim"
        >
          ← Dashboard
        </Link>
        <div className="mt-1 flex items-baseline gap-3">
          <h1 className="text-[18px] font-semibold tracking-[-0.01em]">
            {detail.title}
          </h1>
          {detail.category && (
            <span className="font-mono text-[10.5px] tracking-[0.08em] text-fg-faint uppercase">
              {detail.category}
            </span>
          )}
          {detail.endDate && (
            <span className="font-mono text-[11px] text-fg-dim">
              resolves {new Date(detail.endDate).toISOString().slice(0, 10)}
            </span>
          )}
        </div>
        <div className="mt-1.5 flex gap-5 text-[11.5px]">
          <Stat label="7d notional" value={fmt.usd(detail.notional, { compact: true })} />
          <Stat label="trades" value={detail.tradeCount.toString()} />
          <Stat label="anomalies" value={detail.anomalyCount.toString()} />
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3 px-[18px] py-3.5">
        <Card title="Price · 7d" subtitle="Anomaly trades marked. Hover for context.">
          <div className="px-3 py-3">
            <MarketChart series={detail.series} trades={detail.trades} height={280} />
          </div>
        </Card>
        <Card title="Recent scored trades" subtitle="Click a row to inspect.">
          <MarketRecentTrades trades={detail.trades} />
        </Card>
      </div>
    </Shell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-fg-dim">
      <span className="font-mono text-[10.5px] tracking-[0.08em] text-fg-faint uppercase">
        {label}
      </span>{" "}
      <span className="font-mono font-semibold text-fg">{value}</span>
    </span>
  );
}
