"use server";

import { generateAnalysis } from "@/lib/agent";
import {
  clearProjectError,
  getPMAnswers,
  saveTLAnswers,
  saveAnalysisResult,
  setProjectError,
  updateProjectStatus,
} from "@/lib/db";
import type { TlAnswers } from "@/types";

type TlAnswersInput = Omit<TlAnswers, "id">;

export async function saveTlDraftAction(
  data: TlAnswersInput
): Promise<TlAnswers> {
  return saveTLAnswers(data);
}

export async function submitTlAnswersAction(
  data: TlAnswersInput
): Promise<TlAnswers> {
  const saved = await saveTLAnswers({
    ...data,
    submitted_at: new Date().toISOString(),
  });

  if (saved.project_id) {
    const pm = await getPMAnswers(saved.project_id);
    const bothSubmitted = !!pm?.submitted_at;

    if (bothSubmitted) {
      await updateProjectStatus(saved.project_id, "processing");
      try {
        const analysis = await generateAnalysis(saved.project_id);
        await saveAnalysisResult(saved.project_id, analysis);
        await clearProjectError(saved.project_id);
        await updateProjectStatus(saved.project_id, "ready");
      } catch (err) {
        console.error("submitTlAnswersAction: AI analysis failed:", err);
        await setProjectError(
          saved.project_id,
          err instanceof Error ? err.message : "AI analysis failed"
        );
        // Status stays 'processing' so it can be retried; the submit itself
        // still succeeds and the user is redirected.
      }
    } else {
      await updateProjectStatus(saved.project_id, "awaiting_pm");
    }
  }

  return saved;
}
