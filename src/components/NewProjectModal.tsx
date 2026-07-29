"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { createProjectAction, updateProjectAction } from "@/app/(app)/dashboard/actions";
import { BUSINESS_UNITS, type AnalysisMode, type Project, type ReviewCadence, type User } from "@/types";

function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = options.find((o) => o.value === value);
  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2 text-left outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
          !selected && "text-slate-400"
        )}
      >
        <span>{selected ? selected.label : placeholder}</span>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>

      {open && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="w-full text-sm outline-none"
            />
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-sm text-slate-400">No matches found.</div>
            )}
            {filtered.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                  setQuery("");
                }}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
              >
                {option.label}
                {option.value === value && <Check className="h-4 w-4 text-blue-600" />}
              </button>
            ))}
          </div>
        </div>
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const QUARTERS = ["Q1", "Q2", "Q3", "Q4"] as const;
const CURRENT_YEAR = new Date().getFullYear();

interface FormErrors {
  projectName?: string;
  customerName?: string;
  businessUnit?: string;
  assignedPm?: string;
  assignedTl?: string;
  email?: string;
  form?: string;
}

function EmailTagInput({
  emails,
  onAdd,
  onRemove,
  error,
}: {
  emails: string[];
  onAdd: (email: string) => string | null;
  onRemove: (email: string) => void;
  error?: string;
}) {
  const [draft, setDraft] = useState("");

  function tryAddDraft() {
    const value = draft.trim().replace(/,$/, "");
    if (!value) return;
    const addError = onAdd(value);
    if (!addError) setDraft("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      tryAddDraft();
    }
  }

  return (
    <div>
      <div className="flex w-full flex-wrap gap-2 rounded-lg border border-slate-300 px-3 py-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
        {emails.map((email) => (
          <span
            key={email}
            className="flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm text-blue-700"
          >
            {email}
            <button
              type="button"
              onClick={() => onRemove(email)}
              aria-label={`Remove ${email}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={tryAddDraft}
          placeholder={emails.length === 0 ? "name@company.com" : ""}
          className="min-w-[120px] flex-1 outline-none"
        />
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Add stakeholder emails — they&apos;ll receive the final PDF
      </p>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function parseQuarter(quarter: string): { q: (typeof QUARTERS)[number]; year: number } {
  const match = quarter.match(/Q([1-4])\s*(\d{4})/);
  if (!match) return { q: "Q1", year: CURRENT_YEAR };
  return { q: `Q${match[1]}` as (typeof QUARTERS)[number], year: Number(match[2]) };
}

export function NewProjectModal({
  open,
  onClose,
  pmUsers,
  tlUsers,
  currentUserId,
  project,
}: {
  open: boolean;
  onClose: () => void;
  pmUsers: User[];
  tlUsers: User[];
  currentUserId: string;
  project?: Project;
}) {
  const router = useRouter();
  const isEditMode = !!project;
  const formId = `new-project-form-${useId()}`;

  function initialState() {
    if (!project) {
      return {
        projectName: "",
        customerName: "",
        businessUnit: "",
        cadence: "quarterly" as ReviewCadence,
        quarter: "Q1" as (typeof QUARTERS)[number],
        year: CURRENT_YEAR,
        assignedPm: "",
        assignedTl: "",
        emails: [] as string[],
      };
    }
    const { q, year } = parseQuarter(project.quarter);
    return {
      projectName: project.project_name,
      customerName: project.customer_name,
      businessUnit: project.business_unit ?? "",
      cadence: project.review_cadence,
      quarter: q,
      year,
      assignedPm: project.assigned_pm ?? "",
      assignedTl: project.assigned_tl ?? "",
      emails: project.recipient_emails ?? [],
    };
  }

  const initial = initialState();

  const [projectName, setProjectName] = useState(initial.projectName);
  const [customerName, setCustomerName] = useState(initial.customerName);
  const [businessUnit, setBusinessUnit] = useState(initial.businessUnit);
  const [cadence, setCadence] = useState<ReviewCadence>(initial.cadence);
  const [quarter, setQuarter] = useState<(typeof QUARTERS)[number]>(initial.quarter);
  const [year, setYear] = useState(initial.year);
  const [assignedPm, setAssignedPm] = useState(initial.assignedPm);
  const [assignedTl, setAssignedTl] = useState(initial.assignedTl);
  const [emails, setEmails] = useState<string[]>(initial.emails);
  const [analysisMode] = useState<AnalysisMode>("deterministic");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function resetForm() {
    const fresh = initialState();
    setProjectName(fresh.projectName);
    setCustomerName(fresh.customerName);
    setBusinessUnit(fresh.businessUnit);
    setCadence(fresh.cadence);
    setQuarter(fresh.quarter);
    setYear(fresh.year);
    setAssignedPm(fresh.assignedPm);
    setAssignedTl(fresh.assignedTl);
    setEmails(fresh.emails);
    setErrors({});
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function handleAddEmail(email: string): string | null {
    if (!EMAIL_REGEX.test(email)) {
      setErrors((prev) => ({ ...prev, email: "Enter a valid email address." }));
      return "invalid";
    }
    if (emails.includes(email)) {
      setErrors((prev) => ({ ...prev, email: undefined }));
      return null;
    }
    setEmails((prev) => [...prev, email]);
    setErrors((prev) => ({ ...prev, email: undefined }));
    return null;
  }

  function handleRemoveEmail(email: string) {
    setEmails((prev) => prev.filter((e) => e !== email));
  }

  function validate(): FormErrors {
    const nextErrors: FormErrors = {};
    if (!projectName.trim()) nextErrors.projectName = "Project name is required.";
    if (!customerName.trim()) nextErrors.customerName = "Account name is required.";
    if (!businessUnit) nextErrors.businessUnit = "Business unit is required.";
    if (!assignedPm) nextErrors.assignedPm = "Select a Product Manager.";
    if (!assignedTl) nextErrors.assignedTl = "Select a Tech Lead.";
    return nextErrors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validate();
    setErrors((prev) => ({ ...prev, ...validationErrors, form: undefined }));
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);

    try {
      const input = {
        project_name: projectName.trim(),
        customer_name: customerName.trim(),
        business_unit: businessUnit,
        review_cadence: cadence,
        quarter: `${quarter} ${year}`,
        assigned_pm: assignedPm,
        assigned_tl: assignedTl,
        recipient_emails: emails,
        created_by: currentUserId,
        analysis_mode: analysisMode,
      };

      if (isEditMode && project) {
        await updateProjectAction(project.id, input);
      } else {
        await createProjectAction(input);
      }

      resetForm();
      onClose();
      router.refresh();
    } catch (err) {
      setErrors({
        form:
          err instanceof Error
            ? err.message
            : `Could not ${isEditMode ? "update" : "create"} project.`,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ease-in-out",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={handleClose}
      />

      <div
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-[480px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">
            {isEditMode ? "Edit Project" : "New Project"}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          id={formId}
          onSubmit={handleSubmit}
          className="flex-1 space-y-4 overflow-y-auto px-6 py-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Account Name
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Service 7000 AG"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            {errors.customerName && (
              <p className="mt-1 text-sm text-red-600">{errors.customerName}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Project Name
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. Customer Portal"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            {errors.projectName && (
              <p className="mt-1 text-sm text-red-600">{errors.projectName}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Business Unit
            </label>
            <SearchableSelect
              value={businessUnit}
              onChange={setBusinessUnit}
              options={BUSINESS_UNITS.map((unit) => ({ value: unit, label: unit }))}
              placeholder="Select business unit"
              error={errors.businessUnit}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Delivery Schedule
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(["monthly", "quarterly"] as ReviewCadence[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setCadence(option)}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium capitalize transition-colors",
                    cadence === option
                      ? "bg-blue-600 text-white"
                      : "border border-slate-300 text-slate-600"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Quarter
            </label>
            <div className="flex gap-3">
              <div className="grid flex-1 grid-cols-4 gap-2">
                {QUARTERS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuarter(q)}
                    className={cn(
                      "rounded-lg px-2 py-2 text-sm font-medium transition-colors",
                      quarter === q
                        ? "bg-blue-600 text-white"
                        : "border border-slate-300 text-slate-600"
                    )}
                  >
                    {q}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-24 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Assign Product Manager
            </label>
            <SearchableSelect
              value={assignedPm}
              onChange={setAssignedPm}
              options={pmUsers.map((pm) => ({ value: pm.id, label: pm.full_name }))}
              placeholder="Select Product Manager"
              error={errors.assignedPm}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Assign Tech Lead
            </label>
            <SearchableSelect
              value={assignedTl}
              onChange={setAssignedTl}
              options={tlUsers.map((tl) => ({ value: tl.id, label: tl.full_name }))}
              placeholder="Select Tech Lead"
              error={errors.assignedTl}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Recipient Emails
            </label>
            <EmailTagInput
              emails={emails}
              onAdd={handleAddEmail}
              onRemove={handleRemoveEmail}
              error={errors.email}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Analysis Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="rounded-lg border-2 border-blue-600 bg-blue-50 px-3 py-3 text-left transition-colors"
              >
                <span className="block text-sm font-semibold text-blue-700">Standard</span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  Structured, rule-based analysis with consistent, reproducible outputs.
                </span>
              </button>
              <div className="relative cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 opacity-60">
                <span className="absolute right-2 top-2 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Coming Soon
                </span>
                <span className="block pr-20 text-sm font-semibold text-slate-400">Adaptive</span>
                <span className="mt-0.5 block text-xs text-slate-400">
                  Agentic AI analysis with historical trend awareness. Autonomously investigates gaps, conflicts, and patterns across reviews.
                </span>
              </div>
            </div>
          </div>

          {errors.form && <p className="text-sm text-red-600">{errors.form}</p>}
        </form>

        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form={formId}
            disabled={isSubmitting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600/90 disabled:opacity-50"
          >
            {isSubmitting
              ? isEditMode
                ? "Saving..."
                : "Creating..."
              : isEditMode
                ? "Save Changes"
                : "Create Project"}
          </button>
        </div>
      </div>
    </>
  );
}
