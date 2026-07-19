"use client";

import { useEffect, useRef } from "react";
import { DownloadPdfButton } from "@/components/report/DownloadPdfButton";
import { SendReportButton } from "@/components/report/SendReportButton";
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

function parsePreparedBy(raw: string) {
  const match = raw.match(/^(.+?),\s*Product Manager,\s*(.+?),\s*Tech Lead$/);
  if (match) return { pm: match[1].trim(), tl: match[2].trim() };
  return null;
}

export function ReportHeader({
  project,
  analysis,
}: {
  project: Project;
  analysis: AnalysisJson | null;
}) {
  const preparedBy = analysis?.report_meta.prepared_by ?? "—";
  const parsed = parsePreparedBy(preparedBy);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function updateHeight() {
      if (headerRef.current) {
        const h = headerRef.current.getBoundingClientRect().height;
        document.documentElement.style.setProperty("--report-header-height", `${h}px`);
      }
    }
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    if (headerRef.current) observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <header ref={headerRef} className="sticky top-0 z-10 border-b border-slate-200 bg-white px-8 py-6">
      <div className="relative flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              {project.review_cadence === "monthly"
                ? "Monthly Service Delivery Review"
                : "Quarterly Service Delivery Review"}
            </p>
            <StatusPill status={project.status} />
          </div>
          <h1 className="mt-1 text-3xl font-bold text-slate-800">
            {project.project_name}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span>{project.quarter}</span>
            <span className="text-slate-300">·</span>
            {parsed ? (
              <>
                <span className="flex items-center gap-1.5">
                  {parsed.pm}
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-500">PM</span>
                </span>
                <span className="text-slate-300">·</span>
                <span className="flex items-center gap-1.5">
                  {parsed.tl}
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">TL</span>
                </span>
              </>
            ) : (
              <span>Prepared by {preparedBy}</span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-start gap-3 pt-1">
          <DownloadPdfButton projectId={project.id} pdfUrl={project.pdf_url} />
          <SendReportButton
            projectId={project.id}
            recipientEmails={project.recipient_emails ?? []}
            manualEmailSentAt={project.manual_email_sent_at}
          />
        </div>
      </div>
    </header>
  );
}
