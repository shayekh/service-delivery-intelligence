"use server";

import { getPMAnswers, saveTLAnswers, updateProjectStatus } from "@/lib/db";
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
    await updateProjectStatus(
      saved.project_id,
      bothSubmitted ? "processing" : "awaiting_pm"
    );
  }

  return saved;
}
