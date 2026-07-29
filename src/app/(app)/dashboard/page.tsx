import { requireAuth } from "@/lib/auth";
import { getAllPMs, getAllTLs, getAllProjectsWithAssignees } from "@/lib/db";
import { AddProjectButton } from "@/components/dashboard/AddProjectButton";
import { ProjectsTable } from "@/components/dashboard/ProjectsTable";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireAuth();
  const allProjects = await getAllProjectsWithAssignees();
  const projects =
    user.role === "admin"
      ? allProjects
      : allProjects.filter(
          (p) => p.assigned_pm === user.id || p.assigned_tl === user.id
        );
  const [pmUsers, tlUsers] = await Promise.all([getAllPMs(), getAllTLs()]);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Project Reviews</h1>
      </div>

      <ProjectsTable
        projects={projects}
        currentUser={user}
        pmUsers={pmUsers}
        tlUsers={tlUsers}
        actions={
          <AddProjectButton
            pmUsers={pmUsers}
            tlUsers={tlUsers}
            currentUserId={user.id}
          />
        }
      />
    </div>
  );
}
