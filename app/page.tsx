import { Shell } from "@/components/Shell";
import { Dashboard } from "@/components/Dashboard";
import {
  fetchTrades,
  fetchCategories,
  fetchTopMarkets,
  fetchTopWallets,
  parseSince,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

type SP = { since?: string };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const since = parseSince(sp.since);
  const [trades, categories, topMarkets, topWallets] = await Promise.all([
    fetchTrades({ since, limit: 200 }),
    fetchCategories(),
    fetchTopMarkets({ since, limit: 5 }),
    fetchTopWallets({ since, limit: 6 }),
  ]);

  return (
    <Shell>
      <Dashboard
        trades={trades}
        categories={categories}
        topMarkets={topMarkets}
        topWallets={topWallets}
      />
    </Shell>
  );
}
