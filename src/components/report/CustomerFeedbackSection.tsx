import { SectionCard, NA } from "@/components/report/SectionCard";
import { cn } from "@/lib/utils";
import type { AnalysisJson, StatusColor } from "@/types";

const FIELDS: { key: keyof AnalysisJson["section_synthesis"]["s9_customer_feedback"]; label: string }[] = [
  { key: "satisfaction", label: "Satisfaction" },
  { key: "communication", label: "Communication" },
  { key: "responsiveness", label: "Responsiveness" },
  { key: "business_alignment", label: "Business Alignment" },
  { key: "areas_of_concern", label: "Areas of Concern" },
];

const HEALTH_BADGE: Record<StatusColor, string> = {
  Green: "bg-green-100 text-green-700",
  Amber: "bg-amber-100 text-amber-700",
  Red: "bg-red-100 text-red-700",
};

export function CustomerFeedbackSection({
  data,
}: {
  data: AnalysisJson["section_synthesis"]["s9_customer_feedback"] | undefined;
}) {
  return (
    <SectionCard id="section-11" number="11" title="Customer Feedback" tag="submission">
      {!data ? (
        <NA />
      ) : (
        <div>
          <dl className="space-y-3">
            {FIELDS.map(({ key, label }) => {
              const val = key !== "relationship_health" ? data[key] : null;
              return (
                <div key={key} className="flex gap-4">
                  <dt className="w-44 shrink-0 text-sm text-slate-500">{label}</dt>
                  <dd className="text-sm text-slate-800">
                    {val ? String(val) : <NA />}
                  </dd>
                </div>
              );
            })}
          </dl>
          {data.relationship_health && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-slate-500">Relationship Health</span>
              <span
                className={cn(
                  "rounded px-2 py-0.5 text-xs font-medium",
                  HEALTH_BADGE[data.relationship_health]
                )}
              >
                {data.relationship_health}
              </span>
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
}
