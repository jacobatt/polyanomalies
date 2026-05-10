import { Shell } from "@/components/Shell";
import { AlertsClient } from "@/components/AlertsClient";
import { fetchAlertRules } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata = { title: "Alerts · PolyAnomalies" };

export default async function AlertsPage() {
  let rules: Awaited<ReturnType<typeof fetchAlertRules>> = [];
  try {
    rules = await fetchAlertRules();
  } catch {
    // Surface as empty list — initial-render auth/RLS errors are recoverable
    // by refresh once the user creates a rule.
  }
  return (
    <Shell>
      <AlertsClient initialRules={rules} />
    </Shell>
  );
}
