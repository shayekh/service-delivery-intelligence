"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, FolderOpen, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/StatusChip";
import { DeleteProjectButton } from "@/components/dashboard/DeleteProjectButton";
import { getInitials } from "@/lib/utils";
import type { ProjectWithAssignees, User } from "@/types";

const LEGEND_ITEMS = [
  { label: "Not started", color: "bg-slate-400" },
  { label: "One role submitted", color: "bg-amber-400" },
  { label: "Both submitted / ready", color: "bg-green-500" },
  { label: "Processing", color: "bg-purple-500" },
  { label: "Report sent", color: "bg-blue-500" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "not_started", label: "Not started" },
  { value: "awaiting_pm", label: "Awaiting PM" },
  { value: "awaiting_tl", label: "Awaiting TL" },
  { value: "processing", label: "Processing" },
  { value: "ready", label: "Report ready" },
  { value: "sent", label: "Report sent" },
];


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

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const ACTION_BTN = "w-32 justify-center bg-blue-600 text-white hover:bg-blue-600/90";
const ACTION_BTN_OUTLINE = "w-32 justify-center";

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
        <Button render={<Link href={`/projects/${project.id}/pm`} />} className={ACTION_BTN}>
          {project.pm_draft ? "Continue" : "Fill your section"}
        </Button>
      );
    }

    if (!project.tl_submitted) {
      return (
        <Button variant="outline" className={ACTION_BTN_OUTLINE} disabled>
          View progress
        </Button>
      );
    }

    return (
      <Button render={<Link href={`/projects/${project.id}`} />} className={ACTION_BTN}>
        View Report
      </Button>
    );
  }

  if (isAssignedTl) {
    if (!project.tl_submitted) {
      return (
        <Button render={<Link href={`/projects/${project.id}/tl`} />} className={ACTION_BTN}>
          {project.tl_draft ? "Continue" : "Fill your section"}
        </Button>
      );
    }

    if (!project.pm_submitted) {
      return (
        <Button variant="outline" className={ACTION_BTN_OUTLINE} disabled>
          View progress
        </Button>
      );
    }

    return (
      <Button render={<Link href={`/projects/${project.id}`} />} className={ACTION_BTN}>
        View Report
      </Button>
    );
  }

  if (project.status === "ready" || project.status === "sent") {
    return (
      <Button render={<Link href={`/projects/${project.id}`} />} variant="outline" className={ACTION_BTN_OUTLINE}>
        View Report
      </Button>
    );
  }

  return (
    <Button variant="outline" className={ACTION_BTN_OUTLINE} disabled>
      No Access
    </Button>
  );
}

function deriveStatus(project: ProjectWithAssignees): string {
  if (!project.pm_submitted && !project.tl_submitted) return "not_started";
  return project.status;
}

export function ProjectsTable({
  projects,
  currentUser,
}: {
  projects: ProjectWithAssignees[];
  currentUser: User;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return projects.filter((p) => {
      const matchesSearch =
        !q ||
        p.project_name.toLowerCase().includes(q) ||
        (p.customer_name ?? "").toLowerCase().includes(q) ||
        (p.assigned_pm_name ?? "").toLowerCase().includes(q) ||
        (p.assigned_tl_name ?? "").toLowerCase().includes(q);

      const matchesStatus = !statusFilter || deriveStatus(p) === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [projects, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginated = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize]
  );

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
      <div className="mb-4 flex flex-wrap items-center gap-4">
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mr-2">
          {LEGEND_ITEMS.map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${item.color}`} />
              {item.label}
            </div>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-3">
        <div className="relative min-w-[300px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-8 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        </div>
      </div>

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
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-400">
                  No projects match your search.
                </td>
              </tr>
            ) : (
              paginated.map((project) => (
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <p className="text-sm text-slate-500">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <span>Rows per page</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="rounded-lg border border-slate-200 bg-white py-1 pl-2 pr-6 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium ${
                  n === page
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
