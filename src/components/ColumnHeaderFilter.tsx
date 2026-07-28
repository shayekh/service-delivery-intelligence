"use client";

import {
  useState,
  useEffect,
  useRef,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { Check, Filter, Search } from "lucide-react";

export interface FilterOption {
  value: string;
  label: string;
}

function ColumnFilterPopover({
  options,
  selected,
  onApply,
  onClose,
  anchorRect,
  popoverRef,
}: {
  options: FilterOption[];
  selected: string[];
  onApply: (values: string[]) => void;
  onClose: () => void;
  anchorRect: { top: number; left: number };
  popoverRef: RefObject<HTMLDivElement>;
}) {
  const [draft, setDraft] = useState<string[]>(selected);
  const [query, setQuery] = useState("");

  const q = query.toLowerCase().trim();
  const visibleOptions = options.filter(
    (opt) => draft.includes(opt.value) || opt.label.toLowerCase().includes(q)
  );
  const allVisibleSelected =
    visibleOptions.length > 0 && visibleOptions.every((opt) => draft.includes(opt.value));

  function toggleValue(value: string) {
    setDraft((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  function toggleSelectAll() {
    if (allVisibleSelected) {
      const visibleValues = new Set(visibleOptions.map((o) => o.value));
      setDraft((prev) => prev.filter((v) => !visibleValues.has(v)));
    } else {
      setDraft((prev) => [
        ...prev,
        ...visibleOptions.map((o) => o.value).filter((v) => !prev.includes(v)),
      ]);
    }
  }

  return createPortal(
    <div
      ref={popoverRef}
      style={{ position: "fixed", top: anchorRect.top, left: anchorRect.left }}
      className="z-50 w-64 rounded-lg border border-slate-200 bg-white p-3 text-left normal-case tracking-normal shadow-lg"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="relative mb-2">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search values…"
          className="w-full rounded-md border border-slate-200 py-1.5 pl-8 pr-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="h-56 overflow-y-auto">
        <label className="flex cursor-pointer items-center gap-2 border-b border-slate-100 py-1.5 text-sm font-medium text-slate-800">
          <span
            onClick={toggleSelectAll}
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
              allVisibleSelected ? "border-blue-600 bg-blue-600" : "border-slate-300 bg-white"
            }`}
          >
            {allVisibleSelected && <Check className="h-3 w-3 text-white" />}
          </span>
          (Select all)
        </label>
        {visibleOptions.map((opt) => {
          const checked = draft.includes(opt.value);
          return (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-2 py-1 text-sm text-slate-700"
            >
              <span
                onClick={() => toggleValue(opt.value)}
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                  checked ? "border-blue-600 bg-blue-600" : "border-slate-300 bg-white"
                }`}
              >
                {checked && <Check className="h-3 w-3 text-white" />}
              </span>
              <span className="truncate">{opt.label}</span>
            </label>
          );
        })}
        {visibleOptions.length === 0 && (
          <p className="py-2 text-sm text-slate-400">No matches.</p>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={() => {
            onApply([]);
            onClose();
          }}
          className="text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={() => {
            onApply(draft);
            onClose();
          }}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Apply
        </button>
      </div>
    </div>,
    document.body
  );
}

export function ColumnHeaderFilter({
  columnKey,
  label,
  options,
  selected,
  onApply,
  openColumn,
  setOpenColumn,
  extra,
}: {
  columnKey: string;
  label: string;
  options: FilterOption[];
  selected: string[];
  onApply: (values: string[]) => void;
  openColumn: string | null;
  setOpenColumn: (v: string | null) => void;
  extra?: ReactNode;
}) {
  const isOpen = openColumn === columnKey;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [anchorRect, setAnchorRect] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleOutsideClick(e: MouseEvent) {
      const target = e.target as Node;
      if (popoverRef.current?.contains(target)) return;
      if (buttonRef.current?.contains(target)) return;
      setOpenColumn(null);
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen, setOpenColumn]);

  function handleToggle(e: ReactMouseEvent) {
    e.stopPropagation();
    if (isOpen) {
      setOpenColumn(null);
      return;
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const POPOVER_WIDTH = 256;
    const MARGIN = 8;
    const left = Math.min(
      Math.max(rect.right - POPOVER_WIDTH, MARGIN),
      window.innerWidth - POPOVER_WIDTH - MARGIN
    );
    setAnchorRect({ top: rect.bottom + 4, left });
    setOpenColumn(columnKey);
  }

  return (
    <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
      <div className="flex items-center gap-1.5">
        {extra ?? <span className="whitespace-nowrap">{label}</span>}
        <button
          ref={buttonRef}
          type="button"
          onClick={handleToggle}
          className={`rounded p-0.5 ${
            selected.length > 0 ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
          }`}
          aria-label={`Filter ${label}`}
        >
          <Filter className="h-3.5 w-3.5" />
        </button>
      </div>
      {isOpen && anchorRect && (
        <ColumnFilterPopover
          options={options}
          selected={selected}
          onApply={onApply}
          onClose={() => setOpenColumn(null)}
          anchorRect={anchorRect}
          popoverRef={popoverRef}
        />
      )}
    </th>
  );
}
