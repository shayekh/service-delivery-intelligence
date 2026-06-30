"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MetricRow {
  metric: string;
  target: string;
  actual: string;
  comment: string;
}

const PRE_FILLED_COUNT = 3;

function computeStatus(
  target: string,
  actual: string
): "Green" | "Amber" | "Red" | "N/A" {
  const targetValue = parseFloat(target);
  const actualValue = parseFloat(actual);

  if (target.trim() === "" || actual.trim() === "" || isNaN(targetValue) || isNaN(actualValue)) {
    return "N/A";
  }

  if (actualValue >= targetValue) return "Green";
  if (actualValue >= targetValue * 0.95) return "Amber";
  return "Red";
}

const STATUS_BADGE_STYLES: Record<string, string> = {
  Green: "bg-green-100 text-green-700",
  Amber: "bg-amber-100 text-amber-700",
  Red: "bg-red-100 text-red-700",
  "N/A": "bg-slate-100 text-slate-500",
};

const TEXTAREA_CLASS =
  "w-full resize-none rounded border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-blue-400";
const INPUT_CLASS =
  "w-full rounded border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-blue-500";

export function MetricsTable({
  rows,
  onChange,
}: {
  rows: MetricRow[];
  onChange: (rows: MetricRow[]) => void;
}) {
  function updateRow(index: number, patch: Partial<MetricRow>) {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addRow() {
    onChange([...rows, { metric: "", target: "", actual: "", comment: "" }]);
  }

  function removeRow(index: number) {
    onChange(rows.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-slate-200">
        <table className="w-full table-fixed">
          <colgroup>
            <col style={{ width: "30%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "30%" }} />
            <col className="w-8" />
          </colgroup>
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2 text-left" spellCheck={false}>
                Metric
              </th>
              <th className="px-3 py-2 text-left">Target</th>
              <th className="px-3 py-2 text-left">Actual</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left" spellCheck={false}>
                Comment
              </th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, index) => {
              const status = computeStatus(row.target, row.actual);
              return (
                <tr key={index}>
                  <td className="px-3 py-2 align-top">
                    <textarea
                      rows={2}
                      value={row.metric}
                      onChange={(e) => updateRow(index, { metric: e.target.value })}
                      className={TEXTAREA_CLASS}
                    />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <input
                      type="text"
                      value={row.target}
                      onChange={(e) => updateRow(index, { target: e.target.value })}
                      className={INPUT_CLASS}
                    />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <input
                      type="text"
                      value={row.actual}
                      onChange={(e) => updateRow(index, { actual: e.target.value })}
                      className={INPUT_CLASS}
                    />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <span
                      className={cn(
                        "rounded px-2 py-0.5 text-xs font-medium",
                        STATUS_BADGE_STYLES[status]
                      )}
                    >
                      {status}
                    </span>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <textarea
                      rows={2}
                      value={row.comment}
                      onChange={(e) => updateRow(index, { comment: e.target.value })}
                      className={TEXTAREA_CLASS}
                    />
                  </td>
                  <td className="px-3 py-2 text-right align-top">
                    {index >= PRE_FILLED_COUNT && (
                      <button
                        type="button"
                        onClick={() => removeRow(index)}
                        aria-label="Remove metric"
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={addRow}
        className="mt-3 rounded-lg border border-blue-600 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
      >
        + Add Metric
      </button>
    </div>
  );
}
