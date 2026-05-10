"use client";

import { useEffect, useState } from "react";
import type { AlertRule, AlertCondition, Trade } from "@/lib/types";
import { fmt } from "@/lib/fmt";

const DEBOUNCE_MS = 600;

// One inline-editable rule card. Local draft state holds edits; debounced
// PATCH writes back. Toggle is immediate. Preview hits /api/alerts/preview
// on every conditions change.
export function AlertRuleCard({
  rule,
  onChange,
  onDelete,
}: {
  rule: AlertRule;
  onChange: (next: AlertRule) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState<AlertRule>(rule);
  const [savedRule, setSavedRule] = useState<AlertRule>(rule);
  const [preview, setPreview] = useState<{ matches_24h: number; sample: Trade[] } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Snap draft to incoming rule when its identity changes externally
  // (parent re-fetched after another save).
  if (rule.id !== savedRule.id || rule !== savedRule) {
    if (rule.id !== savedRule.id) {
      setDraft(rule);
      setSavedRule(rule);
    }
  }

  // Debounced save on draft change.
  useEffect(() => {
    if (draft === savedRule) return;
    const id = setTimeout(async () => {
      try {
        const r = await fetch(`/api/alerts/${draft.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: draft.name,
            enabled: draft.enabled,
            conditions: draft.conditions,
            webhook_url: draft.webhook_url,
          }),
        });
        const j = await r.json();
        if (r.ok && j.rule) {
          setSavedRule(j.rule);
          onChange(j.rule);
        }
      } catch {
        // swallow; user can retry by editing again
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [draft, savedRule, onChange]);

  // Preview on conditions change. setState-in-effect is the canonical
  // pattern for async fetch keyed off props; rule is overly strict here.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    let cancelled = false;
    setPreviewLoading(true);
    fetch("/api/alerts/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conditions: draft.conditions }),
    })
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled) setPreview(j);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(draft.conditions)]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function patchCondition<K extends keyof AlertCondition>(
    key: K,
    value: AlertCondition[K] | undefined,
  ) {
    setDraft((d) => {
      const next: AlertCondition = { ...d.conditions };
      if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
        delete next[key];
      } else {
        next[key] = value;
      }
      return { ...d, conditions: next };
    });
  }

  return (
    <div className="rounded-[10px] border border-border bg-surface">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <input
          value={draft.name}
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          className="flex-1 rounded-md border border-transparent bg-transparent text-[14px] font-semibold text-fg outline-none focus:border-border-hi focus:bg-surface-2 focus:px-2 focus:py-1"
        />
        <Toggle
          on={draft.enabled}
          onChange={(v) => setDraft((d) => ({ ...d, enabled: v }))}
        />
        <button
          type="button"
          onClick={onDelete}
          className="rounded-md border border-border bg-surface-2 px-2.5 py-1.5 text-[11.5px] text-fg-dim hover:border-red hover:text-red"
        >
          Delete
        </button>
      </div>

      <div className="grid gap-3 px-4 py-3.5" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
        <Field label="Min score (0–6)">
          <input
            type="number"
            step="0.25"
            min="0"
            max="6"
            value={draft.conditions.min_score ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              patchCondition("min_score", v === "" ? undefined : parseFloat(v));
            }}
            placeholder="any"
            className="w-full rounded-md border border-border bg-surface-2 px-2.5 py-1.5 font-mono text-[12px] text-fg outline-none focus:border-border-hi"
          />
        </Field>
        <Field label="Min notional ($)">
          <input
            type="number"
            step="50000"
            min="0"
            value={draft.conditions.min_notional ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              patchCondition("min_notional", v === "" ? undefined : parseFloat(v));
            }}
            placeholder="any"
            className="w-full rounded-md border border-border bg-surface-2 px-2.5 py-1.5 font-mono text-[12px] text-fg outline-none focus:border-border-hi"
          />
        </Field>
        <Field label="Categories (comma-separated)">
          <input
            type="text"
            value={(draft.conditions.categories ?? []).join(", ")}
            onChange={(e) =>
              patchCondition(
                "categories",
                e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
            placeholder="any"
            className="w-full rounded-md border border-border bg-surface-2 px-2.5 py-1.5 text-[12px] text-fg outline-none focus:border-border-hi"
          />
        </Field>
        <Field label="Wallets (one per line)">
          <textarea
            value={(draft.conditions.wallets ?? []).join("\n")}
            onChange={(e) =>
              patchCondition(
                "wallets",
                e.target.value
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
            placeholder="any"
            rows={2}
            className="w-full resize-y rounded-md border border-border bg-surface-2 px-2.5 py-1.5 font-mono text-[11.5px] text-fg outline-none focus:border-border-hi"
          />
        </Field>
        <Field label="Markets (condition_id per line)">
          <textarea
            value={(draft.conditions.markets ?? []).join("\n")}
            onChange={(e) =>
              patchCondition(
                "markets",
                e.target.value
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
            placeholder="any"
            rows={2}
            className="w-full resize-y rounded-md border border-border bg-surface-2 px-2.5 py-1.5 font-mono text-[11.5px] text-fg outline-none focus:border-border-hi"
          />
        </Field>
        <Field label="Counter-trend only">
          <label className="flex items-center gap-2 text-[12.5px] text-fg-dim">
            <input
              type="checkbox"
              checked={!!draft.conditions.counter_trend_only}
              onChange={(e) =>
                patchCondition(
                  "counter_trend_only",
                  e.target.checked ? true : undefined,
                )
              }
              className="h-4 w-4 accent-[var(--green)]"
            />
            Only fire on counter-trend trades
          </label>
        </Field>
        <Field label="Discord webhook URL (overrides default)">
          <input
            type="text"
            value={draft.webhook_url ?? ""}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                webhook_url: e.target.value || null,
              }))
            }
            placeholder="leave blank to use DISCORD_WEBHOOK_URL fallback"
            className="w-full rounded-md border border-border bg-surface-2 px-2.5 py-1.5 font-mono text-[11.5px] text-fg outline-none focus:border-border-hi"
          />
        </Field>
      </div>

      <div className="border-t border-border bg-surface-2 px-4 py-3">
        <div className="font-mono text-[10px] tracking-[0.1em] text-fg-faint uppercase">
          Preview · last 24h
        </div>
        <div className="mt-1 text-[12.5px] text-fg-dim">
          {previewLoading ? (
            "Computing…"
          ) : preview ? (
            <>
              <span className="font-mono font-semibold text-fg">
                {preview.matches_24h}
              </span>{" "}
              {preview.matches_24h === 1 ? "trade" : "trades"} would have fired in
              the last 24h.
            </>
          ) : (
            "—"
          )}
        </div>
        {preview && preview.sample.length > 0 && (
          <ul className="mt-2 flex flex-col gap-1">
            {preview.sample.map((t) => (
              <li
                key={t.id}
                className="grid items-center gap-2 text-[11.5px]"
                style={{ gridTemplateColumns: "55px 1fr 70px" }}
              >
                <span className={t.side === "BUY" ? "text-green" : "text-red"}>
                  {t.side}
                </span>
                <span className="overflow-hidden whitespace-nowrap text-ellipsis text-fg">
                  {t.market.title}
                </span>
                <span className="text-right font-mono font-semibold">
                  {fmt.usd(t.notional, { compact: true })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="relative h-5 w-9 flex-none rounded-full transition-colors"
      style={{ background: on ? "var(--green)" : "var(--surface-2)", border: on ? "none" : "1px solid var(--border)" }}
    >
      <span
        className="absolute top-0.5 h-4 w-4 rounded-full bg-bg transition-transform"
        style={{
          left: 2,
          transform: on ? "translateX(16px)" : "translateX(0)",
        }}
      />
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[10px] tracking-[0.08em] text-fg-faint uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}
