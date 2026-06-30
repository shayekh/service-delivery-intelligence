import { SectionCard, NA } from "@/components/report/SectionCard";
import { cn } from "@/lib/utils";
import type { AnalysisJson, StatusColor } from "@/types";

const STATUS_BADGE: Record<StatusColor, string> = {
  Green: "bg-green-100 text-green-700",
  Amber: "bg-amber-100 text-amber-700",
  Red: "bg-red-100 text-red-700",
};

export function DeliverySummaryTable({
  data,
}: {
  data: AnalysisJson["section_synthesis"]["s4_delivery_summary"] | undefined;
}) {
  return (
    <SectionCard id="section-06" number="06" title="Delivery Summary" tag="submission">
      {!data?.length ? (
        <NA />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
              <th className="pb-2 text-left font-medium">Workstream</th>
              <th className="pb-2 text-left font-medium">Status</th>
              <th className="pb-2 text-left font-medium">Summary</th>
              <th className="pb-2 text-left font-medium">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, i) => (
              <tr key={i}>
                <td className="py-2 pr-4 font-medium text-slate-800">{row.workstream}</td>
                <td className="py-2 pr-4">
                  <span className={cn("rounded px-2 py-0.5 text-xs font-medium", STATUS_BADGE[row.status])}>
                    {row.status}
                  </span>
                </td>
                <td className="py-2 pr-4 text-slate-600">{row.summary}</td>
                <td className="py-2 text-slate-500">{row.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </SectionCard>
  );
}
