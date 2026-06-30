import { SectionCard, NA } from "@/components/report/SectionCard";
import type { AnalysisJson } from "@/types";

export function ExecutiveSummary({ data }: { data: AnalysisJson["section_synthesis"]["s1_executive_summary"] | undefined }) {
  if (!data) return (
    <SectionCard id="section-01" number="01" title="Executive Summary" tag="submission">
      <NA />
    </SectionCard>
  );

  const parts = [
    data.delivery_focus,
    data.highlights,
    data.areas_requiring_attention,
    data.next_quarter_preview,
  ].filter(Boolean);

  const prose = parts.join(" ");

  return (
    <SectionCard id="section-01" number="01" title="Executive Summary" tag="submission">
      <p className="leading-relaxed text-slate-700">{prose || <NA />}</p>
    </SectionCard>
  );
}
