# SDI — Full Questionnaire Test Answer Set

**Test project:** Nordic Retail Group — Q2 2026 — Quarterly cadence
**Purpose:** Complete PM (11-step) + TL (9-step) answer set for Phase 13 end-to-end testing.
Deliberately includes: one status disagreement (pm_q2 vs tl_q2), one ITSM blind spot
(itsm_pm_4 vs itsm_tl_3 imply different escalation realities), metrics both above and
below target, and enough narrative detail for the AI to synthesise non-trivial S10–S16.

---

## PM Questionnaire (11 steps)

`prepared_by` and reporting period are auto-populated — not included below.

### Step 1 — Delivery Focus (pm_q1)
> What was the overall delivery focus and key activities this quarter?

The primary focus this quarter was stabilizing the checkout and payments flow ahead of
Nordic Retail Group's summer sale campaign, alongside continued rollout of the loyalty
points module. Key activities included: completing the payment gateway migration to
their new PSP, running two rounds of load testing against projected sale-day traffic,
delivering the loyalty points redemption UI, and onboarding two new store-ops
stakeholders on the client side who now participate in fortnightly syncs.

### Step 2 — Delivery Status (pm_q2)
> What is the overall service delivery status?
**Choice:** `Green`

> Justification
Despite one significant incident (see support summary), all committed scope shipped on
time, the client's summer sale went live without checkout downtime, and stakeholder
sentiment is strongly positive. The team classifies this as Green with one flagged risk
carried into next quarter.

### Step 3 — Service Overview (pm_q3)
> Describe the active services, delivery model, team composition, and reporting cadence.

Active services: e-commerce platform maintenance, feature development (loyalty module),
and L2/L3 technical support. Delivery model: dedicated squad under a fixed monthly
retainer with sprint-based delivery. Key stakeholders: Anna Kowalski (Head of Digital,
Nordic Retail Group) and Erik Lindqvist (Store Ops Lead, newly onboarded this quarter).
Team composition: 1 PM, 1 TL, 3 backend engineers, 2 frontend engineers, 1 QA engineer.
Reporting cadence: fortnightly stakeholder sync + this quarterly review.

### Step 4 — Key Achievements (pm_q4)
> What were the key achievements this quarter and what business value did they deliver?

1. Completed payment gateway migration to the new PSP two weeks ahead of schedule,
   reducing transaction fees by an estimated 0.3% — meaningful at Nordic's transaction
   volume.
2. Shipped the loyalty points redemption UI, which the client credits with a 12% uptick
   in repeat-purchase rate in the two weeks since launch.
3. Zero checkout downtime during the summer sale campaign despite 4x normal traffic,
   directly protecting an estimated $180K in sale-day revenue.
4. Reduced average page load time on the product listing page from 2.8s to 1.4s
   following a frontend performance pass.

### Step 5 — Workstream Status (pm_q5)
> Summarise each active workstream — its status (Green/Amber/Red), progress, and key notes.

- **Payments & Checkout** — Green — Migration complete, sale-day load handled cleanly.
  No open items.
- **Loyalty Module** — Green — Redemption UI live; points-earning rules engine still in
  development, on track for Q3.
- **Platform Performance** — Amber — Frontend perf pass complete, but backend API
  latency on the search endpoint remains above target; investigation ongoing.
- **Store Ops Integration** — Amber — New stakeholder onboarding went well, but the
  in-store POS sync feature slipped two weeks due to a third-party API change on the
  vendor's side (see Risks).

### Step 6 — Service Metrics (pm_q6)
> Key service metrics — target vs actual.

| Metric | Target | Actual |
|---|---|---|
| CSAT Score | 4.5 / 5 | 4.6 / 5 |
| SLA Compliance % | 99% | 97.2% |
| Release Success Rate | 95% | 100% |

*(SLA compliance dipped below the 5% Amber threshold this quarter due to the incident
in Step 4 of the TL questionnaire — flag for TL to address in Support & Incidents.)*

### Step 7 — Customer Feedback (pm_q7)
> How was the customer relationship?

Satisfaction remains high; Anna specifically praised the team's transparency during the
checkout incident and the proactive load-testing ahead of the sale. Communication is
strong via the fortnightly sync, though Erik (new stakeholder) has asked for more
detail in written status updates rather than verbal-only summaries. Responsiveness was
excellent — median first-response time on client questions was under 2 hours.
Business alignment is solid; the client has begun discussing Q3 scope (a returns
management feature) ahead of the formal planning cycle, which we take as a positive
signal. One area of concern: the client mentioned they've been asked by their own
finance team to start seeing itemized cost breakdowns for support vs. enhancement work,
which we haven't historically provided.

### Step 8 — Relationship Health (pm_q8)
> Overall relationship health?
**Choice:** `Green`

### Step 9 — ITSM & Service Maturity

**itsm_pm_1** — Were SLAs/SLOs reviewed with the client this quarter, and did they
clearly understand what's covered under standard support vs. billable work?
> SLAs were reviewed once, early in the quarter, during onboarding of the new
> stakeholder Erik. Anna has a solid grasp of coverage boundaries, but Erik's
> understanding is still developing — he raised a question mid-quarter about whether
> the POS sync delay was billable, which suggests the standard-vs-billable line isn't
> fully clear to him yet.

**itsm_pm_2** — Is there a clear line between standard requests (included) and
enhancement work (billable/upsell)? Did the client understand this distinction this
quarter?
> The line exists in our internal documentation but was not proactively communicated
> this quarter beyond the one SLA review. Given the finance-team cost-breakdown request
> in Step 7, this is becoming a live issue rather than a theoretical one.

**itsm_pm_3** — What proactive ITSM improvements or modernization opportunities were
identified and presented to the client this quarter?
> We identified an opportunity to introduce a lightweight self-service status page for
> the client's store-ops team so they can check known issues without opening a ticket.
> This was discussed informally with Erik but not yet formally proposed or scoped.

**itsm_pm_4** — Does the client have a documented, understood escalation path? Was it
tested or used correctly if an escalation occurred this quarter?
> Yes — the escalation path is documented and Anna used it correctly during the
> checkout incident, escalating directly to the TL within minutes, which sped up
> resolution significantly. Erik, however, was not looped into the escalation
> documentation during his onboarding.

**itsm_pm_5** — What did the team do this quarter to help the client better understand
ITSM concepts relevant to their environment?
> Limited — the SLA review at onboarding was the primary vehicle. No dedicated ITSM
> education session was run this quarter, which in hindsight should have been paired
> with Erik's onboarding.

**itsm_pm_6** — How was the business value and risk of maintenance/change activities
communicated to the client this quarter?
> The payment gateway migration's business case (fee reduction, reliability) was
> clearly communicated and well received. Routine maintenance windows were communicated
> via the standard notification email but without explicit business-value framing.

### Step 10 — Additional Notes
> Open notes field.

Worth flagging for Q3 planning: the client's interest in a returns management feature
could be a meaningful scope expansion. Also recommend formally addressing the
cost-breakdown request before it becomes a friction point — possibly tied to the ITSM
self-service status page idea as a broader "transparency package" pitch.

### Step 11 — Review Summary
*(No separate answer — review + submit step.)*

---

## TL Questionnaire (9 steps)

### Step 1 — Technical Delivery Focus (tl_q1)
> From a technical standpoint, what was the delivery focus and key engineering
> activities this quarter?

Engineering focus was split three ways: (1) executing the payment gateway migration
with zero-downtime cutover, (2) load-testing and hardening checkout infrastructure
ahead of the summer sale, and (3) building the loyalty points redemption service and
its supporting API layer. We also carried out a reactive incident response mid-quarter
(see Support & Incidents) and a subsequent root-cause remediation.

### Step 2 — Delivery Status (tl_q2)
> What is your assessment of the overall delivery status?
**Choice:** `Amber`

*(TL sees PM's pm_q2 = Green above this question — disagreement flagged inline)*

> Justification
From an engineering standpoint I'd call this Amber, not Green. We shipped everything
committed, but the checkout incident during peak sale traffic was closer to a
near-miss than the PM summary suggests — we were about 20 minutes from needing to
fail over to a backup payment processor, and the search endpoint latency issue in
Platform Performance is a real technical risk that hasn't been root-caused yet, not
just a minor Amber note.

### Step 3 — Technical Achievements (tl_q3)
> Key technical achievements — releases, performance, security, architecture.

- Zero-downtime PSP migration using a dual-write/shadow-traffic cutover strategy,
  validated against 48 hours of shadow traffic before full switchover.
- Reduced product listing page load time from 2.8s to 1.4s via image lazy-loading,
  bundle splitting, and a CDN cache-header fix.
- Implemented rate-limiting and circuit-breaker patterns on the checkout service ahead
  of the sale, which is what contained the mid-quarter incident from becoming a full
  outage.
- Shipped the loyalty points redemption API with idempotency keys to prevent
  double-redemption under retry conditions.

### Step 4 — Support & Incidents (tl_q4)
> Support and incident numbers.

| Ticket Counts | Value |
|---|---|
| Total | 142 |
| Resolved | 138 |
| Open | 4 |
| Critical | 1 |
| Major | 2 |
| Recurring | 3 |

**Major incident detail:**

| Date | Issue | Impact | Root Cause | Action | Status |
|---|---|---|---|---|---|
| 2026-05-14 | Checkout payment confirmation delayed under peak sale-day load | ~9 min of degraded checkout confirmations; est. 40 orders affected, no data loss | Connection pool exhaustion on the new PSP integration under 4x normal concurrent load | Emergency connection pool resize + circuit breaker tuning; permanent fix deployed within 48h | Resolved |
| 2026-05-14 | Search endpoint latency spike during same peak window | Product search p95 latency rose from 300ms to 2.1s for ~25 minutes | Suspected but unconfirmed — likely cache invalidation storm correlated with the payment incident; not yet reproduced in isolation | Added temporary query result caching as a mitigation; root cause investigation ongoing into Q3 | Open — carried to next quarter |

### Step 5 — Quality & Health (tl_q5)
> Overall quality and delivery health — code quality, QA, release management,
> documentation, communication, team stability.

Code quality remained strong this quarter — test coverage on new services stayed above
85%, and the PSP migration code went through two rounds of peer review plus a security
review given it touches payment data. QA caught the connection-pool exhaustion risk in
load testing but the specific failure threshold under real sale-day traffic patterns
wasn't fully replicated pre-launch — a gap in our load test scenario design. Release
management was smooth; all releases used the standard blue-green deployment pipeline
with no rollbacks required. Documentation is a soft spot — the incident runbook for
payment failures was out of date and had to be improvised during the May 14 incident.
Communication with the PM side was good throughout. Team stability is solid, no
attrition, though the on-call engineer during the incident noted the rotation is
thinly staffed for sale-event coverage.

### Step 6 — Risks & Issues (tl_q6)
> Risks, issues, or dependencies.

| Type | Description | Impact | Owner | Mitigation / Next Step |
|---|---|---|---|---|
| Risk | Search endpoint latency root cause still unconfirmed; could recur under similar load | Medium | Backend Lead | Dedicated investigation sprint scheduled for early Q3 |
| Issue | Incident runbook for payment failures was outdated during May 14 incident | Low | Tech Lead | Runbook rewrite scheduled, target completion within 2 weeks |
| Dependency | Third-party vendor API change broke the in-store POS sync integration, causing a 2-week slip | Medium | Vendor (external) | Vendor has committed to a compatibility patch; internal workaround being built as a fallback in case the patch slips further |
| Risk | On-call rotation is thinly staffed for future high-traffic sale events | Medium | Engineering Manager | Proposing a temporary rotation expansion ahead of any future flash-sale events |

### Step 7 — ITSM & Technical Maturity

**itsm_tl_1** — Is the software/infrastructure inventory (CMDB or equivalent) current?
Were any major gaps in dependency or EOL tracking found this quarter?
> Mostly current. The PSP migration surfaced one gap — the old payment provider's SDK
> version wasn't tracked in our dependency inventory and turned out to be several
> versions behind, which we only caught during migration prep, not through routine
> tracking.

**itsm_tl_2** — What was the patch/vulnerability remediation cadence this quarter?
Were there any overdue critical patches?
> Standard monthly patch cycle was maintained. No overdue critical patches. One
> high-severity CVE in a logging library was patched within 48 hours of disclosure,
> outside the normal cycle.

**itsm_tl_3** — What percentage of incidents this quarter were caught by automated
monitoring vs. client-reported? What's the biggest manual-task automation
opportunity right now?
> Both major incidents on May 14 were caught by automated monitoring within 2 minutes,
> before any client report came in — monitoring coverage held up well under the
> incident itself. The biggest manual-task opportunity right now is the incident
> escalation notification, which is still a manual Slack ping from whoever's on-call
> rather than an automated PagerDuty-style escalation chain.

**itsm_tl_4** — Were any recurring issues this quarter analyzed via root cause
analysis? What prevention steps came out of it?
> Yes — the connection pool exhaustion issue got a full RCA, resulting in the
> permanent pool resize and circuit breaker tuning noted above. The search latency
> issue has an RCA in progress but is not yet concluded.

**itsm_tl_5** — Are the client's critical third-party/vendor dependencies inventoried
with known failure-mode impact? Did any cause issues this quarter?
> Partially. The new PSP is now inventoried with a documented failure mode (connection
> exhaustion under load, now mitigated). The POS sync vendor was not previously
> flagged as a critical dependency with failure-mode documentation, and its API change
> this quarter is exactly the kind of risk that inventory is meant to catch — this is
> a gap we should close in Q3.

### Step 8 — Next Quarter Focus (tl_q7)
> Technical focus for next quarter — blockers, tech debt, priorities.

Top priority is closing out the search latency root cause investigation and
implementing a permanent fix. Second priority is rewriting the incident runbooks,
starting with payments. Third is completing the vendor dependency inventory to
capture failure modes for the POS sync provider and other third-party integrations we
haven't formally risk-assessed. Tech debt: the on-call escalation flow needs
automation (see itsm_tl_3). Blocker: the POS sync fix is dependent on the vendor's
patch timeline, which is outside our control — recommend the PM flag this dependency
risk explicitly with the client.

### Step 9 — Review Summary
*(No separate answer — review + submit step.)*

---

## Notes for Testing

- **Status disagreement** (pm_q2 Green vs tl_q2 Amber) should surface in S1's status
  badge logic and escalate to S13/S15 (Management Attention) per the mapping rules.
- **ITSM blind spot candidate**: itsm_pm_4 (PM believes escalation path is documented
  and understood) vs itsm_tl_3 (TL flags escalation notification as still manual/
  informal) — good test for the BLIND_SPOT tag in S14/S15 ITSM Maturity.
- **Metrics**: SLA Compliance (97.2% vs 99% target) should compute to Amber; CSAT and
  Release Success Rate should compute to Green — exercises the auto-status logic in
  S5.
- **Unconfirmed root cause** (search latency) is a deliberately open thread — good test
  of "note the gap, don't fabricate" in the AI reasoning rules.