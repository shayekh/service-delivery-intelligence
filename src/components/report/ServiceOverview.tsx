import { SectionCard, NA } from "@/components/report/SectionCard";
import type { AnalysisJson } from "@/types";

type Data = AnalysisJson["section_synthesis"]["s2_service_overview"] | undefined;

const FIELDS: { key: keyof NonNullable<Data>; label: string }[] = [
  { key: "active_services", label: "Active Services" },
  { key: "delivery_model", label: "Delivery Model" },
  { key: "key_stakeholders", label: "Key Stakeholders" },
  { key: "team_composition", label: "Team Composition" },
  { key: "reporting_cadence", label: "Reporting Cadence" },
];

export function ServiceOverview({ data }: { data: Data }) {
  return (
    <SectionCard id="section-02" number="02" title="Service Overview" tag="submission">
      <dl className="space-y-3">
        {FIELDS.map(({ key, label }) => (
          <div key={key} className="flex gap-4">
            <dt className="w-40 shrink-0 text-sm text-slate-500">{label}</dt>
            <dd className="text-sm text-slate-800">
              {data?.[key] ? String(data[key]) : <NA />}
            </dd>
          </div>
        ))}
      </dl>
    </SectionCard>
  );
}
