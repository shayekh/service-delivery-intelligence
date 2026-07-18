"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { createProjectAction } from "@/app/(app)/dashboard/actions";
import type { AnalysisMode, ReviewCadence, User } from "@/types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const QUARTERS = ["Q1", "Q2", "Q3", "Q4"] as const;
const CURRENT_YEAR = new Date().getFullYear();

interface FormErrors {
  projectName?: string;
  customerName?: string;
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

export function NewProjectModal({
  open,
  onClose,
  pmUsers,
  tlUsers,
  currentUserId,
}: {
  open: boolean;
  onClose: () => void;
  pmUsers: User[];
  tlUsers: User[];
  currentUserId: string;
}) {
  const router = useRouter();

  const [projectName, setProjectName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [cadence, setCadence] = useState<ReviewCadence>("quarterly");
  const [quarter, setQuarter] = useState<(typeof QUARTERS)[number]>("Q1");
  const [year, setYear] = useState(CURRENT_YEAR);
  const [assignedPm, setAssignedPm] = useState("");
  const [assignedTl, setAssignedTl] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [analysisMode] = useState<AnalysisMode>("deterministic");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function resetForm() {
    setProjectName("");
    setCustomerName("");
    setCadence("quarterly");
    setQuarter("Q1");
    setYear(CURRENT_YEAR);
    setAssignedPm("");
    setAssignedTl("");
    setEmails([]);
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
    if (!customerName.trim()) nextErrors.customerName = "Customer name is required.";
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
      await createProjectAction({
        project_name: projectName.trim(),
        customer_name: customerName.trim(),
        review_cadence: cadence,
        quarter: `${quarter} ${year}`,
        assigned_pm: assignedPm,
        assigned_tl: assignedTl,
        recipient_emails: emails,
        created_by: currentUserId,
        analysis_mode: analysisMode,
      });

      resetForm();
      onClose();
      router.refresh();
    } catch (err) {
      setErrors({
        form: err instanceof Error ? err.message : "Could not create project.",
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
          <h2 className="text-lg font-semibold text-slate-800">New Project</h2>
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
          id="new-project-form"
          onSubmit={handleSubmit}
          className="flex-1 space-y-4 overflow-y-auto px-6 py-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Project Name
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. Northwind Portal Q2 Review"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            {errors.projectName && (
              <p className="mt-1 text-sm text-red-600">{errors.projectName}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Customer Name
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Northwind Industries"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            {errors.customerName && (
              <p className="mt-1 text-sm text-red-600">{errors.customerName}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Delivery Cadence
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
              Assign PM
            </label>
            <select
              value={assignedPm}
              onChange={(e) => setAssignedPm(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select Product Manager</option>
              {pmUsers.map((pm) => (
                <option key={pm.id} value={pm.id}>
                  {pm.full_name}
                </option>
              ))}
            </select>
            {errors.assignedPm && (
              <p className="mt-1 text-sm text-red-600">{errors.assignedPm}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Assign TL
            </label>
            <select
              value={assignedTl}
              onChange={(e) => setAssignedTl(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select Tech Lead</option>
              {tlUsers.map((tl) => (
                <option key={tl.id} value={tl.id}>
                  {tl.full_name}
                </option>
              ))}
            </select>
            {errors.assignedTl && (
              <p className="mt-1 text-sm text-red-600">{errors.assignedTl}</p>
            )}
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
                <span className="block pr-20 text-sm font-semibold text-slate-400">Investigative</span>
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
            form="new-project-form"
            disabled={isSubmitting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600/90 disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Create Project"}
          </button>
        </div>
      </div>
    </>
  );
}
