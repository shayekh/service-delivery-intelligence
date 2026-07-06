import { SectionCard, NA } from "@/components/report/SectionCard";
import type { AnalysisJson, CrossAnalysisRelationship } from "@/types";

const TAG_STYLES: Record<CrossAnalysisRelationship, { bg: string; text: string; label: string }> = {
  AGREE: { bg: "bg-blue-600", text: "text-white", label: "AGREE" },
  DISAGREE: { bg: "bg-red-600", text: "text-white", label: "DISAGREE" },
  COMPLEMENT: { bg: "bg-green-600", text: "text-white", label: "COMPLEMENT" },
  BLIND_SPOT: { bg: "bg-amber-500", text: "text-white", label: "BLIND SPOT" },
};

type ItsmEntry = AnalysisJson["ai_generated"]["s15_itsm_maturity"][number];

function ItsmEntry({ entry, index }: { entry: ItsmEntry; index: number }) {
  const tag = TAG_STYLES[entry.relationship] ?? {
    bg: "bg-slate-400",
    text: "text-white",
    label: entry.relationship,
  };

  return (
    <div
      data-focus-item-id={`itsm-${index}`}
      style={{ scrollMarginTop: "var(--report-header-height, 0px)" }}
      className="border-b border-slate-100 py-4 last:border-0"
    >
      <div className="mb-2 flex items-center gap-2">
        <span
          className={`rounded px-2 py-0.5 text-xs font-bold ${tag.bg} ${tag.text}`}
        >
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
