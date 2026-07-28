import type { ReactNode } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import type { PmAnswers, StatusColor, TlAnswers } from "@/types";

export interface AnswerCard {
  id?: string;
  sectionLabel: string;
  question: string;
  body: ReactNode;
}

// ---- shared read-only building blocks ----

function AnswerText({ value }: { value: string | null | undefined }) {
  if (!value || !value.trim()) {
    return <p className="text-sm italic text-slate-400">No answer provided</p>;
  }
  return (
    <>
      <p className="mb-2 text-sm font-medium text-slate-600">Answer</p>
      <p className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
        {value}
      </p>
    </>
  );
}

function SubAnswer({ question, value }: { question: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-slate-800">{question}</p>
      {!value || !value.trim() ? (
        <p className="text-sm italic text-slate-400">No answer provided</p>
      ) : (
        <p className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          {value}
        </p>
      )}
    </div>
  );
}

function ReadonlyTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: (string | ReactNode)[][];
}) {
  if (rows.length === 0) {
    return <p className="text-sm italic text-slate-400">No entries provided</p>;
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            {columns.map((col) => (
              <th key={col} className="px-3 py-2 text-left font-medium">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-slate-100 last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 align-top text-slate-700">
                  {cell || <span className="text-slate-300">—</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function safeParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// ---- PM cards ----

interface WorkstreamRow {
  workstream: string;
  status: string;
  summary: string;
  notes: string;
}
interface MetricRow {
  metric: string;
  target: string;
  actual: string;
  comment: string;
}
interface CustomerFeedback {
  satisfaction: string;
  communication: string;
  responsiveness: string;
  business_alignment: string;
  areas_of_concern: string;
}

const ITSM_PM_QUESTIONS: { key: keyof PmAnswers; question: string }[] = [
  {
    key: "itsm_pm_1",
    question:
      "Were SLAs/SLOs reviewed with the client this quarter, and did they clearly understand what's covered under standard support vs. billable work?",
  },
  {
    key: "itsm_pm_2",
    question:
      "Is there a clear line between standard requests (included) and enhancement work (billable/upsell)? Did the client understand this distinction this quarter?",
  },
  {
    key: "itsm_pm_3",
    question:
      "What proactive ITSM improvements or modernization opportunities were identified and presented to the client this quarter?",
  },
  {
    key: "itsm_pm_4",
    question:
      "Does the client have a documented, understood escalation path? Was it tested or used correctly if an escalation occurred this quarter?",
  },
  {
    key: "itsm_pm_5",
    question:
      "What did the team do this quarter to help the client better understand ITSM concepts relevant to their environment?",
  },
  {
    key: "itsm_pm_6",
    question:
      "How was the business value and risk of maintenance/change activities communicated to the client this quarter?",
  },
];

export function buildPmAnswerCards(answers: PmAnswers): AnswerCard[] {
  const workstreams = safeParse<WorkstreamRow[]>(answers.pm_q5, []);
  const metrics = safeParse<MetricRow[]>(answers.pm_q6, []);
  const feedback = safeParse<CustomerFeedback>(answers.pm_q7, {
    satisfaction: "",
    communication: "",
    responsiveness: "",
    business_alignment: "",
    areas_of_concern: "",
  });

  return [
    {
      sectionLabel: "Delivery Overview",
      question: "What was the overall delivery focus and key activities this quarter?",
      body: <AnswerText value={answers.pm_q1} />,
    },
    {
      sectionLabel: "Delivery Status",
      question: "What is the overall service delivery status?",
      body: (
        <>
          {answers.pm_q2 ? (
            <div className="mb-4">
              <StatusBadge status={answers.pm_q2 as StatusColor} />
            </div>
          ) : null}
          <AnswerText value={answers.pm_q2_justification} />
        </>
      ),
    },
    {
      sectionLabel: "Service Overview",
      question:
        "Describe the active services, delivery model, team composition, and reporting cadence.",
      body: <AnswerText value={answers.pm_q3} />,
    },
    {
      sectionLabel: "Achievements",
      question:
        "What were the key achievements this quarter and what business value did they deliver?",
      body: <AnswerText value={answers.pm_q4} />,
    },
    {
      sectionLabel: "Workstream Status",
      question: "Summarise each active workstream — its status, progress, and key notes.",
      body: (
        <ReadonlyTable
          columns={["Workstream", "Status", "Summary", "Notes"]}
          rows={workstreams
            .filter((w) => w.workstream || w.summary || w.notes)
            .map((w) => [
              w.workstream,
              w.status ? <StatusBadge status={w.status as StatusColor} /> : "",
              w.summary,
              w.notes,
            ])}
        />
      ),
    },
    {
      sectionLabel: "Service Metrics",
      question: "What were the key service metrics — target vs actual?",
      body: (
        <ReadonlyTable
          columns={["Metric", "Target", "Actual", "Comment"]}
          rows={metrics.filter((m) => m.metric).map((m) => [m.metric, m.target, m.actual, m.comment])}
        />
      ),
    },
    {
      sectionLabel: "Customer Relationship",
      question:
        "How was the customer relationship? Cover satisfaction, communication, responsiveness, business alignment, areas of concern.",
      body: (
        <div className="space-y-4">
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
              Satisfaction
            </p>
            <AnswerText value={feedback.satisfaction} />
          </div>
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
              Communication
            </p>
            <AnswerText value={feedback.communication} />
          </div>
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
              Responsiveness
            </p>
            <AnswerText value={feedback.responsiveness} />
          </div>
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
              Business alignment
            </p>
            <AnswerText value={feedback.business_alignment} />
          </div>
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
              Areas of concern
            </p>
            <AnswerText value={feedback.areas_of_concern} />
          </div>
        </div>
      ),
    },
    {
      sectionLabel: "Relationship Health",
      question: "Overall relationship health?",
      body: (
        <>
          {answers.pm_q8 ? (
            <div className="mb-4">
              <StatusBadge status={answers.pm_q8 as StatusColor} />
            </div>
          ) : null}
          <AnswerText value={answers.pm_q8_notes} />
        </>
      ),
    },
    {
      sectionLabel: "ITSM & Service Maturity",
      question: "ITSM & Service Maturity",
      body: (
        <div className="space-y-6">
          {ITSM_PM_QUESTIONS.map(({ key, question }) => (
            <SubAnswer key={key} question={question} value={answers[key] as string | null} />
          ))}
        </div>
      ),
    },
    {
      sectionLabel: "Additional Notes",
      question: "Any additional context or notes for this review?",
      body: <AnswerText value={answers.pm_q_notes} />,
    },
  ];
}

// ---- TL cards ----

interface TicketCountRow {
  category: string;
  count: string;
  summary: string;
}
interface MajorIncidentRow {
  date: string;
  issue: string;
  impact: string;
  root_cause: string;
  action: string;
  status: string;
}
interface QualityHealthRow {
  area: string;
  observation: string;
  status: string;
  improvement_action: string;
}
interface RiskRow {
  type: string;
  description: string;
  impact: string;
  owner: string;
  mitigation: string;
}

const ITSM_TL_QUESTIONS: { key: keyof TlAnswers; question: string }[] = [
  {
    key: "itsm_tl_1",
    question:
      "Is the software/infrastructure inventory (CMDB or equivalent) current? Were any major gaps in dependency or EOL tracking found this quarter?",
  },
  {
    key: "itsm_tl_2",
    question:
      "What was the patch/vulnerability remediation cadence this quarter? Were there any overdue critical patches?",
  },
  {
    key: "itsm_tl_3",
    question:
      "What percentage of incidents this quarter were caught by automated monitoring vs. client-reported? What's the biggest manual-task automation opportunity right now?",
  },
  {
    key: "itsm_tl_4",
    question:
      "Were any recurring issues this quarter analyzed via root cause analysis? What prevention steps came out of it?",
  },
  {
    key: "itsm_tl_5",
    question:
      "Are the client's critical third-party/vendor dependencies inventoried with known failure-mode impact? Did any cause issues this quarter?",
  },
];

export function buildTlAnswerCards(answers: TlAnswers): AnswerCard[] {
  const tlQ4 = safeParse<{ ticketCounts: TicketCountRow[]; majorIncidents: MajorIncidentRow[] }>(
    answers.tl_q4,
    { ticketCounts: [], majorIncidents: [] }
  );
  const qualityHealth = safeParse<QualityHealthRow[]>(answers.tl_q5, []);
  const risks = safeParse<RiskRow[]>(answers.tl_q6, []);

  return [
    {
      sectionLabel: "Technical Delivery",
      question:
        "From a technical standpoint, what was the delivery focus and key engineering activities this quarter?",
      body: <AnswerText value={answers.tl_q1} />,
    },
    {
      sectionLabel: "Delivery Status",
      question: "What is your assessment of the overall delivery status?",
      body: (
        <>
          {answers.tl_q2 ? (
            <div className="mb-4">
              <StatusBadge status={answers.tl_q2 as StatusColor} />
            </div>
          ) : null}
          <AnswerText value={answers.tl_q2_justification} />
        </>
      ),
    },
    {
      sectionLabel: "Technical Achievements",
      question:
        "What were the key technical achievements? Include releases, performance improvements, security work, or architecture changes.",
      body: <AnswerText value={answers.tl_q3} />,
    },
    {
      sectionLabel: "Support & Incidents",
      question:
        "What were the support and incident numbers? Cover total, resolved, open, critical/major incidents.",
      body: (
        <div className="space-y-4">
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
              Ticket counts
            </p>
            <ReadonlyTable
              columns={["Category", "Count", "Summary"]}
              rows={tlQ4.ticketCounts
                .filter((r) => r.category)
                .map((r) => [r.category, r.count, r.summary])}
            />
          </div>
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
              Major incidents
            </p>
            <ReadonlyTable
              columns={["Date", "Issue", "Impact", "Root Cause", "Action", "Status"]}
              rows={tlQ4.majorIncidents
                .filter((r) => r.issue || r.date)
                .map((r) => [r.date, r.issue, r.impact, r.root_cause, r.action, r.status])}
            />
          </div>
        </div>
      ),
    },
    {
      sectionLabel: "Quality & Health",
      question: "How was overall quality and delivery health?",
      body: (
        <ReadonlyTable
          columns={["Area", "Observation", "Status", "Improvement Action"]}
          rows={qualityHealth
            .filter((r) => r.area)
            .map((r) => [
              r.area,
              r.observation,
              r.status ? <StatusBadge status={r.status as StatusColor} /> : "",
              r.improvement_action,
            ])}
        />
      ),
    },
    {
      sectionLabel: "Risks & Issues",
      question: "What risks, issues, or dependencies exist?",
      body: (
        <ReadonlyTable
          columns={["Type", "Description", "Impact", "Owner", "Mitigation"]}
          rows={risks
            .filter((r) => r.description)
            .map((r) => [r.type, r.description, r.impact, r.owner, r.mitigation])}
        />
      ),
    },
    {
      sectionLabel: "ITSM & Technical Maturity",
      question: "ITSM & Technical Maturity",
      body: (
        <div className="space-y-6">
          {ITSM_TL_QUESTIONS.map(({ key, question }) => (
            <SubAnswer key={key} question={question} value={answers[key] as string | null} />
          ))}
        </div>
      ),
    },
    {
      sectionLabel: "Next Quarter Focus",
      question:
        "What should be the technical focus for next quarter? Include blockers, tech debt, and priorities.",
      body: <AnswerText value={answers.tl_q7} />,
    },
  ];
}
