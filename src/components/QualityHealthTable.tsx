"use client";

import { cn } from "@/lib/utils";
import type { StatusColor } from "@/types";

export interface QualityHealthRow {
  area: string;
  observation: string;
  status: StatusColor | "";
  improvement_action: string;
}

export const QUALITY_AREAS = [
  "Code Quality",
  "QA & Testing",
  "Release Management",
  "Documentation",
  "Communication",
  "Team Stability",
];

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

export function QualityHealthTable({
  rows,
  onChange,
}: {
  rows: QualityHealthRow[];
  onChange: (rows: QualityHealthRow[]) => void;
}) {
  function updateRow(index: number, patch: Partial<QualityHealthRow>) {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <table className="w-full table-fixed">
        <colgroup>
          <col style={{ width: "20%" }} />
          <col style={{ width: "35%" }} />
          <col style={{ width: "15%" }} />
          <col style={{ width: "30%" }} />
        </colgroup>
        <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-3 py-2 text-left">Area</th>
            <th className="px-3 py-2 text-left">Observation</th>
            <th className="px-3 py-2 text-left">Status</th>
            <th className="px-3 py-2 text-left">Improvement Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, index) => (
            <tr key={row.area}>
              <td className="px-3 py-2 align-top text-sm text-slate-700">
                {row.area}
              </td>
              <td className="px-3 py-2 align-top">
                <textarea
                  rows={2}
                  value={row.observation}
                  onChange={(e) => updateRow(index, { observation: e.target.value })}
                  className={TEXTAREA_CLASS}
                />
              </td>
              <td className="min-w-0 px-3 py-2 align-top">
                <select
                  value={row.status}
                  onChange={(e) =>
                    updateRow(index, { status: e.target.value as StatusColor | "" })
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
                  value={row.improvement_action}
                  onChange={(e) =>
                    updateRow(index, { improvement_action: e.target.value })
                  }
                  className={TEXTAREA_CLASS}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
