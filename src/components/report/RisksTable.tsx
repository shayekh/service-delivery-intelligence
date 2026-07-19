import { SectionCard, NA } from "@/components/report/SectionCard";
import { cn } from "@/lib/utils";
import type { AnalysisJson } from "@/types";

const IMPACT_COLOR: Record<string, string> = {
  High: "text-red-600 font-semibold",
  Medium: "text-amber-600 font-semibold",
  Low: "text-green-600 font-semibold",
};

export function RisksTable({
  data,
}: {
  data: AnalysisJson["section_synthesis"]["s8_risks"] | undefined;
}) {
  return (
    <SectionCard id="section-10" number="10" title="Risks & Dependencies" tag="submission">
      {!data?.length ? (
        <NA />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
              <th className="pb-2 text-left font-medium">Type</th>
              <th className="pb-2 text-left font-medium">Description</th>
              <th className="pb-2 text-left font-medium">Impact</th>
              <th className="pb-2 text-left font-medium">Owner</th>
              <th className="pb-2 text-left font-medium">Mitigation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, i) => (
              <tr
                key={i}
                data-focus-item-id={`risk-${i}`}
                style={{ scrollMarginTop: "calc(var(--report-header-height, 0px) + var(--focus-lens-bar-height, 0px))" }}
              >
                <td className="py-3 pr-4">
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {row.type}
                  </span>
                </td>
                <td className="py-3 pr-4 text-slate-700">{row.description}</td>
                <td className={cn("py-3 pr-4", IMPACT_COLOR[row.impact])}>{row.impact}</td>
                <td className="py-3 pr-4 text-slate-600">{row.owner}</td>
                <td className="py-3 text-slate-600">{row.mitigation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </SectionCard>
  );
}
