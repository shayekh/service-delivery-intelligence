"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StatusColor } from "@/types";

export interface WorkstreamRow {
  workstream: string;
  status: StatusColor | "";
  summary: string;
  notes: string;
}

const STATUS_SELECT_STYLES: Record<string, string> = {
  "": "bg-white text-slate-600",
  Green: "bg-green-100 text-green-700",
  Amber: "bg-amber-100 text-amber-700",
  Red: "bg-red-100 text-red-700",
};

const STATUS_OPTION_COLORS: Record<string, { background: string; color: string }> = {
  Green: { background: "#dcfce7", color: "#15803d" },
  Amber: { background: "#fef3c7", color: "#b45309" },
  Red: { background: "#fee2e2", color: "#b91c1c" },
};

const TEXTAREA_CLASS =
  "w-full resize-none rounded border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-blue-400";

export function WorkstreamTable({
  rows,
  onChange,
}: {
  rows: WorkstreamRow[];
  onChange: (rows: WorkstreamRow[]) => void;
}) {
  function updateRow(index: number, patch: Partial<WorkstreamRow>) {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addRow() {
    onChange([...rows, { workstream: "", status: "", summary: "", notes: "" }]);
  }

  function removeRow(index: number) {
    onChange(rows.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-slate-200">
        <table className="w-full table-fixed">
          <colgroup>
            <col style={{ width: "25%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "35%" }} />
            <col style={{ width: "25%" }} />
            <col className="w-8" />
          </colgroup>
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2 text-left">Workstream</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Progress Summary</th>
              <th className="px-3 py-2 text-left">Notes</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, index) => (
              <tr key={index}>
                <td className="px-3 py-2 align-top">
                  <textarea
                    rows={2}
                    value={row.workstream}
                    onChange={(e) => updateRow(index, { workstream: e.target.value })}
                    className={TEXTAREA_CLASS}
                  />
                </td>
                <td className="min-w-0 px-3 py-2 align-top">
                  <select
                    value={row.status}
                    onChange={(e) =>
                      updateRow(index, {
                        status: e.target.value as StatusColor | "",
                      })
                    }
                    className={cn(
                      "w-full rounded border border-slate-300 px-2 py-1.5 text-sm outline-none",
                      STATUS_SELECT_STYLES[row.status]
                    )}
                  >
                    <option value="">Select</option>
                    <option value="Green" style={STATUS_OPTION_COLORS.Green}>
                      Green
                    </option>
                    <option value="Amber" style={STATUS_OPTION_COLORS.Amber}>
                      Amber
                    </option>
                    <option value="Red" style={STATUS_OPTION_COLORS.Red}>
                      Red
                    </option>
                  </select>
                </td>
                <td className="px-3 py-2 align-top">
                  <textarea
                    rows={2}
                    value={row.summary}
                    onChange={(e) => updateRow(index, { summary: e.target.value })}
                    className={TEXTAREA_CLASS}
                  />
                </td>
                <td className="px-3 py-2 align-top">
                  <textarea
                    rows={2}
                    value={row.notes}
                    onChange={(e) => updateRow(index, { notes: e.target.value })}
                    className={TEXTAREA_CLASS}
                  />
                </td>
                <td className="px-3 py-2 text-right align-top">
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    aria-label="Remove workstream"
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
        + Add Workstream
      </button>
    </div>
  );
}
