"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuestionStep } from "@/components/QuestionStep";
import { ProgressBar } from "@/components/ProgressBar";
import { SubmittingOverlay } from "@/components/SubmittingOverlay";
import { Button } from "@/components/ui/button";
import {
  TicketCountsTable,
  TICKET_CATEGORIES,
  type TicketCountRow,
} from "@/components/TicketCountsTable";
import {
  MajorIncidentsTable,
  type MajorIncidentRow,
} from "@/components/MajorIncidentsTable";
import {
  QualityHealthTable,
  QUALITY_AREAS,
  type QualityHealthRow,
} from "@/components/QualityHealthTable";
import { RisksIssuesTable, type RiskRow } from "@/components/RisksIssuesTable";
import {
  saveTlDraftAction,
  submitTlAnswersAction,
} from "@/app/projects/[id]/tl/actions";
import type { PmAnswers, Project, StatusColor, TlAnswers, User } from "@/types";

const TOTAL_STEPS = 9;
type ChoiceValue = StatusColor | "";

interface TlQ4Data {
  ticketCounts: TicketCountRow[];
  majorIncidents: MajorIncidentRow[];
}

function defaultTicketCounts(): TicketCountRow[] {
  return TICKET_CATEGORIES.map((category) => ({ category, count: "", summary: "" }));
}

function parseTlQ4(raw: string | null): TlQ4Data {
  const empty: TlQ4Data = {
    ticketCounts: defaultTicketCounts(),
    majorIncidents: [{ date: "", issue: "", impact: "", root_cause: "", action: "", status: "" }],
  };
  if (!raw) return empty;
  try {
    const parsed = JSON.parse(raw) as Partial<TlQ4Data>;
    return {
      ticketCounts: parsed.ticketCounts ?? empty.ticketCounts,
      majorIncidents: parsed.majorIncidents ?? empty.majorIncidents,
    };
  } catch {
    return empty;
  }
}

function defaultQualityHealth(): QualityHealthRow[] {
  return QUALITY_AREAS.map((area) => ({
    area,
    observation: "",
    status: "",
    improvement_action: "",
  }));
}

function parseQualityHealth(raw: string | null): QualityHealthRow[] {
  if (!raw) return defaultQualityHealth();
  try {
    return JSON.parse(raw) as QualityHealthRow[];
  } catch {
    return defaultQualityHealth();
  }
}

function parseRisks(raw: string | null): RiskRow[] {
  const empty: RiskRow[] = [
    { type: "", description: "", impact: "", owner: "", mitigation: "" },
    { type: "", description: "", impact: "", owner: "", mitigation: "" },
  ];
  if (!raw) return empty;
  try {
    return JSON.parse(raw) as RiskRow[];
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

function ChoiceCards({
  value,
  onChange,
}: {
  value: ChoiceValue;
  onChange: (value: StatusColor) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {CHOICE_OPTIONS.map((option) => (
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

export function TlQuestionnaireClient({
  project,
  initialAnswers,
  pmAnswers,
  currentUser,
}: {
  project: Project;
  initialAnswers: TlAnswers | null;
  pmAnswers: PmAnswers | null;
  currentUser: User;
}) {
  const router = useRouter();
  const currentUserId = currentUser.id;

  const [showOverwriteModal, setShowOverwriteModal] = useState(
    !!initialAnswers?.submitted_at
  );
  const [currentStep, setCurrentStep] = useState(1);
  const [saveLabel, setSaveLabel] = useState<"idle" | "saved">("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [tlQ1, setTlQ1] = useState(initialAnswers?.tl_q1 ?? "");
  const [tlQ2, setTlQ2] = useState<ChoiceValue>(initialAnswers?.tl_q2 ?? "");
  const [tlQ2Justification, setTlQ2Justification] = useState(
    initialAnswers?.tl_q2_justification ?? ""
  );
  const [tlQ3, setTlQ3] = useState(initialAnswers?.tl_q3 ?? "");
  const tlQ4Initial = parseTlQ4(initialAnswers?.tl_q4 ?? null);
  const [ticketCounts, setTicketCounts] = useState<TicketCountRow[]>(
    tlQ4Initial.ticketCounts
  );
  const [majorIncidents, setMajorIncidents] = useState<MajorIncidentRow[]>(
    tlQ4Initial.majorIncidents
  );
  const [qualityHealth, setQualityHealth] = useState<QualityHealthRow[]>(
    parseQualityHealth(initialAnswers?.tl_q5 ?? null)
  );
  const [risks, setRisks] = useState<RiskRow[]>(
    parseRisks(initialAnswers?.tl_q6 ?? null)
  );
  const [itsmTl1, setItsmTl1] = useState(initialAnswers?.itsm_tl_1 ?? "");
  const [itsmTl2, setItsmTl2] = useState(initialAnswers?.itsm_tl_2 ?? "");
  const [itsmTl3, setItsmTl3] = useState(initialAnswers?.itsm_tl_3 ?? "");
  const [itsmTl4, setItsmTl4] = useState(initialAnswers?.itsm_tl_4 ?? "");
  const [itsmTl5, setItsmTl5] = useState(initialAnswers?.itsm_tl_5 ?? "");
  const [tlQ7, setTlQ7] = useState(initialAnswers?.tl_q7 ?? "");

  const pmHasSubmitted = !!pmAnswers?.submitted_at;
  const pmStatus = pmHasSubmitted ? pmAnswers.pm_q2 : null;
  const showDisagreementWarning = !!pmStatus && !!tlQ2 && tlQ2 !== pmStatus;

  function buildPayload(): Omit<TlAnswers, "id"> {
    return {
      project_id: project.id,
      tl_q1: tlQ1,
      tl_q2: tlQ2 || null,
      tl_q2_justification: tlQ2Justification,
      tl_q3: tlQ3,
      tl_q4: JSON.stringify({ ticketCounts, majorIncidents }),
      tl_q5: JSON.stringify(qualityHealth),
      tl_q6: JSON.stringify(risks),
      itsm_tl_1: itsmTl1,
      itsm_tl_2: itsmTl2,
      itsm_tl_3: itsmTl3,
      itsm_tl_4: itsmTl4,
      itsm_tl_5: itsmTl5,
      tl_q7: tlQ7,
      submitted_by: currentUserId,
      submitted_at: initialAnswers?.submitted_at ?? null,
    };
  }

  async function saveDraft() {
    try {
      await saveTlDraftAction(buildPayload());
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
    if (!tlQ2) return "Delivery status is required.";
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
      await submitTlAnswersAction(buildPayload());
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
    { step: 1, label: "Technical Delivery", preview: preview(tlQ1) },
    { step: 2, label: "Delivery Status", preview: choiceBadge(tlQ2) },
    { step: 3, label: "Technical Achievements", preview: preview(tlQ3) },
    {
      step: 4,
      label: "Support & Incidents",
      preview: `${majorIncidents.length} major incident row(s) entered`,
    },
    { step: 5, label: "Quality & Health", preview: `${qualityHealth.length} rows entered` },
    { step: 6, label: "Risks & Issues", preview: `${risks.length} rows entered` },
    { step: 7, label: "ITSM & Technical Maturity", preview: itsmTl1 ? "Answered" : "—" },
    { step: 8, label: "Next Quarter Focus", preview: preview(tlQ7) },
  ];

  if (isSubmitting) {
    return (
      <SubmittingOverlay
        message={
          pmHasSubmitted
            ? "Both reviews are now submitted — the AI report is generating. This may take up to 30 seconds."
            : "Review submitted — waiting on the Product Manager to complete their review before the report can generate."
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
            You already submitted the Tech Lead section for{" "}
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
                {project.project_name} · {project.customer_name} ·{" "}
                {project.quarter}
              </p>
              <p className="font-bold text-slate-800">Tech Lead Review</p>
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
          sectionLabel="Technical Delivery"
          question="From a technical standpoint, what was the delivery focus and key engineering activities this quarter?"
          footer={footer}
        >
          <AnswerTextarea
            value={tlQ1}
            onChange={setTlQ1}
            placeholder="Describe the main technical goals, engineering initiatives, and key activities this quarter..."
          />
        </QuestionStep>
      )}

      {currentStep === 2 && (
        <QuestionStep
          stepNumber={2}
          sectionLabel="Delivery Status"
          question="What is your assessment of the overall delivery status?"
          footer={footer}
        >
          {pmStatus && (
            <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              Product Manager&apos;s assessment: {choiceBadge(pmStatus)}
            </div>
          )}
          <ChoiceCards value={tlQ2} onChange={(value) => setTlQ2(value)} />
          {showDisagreementWarning && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
              ⚠️ Your assessment differs from the Product Manager&apos;s. This
              disagreement will be flagged in the report.
            </div>
          )}
          <div className="mt-4">
            <AnswerTextarea
              value={tlQ2Justification}
              onChange={setTlQ2Justification}
              placeholder="Explain your assessment..."
              minHeightClass="min-h-24"
            />
          </div>
        </QuestionStep>
      )}

      {currentStep === 3 && (
        <QuestionStep
          stepNumber={3}
          sectionLabel="Technical Achievements"
          question="What were the key technical achievements this quarter?"
          helper="Include releases, performance improvements, security work, or architecture changes."
          footer={footer}
        >
          <AnswerTextarea
            value={tlQ3}
            onChange={setTlQ3}
            placeholder="List key technical achievements and their impact..."
            minHeightClass="min-h-40"
          />
        </QuestionStep>
      )}

      {currentStep === 4 && (
        <QuestionStep
          stepNumber={4}
          sectionLabel="Support & Incidents"
          question="What were the support and incident numbers this quarter?"
          helper="Fill in ticket counts and add details for any major incidents."
          width="full"
          footer={footer}
        >
          <TicketCountsTable rows={ticketCounts} onChange={setTicketCounts} />
          <MajorIncidentsTable rows={majorIncidents} onChange={setMajorIncidents} />
        </QuestionStep>
      )}

      {currentStep === 5 && (
        <QuestionStep
          stepNumber={5}
          sectionLabel="Quality & Health"
          question="How was overall quality and delivery health this quarter?"
          helper="Rate each area and describe what you observed."
          width="full"
          footer={footer}
        >
          <QualityHealthTable rows={qualityHealth} onChange={setQualityHealth} />
        </QuestionStep>
      )}

      {currentStep === 6 && (
        <QuestionStep
          stepNumber={6}
          sectionLabel="Risks & Issues"
          question="What risks, issues, or dependencies exist heading into next quarter?"
          helper="For each item describe the type, impact, owner, and mitigation plan."
          width="full"
          footer={footer}
        >
          <RisksIssuesTable rows={risks} onChange={setRisks} />
        </QuestionStep>
      )}

      {currentStep === 7 && (
        <QuestionStep
          stepNumber={7}
          sectionLabel="ITSM & Technical Maturity"
          question="ITSM & Technical Maturity"
          helper="Answer each question with as much detail as needed. All fields are optional but help generate richer insights."
          footer={footer}
        >
          <div className="space-y-6">
            <AnswerTextarea
              value={itsmTl1}
              onChange={setItsmTl1}
              placeholder="Is the software/infrastructure inventory (CMDB or equivalent) current? Were any major gaps in dependency or EOL tracking found this quarter?"
              minHeightClass="min-h-24"
            />
            <AnswerTextarea
              value={itsmTl2}
              onChange={setItsmTl2}
              placeholder="What was the patch/vulnerability remediation cadence this quarter? Were there any overdue critical patches?"
              minHeightClass="min-h-24"
            />
            <AnswerTextarea
              value={itsmTl3}
              onChange={setItsmTl3}
              placeholder="What percentage of incidents this quarter were caught by automated monitoring vs. client-reported? What's the biggest manual-task automation opportunity right now?"
              minHeightClass="min-h-24"
            />
            <AnswerTextarea
              value={itsmTl4}
              onChange={setItsmTl4}
              placeholder="Were any recurring issues this quarter analyzed via root cause analysis? What prevention steps came out of it?"
              minHeightClass="min-h-24"
            />
            <AnswerTextarea
              value={itsmTl5}
              onChange={setItsmTl5}
              placeholder="Are the client's critical third-party/vendor dependencies inventoried with known failure-mode impact? Did any cause issues this quarter?"
              minHeightClass="min-h-24"
            />
          </div>
        </QuestionStep>
      )}

      {currentStep === 8 && (
        <QuestionStep
          stepNumber={8}
          sectionLabel="Next Quarter Focus"
          question="What should be the technical focus for next quarter?"
          helper="Include blockers to resolve, tech debt to address, and engineering priorities."
          footer={footer}
        >
          <AnswerTextarea
            value={tlQ7}
            onChange={setTlQ7}
            placeholder="Describe the key technical priorities, blockers, and focus areas for next quarter..."
            minHeightClass="min-h-40"
          />
        </QuestionStep>
      )}

      {currentStep === 9 && (
        <QuestionStep
          stepNumber={9}
          sectionLabel="Review Summary"
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
            Once submitted, the AI report generates automatically once both the
            Product Manager and Tech Lead have submitted.
          </div>

          {formError && <p className="mt-4 text-sm text-red-600">{formError}</p>}
        </QuestionStep>
      )}
    </div>
  );
}
