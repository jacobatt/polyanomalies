import { Shell } from "@/components/Shell";

export default async function MarketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Shell>
      <section className="px-[18px] py-6">
        <h1 className="text-[18px] font-semibold tracking-[-0.01em]">Market detail</h1>
        <p className="mt-2 font-mono text-fg-dim">{id}</p>
        <p className="mt-2 text-fg-dim">Placeholder — wire-up in task 10.</p>
      </section>
    </Shell>
  );
}
