"use client";

import { LayoutDashboard, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

const ROLE_OPTIONS: {
  value: UserRole;
  label: string;
  icon: typeof LayoutDashboard;
}[] = [
  { value: "product_manager", label: "Product Manager", icon: LayoutDashboard },
  { value: "tech_lead", label: "Tech Lead", icon: Code2 },
];

export function RoleToggle({
  value,
  onChange,
}: {
  value: UserRole | null;
  onChange: (role: UserRole) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {ROLE_OPTIONS.map((option) => {
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "w-full rounded-lg border px-6 py-3 text-sm font-medium transition-colors",
              value === option.value
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-slate-600 bg-transparent text-slate-300 hover:border-slate-400"
            )}
          >
            <Icon className="mx-auto mb-1 h-5 w-5" />
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
