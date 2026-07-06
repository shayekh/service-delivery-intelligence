import { SectionCard, NA } from "@/components/report/SectionCard";
import { cn } from "@/lib/utils";
import type { AnalysisJson, CrossAnalysisRelationship } from "@/types";

const TAG_STYLES: Record<CrossAnalysisRelationship, { border: string; tag: string }> = {
  AGREE: {
    border: "border-l-green-500",
    tag: "bg-green-100 text-green-700",
  },
  DISAGREE: {
    border: "border-l-red-500",
    tag: "bg-red-100 text-red-700",
  },
  COMPLEMENT: {
    border: "border-l-blue-500",
    tag: "bg-blue-100 text-blue-700",
  },
  BLIND_SPOT: {
    border: "border-l-amber-500",
    tag: "bg-amber-100 text-amber-700",
  },
};

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
            const styles = TAG_STYLES[entry.relationship];
            return (
              <div
                key={i}
                data-focus-item-id={`ca-${i}`}
                style={{ scrollMarginTop: "var(--report-header-height, 0px)" }}
                className={cn(
                  "border-l-4 pl-4 py-2",
                  styles.border
                )}
              >
                <div className="mb-1 flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded px-2 py-0.5 text-xs font-bold uppercase",
                      styles.tag
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
