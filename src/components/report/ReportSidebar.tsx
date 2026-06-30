"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const SUBMISSION_SECTIONS = [
  { id: "section-01", label: "01 Executive Summary" },
  { id: "section-02", label: "02 Service Overview" },
  { id: "section-03", label: "03 Delivery Status" },
  { id: "section-04", label: "04 Health Rating" },
  { id: "section-05", label: "05 Key Achievements" },
  { id: "section-06", label: "06 Delivery Summary" },
  { id: "section-07", label: "07 Service Metrics" },
  { id: "section-08", label: "08 Support & Incidents" },
  { id: "section-09", label: "09 Quality & Health" },
  { id: "section-10", label: "10 Risks & Dependencies" },
  { id: "section-11", label: "11 Customer Feedback" },
];

const AI_SECTIONS = [
  { id: "section-12", label: "12 Value Delivered" },
  { id: "section-13", label: "13 Cross-Analysis Summary" },
  { id: "section-14", label: "14 Lessons Learned" },
  { id: "section-15", label: "15 Next Quarter Focus" },
  { id: "section-16", label: "16 Management Attention" },
  { id: "section-17", label: "17 Closing Note" },
];

const ALL_SECTIONS = [...SUBMISSION_SECTIONS, ...AI_SECTIONS];

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

export function ReportSidebar() {
  const [activeId, setActiveId] = useState<string>(SUBMISSION_SECTIONS[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    );

    ALL_SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <aside className="sticky top-24 w-64 shrink-0 self-start px-4 py-6">
      <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
        From Submission
      </p>
      {SUBMISSION_SECTIONS.map(({ id, label }) => (
        <SidebarLink key={id} id={id} label={label} active={activeId === id} />
      ))}

      <p className="mb-2 mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
        AI Synthesised
      </p>
      {AI_SECTIONS.map(({ id, label }) => (
        <SidebarLink key={id} id={id} label={label} active={activeId === id} />
      ))}
    </aside>
  );
}
