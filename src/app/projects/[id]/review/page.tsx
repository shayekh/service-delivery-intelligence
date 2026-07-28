import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { getPMAnswers, getProjectById, getTLAnswers, getUserById } from "@/lib/db";
import { QuestionStep } from "@/components/QuestionStep";
import { AnswersSidebar, type AnswersSidebarSection } from "@/components/report/AnswersSidebar";
import { buildPmAnswerCards, buildTlAnswerCards } from "@/components/report/AnswerCards";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AnswersReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ role?: string }>;
}) {
  const { id } = await params;
  const { role: roleParam } = await searchParams;
  const activeRole: "pm" | "tl" = roleParam === "tl" ? "tl" : "pm";

  const user = await requireAuth();
  const project = await getProjectById(id);
  if (!project) redirect("/dashboard");

  const isAssigned = project.assigned_pm === user.id || project.assigned_tl === user.id;
  if (!isAssigned && user.role !== "admin") redirect("/dashboard");

  const [pmAnswers, tlAnswers, pmUser, tlUser] = await Promise.all([
    getPMAnswers(id),
    getTLAnswers(id),
    project.assigned_pm ? getUserById(project.assigned_pm) : null,
    project.assigned_tl ? getUserById(project.assigned_tl) : null,
  ]);

  const activeAnswers = activeRole === "pm" ? pmAnswers : tlAnswers;
  const activeName =
    (activeRole === "pm" ? pmUser?.full_name : tlUser?.full_name) ??
    (activeRole === "pm" ? "Product Manager" : "Tech Lead");

  const cards = activeAnswers
    ? activeRole === "pm"
      ? buildPmAnswerCards(pmAnswers!)
      : buildTlAnswerCards(tlAnswers!)
    : [];

  const sections: AnswersSidebarSection[] = [];
  const sectionAnchorIds: (string | undefined)[] = cards.map((card) => {
    const existing = sections.find((s) => s.label === card.sectionLabel);
    if (existing) return undefined;
    const id = `ans-section-${sections.length + 1}`;
    sections.push({ id, label: card.sectionLabel });
    return id;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/projects/${id}`} replace>
              <ArrowLeft className="h-5 w-5 text-slate-400 hover:text-slate-600" />
            </Link>
            <div>
              <p className="text-sm text-slate-500">
                {project.customer_name} · {activeName}
              </p>
              <p className="font-bold text-slate-800">
                {activeRole === "pm" ? "Product Manager Review" : "Tech Lead Review"}
              </p>
            </div>
          </div>

          <div className="flex overflow-hidden rounded-lg border border-slate-200">
            <Link
              href={`/projects/${id}/review?role=pm`}
              replace
              className={cn(
                "px-4 py-1.5 text-sm font-medium transition-colors",
                activeRole === "pm"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50"
              )}
            >
              Product Manager
            </Link>
            <Link
              href={`/projects/${id}/review?role=tl`}
              replace
              className={cn(
                "px-4 py-1.5 text-sm font-medium transition-colors",
                activeRole === "tl"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50"
              )}
            >
              Tech Lead
            </Link>
          </div>
        </div>
      </header>

      <div className="flex">
        <AnswersSidebar sections={sections} />

        <main className="min-w-0 flex-1 px-8 py-8">
          <div className="mx-auto max-w-3xl">
            {!activeAnswers ? (
              <div className="mt-16 text-center text-sm text-slate-400">
                No answers submitted yet for this role.
              </div>
            ) : (
              cards.map((card, i) => (
                <div key={i} id={sectionAnchorIds[i]} className="scroll-mt-24">
                  <QuestionStep stepNumber={i + 1} sectionLabel={card.sectionLabel} question={card.question}>
                    {card.body}
                  </QuestionStep>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
