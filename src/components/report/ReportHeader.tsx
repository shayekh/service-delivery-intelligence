import { Send } from "lucide-react";
import { DownloadPdfButton } from "@/components/report/DownloadPdfButton";
import type { AnalysisJson, Project } from "@/types";

function StatusPill({ status }: { status: Project["status"] }) {
  if (status === "sent") {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
        Report sent
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-600">
      <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
      Report ready
    </span>
  );
}

export function ReportHeader({
  project,
  analysis,
}: {
  project: Project;
  analysis: AnalysisJson | null;
}) {
  const preparedBy = analysis?.report_meta.prepared_by ?? "—";

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-8 py-6">
      <div className="relative flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Quarterly Service Delivery Review
            </p>
            <StatusPill status={project.status} />
          </div>
          <h1 className="mt-1 text-3xl font-bold text-slate-800">
            {project.project_name}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {project.quarter} · Prepared by {preparedBy}
          </p>
        </div>

        <div className="flex shrink-0 items-start gap-3 pt-1">
          <DownloadPdfButton projectId={project.id} />
          <button
            disabled
            title="Available after Phase 11"
            className="flex cursor-not-allowed items-center gap-2 rounded-lg bg-blue-200 px-4 py-2 text-sm text-white"
          >
            <Send className="h-4 w-4" />
            Send Report
          </button>
        </div>
      </div>
    </header>
  );
}
