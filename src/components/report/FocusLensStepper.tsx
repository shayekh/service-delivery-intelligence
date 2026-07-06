"use client";

import { useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { FocusLensItem } from "@/lib/focusLens";

interface Props {
  lensLabel: string;
  currentIndex: number;
  total: number;
  currentItem: FocusLensItem;
  onPrev: () => void;
  onNext: () => void;
  onExit: () => void;
}

export function FocusLensStepper({
  lensLabel,
  currentIndex,
  total,
  currentItem,
  onPrev,
  onNext,
  onExit,
}: Props) {
  useEffect(() => {
    const el = document.querySelector(
      `[data-focus-item-id="${currentItem.id}"]`
    ) as HTMLElement | null;
    if (!el) return;

    // Scroll the item into view — scroll-margin-top on the element handles header offset
    el.scrollIntoView({ behavior: "smooth" });

    // Flash highlight — restart animation cleanly
    el.classList.remove("focus-lens-active");
    void el.offsetWidth; // force reflow to restart animation
    el.classList.add("focus-lens-active");

    const timer = setTimeout(() => el.classList.remove("focus-lens-active"), 2100);
    return () => {
      clearTimeout(timer);
      el.classList.remove("focus-lens-active");
    };
  }, [currentItem.id]);

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <button
        type="button"
        onClick={onPrev}
        disabled={currentIndex === 0}
        aria-label="Previous item"
        className="rounded-full p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <span className="px-2 text-sm font-medium text-slate-700 whitespace-nowrap">
        {lensLabel} · {currentIndex + 1} of {total}
      </span>

      <button
        type="button"
        onClick={onNext}
        disabled={currentIndex === total - 1}
        aria-label="Next item"
        className="rounded-full p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      <div className="mx-1 h-4 w-px bg-slate-200" />

      <button
        type="button"
        onClick={onExit}
        aria-label="Exit focus lens"
        className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
