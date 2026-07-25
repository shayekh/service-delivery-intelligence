"use client";

import { useState, useMemo, useEffect, useRef, type MouseEvent as ReactMouseEvent, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown, Check, ChevronLeft, ChevronRight, FolderOpen, Filter, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/StatusChip";
import { DeleteProjectButton } from "@/components/dashboard/DeleteProjectButton";
import { getInitials } from "@/lib/utils";
import { BUSINESS_UNITS, type ProjectWithAssignees, type User } from "@/types";

const LEGEND_ITEMS = [
  { label: "Not started", color: "bg-slate-400" },
  { label: "One role submitted", color: "bg-amber-400" },
  { label: "Both submitted", color: "bg-indigo-500" },
  { label: "Report ready", color: "bg-green-500" },
  { label: "Processing", color: "bg-purple-500" },
  { label: "Report sent", color: "bg-blue-500" },
];

const STATUS_OPTIONS = [
  { value: "not_started", label: "Not started" },
  { value: "awaiting_pm", label: "Awaiting PM" },
  { value: "awaiting_tl", label: "Awaiting TL" },
  { value: "processing", label: "Processing" },
  { value: "ready", label: "Report ready" },
  { value: "sent", label: "Report sent" },
];

const BUSINESS_UNIT_OPTIONS = BUSINESS_UNITS.map((unit) => ({
  value: unit,
  label: unit,
}));

interface FilterOption {
  value: string;
  label: string;
}

function ColumnFilterPopover({
  options,
  selected,
  onApply,
  onClose,
  anchorRect,
  popoverRef,
}: {
  options: FilterOption[];
  selected: string[];
  onApply: (values: string[]) => void;
  onClose: () => void;
  anchorRect: { top: number; left: number };
  popoverRef: RefObject<HTMLDivElement>;
}) {
  const [draft, setDraft] = useState<string[]>(selected);
  const [query, setQuery] = useState("");

  const q = query.toLowerCase().trim();
  const visibleOptions = options.filter(
    (opt) => draft.includes(opt.value) || opt.label.toLowerCase().includes(q)
  );
  const allVisibleSelected =
    visibleOptions.length > 0 && visibleOptions.every((opt) => draft.includes(opt.value));

  function toggleValue(value: string) {
    setDraft((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  function toggleSelectAll() {
    if (allVisibleSelected) {
      const visibleValues = new Set(visibleOptions.map((o) => o.value));
      setDraft((prev) => prev.filter((v) => !visibleValues.has(v)));
    } else {
      setDraft((prev) => [
        ...prev,
        ...visibleOptions.map((o) => o.value).filter((v) => !prev.includes(v)),
      ]);
    }
  }

  return createPortal(
    <div
      ref={popoverRef}
      style={{ position: "fixed", top: anchorRect.top, left: anchorRect.left }}
      className="z-50 w-64 rounded-lg border border-slate-200 bg-white p-3 text-left normal-case tracking-normal shadow-lg"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="relative mb-2">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search values…"
          className="w-full rounded-md border border-slate-200 py-1.5 pl-8 pr-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="h-56 overflow-y-auto">
        <label className="flex cursor-pointer items-center gap-2 border-b border-slate-100 py-1.5 text-sm font-medium text-slate-800">
          <span
            onClick={toggleSelectAll}
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
              allVisibleSelected ? "border-blue-600 bg-blue-600" : "border-slate-300 bg-white"
            }`}
          >
            {allVisibleSelected && <Check className="h-3 w-3 text-white" />}
          </span>
          (Select all)
        </label>
        {visibleOptions.map((opt) => {
          const checked = draft.includes(opt.value);
          return (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-2 py-1 text-sm text-slate-700"
            >
              <span
                onClick={() => toggleValue(opt.value)}
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                  checked ? "border-blue-600 bg-blue-600" : "border-slate-300 bg-white"
                }`}
              >
                {checked && <Check className="h-3 w-3 text-white" />}
              </span>
              <span className="truncate">{opt.label}</span>
            </label>
          );
        })}
        {visibleOptions.length === 0 && (
          <p className="py-2 text-sm text-slate-400">No matches.</p>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={() => {
            onApply([]);
            onClose();
          }}
          className="text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={() => {
            onApply(draft);
            onClose();
          }}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Apply
        </button>
      </div>
    </div>,
    document.body
  );
}

function ColumnHeaderFilter({
  columnKey,
  label,
  options,
  selected,
  onApply,
  openColumn,
  setOpenColumn,
  extra,
}: {
  columnKey: string;
  label: string;
  options: FilterOption[];
  selected: string[];
  onApply: (values: string[]) => void;
  openColumn: string | null;
  setOpenColumn: (v: string | null) => void;
  extra?: ReactNode;
}) {
  const isOpen = openColumn === columnKey;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [anchorRect, setAnchorRect] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleOutsideClick(e: MouseEvent) {
      const target = e.target as Node;
      if (popoverRef.current?.contains(target)) return;
      if (buttonRef.current?.contains(target)) return;
      setOpenColumn(null);
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen, setOpenColumn]);

  function handleToggle(e: ReactMouseEvent) {
    e.stopPropagation();
    if (isOpen) {
      setOpenColumn(null);
      return;
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const POPOVER_WIDTH = 256;
    const MARGIN = 8;
    const left = Math.min(
      Math.max(rect.right - POPOVER_WIDTH, MARGIN),
      window.innerWidth - POPOVER_WIDTH - MARGIN
    );
    setAnchorRect({ top: rect.bottom + 4, left });
    setOpenColumn(columnKey);
  }

  return (
    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
      <div className="flex items-center gap-1.5">
        {extra ?? <span>{label}</span>}
        <button
          ref={buttonRef}
          type="button"
          onClick={handleToggle}
          className={`rounded p-0.5 ${
            selected.length > 0 ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
          }`}
          aria-label={`Filter ${label}`}
        >
          <Filter className="h-3.5 w-3.5" />
        </button>
      </div>
      {isOpen && anchorRect && (
        <ColumnFilterPopover
          options={options}
          selected={selected}
          onApply={onApply}
          onClose={() => setOpenColumn(null)}
          anchorRect={anchorRect}
          popoverRef={popoverRef}
        />
      )}
    </th>
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
    <Button
      variant="outline"
      className={`${ACTION_BTN_OUTLINE} border-transparent bg-slate-100 text-slate-600 hover:bg-slate-100 hover:text-slate-600`}
      disabled
    >
      No Access
    </Button>
  );
}

function deriveStatus(project: ProjectWithAssignees): string {
  if (!project.pm_submitted && !project.tl_submitted) return "not_started";
  return project.status;
}

function quarterSortValue(quarter: string): number {
  const match = quarter.match(/Q(\d)\s*(\d{4})/);
  if (!match) return 0;
  const [, q, year] = match;
  return Number(year) * 10 + Number(q);
}

type SortDirection = "asc" | "desc" | null;

export function ProjectsTable({
  projects,
  currentUser,
}: {
  projects: ProjectWithAssignees[];
  currentUser: User;
}) {
  const [search, setSearch] = useState("");
  const [openColumn, setOpenColumn] = useState<string | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({
    project: [],
    accountName: [],
    businessUnit: [],
    quarter: [],
    productManager: [],
    techLead: [],
    status: [],
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [quarterSort, setQuarterSort] = useState<SortDirection>(null);

  function setColumnFilter(key: string, values: string[]) {
    setColumnFilters((prev) => ({ ...prev, [key]: values }));
  }

  const columnOptions = useMemo(() => {
    function uniqueOptions(values: (string | null | undefined)[]): FilterOption[] {
      const unique = Array.from(new Set(values.filter((v): v is string => !!v)));
      unique.sort((a, b) => a.localeCompare(b));
      return unique.map((v) => ({ value: v, label: v }));
    }

    return {
      project: uniqueOptions(projects.map((p) => p.project_name)),
      accountName: uniqueOptions(projects.map((p) => p.customer_name)),
      businessUnit: BUSINESS_UNIT_OPTIONS,
      quarter: uniqueOptions(projects.map((p) => p.quarter)).sort(
        (a, b) => quarterSortValue(a.value) - quarterSortValue(b.value)
      ),
      productManager: uniqueOptions(projects.map((p) => p.assigned_pm_name)),
      techLead: uniqueOptions(projects.map((p) => p.assigned_tl_name)),
      status: STATUS_OPTIONS,
    };
  }, [projects]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const result = projects.filter((p) => {
      const statusLabel =
        STATUS_OPTIONS.find((opt) => opt.value === deriveStatus(p))?.label ?? "";

      const matchesSearch =
        !q ||
        p.project_name.toLowerCase().includes(q) ||
        (p.customer_name ?? "").toLowerCase().includes(q) ||
        (p.business_unit ?? "").toLowerCase().includes(q) ||
        p.quarter.toLowerCase().includes(q) ||
        (p.assigned_pm_name ?? "").toLowerCase().includes(q) ||
        (p.assigned_tl_name ?? "").toLowerCase().includes(q) ||
        statusLabel.toLowerCase().includes(q);

      const matchesProject =
        columnFilters.project.length === 0 ||
        columnFilters.project.includes(p.project_name);

      const matchesAccountName =
        columnFilters.accountName.length === 0 ||
        columnFilters.accountName.includes(p.customer_name);

      const matchesBusinessUnit =
        columnFilters.businessUnit.length === 0 ||
        (!!p.business_unit && columnFilters.businessUnit.includes(p.business_unit));

      const matchesQuarter =
        columnFilters.quarter.length === 0 || columnFilters.quarter.includes(p.quarter);

      const matchesPm =
        columnFilters.productManager.length === 0 ||
        (!!p.assigned_pm_name && columnFilters.productManager.includes(p.assigned_pm_name));

      const matchesTl =
        columnFilters.techLead.length === 0 ||
        (!!p.assigned_tl_name && columnFilters.techLead.includes(p.assigned_tl_name));

      const matchesStatus =
        columnFilters.status.length === 0 || columnFilters.status.includes(deriveStatus(p));

      return (
        matchesSearch &&
        matchesProject &&
        matchesAccountName &&
        matchesBusinessUnit &&
        matchesQuarter &&
        matchesPm &&
        matchesTl &&
        matchesStatus
      );
    });

    if (quarterSort) {
      result.sort((a, b) => {
        const diff = quarterSortValue(a.quarter) - quarterSortValue(b.quarter);
        return quarterSort === "asc" ? diff : -diff;
      });
    }

    return result;
  }, [projects, search, columnFilters, quarterSort]);

  function toggleQuarterSort() {
    setQuarterSort((prev) => (prev === null ? "asc" : prev === "asc" ? "desc" : null));
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [search, columnFilters, pageSize, quarterSort]);

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
      <div className="sticky top-0 z-20 mb-4 flex flex-wrap items-center gap-4 bg-gray-50 py-2">
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
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow">
        <table className="w-full divide-y divide-gray-100">
          <thead className="sticky top-0 z-10 bg-gray-50">
            <tr onClick={() => setOpenColumn(null)}>
              <ColumnHeaderFilter
                columnKey="project"
                label="Project"
                options={columnOptions.project}
                selected={columnFilters.project}
                onApply={(v) => setColumnFilter("project", v)}
                openColumn={openColumn}
                setOpenColumn={setOpenColumn}
              />
              <ColumnHeaderFilter
                columnKey="accountName"
                label="Account Name"
                options={columnOptions.accountName}
                selected={columnFilters.accountName}
                onApply={(v) => setColumnFilter("accountName", v)}
                openColumn={openColumn}
                setOpenColumn={setOpenColumn}
              />
              <ColumnHeaderFilter
                columnKey="businessUnit"
                label="Business Unit"
                options={columnOptions.businessUnit}
                selected={columnFilters.businessUnit}
                onApply={(v) => setColumnFilter("businessUnit", v)}
                openColumn={openColumn}
                setOpenColumn={setOpenColumn}
              />
              <ColumnHeaderFilter
                columnKey="quarter"
                label="Quarter"
                options={columnOptions.quarter}
                selected={columnFilters.quarter}
                onApply={(v) => setColumnFilter("quarter", v)}
                openColumn={openColumn}
                setOpenColumn={setOpenColumn}
                extra={
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleQuarterSort();
                    }}
                    className="flex items-center gap-1 hover:text-slate-700"
                  >
                    Quarter
                    {quarterSort === "asc" ? (
                      <ArrowUp className="h-3.5 w-3.5" />
                    ) : quarterSort === "desc" ? (
                      <ArrowDown className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 text-slate-300" />
                    )}
                  </button>
                }
              />
              <ColumnHeaderFilter
                columnKey="productManager"
                label="Product Manager"
                options={columnOptions.productManager}
                selected={columnFilters.productManager}
                onApply={(v) => setColumnFilter("productManager", v)}
                openColumn={openColumn}
                setOpenColumn={setOpenColumn}
              />
              <ColumnHeaderFilter
                columnKey="techLead"
                label="Tech Lead"
                options={columnOptions.techLead}
                selected={columnFilters.techLead}
                onApply={(v) => setColumnFilter("techLead", v)}
                openColumn={openColumn}
                setOpenColumn={setOpenColumn}
              />
              <ColumnHeaderFilter
                columnKey="status"
                label="Status"
                options={columnOptions.status}
                selected={columnFilters.status}
                onApply={(v) => setColumnFilter("status", v)}
                openColumn={openColumn}
                setOpenColumn={setOpenColumn}
              />
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-10 text-center text-sm text-slate-400">
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
                      <p className="font-medium text-slate-800">
                        {project.project_name}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-800">
                    {project.customer_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-800">
                    {project.business_unit || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-800">
                    {project.quarter}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-800">
                    {project.assigned_pm_name || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-800">
                    {project.assigned_tl_name || "—"}
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
