import { SectionCard, NA } from "@/components/report/SectionCard";
import { cn } from "@/lib/utils";
import { RELATIONSHIP_TAG } from "@/lib/tagColors";
import type { AnalysisJson } from "@/types";

type ItsmEntry = AnalysisJson["ai_generated"]["s15_itsm_maturity"][number];

function ItsmEntry({ entry, index }: { entry: ItsmEntry; index: number }) {
  const tag = RELATIONSHIP_TAG[entry.relationship] ?? {
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-l-slate-300",
    label: entry.relationship,
  };

  return (
    <div
      data-focus-item-id={`itsm-${index}`}
      style={{ scrollMarginTop: "calc(var(--report-header-height, 0px) + var(--focus-lens-bar-height, 0px))" }}
      className="border-b border-slate-100 py-4 last:border-0"
    >
      <div className="mb-2 flex items-center gap-2">
        <span className={cn("rounded px-2 py-0.5 text-xs font-bold uppercase", tag.bg, tag.text)}>
          {tag.label}
        </span>
        <span className="text-sm font-semibold text-slate-700">{entry.topic}</span>
      </div>
      <p className="text-sm leading-relaxed text-slate-600">{entry.finding}</p>
    </div>
  );
}

export function ItsmMaturitySection({
  data,
}: {
  data: AnalysisJson["ai_generated"]["s15_itsm_maturity"] | undefined;
}) {
  return (
    <SectionCard id="section-16" number="16" title="ITSM Maturity Summary" tag="ai">
      {!data || data.length === 0 ? (
        <NA />
      ) : (
        <div className="divide-y divide-slate-100">
          {data.map((entry, i) => (
            <ItsmEntry key={i} entry={entry} index={i} />
          ))}
        </div>
      )}
    </SectionCard>
  );
}
