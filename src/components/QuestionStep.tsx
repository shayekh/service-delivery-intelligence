import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function QuestionStep({
  stepNumber,
  sectionLabel,
  question,
  helper,
  kind = "question",
  width = "default",
  children,
  footer,
}: {
  stepNumber: number;
  sectionLabel: string;
  question: string;
  helper?: string;
  kind?: "question" | "summary";
  width?: "default" | "full";
  children: ReactNode;
  footer: ReactNode;
}) {
  const prefixWord = kind === "summary" ? "STEP" : "QUESTION";

  return (
    <div
      className={cn(
        "mb-8 mt-8 rounded-xl border border-slate-200 bg-white shadow-sm",
        width === "full" ? "w-full px-12" : "mx-auto max-w-3xl"
      )}
    >
      <div className="px-8 pt-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-blue-600">
          {prefixWord} {stepNumber} · {sectionLabel.toUpperCase()}
        </p>
        <h2 className={cn("text-2xl font-bold text-slate-800", helper ? "mb-2" : "mb-6")}>
          {question}
        </h2>
        {helper && <p className="mb-6 text-sm text-blue-500">{helper}</p>}
      </div>

      <div className="px-8">{children}</div>

      <div className="flex items-center justify-between border-t border-slate-100 px-8 py-4">
        {footer}
      </div>
    </div>
  );
}
