import { NextResponse } from "next/server";
import { serverServiceClient } from "@/lib/supabase";
import type { AlertCondition } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
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
  const update: Record<string, unknown> = {};
  if (body.name !== undefined) update.name = body.name;
  if (body.enabled !== undefined) update.enabled = body.enabled;
  if (body.conditions !== undefined) update.conditions = body.conditions;
  if (body.webhook_url !== undefined) update.webhook_url = body.webhook_url;
  const sb = serverServiceClient();
  const { data, error } = await sb
    .from("alert_rules")
    .update(update)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rule: data });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const sb = serverServiceClient();
  const { error } = await sb.from("alert_rules").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
