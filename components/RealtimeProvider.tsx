"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { browserClient } from "@/lib/supabase";
import { rowToTrade } from "@/lib/mappers";
import type { Trade, TradeRow } from "@/lib/types";
import type { RealtimeStatus } from "@/lib/realtime";

type TradeListener = (t: Trade) => void;

interface RealtimeContextValue {
  status: RealtimeStatus;
  /** Subscribe to scored trade events. Returns an unsubscribe fn. */
  onTrade: (cb: TradeListener) => () => void;
}

const Ctx = createContext<RealtimeContextValue | null>(null);

export function useRealtime(): RealtimeContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useRealtime must be used inside <RealtimeProvider>");
  return v;
}

// One Supabase channel for the whole app. Subscribes to every change on the
// trades table, forwards rows that already have a non-null score (so we
// effectively react to the score UPDATE step in ingest.py rather than the
// initial INSERT, which has score=null until score_window runs).
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<RealtimeStatus>("connecting");
  const listeners = useRef<Set<TradeListener>>(new Set());

  const onTrade = useCallback<RealtimeContextValue["onTrade"]>((cb) => {
    listeners.current.add(cb);
    return () => {
      listeners.current.delete(cb);
    };
  }, []);

  useEffect(() => {
    const sb = browserClient();
    const channel = sb
      .channel("trades-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trades" },
        (payload) => {
          const row = (payload.new ?? null) as TradeRow | null;
          if (!row || row.score == null) return;
          const trade = rowToTrade(row);
          listeners.current.forEach((cb) => cb(trade));
        },
      )
      .subscribe((s) => {
        if (s === "SUBSCRIBED") setStatus("connected");
        else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT" || s === "CLOSED")
          setStatus("error");
        else setStatus("connecting");
      });

    return () => {
      sb.removeChannel(channel);
    };
  }, []);

  return <Ctx.Provider value={{ status, onTrade }}>{children}</Ctx.Provider>;
}
