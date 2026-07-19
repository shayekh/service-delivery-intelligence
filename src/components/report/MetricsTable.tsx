import { SectionCard, NA } from "@/components/report/SectionCard";
import { cn } from "@/lib/utils";
import type { AnalysisJson, StatusColor } from "@/types";

const STATUS_BADGE: Record<StatusColor, string> = {
  Green: "bg-green-100 text-green-700",
  Amber: "bg-amber-100 text-amber-700",
  Red: "bg-red-100 text-red-700",
};

export function ReportMetricsTable({
  data,
}: {
  data: AnalysisJson["section_synthesis"]["s5_metrics"] | undefined;
}) {
  return (
    <SectionCard id="section-07" number="07" title="Service Metrics" tag="submission">
      {!data?.length ? (
        <NA />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
              <th className="pb-2 text-left font-medium">Metric</th>
              <th className="pb-2 text-left font-medium">Target</th>
              <th className="pb-2 text-left font-medium">Actual</th>
              <th className="pb-2 text-left font-medium">Status</th>
              <th className="pb-2 text-left font-medium">Comment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, i) => (
              <tr key={i}>
                <td className="py-3 pr-4 font-medium text-slate-800">{row.metric}</td>
                <td className="py-3 pr-4 text-slate-600">{row.target}</td>
                <td className="py-3 pr-4 text-slate-600">{row.actual}</td>
                <td className="py-3 pr-4">
                  <span className={cn("rounded px-2 py-0.5 text-xs font-medium", STATUS_BADGE[row.status])}>
                    {row.status}
                  </span>
                </td>
                <td className="py-3 text-slate-500">{row.comment}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </SectionCard>
  );
}
