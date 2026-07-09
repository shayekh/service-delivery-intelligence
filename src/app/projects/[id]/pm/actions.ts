"use server";

import { generateAnalysis } from "@/lib/agent";
import { generateReportPdf } from "@/lib/pdf";
import {
  clearProjectError,
  getTLAnswers,
  savePMAnswers,
  saveAnalysisResult,
  setProjectError,
  updateProjectStatus,
} from "@/lib/db";
import type { PmAnswers } from "@/types";

type PmAnswersInput = Omit<PmAnswers, "id">;

export async function savePmDraftAction(
  data: PmAnswersInput
): Promise<PmAnswers> {
  return savePMAnswers(data);
}

export async function submitPmAnswersAction(
  data: PmAnswersInput
): Promise<PmAnswers> {
  const saved = await savePMAnswers({
    ...data,
    submitted_at: new Date().toISOString(),
  });

  if (saved.project_id) {
    const tl = await getTLAnswers(saved.project_id);
    const bothSubmitted = !!tl?.submitted_at;

    if (bothSubmitted) {
      await updateProjectStatus(saved.project_id, "processing");
      try {
        const { analysis, tokenUsage } = await generateAnalysis(saved.project_id);
        await saveAnalysisResult(saved.project_id, analysis, tokenUsage);
        await clearProjectError(saved.project_id);
        await updateProjectStatus(saved.project_id, "ready");
        // Generate PDF immediately after analysis — best-effort, does not block ready status
        try {
          await generateReportPdf(saved.project_id);
        } catch (pdfErr) {
          console.error("submitPmAnswersAction: PDF generation failed (analysis still saved, web report available):", pdfErr);
        }
      } catch (err) {
        console.error("submitPmAnswersAction: AI analysis failed:", err);
        await setProjectError(
          saved.project_id,
          err instanceof Error ? err.message : "AI analysis failed"
        );
        // Status stays 'processing' so it can be retried; the submit itself
        // still succeeds and the user is redirected.
      }
    } else {
      await updateProjectStatus(saved.project_id, "awaiting_tl");
    }
  }

  return saved;
}
