import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getAnalysisResult, getProjectById } from "@/lib/db";
import { ReportHeader } from "@/components/report/ReportHeader";
import { ReportSidebar } from "@/components/report/ReportSidebar";
import { ExecutiveSummary } from "@/components/report/ExecutiveSummary";
import { ServiceOverview } from "@/components/report/ServiceOverview";
import { DeliveryStatusSection } from "@/components/report/DeliveryStatusSection";
import { HealthRating } from "@/components/report/HealthRating";
import { KeyAchievements } from "@/components/report/KeyAchievements";
import { DeliverySummaryTable } from "@/components/report/DeliverySummaryTable";
import { ReportMetricsTable } from "@/components/report/MetricsTable";
import { SupportIncidents } from "@/components/report/SupportIncidents";
import { ReportQualityHealthTable } from "@/components/report/QualityHealthTable";
import { RisksTable } from "@/components/report/RisksTable";
import { CustomerFeedbackSection } from "@/components/report/CustomerFeedbackSection";
import { ValueDelivered } from "@/components/report/ValueDelivered";
import { CrossAnalysisSummary } from "@/components/report/CrossAnalysisSummary";
import { LessonsLearnedList } from "@/components/report/LessonsLearnedList";
import { NextQuarterFocusTable } from "@/components/report/NextQuarterFocusTable";
import { ManagementAttentionCards } from "@/components/report/ManagementAttentionCards";
import { ItsmMaturitySection } from "@/components/report/ItsmMaturitySection";
import { ClosingNoteCard } from "@/components/report/ClosingNoteCard";
import { FocusLensBar } from "@/components/report/FocusLensBar";
import { ScrollToTopButton } from "@/components/report/ScrollToTopButton";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireAuth();
  const project = await getProjectById(id);

  if (!project) redirect("/dashboard");

  const isAssigned =
    project.assigned_pm === user.id || project.assigned_tl === user.id;
  const isReady =
    project.status === "ready" || project.status === "sent";

  if (!isAssigned && !isReady) redirect("/dashboard");

  // Pending state
  if (!isReady) {
    const STATUS_LABEL: Record<string, string> = {
      not_started: "Neither PM nor TL has submitted yet.",
      awaiting_pm: "Waiting for the Product Manager to submit their review.",
      awaiting_tl: "Waiting for the Tech Lead to submit their review.",
      processing: "Both reviews are in — the AI report is generating.",
      generating_pdf: "Generating PDF…",
    };
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
          {project.project_name} · {project.quarter}
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-800">
          Report not ready yet
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {STATUS_LABEL[project.status] ?? `Status: ${project.status}`}
        </p>
        {project.status === "processing" && project.error_message && (
          <div className="mt-4 max-w-md rounded-lg border border-red-200 bg-red-50 p-4 text-left text-sm text-red-700">
            <p className="font-semibold">AI generation error</p>
            <p className="mt-1 font-mono text-xs">{project.error_message}</p>
          </div>
        )}
        <a
          href="/dashboard"
          className="mt-6 text-sm text-blue-600 underline"
        >
          Back to dashboard
        </a>
      </div>
    );
  }

  const analysis = await getAnalysisResult(id);

  // Error state: ready but analysis missing
  if (!analysis) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-red-500">
          Error
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-800">
          Analysis not found
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          The report was marked ready but no analysis data could be retrieved.
        </p>
        {project.error_message && (
          <div className="mt-4 max-w-md rounded-lg border border-red-200 bg-red-50 p-4 text-left text-sm text-red-700">
            <p className="font-semibold">Last known error</p>
            <p className="mt-1 font-mono text-xs">{project.error_message}</p>
          </div>
        )}
        <a href="/dashboard" className="mt-6 text-sm text-blue-600 underline">
          Back to dashboard
        </a>
      </div>
    );
  }

  const ss = analysis.section_synthesis;
  const ai = analysis.ai_generated;

  return (
    <div className="min-h-screen bg-gray-50">
      <ReportHeader project={project} analysis={analysis} />
      <FocusLensBar analysis={analysis} />

      <div className="flex">
        <ReportSidebar />

        <main className="min-w-0 flex-1 px-8 py-8">
          <div className="mx-auto max-w-3xl space-y-6">
            <ExecutiveSummary data={ss.s1_executive_summary} />
            <ServiceOverview data={ss.s2_service_overview} />
            <DeliveryStatusSection data={ss.s1_executive_summary} />
            <HealthRating meta={analysis.report_meta} />
            <KeyAchievements data={ss.s3_achievements} />
            <DeliverySummaryTable data={ss.s4_delivery_summary} />
            <ReportMetricsTable data={ss.s5_metrics} />
            <SupportIncidents data={ss.s6_support_summary} />
            <ReportQualityHealthTable data={ss.s7_quality_health} />
            <RisksTable data={ss.s8_risks} />
            <CustomerFeedbackSection data={ss.s9_customer_feedback} />
            <ValueDelivered data={ai.s10_value_delivered} />
            <CrossAnalysisSummary data={ai.s10_cross_analysis} />
            <LessonsLearnedList data={ai.s11_lessons_learned} />
            <NextQuarterFocusTable data={ai.s12_next_quarter_focus} />
            <ItsmMaturitySection data={ai.s15_itsm_maturity} />
            <ManagementAttentionCards data={ai.s13_management_attention} />
            <ClosingNoteCard data={ai.s16_closing_note} />
          </div>
        </main>
      </div>
      <ScrollToTopButton />
    </div>
  );
}
