import { SectionCard, NA } from "@/components/report/SectionCard";
import type { AnalysisJson } from "@/types";
import { cn } from "@/lib/utils";

const STATUS_STYLES = {
  Green: "bg-green-100 text-green-800 border-green-300",
  Amber: "bg-amber-100 text-amber-800 border-amber-300",
  Red: "bg-red-100 text-red-800 border-red-300",
};

export function DeliveryStatusSection({
  data,
}: {
  data: AnalysisJson["section_synthesis"]["s1_executive_summary"] | undefined;
}) {
  const status = data?.overall_status;

  return (
    <SectionCard id="section-03" number="03" title="Delivery Status" tag="submission">
      {status ? (
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "rounded-lg border px-4 py-2 text-sm font-semibold",
              STATUS_STYLES[status]
            )}
          >
            {status === "Green" ? "On Track" : status === "Amber" ? "At Risk" : "Critical"}
          </span>
          <span className="text-sm text-slate-500">Overall delivery status</span>
        </div>
      ) : (
        <NA />
      )}
    </SectionCard>
  );
}
