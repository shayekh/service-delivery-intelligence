import Link from "next/link";
import { Check, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/StatusChip";
import { DeleteProjectButton } from "@/components/dashboard/DeleteProjectButton";
import { getInitials } from "@/lib/utils";
import type { ProjectWithAssignees, User } from "@/types";

const LEGEND_ITEMS = [
  { label: "Not started", color: "bg-slate-400" },
  { label: "One role submitted", color: "bg-amber-400" },
  { label: "Both submitted / ready", color: "bg-green-500" },
  { label: "Report sent", color: "bg-blue-500" },
];

function StatusLegend() {
  return (
    <div className="mb-4 flex gap-4 text-xs text-slate-500">
      {LEGEND_ITEMS.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${item.color}`} />
          {item.label}
        </div>
      ))}
    </div>
  );
}

function SubmissionCell({ submitted }: { submitted: boolean }) {
  if (submitted) {
    return (
      <span className="flex items-center gap-1.5 text-sm text-green-600">
        <Check className="h-4 w-4" />
        Submitted
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5 text-sm text-slate-400">
      <span className="h-2 w-2 rounded-full bg-slate-300" />
      Not started
    </span>
  );
}

function ActionCell({
  project,
  currentUser,
}: {
  project: ProjectWithAssignees;
  currentUser: User;
}) {
  const isAssignedPm = project.assigned_pm === currentUser.id;
  const isAssignedTl = project.assigned_tl === currentUser.id;

  if (isAssignedPm) {
    if (!project.pm_submitted) {
      return (
        <Button
          render={<Link href={`/projects/${project.id}/pm`} />}
          className="bg-blue-600 text-white hover:bg-blue-600/90"
        >
          {project.pm_draft ? "Continue" : "Fill your section"}
        </Button>
      );
    }

    if (!project.tl_submitted) {
      return (
        <Button variant="outline" disabled>
          View progress
        </Button>
      );
    }

    return (
      <Button
        render={<Link href={`/projects/${project.id}`} />}
        className="bg-blue-600 text-white hover:bg-blue-600/90"
      >
        View Report
      </Button>
    );
  }

  if (isAssignedTl) {
    if (!project.tl_submitted) {
      return (
        <Button
          render={<Link href={`/projects/${project.id}/tl`} />}
          className="bg-blue-600 text-white hover:bg-blue-600/90"
        >
          {project.tl_draft ? "Continue" : "Fill your section"}
        </Button>
      );
    }

    if (!project.pm_submitted) {
      return (
        <Button variant="outline" disabled>
          View progress
        </Button>
      );
    }

    return (
      <Button
        render={<Link href={`/projects/${project.id}`} />}
        className="bg-blue-600 text-white hover:bg-blue-600/90"
      >
        View Report
      </Button>
    );
  }

  if (project.status === "ready" || project.status === "sent") {
    return (
      <Button render={<Link href={`/projects/${project.id}`} />} variant="outline">
        View Report
      </Button>
    );
  }

  return null;
}

export function ProjectsTable({
  projects,
  currentUser,
}: {
  projects: ProjectWithAssignees[];
  currentUser: User;
}) {
  if (projects.length === 0) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center rounded-xl bg-white text-center shadow">
        <FolderOpen className="h-16 w-16 text-slate-300" />
        {currentUser.role === "product_manager" && (
          <>
            <p className="mt-4 text-lg font-medium text-slate-500">
              No projects yet
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Click &apos;Add Project&apos; to create your first project review
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      <StatusLegend />

      <div className="overflow-hidden rounded-xl bg-white shadow">
        <table className="w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              {[
                "Project",
                "Quarter",
                "Product Manager",
                "Tech Lead",
                "Status",
                "Action",
              ].map((heading) => (
                <th
                  key={heading}
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {projects.map((project) => (
              <tr key={project.id} className="transition hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                      {getInitials(project.project_name)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">
                        {project.project_name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {project.customer_name}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-800">
                  {project.quarter}
                </td>
                <td className="px-6 py-4">
                  <SubmissionCell submitted={project.pm_submitted} />
                </td>
                <td className="px-6 py-4">
                  <SubmissionCell submitted={project.tl_submitted} />
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <StatusChip project={project} />
                    {project.status === "ready" && project.manual_email_sent_at && (
                      <span className="text-xs text-slate-400">✓ manually sent</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <ActionCell project={project} currentUser={currentUser} />
                    {(project.assigned_pm === currentUser.id ||
                      project.assigned_tl === currentUser.id) &&
                      !project.pm_submitted &&
                      !project.tl_submitted && (
                        <DeleteProjectButton
                          projectId={project.id}
                          projectName={project.project_name}
                        />
                      )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
