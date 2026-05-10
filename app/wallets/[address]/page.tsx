import { notFound } from "next/navigation";
import Link from "next/link";
import { Shell } from "@/components/Shell";
import { Card } from "@/components/Card";
import { WalletAvatar } from "@/components/WalletAvatar";
import { WalletPnLChart } from "@/components/WalletPnLChart";
import { WalletExposure } from "@/components/WalletExposure";
import { MarketRecentTrades } from "@/components/MarketRecentTrades";
import { fetchWalletDetail } from "@/lib/queries";
import { fmt } from "@/lib/fmt";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  const detail = await fetchWalletDetail(address).catch(() => null);
  const display = detail?.pseudonym ?? detail?.name ?? fmt.shortAddr(address);
  return { title: `${display} · PolyAnomalies` };
}

export default async function WalletPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  const detail = await fetchWalletDetail(address);
  if (!detail) notFound();

  const display = detail.pseudonym ?? detail.name ?? fmt.shortAddr(detail.wallet);

  return (
    <Shell>
      {/* Sticky header */}
      <div className="sticky top-0 z-10 border-b border-border bg-bg/95 px-[18px] py-3 backdrop-blur">
        <Link
          href="/"
          className="font-mono text-[10.5px] tracking-[0.08em] text-fg-faint no-underline uppercase hover:text-fg-dim"
        >
          ← Dashboard
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <WalletAvatar
            wallet={detail.wallet}
            pseudonym={detail.pseudonym}
            size={48}
          />
          <div>
            <div className="text-[18px] font-semibold tracking-[-0.01em]">
              {display}
            </div>
            <div className="font-mono text-[11.5px] text-fg-dim">
              {fmt.shortAddr(detail.wallet)}
            </div>
          </div>
          <div className="ml-auto flex gap-5 text-[11.5px]">
            <Stat label="30d notional" value={fmt.usd(detail.totalNotional, { compact: true })} />
            <Stat label="trades" value={detail.tradeCount.toString()} />
            <Stat label="markets" value={detail.marketCount.toString()} />
          </div>
        </div>
      </div>

      <div
        className="grid gap-3 px-[18px] py-3.5"
        style={{ gridTemplateColumns: "1.4fr 1fr" }}
      >
        <Card title="Cumulative signed notional" subtitle="BUY adds, SELL subtracts. Stand-in for PnL until settlement data lands.">
          <div className="px-3 py-3">
            <WalletPnLChart series={detail.pnlSeries} height={220} />
          </div>
        </Card>
        <Card title="Market exposure" subtitle="Top markets by notional in window">
          <div className="px-3.5 py-3.5">
            <WalletExposure markets={detail.exposure} />
          </div>
        </Card>
      </div>

      <div className="px-[18px] pb-[18px]">
        <Card title="Recent trades" subtitle="Click a row to inspect.">
          <MarketRecentTrades trades={detail.trades.slice(0, 100)} />
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
