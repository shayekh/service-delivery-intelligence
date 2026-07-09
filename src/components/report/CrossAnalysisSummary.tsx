import { SectionCard, NA } from "@/components/report/SectionCard";
import { cn } from "@/lib/utils";
import { RELATIONSHIP_TAG } from "@/lib/tagColors";
import type { AnalysisJson } from "@/types";

export function CrossAnalysisSummary({
  data,
}: {
  data: AnalysisJson["ai_generated"]["s10_cross_analysis"] | undefined;
}) {
  return (
    <SectionCard id="section-13" number="13" title="Cross-Analysis Summary" tag="ai">
      {!data?.length ? (
        <NA />
      ) : (
        <div className="space-y-3">
          {data.map((entry, i) => {
            const styles = RELATIONSHIP_TAG[entry.relationship] ?? {
              bg: "bg-slate-100",
              text: "text-slate-600",
              border: "border-l-slate-300",
              label: entry.relationship,
            };
            return (
              <div
                key={i}
                data-focus-item-id={`ca-${i}`}
                style={{ scrollMarginTop: "calc(var(--report-header-height, 0px) + var(--focus-lens-bar-height, 0px))" }}
                className={cn("border-l-4 pl-4 py-2", styles.border)}
              >
                <div className="mb-1 flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded px-2 py-0.5 text-xs font-bold uppercase",
                      styles.bg,
                      styles.text
                    )}
                  >
                    {entry.relationship.replace("_", " ")}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    {entry.topic}
                  </span>
                </div>
                <p className="text-sm text-slate-700">{entry.finding}</p>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
