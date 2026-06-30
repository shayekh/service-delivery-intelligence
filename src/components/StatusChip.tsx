import { cn } from "@/lib/utils";
import type { ProjectWithAssignees } from "@/types";

const CHIP_STYLES = {
  grey: "bg-slate-100 text-slate-600",
  amber: "border border-amber-200 bg-amber-50 text-amber-700",
  purple: "border border-purple-200 bg-purple-50 text-purple-700",
  green: "border border-green-200 bg-green-50 text-green-700",
  blue: "border border-blue-200 bg-blue-50 text-blue-700",
} as const;

export function getStatusDisplay(
  project: Pick<ProjectWithAssignees, "pm_submitted" | "tl_submitted" | "status">
): { label: string; color: keyof typeof CHIP_STYLES } {
  if (!project.pm_submitted && !project.tl_submitted) {
    return { label: "Not started", color: "grey" };
  }

  if (project.pm_submitted && !project.tl_submitted) {
    return { label: "Awaiting Tech Lead", color: "amber" };
  }

  if (!project.pm_submitted && project.tl_submitted) {
    return { label: "Awaiting PM", color: "amber" };
  }

  if (project.status === "ready") {
    return { label: "Report ready", color: "green" };
  }

  if (project.status === "sent") {
    return { label: "Report sent", color: "blue" };
  }

  return { label: "Processing", color: "purple" };
}

export function StatusChip({
  project,
}: {
  project: Pick<ProjectWithAssignees, "pm_submitted" | "tl_submitted" | "status">;
}) {
  const { label, color } = getStatusDisplay(project);

  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium",
        CHIP_STYLES[color]
      )}
    >
      {label}
    </span>
  );
}
