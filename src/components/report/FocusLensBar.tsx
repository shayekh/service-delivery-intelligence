"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { getFocusLensItems, getAvailableLenses, SECTION_TITLES } from "@/lib/focusLens";
import { LENS_COLORS } from "@/lib/tagColors";
import { FocusLensStepper } from "@/components/report/FocusLensStepper";
import type { AnalysisJson } from "@/types";

export function FocusLensBar({ analysis }: { analysis: AnalysisJson }) {
  const [activeLens, setActiveLens] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);

  const allItems = useMemo(() => getFocusLensItems(analysis), [analysis]);
  const lenses = useMemo(() => getAvailableLenses(allItems), [allItems]);
  const filteredItems = useMemo(
    () => (activeLens ? allItems.filter((item) => item.lenses.includes(activeLens)) : []),
    [allItems, activeLens]
  );

  const currentItem = filteredItems[currentIndex] ?? null;
  const activeLensLabel = lenses.find((l) => l.key === activeLens)?.label ?? "";

  // Write --focus-lens-bar-height so SectionCard scroll-margin-top stays correct
  useEffect(() => {
    function updateHeight() {
      if (barRef.current) {
        const h = barRef.current.getBoundingClientRect().height;
        document.documentElement.style.setProperty("--focus-lens-bar-height", `${h}px`);
      }
    }
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    if (barRef.current) observer.observe(barRef.current);
    return () => {
      observer.disconnect();
      document.documentElement.style.setProperty("--focus-lens-bar-height", "0px");
    };
  }, []);

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
      <div
        ref={barRef}
        className="z-[9] border-b border-slate-200 bg-white px-8 py-3"
        style={{ position: "sticky", top: "var(--report-header-height, 0px)" }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Highlights
          </span>

          {lenses.map((lens) => {
            const colors = LENS_COLORS[lens.key] ?? { bg: "bg-slate-100", text: "text-slate-600" };
            const isActive = activeLens === lens.key;
            return (
              <button
                key={lens.key}
                type="button"
                onClick={() => (isActive ? exitLens() : enterLens(lens.key))}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors",
                  isActive
                    ? cn(colors.bg, colors.text, "font-semibold ring-1 ring-inset ring-current/30")
                    : "text-slate-500 hover:bg-slate-100"
                )}
              >
                {lens.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-xs tabular-nums",
                    isActive ? "bg-white/70 " + colors.text : "bg-slate-100 text-slate-500"
                  )}
                >
                  {lens.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {activeLens && currentItem && (
        <FocusLensStepper
          lensLabel={activeLensLabel}
          sectionLabel={SECTION_TITLES[currentItem.sectionId] ?? ""}
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
