import { SectionCard, NA } from "@/components/report/SectionCard";
import type { AnalysisJson } from "@/types";

export function KeyAchievements({
  data,
}: {
  data: AnalysisJson["section_synthesis"]["s3_achievements"] | undefined;
}) {
  return (
    <SectionCard id="section-05" number="05" title="Key Achievements" tag="submission">
      {!data?.length ? (
        <NA />
      ) : (
        <ol className="space-y-4">
          {data.map((item, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-0.5 text-sm font-bold text-blue-600">{String(i + 1).padStart(2, "0")}.</span>
              <div>
                <p className="font-semibold text-slate-800">{item.achievement}</p>
                {item.impact && (
                  <p className="mt-0.5 text-sm text-slate-600">{item.impact}</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </SectionCard>
  );
}
