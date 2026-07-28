"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface AnswersSidebarSection {
  id: string;
  label: string;
}

function SidebarLink({
  id,
  label,
  active,
}: {
  id: string;
  label: string;
  active: boolean;
}) {
  function scrollTo() {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <button
      type="button"
      data-sidebar-item={id}
      onClick={scrollTo}
      className={cn(
        "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
        active
          ? "border-l-2 border-blue-600 bg-blue-50 font-medium text-blue-600"
          : "text-slate-600 hover:bg-slate-50"
      )}
    >
      {label}
    </button>
  );
}

export function AnswersSidebar({ sections }: { sections: AnswersSidebarSection[] }) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? "");
  const asideRef = useRef<HTMLElement>(null);

  // Scroll-position based active section: pick the last section whose top has
  // crossed a fixed threshold line near the top of the viewport. An
  // IntersectionObserver band (e.g. 20%-40% of viewport) misidentifies short
  // trailing sections near the bottom of the page, since there's no longer
  // enough room left to scroll for them to ever enter that band.
  useEffect(() => {
    const THRESHOLD = 120; // px from top of viewport, clears the sticky header

    function updateActive() {
      const scrolledToBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (scrolledToBottom) {
        const lastId = sections[sections.length - 1]?.id;
        if (lastId) setActiveId(lastId);
        return;
      }

      let current = sections[0]?.id;
      for (const { id } of sections) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= THRESHOLD) {
          current = id;
        } else {
          break;
        }
      }
      if (current) setActiveId(current);
    }

    updateActive();
    window.addEventListener("scroll", updateActive, { passive: true });
    window.addEventListener("resize", updateActive);
    return () => {
      window.removeEventListener("scroll", updateActive);
      window.removeEventListener("resize", updateActive);
    };
  }, [sections]);

  useEffect(() => {
    if (!asideRef.current) return;
    const btn = asideRef.current.querySelector<HTMLElement>(
      `[data-sidebar-item="${activeId}"]`
    );
    btn?.scrollIntoView({ block: "nearest" });
  }, [activeId]);

  return (
    <aside
      ref={asideRef}
      className="sticky top-6 hidden max-h-[calc(100vh-3rem)] w-64 shrink-0 self-start overflow-y-auto px-4 py-6 lg:block"
    >
      <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Sections
      </p>
      {sections.map(({ id, label }, i) => (
        <SidebarLink key={id} id={id} label={`${i + 1}. ${label}`} active={activeId === id} />
      ))}
    </aside>
  );
}
