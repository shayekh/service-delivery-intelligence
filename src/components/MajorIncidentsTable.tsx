"use client";

import { X } from "lucide-react";

export interface MajorIncidentRow {
  date: string;
  issue: string;
  impact: string;
  root_cause: string;
  action: string;
  status: string;
}

const TEXTAREA_CLASS =
  "w-full resize-none rounded border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-blue-400";

export function MajorIncidentsTable({
  rows,
  onChange,
}: {
  rows: MajorIncidentRow[];
  onChange: (rows: MajorIncidentRow[]) => void;
}) {
  function updateRow(index: number, patch: Partial<MajorIncidentRow>) {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addRow() {
    onChange([
      ...rows,
      { date: "", issue: "", impact: "", root_cause: "", action: "", status: "" },
    ]);
  }

  function removeRow(index: number) {
    onChange(rows.filter((_, i) => i !== index));
  }

  return (
    <div>
      <p className="mb-2 mt-6 text-sm font-semibold text-slate-700">
        Major Incidents / Escalations
      </p>
      <div className="overflow-hidden rounded-lg border border-slate-200">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-40" />
            <col />
            <col style={{ width: "12%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "14%" }} />
            <col className="w-8" />
          </colgroup>
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Issue</th>
              <th className="px-3 py-2 text-left">Impact</th>
              <th className="px-3 py-2 text-left">Root Cause</th>
              <th className="px-3 py-2 text-left">Action Taken</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, index) => (
              <tr key={index}>
                <td className="px-3 py-2 align-top">
                  <input
                    type="date"
                    value={row.date}
                    onChange={(e) => updateRow(index, { date: e.target.value })}
                    className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-blue-400"
                  />
                </td>
                <td className="px-3 py-2 align-top">
                  <textarea
                    rows={2}
                    value={row.issue}
                    onChange={(e) => updateRow(index, { issue: e.target.value })}
                    className={TEXTAREA_CLASS}
                  />
                </td>
                <td className="px-3 py-2 align-top">
                  <textarea
                    rows={2}
                    value={row.impact}
                    onChange={(e) => updateRow(index, { impact: e.target.value })}
                    className={TEXTAREA_CLASS}
                  />
                </td>
                <td className="px-3 py-2 align-top">
                  <textarea
                    rows={2}
                    value={row.root_cause}
                    onChange={(e) => updateRow(index, { root_cause: e.target.value })}
                    className={TEXTAREA_CLASS}
                  />
                </td>
                <td className="px-3 py-2 align-top">
                  <textarea
                    rows={2}
                    value={row.action}
                    onChange={(e) => updateRow(index, { action: e.target.value })}
                    className={TEXTAREA_CLASS}
                  />
                </td>
                <td className="px-3 py-2 align-top">
                  <textarea
                    rows={2}
                    value={row.status}
                    onChange={(e) => updateRow(index, { status: e.target.value })}
                    className={TEXTAREA_CLASS}
                  />
                </td>
                <td className="px-3 py-2 text-right align-top">
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    aria-label="Remove incident"
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={addRow}
        className="mt-3 rounded-lg border border-blue-600 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
      >
        + Add Incident
      </button>
    </div>
  );
}
