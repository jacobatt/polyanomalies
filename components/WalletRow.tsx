"use client";

import Link from "next/link";
import type { TopWallet } from "@/lib/types";
import { fmt } from "@/lib/fmt";

// Single row in the Top wallets card. Click → /wallets/[address]. 24px
// rank column · pseudonym + short addr · mono-green notional · trade and
// market counts. Matches the desk-dashboard artboard's right-stack row.
export function WalletRow({
  wallet,
  rank,
}: {
  wallet: TopWallet;
  rank: number;
}) {
  const display = wallet.pseudonym ?? wallet.name ?? fmt.shortAddr(wallet.wallet);
  return (
    <Link
      href={`/wallets/${encodeURIComponent(wallet.wallet)}`}
      className="grid items-center gap-2.5 border-b border-border px-3.5 py-2.5 no-underline hover:bg-surface-2"
      style={{ gridTemplateColumns: "24px 1fr 80px 60px" }}
    >
      <span className="font-mono text-[11px] text-fg-faint">{rank}</span>
      <div className="overflow-hidden">
        <div className="overflow-hidden whitespace-nowrap text-ellipsis font-medium text-fg">
          {display}
        </div>
        <div className="font-mono text-[10.5px] text-fg-faint">
          {fmt.shortAddr(wallet.wallet)}
        </div>
      </div>
      <div className="text-right font-mono font-semibold text-green">
        {fmt.usd(wallet.notional, { compact: true })}
      </div>
      <div className="text-right text-[11px] text-fg-dim">
        {wallet.tradeCount}t · {wallet.marketCount}m
      </div>
    </Link>
  );
}
