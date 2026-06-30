import { SectionCard, NA } from "@/components/report/SectionCard";
import type { AnalysisJson } from "@/types";

const TICKET_ROWS: {
  key: keyof AnalysisJson["section_synthesis"]["s6_support_summary"]["ticket_counts"];
  label: string;
}[] = [
  { key: "total", label: "Total Raised" },
  { key: "resolved", label: "Resolved" },
  { key: "open", label: "Open" },
  { key: "critical", label: "Critical Incidents" },
  { key: "major", label: "Major Incidents" },
  { key: "recurring", label: "Recurring Issues" },
];

export function SupportIncidents({
  data,
}: {
  data: AnalysisJson["section_synthesis"]["s6_support_summary"] | undefined;
}) {
  return (
    <SectionCard id="section-08" number="08" title="Support & Incidents" tag="submission">
      {!data ? (
        <NA />
      ) : (
        <>
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col style={{ width: "25%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "60%" }} />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-400">
                <th className="px-3 py-2 text-left font-medium">Category</th>
                <th className="px-3 py-2 text-center font-medium">Count</th>
                <th className="px-3 py-2 text-left font-medium">Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {TICKET_ROWS.map(({ key, label }) => {
                const val = data.ticket_counts[key];
                return (
                  <tr key={key}>
                    <td className="px-3 py-2 font-medium text-slate-700">{label}</td>
                    <td className="px-3 py-2 text-center text-slate-800">
                      {val?.count || "—"}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {val?.summary || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {data.major_incidents?.length > 0 && (
            <div className="mt-5">
              <p className="mb-3 text-sm font-semibold text-slate-700">
                Major Incidents / Escalations
              </p>
              <div className="space-y-2">
                {data.major_incidents.map((inc, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-4 rounded-lg border border-slate-100 p-3 text-sm"
                  >
                    <span className="shrink-0 text-slate-400">{inc.date || "—"}</span>
                    <span className="flex-1 text-slate-700">{inc.issue}</span>
                    <span
                      className={
                        inc.status?.toLowerCase() === "resolved"
                          ? "rounded px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700"
                          : "rounded px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700"
                      }
                    >
                      {inc.status || "Open"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </SectionCard>
  );
}
