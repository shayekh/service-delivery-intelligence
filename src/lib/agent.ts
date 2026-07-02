import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";
import { getPMAnswers, getProjectById, getTLAnswers, getUserById } from "@/lib/db";
import type { AnalysisJson, PmAnswers, Project, StatusColor, TlAnswers } from "@/types";

const SCHEMA_TEXT = `{
  "report_meta": {
    "customer_name": "...",
    "reporting_period": "Q2 2026",
    "prepared_by": "...",
    "date_generated": "DD Month, YYYY",
    "pm_status": "Green|Amber|Red",
    "tl_status": "Green|Amber|Red",
    "status_aligned": true
  },
  "section_synthesis": {
    "s1_executive_summary": {
      "delivery_focus": "...", "overall_status": "Green|Amber|Red",
      "highlights": "...", "areas_requiring_attention": "...", "next_quarter_preview": "..."
    },
    "s2_service_overview": {
      "active_services": "...", "delivery_model": "...", "key_stakeholders": "...",
      "team_composition": "...", "reporting_cadence": "..."
    },
    "s3_achievements": [{ "achievement": "...", "impact": "..." }],
    "s4_delivery_summary": [{ "workstream": "...", "status": "Green|Amber|Red", "summary": "...", "notes": "..." }],
    "s5_metrics": [{ "metric": "...", "target": "...", "actual": "...", "status": "Green|Amber|Red", "comment": "..." }],
    "s6_support_summary": {
      "ticket_counts": {
        "total":    { "count": "...", "summary": "..." },
        "resolved": { "count": "...", "summary": "..." },
        "open":     { "count": "...", "summary": "..." },
        "critical": { "count": "...", "summary": "..." },
        "major":    { "count": "...", "summary": "..." },
        "recurring":{ "count": "...", "summary": "..." }
      },
      "major_incidents": [{ "date": "...", "issue": "...", "impact": "...", "root_cause": "...", "action": "...", "status": "..." }]
    },
    "s7_quality_health": [{ "area": "...", "observation": "...", "status": "Green|Amber|Red", "improvement_action": "..." }],
    "s8_risks": [{ "type": "Risk|Issue|Dependency", "description": "...", "impact": "High|Medium|Low", "owner": "...", "mitigation": "..." }],
    "s9_customer_feedback": {
      "satisfaction": "...", "communication": "...", "responsiveness": "...",
      "business_alignment": "...", "areas_of_concern": "...", "relationship_health": "Green|Amber|Red"
    }
  },
  "ai_generated": {
    "s10_value_delivered": {
      "business_value": "2-3 sentence paragraph on customer-facing business gains this quarter",
      "operational_value": "2-3 sentence paragraph on process, support, stability improvements",
      "technical_value": "2-3 sentence paragraph on architecture, performance, security, engineering quality",
      "strategic_value": "2-3 sentence paragraph on long-term positioning, roadmap contribution, risk reduction"
    },
    "s10_cross_analysis": [
      { "topic": "...", "relationship": "AGREE|DISAGREE|COMPLEMENT|BLIND_SPOT", "finding": "..." }
    ],
    "s11_lessons_learned": [{ "lesson": "...", "context": "...", "action": "..." }],
    "s12_next_quarter_focus": [
      { "focus_area": "...", "expected_outcome": "...", "owner": "Product Manager|Tech Lead|Product Manager, Tech Lead" }
    ],
    "s13_management_attention": [
      { "item": "...", "type": "Decision|Approval|Budget|Resource|Escalation|Misalignment",
        "explanation": "...", "urgency": "High|Medium|Low",
        "source": "Product Manager|Tech Lead|Product Manager, Tech Lead|Disagreement" }
    ],
    "s15_itsm_maturity": [
      { "topic": "...", "pm_perspective": "...", "tl_perspective": "...", "finding": "...", "relationship": "AGREE|DISAGREE|COMPLEMENT|BLIND_SPOT" }
    ],
    "s16_closing_note": "..."
  }
}`;

const SYSTEM_PROMPT = `You are a senior service delivery analyst producing this quarter's Service Delivery Report for an internal SELISE Digital Platforms team.

You are given the Product Manager's (PM) and Tech Lead's (TL) independently submitted quarterly review answers. Your job is to:

1. Synthesise the PM and TL answers into the report's structured sections.
2. Cross-analyse every topic where both the PM and TL answers cover the same ground, and tag each finding as exactly one of:
   - AGREE: both perspectives align and reinforce the same point
   - DISAGREE: the PM and TL assessments conflict (especially overall delivery status)
   - COMPLEMENT: both add different but compatible detail on the same topic
   - BLIND_SPOT: one role identifies a risk or issue the other did not mention at all
3. NEVER fabricate information that is not present in the source answers. If one role answered a topic and the other did not address it, note the gap explicitly — do not invent an answer for the missing side.
4. From tl_q4 ticket count data, compute Ticket Resolution Rate as (resolved/total)*100 against a default target of 90%. Only include Average Response Time and Average Resolution Time metrics if response/resolution time data was explicitly mentioned in the TL's incident summaries — otherwise omit these metrics rather than fabricating values.
5. For each ticket_counts field in s6_support_summary, return an object with "count" (short numeric string from the TL's input) and "summary" (one sentence from the TL's summary field for that category, or a brief auto-generated description if the TL did not provide one). Source these directly from the tl_q4 ticketCounts array.
6. For s10_value_delivered, synthesise 4 distinct value paragraphs (2-3 sentences each, specific to this project's data — do NOT use generic placeholder language):
   - business_value: how delivery outcomes translated into customer-facing business gains (revenue, efficiency, adoption, customer experience)
   - operational_value: process, support, stability, and operational improvements delivered this quarter
   - technical_value: architecture, performance, security, maintainability, and engineering quality improvements
   - strategic_value: long-term positioning, roadmap contribution, risk reduction, and strategic alignment achieved this quarter
7. For s15_itsm_maturity, synthesise the PM's ITSM answers (itsm_pm_1–6) and the TL's ITSM answers (itsm_tl_1–5) into a list of cross-perspective findings. For each topic (e.g. SLA clarity, request boundary, escalation path, patch cadence, automation maturity, RCA discipline, dependency risk), produce an entry with pm_perspective, tl_perspective, finding, and relationship tag (AGREE/DISAGREE/COMPLEMENT/BLIND_SPOT). Omit topics where neither PM nor TL provided relevant input. If a topic was only addressed by one role, tag it as BLIND_SPOT.
8. Output ONLY valid JSON matching the exact schema you are given — no markdown formatting, no code fences, no preamble or explanation text before or after the JSON.`;

interface SourceAnswers {
  project: Project;
  pm: PmAnswers;
  tl: TlAnswers;
  tlPreparedBy: string;
}

function buildUserMessage({ project, pm, tl, tlPreparedBy }: SourceAnswers): string {
  return `Generate the complete analysis JSON for this quarter's Service Delivery Report following the schema exactly.

## Project Context
Customer: ${project.customer_name}
Project: ${project.project_name}
Reporting Period: ${project.quarter}

## Product Manager Answers (prepared by: ${pm.prepared_by})
pm_q1 (delivery focus and key activities): ${pm.pm_q1 ?? "(not answered)"}
pm_q2 (overall service delivery status): ${pm.pm_q2 ?? "(not answered)"}
pm_q2_justification: ${pm.pm_q2_justification ?? "(not answered)"}
pm_q3 (active services, delivery model, team, cadence): ${pm.pm_q3 ?? "(not answered)"}
pm_q4 (key achievements and business value): ${pm.pm_q4 ?? "(not answered)"}
pm_q5 (workstream status, JSON array of {workstream, status, summary, notes}): ${pm.pm_q5 ?? "(not answered)"}
pm_q6 (service metrics, JSON array of {metric, target, actual, comment}): ${pm.pm_q6 ?? "(not answered)"}
pm_q7 (customer relationship, JSON object {satisfaction, communication, responsiveness, business_alignment, areas_of_concern}): ${pm.pm_q7 ?? "(not answered)"}
pm_q8 (overall relationship health): ${pm.pm_q8 ?? "(not answered)"}
pm_q8_notes: ${pm.pm_q8_notes ?? "(not answered)"}
pm_q_notes (additional notes): ${pm.pm_q_notes ?? "(none)"}

## Tech Lead Answers (prepared by: ${tlPreparedBy})
tl_q1 (technical delivery focus): ${tl.tl_q1 ?? "(not answered)"}
tl_q2 (technical delivery status): ${tl.tl_q2 ?? "(not answered)"}
tl_q2_justification: ${tl.tl_q2_justification ?? "(not answered)"}
tl_q3 (key technical achievements): ${tl.tl_q3 ?? "(not answered)"}
tl_q4 (support and incidents, JSON object {ticketCounts: [{category, count, summary}], majorIncidents: [{date, issue, impact, root_cause, action, status}]}): ${tl.tl_q4 ?? "(not answered)"}
tl_q5 (quality and delivery health, JSON array of {area, observation, status, improvement_action}): ${tl.tl_q5 ?? "(not answered)"}
tl_q6 (risks, issues, dependencies, JSON array of {type, description, impact, owner, mitigation}): ${tl.tl_q6 ?? "(not answered)"}
tl_q7 (next quarter technical focus): ${tl.tl_q7 ?? "(not answered)"}

## PM ITSM Answers
itsm_pm_1 (SLA/SLO review with client, standard vs. billable clarity): ${pm.itsm_pm_1 ?? "(not answered)"}
itsm_pm_2 (request boundary — standard vs. enhancement/upsell distinction): ${pm.itsm_pm_2 ?? "(not answered)"}
itsm_pm_3 (proactive ITSM improvements presented to client): ${pm.itsm_pm_3 ?? "(not answered)"}
itsm_pm_4 (escalation path documentation and usage): ${pm.itsm_pm_4 ?? "(not answered)"}
itsm_pm_5 (client ITSM education activities): ${pm.itsm_pm_5 ?? "(not answered)"}
itsm_pm_6 (change/maintenance communication to client): ${pm.itsm_pm_6 ?? "(not answered)"}

## TL ITSM Answers
itsm_tl_1 (CMDB/inventory currency, EOL tracking gaps): ${tl.itsm_tl_1 ?? "(not answered)"}
itsm_tl_2 (patch/vulnerability remediation cadence, overdue patches): ${tl.itsm_tl_2 ?? "(not answered)"}
itsm_tl_3 (automated vs. client-reported incident detection, automation opportunities): ${tl.itsm_tl_3 ?? "(not answered)"}
itsm_tl_4 (RCA on recurring issues, prevention steps): ${tl.itsm_tl_4 ?? "(not answered)"}
itsm_tl_5 (third-party/vendor dependency inventory and failure-mode risk): ${tl.itsm_tl_5 ?? "(not answered)"}

## Output Schema
Respond with ONLY a JSON object matching this exact shape (field names and nesting must match exactly):

${SCHEMA_TEXT}`;
}

function stripMarkdownFences(text: string): string {
  let result = text.trim();

  // Strip an opening fence (```json or ```) if present — independent of
  // whether a closing fence ever arrived (truncated responses won't have one).
  result = result.replace(/^```(?:json)?\s*/i, "");

  // Strip a closing fence if present.
  result = result.replace(/\s*```$/, "");

  return result.trim();
}

function formatDateGenerated(date: Date): string {
  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "long" });
  const year = date.getFullYear();
  return `${day} ${month}, ${year}`;
}

function computeMetricStatus(target: string, actual: string): StatusColor | null {
  const targetValue = parseFloat(target);
  const actualValue = parseFloat(actual);
  if (Number.isNaN(targetValue) || Number.isNaN(actualValue)) return null;
  if (actualValue >= targetValue) return "Green";
  if (actualValue >= targetValue * 0.95) return "Amber";
  return "Red";
}

interface TicketCountRow {
  category: string;
  count: string;
  summary: string;
}

const TICKET_RESOLUTION_RATE_TARGET = 90;

function computeTicketResolutionRate(
  tlQ4: string | null
): { actual: string; target: string; status: StatusColor; comment: string } | null {
  if (!tlQ4) return null;
  let ticketCounts: TicketCountRow[] = [];
  try {
    ticketCounts = JSON.parse(tlQ4).ticketCounts ?? [];
  } catch {
    return null;
  }

  const totalRow = ticketCounts.find((row) => row.category === "Total Raised");
  const resolvedRow = ticketCounts.find((row) => row.category === "Resolved");
  const total = totalRow ? parseFloat(totalRow.count) : NaN;
  const resolved = resolvedRow ? parseFloat(resolvedRow.count) : NaN;
  if (Number.isNaN(total) || Number.isNaN(resolved) || total <= 0) return null;

  const actual = Math.round((resolved / total) * 1000) / 10;
  const status = computeMetricStatus(String(TICKET_RESOLUTION_RATE_TARGET), String(actual));

  return {
    actual: `${actual}%`,
    target: `${TICKET_RESOLUTION_RATE_TARGET}%`,
    status: status ?? "Red",
    comment: `${resolvedRow!.count} of ${totalRow!.count} tickets resolved this quarter`,
  };
}

function applyComputedFields(
  result: AnalysisJson,
  { project, pm, tl, tlPreparedBy }: SourceAnswers
): AnalysisJson {
  const pmStatus = pm.pm_q2;
  const tlStatus = tl.tl_q2;

  result.report_meta = {
    ...result.report_meta,
    customer_name: project.customer_name,
    reporting_period: project.quarter,
    prepared_by: `${pm.prepared_by}, ${tlPreparedBy}`,
    date_generated: formatDateGenerated(new Date()),
    pm_status: pmStatus ?? result.report_meta.pm_status,
    tl_status: tlStatus ?? result.report_meta.tl_status,
    status_aligned: !!pmStatus && !!tlStatus && pmStatus === tlStatus,
  };

  // Override computed status for any PM metric we can confidently recompute
  // from numeric target/actual values — never trust the model for arithmetic.
  let pmMetrics: { metric: string; target: string; actual: string }[] = [];
  try {
    pmMetrics = pm.pm_q6 ? JSON.parse(pm.pm_q6) : [];
  } catch {
    pmMetrics = [];
  }

  result.section_synthesis.s5_metrics = (result.section_synthesis.s5_metrics ?? []).map(
    (row) => {
      const match = pmMetrics.find(
        (m) => m.metric.trim().toLowerCase() === row.metric.trim().toLowerCase()
      );
      if (!match) return row;
      const computed = computeMetricStatus(match.target, match.actual);
      return computed
        ? { ...row, target: match.target, actual: match.actual, status: computed }
        : row;
    }
  );

  // Ticket Resolution Rate is deterministically computed from tl_q4 ticket
  // counts — never trust the model for this arithmetic either.
  const ticketResolutionRate = computeTicketResolutionRate(tl.tl_q4);
  if (ticketResolutionRate) {
    const metrics = result.section_synthesis.s5_metrics ?? [];
    const existingIndex = metrics.findIndex((row) =>
      row.metric.trim().toLowerCase().includes("ticket resolution rate")
    );
    const metricRow = {
      metric: "Ticket Resolution Rate",
      target: ticketResolutionRate.target,
      actual: ticketResolutionRate.actual,
      status: ticketResolutionRate.status,
      comment: ticketResolutionRate.comment,
    };
    if (existingIndex >= 0) {
      metrics[existingIndex] = metricRow;
    } else {
      metrics.push(metricRow);
    }
    result.section_synthesis.s5_metrics = metrics;
  }

  // Status disagreement always escalates, regardless of what the model produced.
  if (pmStatus && tlStatus && pmStatus !== tlStatus) {
    const crossAnalysis = (result.ai_generated.s10_cross_analysis ?? []).filter(
      (entry) =>
        !(entry.relationship === "DISAGREE" && entry.topic.toLowerCase().includes("status"))
    );
    crossAnalysis.push({
      topic: "Overall Delivery Status",
      relationship: "DISAGREE",
      finding: `The Product Manager assessed overall delivery status as ${pmStatus}, while the Tech Lead assessed it as ${tlStatus}. This disagreement should be reconciled before the report is shared externally.`,
    });
    result.ai_generated.s10_cross_analysis = crossAnalysis;

    const managementAttention = (result.ai_generated.s13_management_attention ?? []).filter(
      (entry) => entry.source !== "Disagreement"
    );
    managementAttention.push({
      item: "Delivery status disagreement between PM and TL",
      type: "Misalignment",
      explanation: `PM rated delivery status as ${pmStatus}; TL rated it as ${tlStatus}. Align on a single status before this report reaches the customer.`,
      urgency: "High",
      source: "Disagreement",
    });
    result.ai_generated.s13_management_attention = managementAttention;
  }

  return result;
}

export async function generateAnalysis(projectId: string): Promise<AnalysisJson> {
  console.log(`[generateAnalysis] START projectId=${projectId}`);
  console.log(
    `[generateAnalysis] ANTHROPIC_API_KEY present=${!!process.env.ANTHROPIC_API_KEY} length=${process.env.ANTHROPIC_API_KEY?.length ?? 0} prefix=${process.env.ANTHROPIC_API_KEY?.slice(0, 12) ?? "undefined"}`
  );

  const project = await getProjectById(projectId);
  if (!project) throw new Error(`Project ${projectId} not found`);

  const pm = await getPMAnswers(projectId);
  const tl = await getTLAnswers(projectId);
  if (!pm || !pm.submitted_at)
    throw new Error(`PM answers not submitted for project ${projectId}`);
  if (!tl || !tl.submitted_at)
    throw new Error(`TL answers not submitted for project ${projectId}`);

  const tlUser = tl.submitted_by ? await getUserById(tl.submitted_by) : null;
  const tlPreparedBy = tlUser ? `${tlUser.full_name}, Tech Lead` : "Tech Lead";

  const source: SourceAnswers = { project, pm, tl, tlPreparedBy };

  console.log("[generateAnalysis] calling Claude API...");

  let response;
  try {
    response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserMessage(source) }],
    });
  } catch (err) {
    console.error("[generateAnalysis] Claude API call threw an error:");
    console.error(err);
    if (err && typeof err === "object") {
      console.error("[generateAnalysis] error keys:", Object.keys(err));
      console.error("[generateAnalysis] full error JSON:", JSON.stringify(err, null, 2));
    }
    throw err;
  }

  console.log("[generateAnalysis] Claude API call succeeded. stop_reason:", response.stop_reason);
  console.log("[generateAnalysis] raw response.content:", JSON.stringify(response.content, null, 2));

  if (response.stop_reason === "max_tokens") {
    console.warn(
      "[generateAnalysis] WARNING: Response was truncated due to max_tokens limit — consider increasing further or reducing prompt complexity"
    );
  }

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude API returned no text content");
  }

  console.log("[generateAnalysis] raw text block before JSON.parse:", textBlock.text);

  const cleaned = stripMarkdownFences(textBlock.text);

  let parsed: AnalysisJson;
  try {
    parsed = JSON.parse(cleaned) as AnalysisJson;
  } catch (err) {
    console.error(
      "generateAnalysis: failed to parse Claude response as JSON. Raw response:",
      textBlock.text
    );
    throw new Error(
      `generateAnalysis: invalid JSON from Claude API: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  const result = applyComputedFields(parsed, source);
  console.log(`[generateAnalysis] END projectId=${projectId} success`);
  return result;
}
