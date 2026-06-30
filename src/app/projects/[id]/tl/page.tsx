import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getPMAnswers, getProjectById, getTLAnswers } from "@/lib/db";
import { TlQuestionnaireClient } from "@/components/tl/TlQuestionnaireClient";

export const dynamic = "force-dynamic";

export default async function TlQuestionnairePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireAuth();
  const project = await getProjectById(id);

  if (!project || project.assigned_tl !== user.id) {
    redirect("/dashboard");
  }

  const answers = await getTLAnswers(id);
  const pmAnswers = await getPMAnswers(id);

  return (
    <TlQuestionnaireClient
      project={project}
      initialAnswers={answers}
      pmAnswers={pmAnswers}
      currentUser={user}
    />
  );
}
