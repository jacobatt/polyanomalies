import { Shell } from "@/components/Shell";
import { Dashboard } from "@/components/Dashboard";
import { fetchTrades, fetchCategories, parseSince } from "@/lib/queries";

export const dynamic = "force-dynamic";

type SP = { since?: string };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const since = parseSince(sp.since);
  const [trades, categories] = await Promise.all([
    fetchTrades({ since, limit: 200 }),
    fetchCategories(),
  ]);

  return (
    <Shell>
      <Dashboard trades={trades} categories={categories} />
    </Shell>
  );
}
