import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

type SectionTag = "submission" | "ai";

export function SectionCard({
  id,
  number,
  title,
  tag,
  children,
}: {
  id: string;
  number: string;
  title: string;
  tag: SectionTag;
  children: ReactNode;
}) {
  return (
    <div id={id} className="rounded-xl border border-slate-200 bg-white p-7" style={{ scrollMarginTop: "calc(var(--report-header-height, 0px) + var(--focus-lens-bar-height, 0px))" }}>
      <div className="mb-5 flex items-center gap-3">
        <h2 className="text-lg font-bold text-slate-800">
          {number} · {title}
        </h2>
        {tag === "ai" ? (
          <span className="flex items-center gap-1 rounded-full bg-purple-50 px-2 py-1 text-xs font-medium text-purple-600">
            <Sparkles className="h-3 w-3" />
            AI synthesised
          </span>
        ) : (
          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">
            From submission
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

export function NA({ label }: { label?: string }) {
  return (
    <span className="italic text-slate-400">{label ?? "Not provided"}</span>
  );
}
