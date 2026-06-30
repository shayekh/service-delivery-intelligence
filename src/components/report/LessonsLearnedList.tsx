import { SectionCard, NA } from "@/components/report/SectionCard";
import { ArrowRight } from "lucide-react";
import type { AnalysisJson } from "@/types";

export function LessonsLearnedList({
  data,
}: {
  data: AnalysisJson["ai_generated"]["s11_lessons_learned"] | undefined;
}) {
  return (
    <SectionCard id="section-14" number="14" title="Lessons Learned" tag="ai">
      {!data?.length ? (
        <NA />
      ) : (
        <ol className="space-y-4">
          {data.map((item, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-0.5 shrink-0 text-sm font-bold text-purple-600">
                {String(i + 1).padStart(2, "0")}.
              </span>
              <div>
                <p className="font-semibold text-slate-800">{item.lesson}</p>
                {item.context && (
                  <p className="mt-0.5 text-sm text-slate-600">{item.context}</p>
                )}
                {item.action && (
                  <p className="mt-1 flex items-center gap-1 text-sm text-blue-600">
                    <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                    {item.action}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </SectionCard>
  );
}
