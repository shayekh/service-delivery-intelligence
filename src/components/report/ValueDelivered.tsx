import { SectionCard, NA } from "@/components/report/SectionCard";
import type { AnalysisJson } from "@/types";

const VALUE_ITEMS = [
  { key: "business_value", label: "Business Value" },
  { key: "operational_value", label: "Operational Value" },
  { key: "technical_value", label: "Technical Value" },
  { key: "strategic_value", label: "Strategic Value" },
] as const;

export function ValueDelivered({
  data,
}: {
  data: AnalysisJson["ai_generated"]["s10_value_delivered"] | undefined;
}) {
  return (
    <SectionCard id="section-12" number="12" title="Value Delivered" tag="ai">
      {data ? (
        <div className="divide-y divide-slate-100">
          {VALUE_ITEMS.map(({ key, label }, i) => (
            <div key={key} className={i === 0 ? "pb-4" : "py-4"}>
              <p className="mb-1.5 text-sm font-semibold text-blue-700">{label}</p>
              <p className="text-sm leading-relaxed text-slate-700">
                {data[key] ?? <NA />}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <NA />
      )}
    </SectionCard>
  );
}
