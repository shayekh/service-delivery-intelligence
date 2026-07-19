"use client";

import { useState, useRef, useEffect } from "react";
import { Coins, X } from "lucide-react";
import type { TokenUsage } from "@/types";

function fmt(n: number | undefined) {
  if (n == null) return "—";
  return n.toLocaleString();
}

export function TokenCostButton({
  tokenUsage,
  costUsd,
}: {
  tokenUsage: TokenUsage | null;
  costUsd: number | null;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!tokenUsage && costUsd == null) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50"
        title="Token usage & cost"
      >
        <Coins className="h-4 w-4 text-slate-400" />
        Report Cost
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">AI Token Usage</p>
            <button onClick={() => setOpen(false)} className="text-slate-300 hover:text-slate-500">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            <Row label="Input tokens" value={fmt(tokenUsage?.input_tokens)} />
            <Row label="Output tokens" value={fmt(tokenUsage?.output_tokens)} />
            <Row label="Total tokens" value={fmt(tokenUsage?.total_tokens)} bold />
            {(tokenUsage?.cache_read_input_tokens ?? 0) > 0 && (
              <Row label="Cache read" value={fmt(tokenUsage?.cache_read_input_tokens)} muted />
            )}
            {(tokenUsage?.cache_creation_input_tokens ?? 0) > 0 && (
              <Row label="Cache write" value={fmt(tokenUsage?.cache_creation_input_tokens)} muted />
            )}
          </div>

          <div className="mt-3 border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">Cost (USD)</span>
              <span className="text-sm font-bold text-slate-800">
                {costUsd != null ? `$${costUsd.toFixed(4)}` : "—"}
              </span>
            </div>
            {tokenUsage?.model && (
              <p className="mt-1.5 text-[11px] text-slate-400">{tokenUsage.model}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  muted,
}: {
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${muted ? "text-slate-400" : "text-slate-600"}`}>{label}</span>
      <span className={`text-sm ${bold ? "font-semibold text-slate-800" : muted ? "text-slate-400" : "text-slate-700"}`}>
        {value}
      </span>
    </div>
  );
}
