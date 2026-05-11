import { NextResponse } from "next/server";
import { serverServiceClient } from "@/lib/supabase";
import { rowToTrade } from "@/lib/mappers";
import { fetchAlertRules, tradeMatchesRule } from "@/lib/queries";
import type { Trade, TradeRow, AlertRule } from "@/lib/types";

export const dynamic = "force-dynamic";

const COLOR_BUY = 3066993;
const COLOR_SELL = 15158332;
const FALLBACK_WEBHOOK = process.env.DISCORD_WEBHOOK_URL ?? null;

// Hit GET /api/alerts/run to evaluate enabled rules against trades inserted
// since cron_state.alerts_last_run, then update the watermark. Pass
// ?dry_run=false to actually POST to Discord — default is logging only.
// Vercel cron is wired in vercel.json with ?dry_run=false in the path.
//
// Auth: when CRON_SECRET env is set, require Authorization: Bearer <secret>.
// Vercel cron injects this header automatically. When CRON_SECRET is unset,
// the route is open — keeps migrations + manual hits working without
// breaking the deploy mid-cutover.
export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${expected}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dry_run") !== "false";
  const sb = serverServiceClient();

  // 1. Read watermark
  const { data: cron, error: cronErr } = await sb
    .from("cron_state")
    .select("value")
    .eq("key", "alerts_last_run")
    .maybeSingle();
  if (cronErr) return NextResponse.json({ error: cronErr.message }, { status: 500 });
  const lastRunIso = cron?.value as string | null;
  const lastRunSec = lastRunIso
    ? Math.floor(new Date(lastRunIso).getTime() / 1000)
    : Math.floor(Date.now() / 1000) - 300;

  // 2. New trades since watermark — scored only
  const select = [
    "id", "timestamp", "condition_id", "title", "slug", "category",
    "proxy_wallet", "asset", "side", "outcome", "outcome_index",
    "size", "price", "notional", "transaction_hash",
    "name", "pseudonym", "score", "notional_score", "counter_trend",
  ].join(",");

  const { data: rows, error: tradeErr } = await sb
    .from("trades")
    .select(select)
    .gt("timestamp", lastRunSec)
    .not("score", "is", null)
    .order("timestamp", { ascending: true })
    .limit(1000);
  if (tradeErr) return NextResponse.json({ error: tradeErr.message }, { status: 500 });
  const trades = (rows ?? []).map((r) => rowToTrade(r as unknown as TradeRow));

  // 3. Active rules
  const allRules = await fetchAlertRules();
  const rules = allRules.filter((r) => r.enabled);

  // 4. Match × notify
  type Fired = {
    rule: string;
    tradeId: string;
    notional: number;
    posted: boolean;
    error?: string;
  };
  const fired: Fired[] = [];

  for (const trade of trades) {
    for (const rule of rules) {
      if (!tradeMatchesRule(trade, rule.conditions)) continue;
      const target = rule.webhook_url || FALLBACK_WEBHOOK;
      const entry: Fired = {
        rule: rule.name,
        tradeId: trade.id,
        notional: trade.notional,
        posted: false,
      };
      if (dryRun || !target) {
        // Log only.
        console.log(
          `[alerts/run dry] rule=${rule.name} trade=${trade.id.slice(0, 16)}… ` +
            `notional=${trade.notional.toFixed(0)} target=${target ? "ok" : "none"}`,
        );
      } else {
        try {
          const res = await fetch(target, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(buildEmbed(trade, rule)),
          });
          if (!res.ok) {
            entry.error = `Discord ${res.status}`;
          } else {
            entry.posted = true;
          }
        } catch (e) {
          entry.error = e instanceof Error ? e.message : "unknown";
        }
      }
      fired.push(entry);
    }
  }

  // 5. Advance watermark to max(timestamp) of processed trades. If nothing
  // came back, leave it where it was so we don't skip anything.
  let advancedTo: string | null = null;
  if (trades.length > 0) {
    const maxTs = Math.max(...trades.map((t) => Math.floor(t.ts / 1000)));
    const iso = new Date(maxTs * 1000).toISOString();
    const { error: updErr } = await sb
      .from("cron_state")
      .update({ value: iso })
      .eq("key", "alerts_last_run");
    if (updErr) {
      return NextResponse.json(
        {
          error: `watermark update failed: ${updErr.message}`,
          processed: trades.length,
          fired: fired.length,
        },
        { status: 500 },
      );
    }
    advancedTo = iso;
  }

  return NextResponse.json({
    dryRun,
    rulesActive: rules.length,
    tradesProcessed: trades.length,
    matches: fired.length,
    posted: fired.filter((f) => f.posted).length,
    errors: fired.filter((f) => f.error).map((f) => ({ rule: f.rule, error: f.error })),
    sinceWatermark: lastRunIso,
    advancedTo,
    sampleFired: fired.slice(0, 5),
  });
}

const DASHBOARD_BASE =
  process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "https://polyanomalies.vercel.app";

function buildEmbed(trade: Trade, rule: AlertRule) {
  const dashboard = `${DASHBOARD_BASE}/?trade=${encodeURIComponent(trade.id)}`;
  const wallet = trade.wallet.wallet;
  return {
    embeds: [
      {
        title: trade.market.title || "(unknown market)",
        url: dashboard,
        color: trade.side === "BUY" ? COLOR_BUY : COLOR_SELL,
        fields: [
          { name: "Side", value: trade.side, inline: true },
          {
            name: "Notional",
            value: `$${(trade.notional / 1e6).toFixed(2)}M`,
            inline: true,
          },
          {
            name: "Outcome",
            value: trade.outcome ?? "?",
            inline: true,
          },
          { name: "Wallet", value: `${wallet.slice(0, 10)}…`, inline: true },
          { name: "Rule", value: rule.name, inline: true },
        ],
      },
    ],
  };
}
