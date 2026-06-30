"use server";

import { getTLAnswers, savePMAnswers, updateProjectStatus } from "@/lib/db";
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
    await updateProjectStatus(
      saved.project_id,
      bothSubmitted ? "processing" : "awaiting_tl"
    );
  }

  return saved;
}
