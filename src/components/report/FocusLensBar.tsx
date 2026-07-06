"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { getFocusLensItems, getAvailableLenses } from "@/lib/focusLens";
import { FocusLensStepper } from "@/components/report/FocusLensStepper";
import type { AnalysisJson } from "@/types";

export function FocusLensBar({ analysis }: { analysis: AnalysisJson }) {
  const [activeLens, setActiveLens] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const allItems = useMemo(() => getFocusLensItems(analysis), [analysis]);
  const lenses = useMemo(() => getAvailableLenses(allItems), [allItems]);
  const filteredItems = useMemo(
    () => (activeLens ? allItems.filter((item) => item.lenses.includes(activeLens)) : []),
    [allItems, activeLens]
  );

  const currentItem = filteredItems[currentIndex] ?? null;
  const activeLensLabel = lenses.find((l) => l.key === activeLens)?.label ?? "";

  function enterLens(key: string) {
    setActiveLens(key);
    setCurrentIndex(0);
  }

  function exitLens() {
    setActiveLens(null);
    setCurrentIndex(0);
  }

  function goNext() {
    setCurrentIndex((i) => Math.min(i + 1, filteredItems.length - 1));
  }

  function goPrev() {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }

  return (
    <>
      <div className="border-b border-slate-200 bg-white px-8 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Focus lens
          </span>

          <button
            type="button"
            onClick={exitLens}
            className={cn(
              "rounded-full px-3 py-1 text-sm font-medium transition-colors",
              activeLens === null
                ? "bg-slate-800 text-white"
                : "text-slate-500 hover:bg-slate-100"
            )}
          >
            All
          </button>

          {lenses.map((lens) => (
            <button
              key={lens.key}
              type="button"
              onClick={() => enterLens(lens.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors",
                activeLens === lens.key
                  ? "bg-slate-800 text-white"
                  : "text-slate-500 hover:bg-slate-100"
              )}
            >
              {lens.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-xs tabular-nums",
                  activeLens === lens.key
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-500"
                )}
              >
                {lens.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {activeLens && currentItem && (
        <FocusLensStepper
          lensLabel={activeLensLabel}
          currentIndex={currentIndex}
          total={filteredItems.length}
          currentItem={currentItem}
          onPrev={goPrev}
          onNext={goNext}
          onExit={exitLens}
        />
      )}
    </>
  );
}
