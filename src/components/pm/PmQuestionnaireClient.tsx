"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuestionStep } from "@/components/QuestionStep";
import { ProgressBar } from "@/components/ProgressBar";
import { SubmittingOverlay } from "@/components/SubmittingOverlay";
import { Button } from "@/components/ui/button";
import { MetricsTable, type MetricRow } from "@/components/MetricsTable";
import { WorkstreamTable, type WorkstreamRow } from "@/components/WorkstreamTable";
import {
  CustomerFeedbackFields,
  type CustomerFeedback,
} from "@/components/CustomerFeedbackFields";
import {
  savePmDraftAction,
  submitPmAnswersAction,
} from "@/app/projects/[id]/pm/actions";
import type { PmAnswers, Project, StatusColor, User } from "@/types";

const TOTAL_STEPS = 11;
type ChoiceValue = StatusColor | "";

function parseWorkstreams(raw: string | null): WorkstreamRow[] {
  if (!raw) {
    return [
      { workstream: "", status: "", summary: "", notes: "" },
      { workstream: "", status: "", summary: "", notes: "" },
    ];
  }
  try {
    return JSON.parse(raw) as WorkstreamRow[];
  } catch {
    return [];
  }
}

function parseMetrics(raw: string | null): MetricRow[] {
  if (!raw) {
    return [
      { metric: "CSAT Score", target: "", actual: "", comment: "" },
      { metric: "SLA Compliance %", target: "", actual: "", comment: "" },
      { metric: "Release Success Rate", target: "", actual: "", comment: "" },
    ];
  }
  try {
    return JSON.parse(raw) as MetricRow[];
  } catch {
    return [];
  }
}

function parseFeedback(raw: string | null): CustomerFeedback {
  const empty: CustomerFeedback = {
    satisfaction: "",
    communication: "",
    responsiveness: "",
    business_alignment: "",
    areas_of_concern: "",
  };
  if (!raw) return empty;
  try {
    return { ...empty, ...JSON.parse(raw) };
  } catch {
    return empty;
  }
}

const CHOICE_OPTIONS: {
  value: StatusColor;
  label: string;
  border: string;
  bg: string;
  dot: string;
}[] = [
  {
    value: "Green",
    label: "On Track",
    border: "border-green-500",
    bg: "bg-green-50",
    dot: "bg-green-500",
  },
  {
    value: "Amber",
    label: "At Risk",
    border: "border-amber-500",
    bg: "bg-amber-50",
    dot: "bg-amber-500",
  },
  {
    value: "Red",
    label: "Critical",
    border: "border-red-500",
    bg: "bg-red-50",
    dot: "bg-red-500",
  },
];

const HEALTH_OPTIONS: {
  value: StatusColor;
  label: string;
  border: string;
  bg: string;
  dot: string;
}[] = [
  {
    value: "Green",
    label: "Strong",
    border: "border-green-500",
    bg: "bg-green-50",
    dot: "bg-green-500",
  },
  {
    value: "Amber",
    label: "Needs Attention",
    border: "border-amber-500",
    bg: "bg-amber-50",
    dot: "bg-amber-500",
  },
  {
    value: "Red",
    label: "At Risk",
    border: "border-red-500",
    bg: "bg-red-50",
    dot: "bg-red-500",
  },
];

function ChoiceCards({
  options,
  value,
  onChange,
}: {
  options: typeof CHOICE_OPTIONS;
  value: ChoiceValue;
  onChange: (value: StatusColor) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "cursor-pointer rounded-xl border-2 p-4 text-center transition",
            value === option.value
              ? `${option.border} ${option.bg}`
              : "border-slate-200 bg-white"
          )}
        >
          <span className={cn("mx-auto mb-2 block h-3 w-3 rounded-full", option.dot)} />
          <span className="text-sm font-medium text-slate-800">{option.label}</span>
        </button>
      ))}
    </div>
  );
}

const MAX_ANSWER_LENGTH = 1500;

function AnswerTextarea({
  value,
  onChange,
  placeholder,
  minHeightClass = "min-h-40",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  minHeightClass?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-600">
        Your answer
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={MAX_ANSWER_LENGTH}
        className={cn(
          "w-full resize-y rounded-lg border border-slate-200 p-4 text-sm outline-none focus:border-blue-400",
          minHeightClass
        )}
      />
      <div className="mt-1 flex justify-end text-xs text-slate-400">
        <span>
          {value.length} / {MAX_ANSWER_LENGTH}
        </span>
      </div>
    </div>
  );
}

function StepFooter({
  onPrevious,
  onNext,
  nextLabel,
  nextColor,
  saved,
  disabled,
}: {
  onPrevious?: () => void;
  onNext: () => void;
  nextLabel: string;
  nextColor: "blue" | "green";
  saved: boolean;
  disabled?: boolean;
}) {
  return (
    <>
      {onPrevious ? (
        <Button variant="outline" className="flex items-center gap-2 rounded-lg px-4 py-2" onClick={onPrevious}>
          <ArrowLeft className="h-4 w-4" />
          Previous
        </Button>
      ) : (
        <span />
      )}

      <span className="text-sm text-slate-400">{saved ? "Draft saved" : ""}</span>

      <Button
        disabled={disabled}
        className={cn(
          "flex items-center gap-2 rounded-lg px-6 py-2 text-white",
          nextColor === "green"
            ? "bg-green-600 hover:bg-green-600/90"
            : "bg-blue-600 hover:bg-blue-600/90"
        )}
        onClick={onNext}
      >
        {nextLabel}
        {nextColor !== "green" && <ArrowRight className="h-4 w-4" />}
      </Button>
    </>
  );
}

interface SummaryRow {
  step: number;
  label: string;
  preview: React.ReactNode;
}

export function PmQuestionnaireClient({
  project,
  initialAnswers,
  currentUser,
  tlHasSubmitted = false,
}: {
  project: Project;
  initialAnswers: PmAnswers | null;
  currentUser: User;
  tlHasSubmitted?: boolean;
}) {
  const router = useRouter();
  const currentUserId = currentUser.id;
  const defaultPreparedBy = `${currentUser.full_name}, Product Manager`;

  const [showOverwriteModal, setShowOverwriteModal] = useState(
    !!initialAnswers?.submitted_at
  );
  const [currentStep, setCurrentStep] = useState(1);
  const [saveLabel, setSaveLabel] = useState<"idle" | "saved">("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [preparedBy] = useState(initialAnswers?.prepared_by ?? defaultPreparedBy);
  const [pmQ1, setPmQ1] = useState(initialAnswers?.pm_q1 ?? "");
  const [pmQ2, setPmQ2] = useState<ChoiceValue>(initialAnswers?.pm_q2 ?? "");
  const [pmQ2Justification, setPmQ2Justification] = useState(
    initialAnswers?.pm_q2_justification ?? ""
  );
  const [pmQ3, setPmQ3] = useState(initialAnswers?.pm_q3 ?? "");
  const [pmQ4, setPmQ4] = useState(initialAnswers?.pm_q4 ?? "");
  const [workstreams, setWorkstreams] = useState<WorkstreamRow[]>(
    parseWorkstreams(initialAnswers?.pm_q5 ?? null)
  );
  const [metrics, setMetrics] = useState<MetricRow[]>(
    parseMetrics(initialAnswers?.pm_q6 ?? null)
  );
  const [feedback, setFeedback] = useState<CustomerFeedback>(
    parseFeedback(initialAnswers?.pm_q7 ?? null)
  );
  const [pmQ8, setPmQ8] = useState<ChoiceValue>(initialAnswers?.pm_q8 ?? "");
  const [pmQ8Notes, setPmQ8Notes] = useState(initialAnswers?.pm_q8_notes ?? "");
  const [itsmPm1, setItsmPm1] = useState(initialAnswers?.itsm_pm_1 ?? "");
  const [itsmPm2, setItsmPm2] = useState(initialAnswers?.itsm_pm_2 ?? "");
  const [itsmPm3, setItsmPm3] = useState(initialAnswers?.itsm_pm_3 ?? "");
  const [itsmPm4, setItsmPm4] = useState(initialAnswers?.itsm_pm_4 ?? "");
  const [itsmPm5, setItsmPm5] = useState(initialAnswers?.itsm_pm_5 ?? "");
  const [itsmPm6, setItsmPm6] = useState(initialAnswers?.itsm_pm_6 ?? "");
  const [notes, setNotes] = useState(initialAnswers?.pm_q_notes ?? "");

  function buildPayload(): Omit<PmAnswers, "id"> {
    return {
      project_id: project.id,
      prepared_by: preparedBy,
      pm_q1: pmQ1,
      pm_q2: pmQ2 || null,
      pm_q2_justification: pmQ2Justification,
      pm_q3: pmQ3,
      pm_q4: pmQ4,
      pm_q5: JSON.stringify(workstreams),
      pm_q6: JSON.stringify(metrics),
      pm_q7: JSON.stringify(feedback),
      pm_q8: pmQ8 || null,
      pm_q8_notes: pmQ8Notes,
      reporting_period: project.quarter,
      pm_q_notes: notes,
      itsm_pm_1: itsmPm1,
      itsm_pm_2: itsmPm2,
      itsm_pm_3: itsmPm3,
      itsm_pm_4: itsmPm4,
      itsm_pm_5: itsmPm5,
      itsm_pm_6: itsmPm6,
      submitted_by: currentUserId,
      submitted_at: initialAnswers?.submitted_at ?? null,
    };
  }

  async function saveDraft() {
    try {
      await savePmDraftAction(buildPayload());
      setSaveLabel("saved");
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
      savedTimeoutRef.current = setTimeout(() => setSaveLabel("idle"), 2000);
    } catch {
      // Draft save failures are non-blocking — the user can keep working
      // and retry on the next step change.
    }
  }

  async function goToStep(step: number) {
    await saveDraft();
    setCurrentStep(step);
  }

  function validate(): string | null {
    if (!preparedBy.trim()) return "Your name and role is required.";
    if (!pmQ2) return "Delivery status is required.";
    if (!pmQ8) return "Relationship health is required.";
    return null;
  }

  async function handleSubmit() {
    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError(null);
    setIsSubmitting(true);
    try {
      await submitPmAnswersAction(buildPayload());
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not submit review.");
      setIsSubmitting(false);
    }
  }

  function preview(text: string): string {
    return text.length > 100 ? `${text.slice(0, 100)}...` : text || "—";
  }

  function choiceBadge(value: ChoiceValue): React.ReactNode {
    if (!value) return <span className="text-slate-400">—</span>;
    const styles: Record<StatusColor, string> = {
      Green: "bg-green-100 text-green-700",
      Amber: "bg-amber-100 text-amber-700",
      Red: "bg-red-100 text-red-700",
    };
    return (
      <span className={cn("rounded px-2 py-0.5 text-xs font-medium", styles[value])}>
        {value}
      </span>
    );
  }

  const summaryRows: SummaryRow[] = [
    { step: 1, label: "Delivery Focus", preview: preview(pmQ1) },
    { step: 2, label: "Delivery Status", preview: choiceBadge(pmQ2) },
    { step: 3, label: "Service Overview", preview: preview(pmQ3) },
    { step: 4, label: "Key Achievements", preview: preview(pmQ4) },
    { step: 5, label: "Workstream Status", preview: `${workstreams.length} rows entered` },
    { step: 6, label: "Service Metrics", preview: `${metrics.length} rows entered` },
    { step: 7, label: "Customer Feedback", preview: "5 sections entered" },
    { step: 8, label: "Relationship Health", preview: choiceBadge(pmQ8) },
    { step: 9, label: "ITSM & Service Maturity", preview: itsmPm1 ? "Answered" : "—" },
    { step: 10, label: "Additional Notes", preview: preview(notes) },
  ];

  if (isSubmitting) {
    return (
      <SubmittingOverlay
        message={
          tlHasSubmitted
            ? "Both reviews are now submitted — the AI report is generating. This may take up to 30 seconds."
            : "Review submitted — waiting on the Tech Lead to complete their review before the report can generate."
        }
      />
    );
  }

  if (showOverwriteModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
          <h2 className="mb-2 text-lg font-semibold text-slate-800">
            Already Submitted
          </h2>
          <p className="mb-6 text-sm text-slate-600">
            You already submitted the Product Manager section for{" "}
            {project.project_name} ({project.quarter}). Continuing will replace
            your previous answers and the report will need to be regenerated.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Go Back
            </Button>
            <Button
              className="bg-amber-600 text-white hover:bg-amber-600/90"
              onClick={() => setShowOverwriteModal(false)}
            >
              Continue Editing
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isLastStep = currentStep === TOTAL_STEPS;
  const footer = (
    <StepFooter
      onPrevious={currentStep > 1 ? () => goToStep(currentStep - 1) : undefined}
      onNext={isLastStep ? handleSubmit : () => goToStep(currentStep + 1)}
      nextLabel={isLastStep ? (isSubmitting ? "Submitting..." : "Submit Review") : "Next"}
      nextColor={isLastStep ? "green" : "blue"}
      saved={saveLabel === "saved"}
      disabled={isLastStep && isSubmitting}
    />
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <ArrowLeft
              className="h-5 w-5 cursor-pointer text-slate-400 hover:text-slate-600"
              onClick={() => router.push("/dashboard")}
            />
            <div>
              <p className="text-sm text-slate-500">
                {project.project_name} · {project.customer_name}
              </p>
              <p className="font-bold text-slate-800">Product Manager Review</p>
            </div>
          </div>

          <p className="text-sm text-slate-500">
            Step {currentStep} of {TOTAL_STEPS}
          </p>
        </div>
        <ProgressBar step={currentStep} total={TOTAL_STEPS} />
      </header>

      {currentStep === 1 && (
        <QuestionStep
          stepNumber={1}
          sectionLabel="Delivery Overview"
          question="What was the overall delivery focus and key activities this quarter?"          footer={footer}
        >
          <AnswerTextarea
            value={pmQ1}
            onChange={setPmQ1}
            placeholder="Describe the main delivery goals, initiatives, and key activities undertaken this quarter..."
          />
        </QuestionStep>
      )}

      {currentStep === 2 && (
        <QuestionStep
          stepNumber={2}
          sectionLabel="Delivery Status"
          question="What is the overall service delivery status?"          footer={footer}
        >
          <ChoiceCards
            options={CHOICE_OPTIONS}
            value={pmQ2}
            onChange={(value) => setPmQ2(value)}
          />
          <div className="mt-4">
            <AnswerTextarea
              value={pmQ2Justification}
              onChange={setPmQ2Justification}
              placeholder="Explain the current status and any key factors..."
              minHeightClass="min-h-24"
            />
          </div>
        </QuestionStep>
      )}

      {currentStep === 3 && (
        <QuestionStep
          stepNumber={3}
          sectionLabel="Service Overview"
          question="Describe the active services, delivery model, team composition, and reporting cadence."          footer={footer}
        >
          <AnswerTextarea
            value={pmQ3}
            onChange={setPmQ3}
            placeholder="Cover: what services are active, how delivery is structured, team size and roles, how often you report to the customer..."
            minHeightClass="min-h-48"
          />
        </QuestionStep>
      )}

      {currentStep === 4 && (
        <QuestionStep
          stepNumber={4}
          sectionLabel="Achievements"
          question="What were the key achievements this quarter and what business value did they deliver?"          footer={footer}
        >
          <AnswerTextarea
            value={pmQ4}
            onChange={setPmQ4}
            placeholder="List your key achievements and the business impact of each. Be specific about outcomes..."
            minHeightClass="min-h-48"
          />
        </QuestionStep>
      )}

      {currentStep === 5 && (
        <QuestionStep
          stepNumber={5}
          sectionLabel="Workstream Status"
          question="Summarise each active workstream — its status, progress, and key notes."
          footer={footer}
        >
          <WorkstreamTable rows={workstreams} onChange={setWorkstreams} />
        </QuestionStep>
      )}

      {currentStep === 6 && (
        <QuestionStep
          stepNumber={6}
          sectionLabel="Service Metrics"
          question="What were the key service metrics this quarter?"
          helper="Enter target and actual values — status is computed automatically."
          footer={footer}
        >
          <MetricsTable rows={metrics} onChange={setMetrics} />
        </QuestionStep>
      )}

      {currentStep === 7 && (
        <QuestionStep
          stepNumber={7}
          sectionLabel="Customer Relationship"
          question="How was the customer relationship this quarter?"
          helper="Cover each area with as much detail as needed."          footer={footer}
        >
          <CustomerFeedbackFields value={feedback} onChange={setFeedback} />
        </QuestionStep>
      )}

      {currentStep === 8 && (
        <QuestionStep
          stepNumber={8}
          sectionLabel="Relationship Health"
          question="What is the overall customer relationship health?"          footer={footer}
        >
          <ChoiceCards
            options={HEALTH_OPTIONS}
            value={pmQ8}
            onChange={(value) => setPmQ8(value)}
          />
          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-slate-600">
              Add any context (optional)
            </label>
            <textarea
              value={pmQ8Notes}
              onChange={(e) => setPmQ8Notes(e.target.value)}
              placeholder="Any additional context about the relationship health..."
              className="min-h-20 w-full resize-y rounded-lg border border-slate-200 p-4 text-sm outline-none focus:border-blue-400"
            />
          </div>
        </QuestionStep>
      )}

      {currentStep === 9 && (
        <QuestionStep
          stepNumber={9}
          sectionLabel="ITSM & Service Maturity"
          question="ITSM & Service Maturity"
          helper="Answer each question with as much detail as needed. All fields are optional but help generate richer insights."
          footer={footer}
        >
          <div className="space-y-6">
            <AnswerTextarea
              value={itsmPm1}
              onChange={setItsmPm1}
              placeholder="Were SLAs/SLOs reviewed with the client this quarter, and did they clearly understand what's covered under standard support vs. billable work?"
              minHeightClass="min-h-24"
            />
            <AnswerTextarea
              value={itsmPm2}
              onChange={setItsmPm2}
              placeholder="Is there a clear line between standard requests (included) and enhancement work (billable/upsell)? Did the client understand this distinction this quarter?"
              minHeightClass="min-h-24"
            />
            <AnswerTextarea
              value={itsmPm3}
              onChange={setItsmPm3}
              placeholder="What proactive ITSM improvements or modernization opportunities were identified and presented to the client this quarter?"
              minHeightClass="min-h-24"
            />
            <AnswerTextarea
              value={itsmPm4}
              onChange={setItsmPm4}
              placeholder="Does the client have a documented, understood escalation path? Was it tested or used correctly if an escalation occurred this quarter?"
              minHeightClass="min-h-24"
            />
            <AnswerTextarea
              value={itsmPm5}
              onChange={setItsmPm5}
              placeholder="What did the team do this quarter to help the client better understand ITSM concepts relevant to their environment?"
              minHeightClass="min-h-24"
            />
            <AnswerTextarea
              value={itsmPm6}
              onChange={setItsmPm6}
              placeholder="How was the business value and risk of maintenance/change activities communicated to the client this quarter?"
              minHeightClass="min-h-24"
            />
          </div>
        </QuestionStep>
      )}

      {currentStep === 10 && (
        <QuestionStep
          stepNumber={10}
          sectionLabel="Additional Notes"
          question="Any additional context or notes for this review?"
          helper="Optional — add any caveats, background, or context that doesn't fit elsewhere."
          footer={footer}
        >
          <AnswerTextarea
            value={notes}
            onChange={setNotes}
            placeholder="Any additional context, caveats, or notes for the report reviewer..."
            minHeightClass="min-h-32"
          />
        </QuestionStep>
      )}

      {currentStep === 11 && (
        <QuestionStep
          stepNumber={11}
          sectionLabel="Final Review"
          kind="summary"
          question="Review your answers before submitting."
          helper="Everything look good? Click Edit on any answer to go back."
          footer={footer}
        >
          <div className="divide-y divide-slate-100">
            {summaryRows.map((row) => (
              <div key={row.step} className="flex items-start justify-between py-3">
                <div>
                  <p className="text-sm text-slate-500">
                    Step {row.step} — {row.label}
                  </p>
                  <div className="mt-1 text-slate-800">{row.preview}</div>
                </div>
                <button
                  type="button"
                  onClick={() => goToStep(row.step)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Edit
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
            Once submitted, the system will be notified. The AI report generates
            automatically once both the Product Manager and Tech Lead have
            submitted.
          </div>

          {formError && <p className="mt-4 text-sm text-red-600">{formError}</p>}
        </QuestionStep>
      )}
    </div>
  );
}
