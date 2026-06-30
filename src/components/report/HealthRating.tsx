import { SectionCard, NA } from "@/components/report/SectionCard";
import { cn } from "@/lib/utils";
import type { AnalysisJson, StatusColor } from "@/types";

const DOT: Record<StatusColor, string> = {
  Green: "bg-green-500",
  Amber: "bg-amber-500",
  Red: "bg-red-500",
};

const LABEL: Record<StatusColor, string> = {
  Green: "On Track",
  Amber: "At Risk",
  Red: "Critical",
};

function RatingCard({
  role,
  status,
  mismatch,
}: {
  role: string;
  status: StatusColor | null | undefined;
  mismatch: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-slate-200 bg-slate-50 p-4",
        mismatch && "border-l-4 border-l-red-400"
      )}
    >
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        {role}
      </p>
      {status ? (
        <div className="flex items-center gap-2">
          <span className={cn("h-2.5 w-2.5 rounded-full", DOT[status])} />
          <span className="font-semibold text-slate-800">{LABEL[status]}</span>
        </div>
      ) : (
        <NA />
      )}
    </div>
  );
}

export function HealthRating({
  meta,
}: {
  meta: AnalysisJson["report_meta"] | undefined;
}) {
  const pmStatus = meta?.pm_status ?? null;
  const tlStatus = meta?.tl_status ?? null;
  const mismatch = !!pmStatus && !!tlStatus && pmStatus !== tlStatus;

  return (
    <SectionCard id="section-04" number="04" title="Health Rating" tag="submission">
      <div className="grid grid-cols-2 gap-4">
        <RatingCard role="Product Manager" status={pmStatus} mismatch={mismatch} />
        <RatingCard role="Tech Lead" status={tlStatus} mismatch={mismatch} />
      </div>
      {mismatch && (
        <p className="mt-3 text-xs text-red-500">
          ⚠ PM and TL assessments differ — see Management Attention for details.
        </p>
      )}
    </SectionCard>
  );
}
