"use client";

export interface TicketCountRow {
  category: string;
  count: string;
  summary: string;
}

export const TICKET_CATEGORIES = [
  "Total Raised",
  "Resolved",
  "Open",
  "Critical Incidents",
  "Major Incidents",
  "Recurring Issues",
];

const INPUT_CLASS =
  "w-full rounded border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-blue-500";

export function TicketCountsTable({
  rows,
  onChange,
}: {
  rows: TicketCountRow[];
  onChange: (rows: TicketCountRow[]) => void;
}) {
  function updateRow(index: number, patch: Partial<TicketCountRow>) {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <table className="w-full table-fixed">
        <colgroup>
          <col style={{ width: "25%" }} />
          <col style={{ width: "15%" }} />
          <col style={{ width: "60%" }} />
        </colgroup>
        <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-3 py-2 text-left">Category</th>
            <th className="px-3 py-2 text-left">Count</th>
            <th className="px-3 py-2 text-left">Summary</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, index) => (
            <tr key={row.category}>
              <td className="px-3 py-2 align-top text-sm text-slate-700">
                {row.category}
              </td>
              <td className="px-3 py-2 align-top">
                <input
                  type="number"
                  value={row.count}
                  onChange={(e) => updateRow(index, { count: e.target.value })}
                  className={INPUT_CLASS}
                />
              </td>
              <td className="px-3 py-2 align-top">
                <input
                  type="text"
                  value={row.summary}
                  onChange={(e) => updateRow(index, { summary: e.target.value })}
                  className={INPUT_CLASS}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
