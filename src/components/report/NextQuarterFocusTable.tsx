import { SectionCard, NA } from "@/components/report/SectionCard";
import type { AnalysisJson } from "@/types";

export function NextQuarterFocusTable({
  data,
}: {
  data: AnalysisJson["ai_generated"]["s12_next_quarter_focus"] | undefined;
}) {
  return (
    <SectionCard id="section-15" number="15" title="Next Quarter Focus" tag="ai">
      {!data?.length ? (
        <NA />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
              <th className="pb-2 text-left font-medium">Focus Area</th>
              <th className="pb-2 text-left font-medium">Expected Outcome</th>
              <th className="pb-2 text-left font-medium">Owner</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, i) => (
              <tr key={i}>
                <td className="py-2 pr-4 font-medium text-slate-800">{row.focus_area}</td>
                <td className="py-2 pr-4 text-slate-600">{row.expected_outcome}</td>
                <td className="py-2 text-slate-500">{row.owner}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </SectionCard>
  );
}
