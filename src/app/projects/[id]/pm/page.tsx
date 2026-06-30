import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getPMAnswers, getProjectById } from "@/lib/db";
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

  const answers = await getPMAnswers(id);

  return (
    <PmQuestionnaireClient
      project={project}
      initialAnswers={answers}
      currentUser={user}
    />
  );
}
