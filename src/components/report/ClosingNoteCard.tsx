import { SectionCard, NA } from "@/components/report/SectionCard";
import type { AnalysisJson } from "@/types";

export function ClosingNoteCard({
  data,
}: {
  data: AnalysisJson["ai_generated"]["s16_closing_note"] | undefined;
}) {
  return (
    <SectionCard id="section-18" number="18" title="Closing Note" tag="ai">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
        {data ? (
          <p className="italic leading-relaxed text-slate-700">&ldquo;{data}&rdquo;</p>
        ) : (
          <NA />
        )}
      </div>
    </SectionCard>
  );
}
