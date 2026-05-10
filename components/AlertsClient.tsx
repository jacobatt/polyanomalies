"use client";

import { useState } from "react";
import type { AlertRule } from "@/lib/types";
import { AlertRuleCard } from "@/components/AlertRuleCard";

export function AlertsClient({ initialRules }: { initialRules: AlertRule[] }) {
  const [rules, setRules] = useState<AlertRule[]>(initialRules);
  const [creating, setCreating] = useState(false);

  async function newRule() {
    setCreating(true);
    try {
      const r = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "New rule",
          enabled: true,
          conditions: { min_score: 4 },
        }),
      });
      const j = await r.json();
      if (r.ok && j.rule) setRules((prev) => [j.rule, ...prev]);
    } finally {
      setCreating(false);
    }
  }

  async function deleteRule(id: string) {
    setRules((prev) => prev.filter((r) => r.id !== id));
    await fetch(`/api/alerts/${id}`, { method: "DELETE" });
  }

  function patchLocal(updated: AlertRule) {
    setRules((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }

  return (
    <>
      <div className="flex items-center justify-between border-b border-border px-[18px] py-3">
        <h1 className="text-[18px] font-semibold tracking-[-0.01em]">Alert rules</h1>
        <button
          type="button"
          onClick={newRule}
          disabled={creating}
          className="rounded-md bg-green px-3 py-1.5 text-[12px] font-semibold text-[#062a13] transition-opacity disabled:opacity-50"
        >
          + New rule
        </button>
      </div>
      <div className="flex flex-col gap-3 px-[18px] py-3.5">
        {rules.length === 0 ? (
          <div className="rounded-[10px] border border-border bg-surface px-4 py-8 text-center text-fg-dim">
            No alert rules yet. Click <span className="font-semibold text-fg">+ New rule</span> to start.
          </div>
        ) : (
          rules.map((rule) => (
            <AlertRuleCard
              key={rule.id}
              rule={rule}
              onChange={patchLocal}
              onDelete={() => deleteRule(rule.id)}
            />
          ))
        )}
      </div>
    </>
  );
}
