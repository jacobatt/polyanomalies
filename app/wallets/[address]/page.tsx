import { Shell } from "@/components/Shell";

export default async function WalletPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  return (
    <Shell>
      <section className="px-[18px] py-6">
        <h1 className="text-[18px] font-semibold tracking-[-0.01em]">Wallet profile</h1>
        <p className="mt-2 font-mono text-fg-dim">{address}</p>
        <p className="mt-2 text-fg-dim">Placeholder — wire-up in task 11.</p>
      </section>
    </Shell>
  );
}
