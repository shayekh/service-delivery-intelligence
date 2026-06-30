"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type RiskType = "Risk" | "Issue" | "Dependency";
export type RiskImpact = "High" | "Medium" | "Low";

export interface RiskRow {
  type: RiskType | "";
  description: string;
  impact: RiskImpact | "";
  owner: string;
  mitigation: string;
}

const IMPACT_TEXT_COLOR: Record<string, string> = {
  High: "text-red-600",
  Medium: "text-amber-600",
  Low: "text-green-600",
};

const TEXTAREA_CLASS =
  "w-full resize-none rounded border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-blue-400";
const SELECT_CLASS =
  "w-full rounded border border-slate-300 px-2 py-1.5 text-sm outline-none";

export function RisksIssuesTable({
  rows,
  onChange,
}: {
  rows: RiskRow[];
  onChange: (rows: RiskRow[]) => void;
}) {
  function updateRow(index: number, patch: Partial<RiskRow>) {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addRow() {
    onChange([
      ...rows,
      { type: "", description: "", impact: "", owner: "", mitigation: "" },
    ]);
  }

  function removeRow(index: number) {
    onChange(rows.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-slate-200">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-32" />
            <col style={{ width: "28%" }} />
            <col className="w-32" />
            <col style={{ width: "18%" }} />
            <col style={{ width: "30%" }} />
            <col className="w-8" />
          </colgroup>
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-left">Description</th>
              <th className="px-3 py-2 text-left">Impact</th>
              <th className="px-3 py-2 text-left">Owner</th>
              <th className="px-3 py-2 text-left">Mitigation / Next Step</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, index) => (
              <tr key={index}>
                <td className="min-w-0 px-3 py-2 align-top">
                  <select
                    value={row.type}
                    onChange={(e) =>
                      updateRow(index, { type: e.target.value as RiskType | "" })
                    }
                    className={SELECT_CLASS}
                  >
                    <option value="">Select</option>
                    <option value="Risk">Risk</option>
                    <option value="Issue">Issue</option>
                    <option value="Dependency">Dependency</option>
                  </select>
                </td>
                <td className="px-3 py-2 align-top">
                  <textarea
                    rows={2}
                    value={row.description}
                    onChange={(e) => updateRow(index, { description: e.target.value })}
                    className={TEXTAREA_CLASS}
                  />
                </td>
                <td className="min-w-0 px-3 py-2 align-top">
                  <select
                    value={row.impact}
                    onChange={(e) =>
                      updateRow(index, { impact: e.target.value as RiskImpact | "" })
                    }
                    className={cn(SELECT_CLASS, IMPACT_TEXT_COLOR[row.impact])}
                  >
                    <option value="">Select</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </td>
                <td className="px-3 py-2 align-top">
                  <textarea
                    rows={2}
                    value={row.owner}
                    onChange={(e) => updateRow(index, { owner: e.target.value })}
                    className={TEXTAREA_CLASS}
                  />
                </td>
                <td className="px-3 py-2 align-top">
                  <textarea
                    rows={2}
                    value={row.mitigation}
                    onChange={(e) => updateRow(index, { mitigation: e.target.value })}
                    className={TEXTAREA_CLASS}
                  />
                </td>
                <td className="px-3 py-2 text-right align-top">
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    aria-label="Remove item"
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
        + Add Item
      </button>
    </div>
  );
}
