"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QuestionnaireSection {
  step: number;
  label: string;
  filled?: boolean;
}

interface QuestionnaireSidebarProps {
  sections: QuestionnaireSection[];
  currentStep: number;
  onNavigate: (step: number) => void;
}

export function QuestionnaireSidebar({
  sections,
  currentStep,
  onNavigate,
}: QuestionnaireSidebarProps) {
  return (
    <aside
      className="sticky hidden w-64 shrink-0 self-start overflow-y-auto px-4 py-6 lg:block"
      style={{
        top: "calc(var(--questionnaire-header-height, 0px) + 0.5rem)",
        maxHeight: "calc(100vh - var(--questionnaire-header-height, 0px) - 1rem)",
      }}
    >
      <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Sections
      </p>
      {sections.map(({ step, label, filled }) => {
        const active = step === currentStep;
        return (
          <button
            key={step}
            type="button"
            onClick={() => onNavigate(step)}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
              active
                ? "border-l-2 border-blue-600 bg-blue-50 font-medium text-blue-600"
                : "text-slate-600 hover:bg-slate-50"
            )}
          >
            <span
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                filled
                  ? "border-green-500 bg-green-500 text-white"
                  : "border-slate-300 bg-white"
              )}
              aria-label={filled ? "Answered" : "Not answered yet"}
            >
              {filled && <Check className="h-3 w-3" strokeWidth={3} />}
            </span>
            <span className="min-w-0 flex-1 truncate">
              {step}. {label}
            </span>
          </button>
        );
      })}
    </aside>
  );
}
