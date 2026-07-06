import { SectionCard, NA } from "@/components/report/SectionCard";
import { cn } from "@/lib/utils";
import type { AnalysisJson } from "@/types";

const URGENCY_BORDER: Record<string, string> = {
  High: "border-l-red-500",
  Medium: "border-l-amber-500",
  Low: "border-l-green-500",
};

const URGENCY_TAG: Record<string, string> = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-green-100 text-green-700",
};

export function ManagementAttentionCards({
  data,
}: {
  data: AnalysisJson["ai_generated"]["s13_management_attention"] | undefined;
}) {
  return (
    <SectionCard id="section-17" number="17" title="Management Attention" tag="ai">
      {!data?.length ? (
        <NA />
      ) : (
        <div className="space-y-3">
          {data.map((item, i) => (
            <div
              key={i}
              data-focus-item-id={`attn-${i}`}
              style={{ scrollMarginTop: "var(--report-header-height, 0px)" }}
              className={cn(
                "rounded-lg border border-slate-200 bg-white p-4 border-l-4",
                URGENCY_BORDER[item.urgency]
              )}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="font-semibold text-slate-800">{item.item}</p>
                <span
                  className={cn(
                    "shrink-0 rounded px-2 py-0.5 text-xs font-bold uppercase",
                    URGENCY_TAG[item.urgency]
                  )}
                >
                  {item.urgency}
                </span>
              </div>
              <p className="text-sm text-slate-600">{item.explanation}</p>
              <p className="mt-2 text-xs text-slate-400">
                {item.type} · Source: {item.source}
              </p>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
