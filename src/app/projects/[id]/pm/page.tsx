import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getPMAnswers, getProjectById, getTLAnswers } from "@/lib/db";
import { PmQuestionnaireClient } from "@/components/pm/PmQuestionnaireClient";

export const dynamic = "force-dynamic";

export default async function PmQuestionnairePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireAuth();
  const project = await getProjectById(id);

  if (!project || project.assigned_pm !== user.id) {
    redirect("/dashboard");
  }

  const [answers, tlAnswers] = await Promise.all([
    getPMAnswers(id),
    getTLAnswers(id),
  ]);

  return (
    <PmQuestionnaireClient
      project={project}
      initialAnswers={answers}
      currentUser={user}
      tlHasSubmitted={!!tlAnswers?.submitted_at}
    />
  );
}
