# Quarterly Service Delivery Report Skills

## Purpose

Use this skill to reformat, rewrite, or quality-review a Quarterly Service Delivery Report so that it is:

- Customer-focused, evidence-based, and easy to scan
- Precise, professional, and free from unnecessary detail
- Transparent about performance, weaknesses, risks, and dependencies
- Aligned with practical ITIL/ITSM service-management principles
- Designed to increase customer confidence and enable an open quarterly discussion
- Useful for identifying future customer needs and additional value opportunities without sounding sales-driven

The report must show:

> What we delivered.  
> How the service performed.  
> What went well.  
> What did not go well.  
> What we will improve.  
> What we need to discuss and decide together.

---

## 1. Core Reporting Principles

### 1.1 Lead with customer impact

Do not present activities as achievements unless their value is clear.

**Weak**

> Completed WordPress updates and resolved tickets.

**Better**

> Completed planned platform updates and resolved all reported requests, supporting service continuity and reducing operational disruption.

Connect delivery to one or more of the following:

- Service continuity
- Business operations
- Customer or end-user experience
- Risk reduction
- Faster response or restoration
- Improved governance
- Better maintainability
- Future readiness

### 1.2 Use evidence, not general claims

Every status should be supported by measurable information.

Use:

- Availability
- SLA performance
- Incident count and severity
- Resolution or restoration performance
- Change success rate
- Backlog position
- Recurring problems
- Security findings
- Improvement progress
- Customer feedback

Avoid unsupported statements such as:

- Everything was stable
- Support was excellent
- The platform performed well
- All security risks are under control

### 1.3 Be transparent without becoming defensive

State problems clearly, explain their impact, and show ownership.

Use this structure:

> **Issue → customer impact → cause or current understanding → action taken → preventive action → owner and target date**

Do not hide a concern in an annex while claiming that no concern exists in the main report.

### 1.4 Separate facts, interpretation, and commitments

- **Fact:** What happened and what the data shows
- **Interpretation:** Why the status is Green, Amber, or Red
- **Commitment:** What will happen next, by whom, and by when

### 1.5 Report exceptions, not inventories

Keep the main report focused on decisions and material information.

Move the following to annexes:

- Complete plugin inventories
- Full version lists
- Detailed access registers
- Ticket-level records
- Full vulnerability scan output
- Glossaries
- Detailed maintenance logs

In the main report, show only:

- Material exceptions
- Unsupported or outdated components
- Security findings requiring action
- Important compatibility risks
- Significant changes
- Customer decisions required

---

## 2. Recommended Customer-Facing Structure

Keep the main report to approximately **five or six pages**, with supporting detail in annexes.

### 2.1 Executive Summary

Include:

- Reporting period
- Services covered
- Overall service status
- One-sentence status rationale
- Three key achievements
- Three key concerns
- Key customer decisions or support required
- Next-quarter priorities

Suggested introduction:

> This report provides an evidence-based review of service performance, delivery outcomes, incidents, risks, improvements, and priorities for the reporting period. It is intended to support an open quarterly discussion, identify concerns early, and align both parties on the actions and decisions required for the next quarter.

### 2.2 Service Performance Scorecard

Use a compact table:

| Metric | Target | Actual | Previous Period | Trend | Status | Commentary |
|---|---:|---:|---:|---|---|---|
| Availability | Agreed target | Actual | Previous | Up/Flat/Down | Green/Amber/Red | Explain exceptions only |
| Response SLA | Agreed target | Actual | Previous | Trend | Status | |
| Resolution SLA | Agreed target | Actual | Previous | Trend | Status | |
| P1/P2 incidents | Threshold | Actual | Previous | Trend | Status | |
| Recurring problems | Threshold | Actual | Previous | Trend | Status | |
| Change success rate | Target | Actual | Previous | Trend | Status | |
| Critical/high vulnerabilities | Target | Actual | Previous | Trend | Status | |

Rules:

- Do not invent targets or actuals.
- Use `Not measured` or `Baseline established this quarter` where data is unavailable.
- Explain missed targets and material exceptions.
- Show trends from the second reporting cycle onward.

### 2.3 What Went Well

Include three to five points only.

Each point should contain:

> **Outcome + evidence + customer value**

Example:

> All reported requests were completed during the period, with initial responses within the agreed target. This supported operational continuity and prevented an aged support backlog.

### 2.4 What Did Not Go Well

Include material weaknesses openly and neutrally.

Cover:

- SLA misses
- Major incidents
- Recurring defects
- Delayed actions
- Communication gaps
- Security or technical debt
- Customer dissatisfaction
- Dependencies that limited progress

Avoid blame. Distinguish between:

- Provider-controlled causes
- Customer dependencies
- Third-party failures
- Shared process gaps

### 2.5 Improvement Plan

Every action must be measurable.

| Improvement | Problem addressed | Expected outcome | Owner | Target date | Success measure | Status |
|---|---|---|---|---|---|---|
| Improve diagnostic logging | Recurring issue difficult to trace | Faster root-cause identification | Provider | Date | Reduced repeat incidents or faster diagnosis | In progress |
| Establish CAB cadence | Changes lack joint governance | Better planning and risk control | Joint | Date | Meetings scheduled and decisions recorded | Proposed |

Avoid vague actions such as:

- Improve communication
- Enhance monitoring
- Continue optimization
- Work more closely

Convert them into specific commitments.

### 2.6 Risks, Decisions, and Customer Support Required

Use one concise table:

| Topic | Risk or decision | Business impact | Required action | Owner | Required by |
|---|---|---|---|---|---|

Only include items that require attention, decision, acceptance, input, or dependency resolution.

### 2.7 Customer Feedback and Open Discussion

Use the report to start a conversation, not to close one.

Include these questions:

1. What worked well from the customer’s perspective?
2. Where did the service fall short of expectations?
3. Are there unresolved concerns or grievances?
4. Have business, operational, or technical priorities changed?
5. What should the provider improve next quarter?
6. What upcoming initiatives may affect the service?
7. Where could the provider create additional value?

Record agreed answers, owners, and actions after the review meeting.

### 2.8 Next-Quarter Commitments

Use measurable commitments, not broad activity statements.

| Commitment | Expected outcome | Owner | Due date | Customer dependency |
|---|---|---|---|---|

**Weak**

> Continue platform maintenance.

**Better**

> Complete the platform and plugin compatibility assessment and present prioritized remediation options by the end of the quarter.

---

## 3. Practical ITIL/ITSM Coverage

The report should apply ITIL/ITSM principles without becoming a textbook.

### 3.1 Service Level Management

Show:

- Agreed targets
- Actual performance
- Trends
- Breaches
- Exception commentary
- Improvement actions

Do not use “On Track” without evidence.

### 3.2 Incident Management

An incident is a service interruption or degradation.

For material incidents, report:

| Incident | Severity | Business impact | Duration | Time to restore | Resolution | Status |
|---|---|---|---:|---:|---|---|

Useful measures:

- P1/P2 incident count
- Mean Time to Restore Service
- Response SLA compliance
- Resolution SLA compliance
- Business downtime
- Open incidents
- Aged incident backlog

### 3.3 Problem Management

A problem is the underlying cause of one or more incidents.

Report recurring or significant problems separately:

| Problem | Related incidents | Root cause status | Temporary control | Permanent action | Owner | Due date |
|---|---:|---|---|---|---|---|

Do not claim that a problem is resolved merely because the incident was closed.

Use one of these root-cause states:

- Confirmed
- Probable
- Under investigation
- External dependency
- Configuration-related
- No fault found

### 3.4 Change Enablement and Release Management

Summarize:

| Change category | Planned | Completed | Successful | Failed/Rolled back | Emergency |
|---|---:|---:|---:|---:|---:|

Include:

- Significant completed changes
- Failed or emergency changes
- Upcoming change calendar
- Customer approvals required
- CAB decisions
- Change-related risks

The purpose of CAB is to:

- Review business impact and technical risk
- Approve significant changes
- Agree timing and ownership
- Review failed or emergency changes
- Align roadmap and maintenance priorities

### 3.5 Monitoring and Event Management

Report only meaningful monitoring outcomes:

- Availability
- Capacity or performance exceptions
- Alerting gaps
- Monitoring improvements
- Events that became incidents
- Detection and response improvements

### 3.6 Information Security Management

Separate:

- No security incidents
- No critical/high vulnerabilities
- Known medium/low findings
- Findings awaiting remediation
- Accepted risks
- Certificate or dependency risks

Never state “no known vulnerabilities” when the technical annex contains unresolved findings.

### 3.7 Continual Improvement

Maintain a quarterly improvement register.

Each improvement must show:

- Baseline
- Target
- Expected customer benefit
- Owner
- Due date
- Status
- Evidence of completion

### 3.8 Relationship Management

Demonstrate:

- Regular governance cadence
- Customer feedback
- Early escalation
- Open risks and concerns
- Joint decisions
- Action tracking
- Future priorities

---

## 4. Status Model

Use a consistent status definition.

### Green — On Track

- Agreed targets met
- No material unresolved customer impact
- Risks controlled
- Improvement actions progressing as planned

### Amber — Improvement Required

- Core service remains operational
- One or more recurring problems, material risks, missed commitments, or governance gaps require attention
- No uncontrolled critical impact

### Red — Critical Attention Required

- Material business disruption
- Significant SLA failure
- Unresolved critical incident or security risk
- Immediate executive action required

### Overall status rule

The overall status must reflect the most material customer outcome, not the average of individual indicators.

Example:

> **Overall Status: Amber — Service Stable, Improvement Required**  
> Core service targets were achieved; however, recurring booking issues, communication gaps, and platform-maintenance risks require structured corrective action.

---

## 5. Customer Confidence Framework

The report should increase confidence by demonstrating five capabilities.

### 5.1 Control

Show that the service is measured and governed.

Evidence:

- Scorecard
- SLA tracking
- CAB
- Change calendar
- Action ownership

### 5.2 Competence

Show that the provider understands both technical and business impact.

Evidence:

- Clear root-cause analysis
- Preventive actions
- Technical risk assessment
- Business-value explanation

### 5.3 Transparency

Show weaknesses as clearly as strengths.

Evidence:

- What did not go well
- Open risks
- Known vulnerabilities
- Missed targets
- Dependencies and limitations

### 5.4 Accountability

Every material action needs:

- One owner
- One target date
- One success measure
- One status

### 5.5 Partnership

The report should invite joint decisions and customer feedback.

Use:

- “Joint action”
- “Customer input required”
- “Decision required”
- “Discussion point”
- “Potential value opportunity”

Avoid language that sounds like blame or a sales pitch.

---

## 6. Future Value, Upsell, and Cross-Sell

Do not use the terms **upsell** or **cross-sell** in the customer-facing report.

Use the heading:

## Potential Value Opportunities

Only include an opportunity when it is connected to an observed customer need.

| Observed need | Potential opportunity | Customer benefit | Recommended next step |
|---|---|---|---|
| Legacy platform limits maintainability | Platform modernization assessment | Lower long-term risk and improved development efficiency | Joint discovery session |
| Limited operational visibility | Enhanced monitoring and service analytics | Earlier issue detection and better reporting | Define monitoring scope |
| Ad hoc change coordination | Managed CAB and release governance | Reduced change risk | Agree governance cadence |

Rules:

- Lead with the need, not the product.
- Explain the customer benefit.
- Present the next step as a discussion.
- Keep commercial details outside the service report unless requested.
- Never exploit an incident as a direct sales tactic.
- Build opportunities from trust, evidence, and future priorities.

---

## 7. Writing and Editing Rules

### 7.1 Tone

Use language that is:

- Direct
- Calm
- Professional
- Evidence-based
- Non-defensive
- Customer-centered
- Open to discussion

### 7.2 Sentence construction

Prefer:

- Short paragraphs
- Active voice
- Specific verbs
- One message per sentence
- Tables for structured information

Avoid:

- Repetition
- Marketing language
- Consultant jargon
- Long technical explanations
- Excessive praise
- Unclear ownership
- Unsupported adjectives

### 7.3 Preferred language

Use:

- Service remained available
- Target achieved
- Target missed
- Customer impact
- Root cause under investigation
- Corrective action
- Preventive action
- Owner
- Target date
- Decision required
- Customer input required
- Improvement opportunity

Avoid:

- Seamlessly
- Best-in-class
- World-class
- Successfully delivered, when no evidence is given
- No issues, when lower-level concerns exist
- Due to the customer, unless factual and neutrally phrased
- We guided the client, when collaborative wording is more appropriate

### 7.4 Precision rules

- Use exact dates.
- Use consistent reporting periods.
- Define all percentages.
- Distinguish planned from unplanned downtime.
- Confirm whether availability excludes planned maintenance.
- Do not mix tickets, requests, incidents, and problems without definitions.
- Do not mark an item Closed when the preventive action remains open.
- Use `TBC`, `Not measured`, or `Data unavailable` rather than guessing.

---

## 8. Reformatting Workflow

Follow this sequence when improving an existing report.

### Step 1 — Extract all facts

Capture:

- Scope
- Services
- Applications
- Targets
- Actual metrics
- Incidents
- Problems
- Changes
- Security findings
- Risks
- Customer feedback
- Achievements
- Commitments
- Dependencies
- Opportunities

Do not start rewriting before the facts are mapped.

### Step 2 — Identify inconsistencies

Check for:

- Overall status conflicting with section statuses
- “No vulnerabilities” conflicting with open findings
- Closed incidents with open underlying problems
- Availability figures that do not match detailed downtime
- Reporting quarter inconsistent with report dates
- Customer asks described as concerns
- Activities presented as value
- Missing owners or target dates

### Step 3 — Build the executive narrative

Summarize the period in this order:

1. Overall service outcome
2. Customer impact
3. Main achievements
4. Main concerns
5. Improvement direction
6. Decisions required

### Step 4 — Build the scorecard

Use only verified data. Establish a baseline when historical comparison is unavailable.

### Step 5 — Separate incidents, problems, changes, and risks

Do not combine them into a generic issue list.

### Step 6 — Convert recommendations into commitments

Every commitment requires:

- Action
- Outcome
- Owner
- Date
- Measure

### Step 7 — Add customer discussion points

Create explicit questions and record decisions after the quarterly review.

### Step 8 — Move technical detail to annexes

Keep the main report readable for business and IT stakeholders.

### Step 9 — Run the quality checklist

Do not release the report until all critical checks pass.

---

## 9. Quality Checklist

### Executive clarity

- [ ] Can a customer understand the quarter in two minutes?
- [ ] Is the overall status explained in one sentence?
- [ ] Are the top achievements and concerns visible immediately?
- [ ] Are decisions and dependencies explicit?

### Data integrity

- [ ] Are all targets and actuals verified?
- [ ] Are calculations consistent?
- [ ] Are planned and unplanned downtime separated?
- [ ] Do the main report and annexes agree?
- [ ] Are unknown values clearly marked?

### ITSM discipline

- [ ] Are incidents and problems separated?
- [ ] Are major incidents linked to business impact and restoration time?
- [ ] Do recurring issues have permanent corrective actions?
- [ ] Are changes summarized with success and failure rates?
- [ ] Are security findings stated accurately?
- [ ] Is there a measurable continual-improvement register?

### Accountability

- [ ] Does each material action have an owner?
- [ ] Does each action have a target date?
- [ ] Does each action have a success measure?
- [ ] Are previous-quarter commitments reviewed?

### Customer relationship

- [ ] Is customer feedback requested explicitly?
- [ ] Are concerns presented openly and neutrally?
- [ ] Are joint decisions clearly identified?
- [ ] Does the report create an agenda for discussion?
- [ ] Are potential value opportunities linked to real customer needs?

### Writing quality

- [ ] Is the main report no longer than necessary?
- [ ] Are technical inventories moved to annexes?
- [ ] Is repetitive content removed?
- [ ] Is the language free from hype and blame?
- [ ] Are all tables readable and purposeful?

---

## 10. Minimum Data to Collect During the Quarter

Maintain a monthly service record containing:

- Availability by service
- Planned and unplanned downtime
- SLA response and resolution performance
- Ticket and incident volumes
- P1/P2 incidents
- Mean Time to Restore Service
- Recurring problems
- Open backlog and age
- Changes and release outcomes
- Emergency and failed changes
- Security findings and remediation status
- Risks and dependencies
- Improvement actions
- Customer concerns and feedback
- Decisions required
- Potential future requirements

This avoids reconstructing the quarter from memory at reporting time.

---

## 11. Reusable Report Prompt

Use the following prompt when reformatting another service-delivery report:

> Review the attached service-delivery report and rewrite it as a precise, customer-facing Quarterly Service Delivery Report. Preserve all verified facts and relevant context, but remove repetition, unnecessary technical detail, drafting notes, and unsupported claims.
>
> Structure the main report around:
>
> 1. Executive Summary  
> 2. Service Scope  
> 3. Service Performance Scorecard  
> 4. What Went Well  
> 5. What Did Not Go Well  
> 6. Incident and Problem Management  
> 7. Change, Release, Security, and Risk Summary  
> 8. Measurable Improvement Plan  
> 9. Customer Decisions and Support Required  
> 10. Customer Feedback and Open Discussion  
> 11. Next-Quarter Commitments  
> 12. Potential Value Opportunities  
>
> Apply practical ITIL/ITSM principles. Separate incidents from underlying problems. Ensure every material improvement has an owner, target date, expected outcome, and success measure. Use Green, Amber, or Red statuses consistently and explain the overall rating.
>
> Do not invent data. Mark unavailable information as “Not measured,” “TBC,” or “Baseline established this quarter.” Resolve or explicitly flag contradictions between the main report and annexes.
>
> Keep the main report to approximately five or six pages. Move plugin lists, access lists, detailed versions, ticket-level data, and full vulnerability details to annexes.
>
> The tone must be direct, transparent, professional, customer-centered, and open to discussion. The report should increase customer confidence by showing control, competence, accountability, transparency, and partnership.
>
> Present future commercial possibilities as “Potential Value Opportunities,” linked to observed customer needs and benefits. Do not use sales-heavy language or the terms upsell and cross-sell in the customer-facing report.
>
> Finish with a concise quality review identifying missing data, unresolved contradictions, and improvements required for the next reporting cycle.

---

## 12. Final Standard

A strong Quarterly Service Delivery Report is not a list of completed activities.

It is a concise management instrument that shows:

- Service performance against commitments
- Customer and business impact
- Delivery strengths
- Service weaknesses
- Corrective and preventive actions
- Clear accountability
- Joint decisions
- Customer feedback
- Future priorities
- Credible opportunities to create additional value

Professionalism is demonstrated through **evidence, consistency, ownership, transparency, and disciplined follow-through**.
