import { NextResponse } from "next/server";
import { serverServiceClient } from "@/lib/supabase";
import { fetchAlertRules } from "@/lib/queries";
import type { AlertCondition } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rules = await fetchAlertRules();
    return NextResponse.json({ rules });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let body: {
    name?: string;
    enabled?: boolean;
    conditions?: AlertCondition;
    webhook_url?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const sb = serverServiceClient();
  const { data, error } = await sb
    .from("alert_rules")
    .insert({
      name: body.name ?? "Untitled rule",
      enabled: body.enabled ?? true,
      conditions: body.conditions ?? {},
      channel: "discord",
      webhook_url: body.webhook_url ?? null,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rule: data });
}
