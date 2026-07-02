# Service Delivery Intelligence — CLAUDE.md (Web App Version)

> Persistent memory for this project.
> Read this before doing anything. Update when plan evolves.

---

## What This Is

**Service Delivery Intelligence** is an internal web application for
SELISE Digital Platforms that automates Quarterly Service Delivery Reviews.

Product Managers create review sessions, answer their questions, and
Tech Leads answer theirs independently. Once both submit, an AI agent
analyses both perspectives, generates a professional 16-section PDF
report, and emails it to customer stakeholders.

This is an **internal tool** — not a public SaaS product.
Users are SELISE employees (Product Managers and Tech Leads).
Anyone can sign up with their SELISE email and select their role.

**Terminal prototype (source of truth):** All core logic — question sets,
AI reasoning rules, report structure, PDF layout, email format —
is carried over exactly from the terminal version.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| UI Components | Shadcn/ui + Tailwind CSS |
| AI | Anthropic Claude API (claude-sonnet-4-6) |
| PDF Generation | pdf-lib |
| Email | Resend |
| Hosting | Vercel |
| Storage | Supabase Storage (PDFs, logos) |

---

## Roles

| Role | What They Can Do |
|------|-----------------|
| Product Manager | Sign up, create projects, answer PM questionnaire, view reports |
| Tech Lead | Sign up, view all projects, answer TL questionnaire, view reports |

No admin role. No delivery manager role.
Both roles self-selected on signup.
Both roles can view all projects and reports on the dashboard.

---

## Core Workflow

```
SIGNUP / LOGIN
→ User visits /signup
→ Enters Full Name, Last Name, Work Email, Password
→ Selects role: Product Manager or Tech Lead
→ Account created via Supabase Auth
→ Redirected to dashboard

PM CREATES PROJECT
→ PM logs in → Dashboard
→ Clicks "Add Project" (top right)
→ Right-side slide-in modal opens:
   - Project Name
   - Customer Name
   - Delivery Cadence (Monthly / Quarterly)
   - Quarter (Q1 / Q2 / Q3 / Q4 + Year)
   - Assign PM (select from registered PMs)
   - Assign TL (select from registered TLs)
   - Recipient Emails (stakeholder emails)
→ Project created → status: "not_started"

PM ANSWERS QUESTIONNAIRE
→ PM opens project → clicks "Start PM Review"
→ Step-by-step questionnaire (11 steps — prepared_by and reporting period
  are auto-populated, not asked as steps)
→ Steps: Delivery Focus, Delivery Status, Service Overview, Key Achievements,
  Workstream Status, Service Metrics, Customer Feedback, Relationship Health,
  ITSM & Service Maturity, Additional Notes, Review Summary
→ Draft saved automatically on every step
→ Step 11: Review Summary — see all answers, edit any, Submit Review
→ Overwrite Warning modal if resubmitting
→ pm_answers saved → project status: "awaiting_tl" (PM submitted, waiting on TL)

TL ANSWERS QUESTIONNAIRE (independently, can happen before, after, or
alongside the PM's review)
→ TL logs in → Dashboard
→ Sees all projects, including ones awaiting TL submission
→ Opens project → clicks "Start TL Review"
→ Step-by-step questionnaire (9 steps)
→ Steps: Technical Delivery Focus, Delivery Status, Technical Achievements,
  Support & Incidents, Quality & Health, Risks & Issues, ITSM & Technical Maturity,
  Next Quarter Focus, Review Summary
→ For status question: sees PM's answer above their own
  → disagreement flagged inline in real time
→ Draft saved automatically
→ Step 9: Review Summary → Submit Review
→ tl_answers saved → project status: "awaiting_pm" if PM hasn't submitted
  yet, otherwise "processing"

AI AGENT (triggers automatically once BOTH pm_answers and tl_answers exist)
→ project status: "processing"
→ Step 1: Cross-analyse overlapping answers
          AGREE / DISAGREE / COMPLEMENT / BLIND_SPOT
→ Step 2: Detect patterns across all 16 report sections
→ Step 3: Generate S10–S16
→ Step 4: Self-check — verify all placeholders filled
→ analysis saved to Supabase
→ project status: "Generating PDF"

PDF GENERATION (triggers after agent)
→ 16-section Quarterly Service Delivery Report generated
→ Saved to Supabase Storage bucket "reports"
→ projects.pdf_url stores the PDF public URL
→ project status: "Ready"

EMAIL
→ Monthly → sends on configured day of month (e.g. 5th)
→ Quarterly → sends March / June / September / December
→ PM can trigger manual send from report preview page
→ HTML email + PDF attachment via Resend
→ project status: "Sent"
```

### Status Logic
- Initial status on project creation: `not_started`
- PM and TL can answer simultaneously — no waiting for each other
- Status logic:
  - Neither submitted → `not_started`
  - PM submitted only → `awaiting_tl`
  - TL submitted only → `awaiting_pm`
  - Both submitted → `processing` → AI triggers automatically → `ready` → `sent`

---

## Database Schema (Supabase)

### users
```sql
id          uuid primary key
email       text unique
full_name   text
role        text        -- 'product_manager' | 'tech_lead'
created_at  timestamp
```

### projects
```sql
id                uuid primary key
project_name      text
customer_name     text
review_cadence    text        -- 'monthly' | 'quarterly'
quarter           text        -- 'Q1 2026' | 'Q2 2026' | 'Q3 2026' | 'Q4 2026'
start_date        date        -- auto set on creation
assigned_pm       uuid references users
assigned_tl       uuid references users
recipient_emails  text[]
status            text        -- 'awaiting_pm' | 'awaiting_tl' | 'processing' | 'generating_pdf' | 'ready' | 'sent'
pdf_url                text
email_sent_at          timestamp   -- set by scheduler only
manual_email_sent_at   timestamp   -- set by manual send only
created_by             uuid references users
created_at        timestamp
```

### pm_answers
```sql
id            uuid primary key
project_id    uuid references projects
prepared_by   text
pm_q1         text    -- delivery focus and key activities
pm_q2         text    -- delivery status: 'Green' | 'Amber' | 'Red'
pm_q3         text    -- active services, delivery model, team, cadence
pm_q4         text    -- key achievements and business value
pm_q5         text    -- workstream status summary
pm_q6         text    -- service metrics target vs actual
pm_q7         text    -- customer relationship
pm_q8         text    -- relationship health: 'Green' | 'Amber' | 'Red'
itsm_pm_1     text    -- SLA & value communication
itsm_pm_2     text    -- service request boundaries
itsm_pm_3     text    -- proactive improvements
itsm_pm_4     text    -- escalation path
itsm_pm_5     text    -- client education
itsm_pm_6     text    -- change communication
submitted_by  uuid references users
submitted_at  timestamp
```

### tl_answers
```sql
id            uuid primary key
project_id    uuid references projects
tl_q1         text    -- technical delivery focus
tl_q2         text    -- technical delivery status: 'Green' | 'Amber' | 'Red'
tl_q3         text    -- technical achievements
tl_q4         text    -- support and incident numbers
tl_q5         text    -- quality and delivery health
tl_q6         text    -- risks, issues, dependencies
tl_q7         text    -- next quarter technical focus
itsm_tl_1     text    -- environment & configuration
itsm_tl_2     text    -- security & patch management
itsm_tl_3     text    -- tooling & automation
itsm_tl_4     text    -- root cause analysis
itsm_tl_5     text    -- third-party dependency risk
submitted_by  uuid references users
submitted_at  timestamp
```

### analysis_results
```sql
id            uuid primary key
project_id    uuid references projects
analysis      jsonb       -- full analysis.json (see schema below)
generated_at  timestamp
```

### settings (global — one row)
```sql
id                  uuid primary key
organisation_name   text        -- 'SELISE Digital Platforms'
organisation_logo   text        -- Supabase Storage URL
delivery_cadence    text        -- 'monthly' | 'quarterly'
send_on_day         integer     -- day of month (e.g. 5)
recipient_emails    text[]
updated_at          timestamp
```

### customer_logos
```sql
id              uuid primary key
customer_name   text
logo_url        text        -- Supabase Storage URL
uploaded_by     uuid references users
uploaded_at     timestamp
```

---

## Pages & Routes

| Route | Page | Who Can Access |
|-------|------|---------------|
| `/` | Landing → redirect to login | Everyone |
| `/login` | Login page | Unauthenticated |
| `/signup` | Signup page | Unauthenticated |
| `/dashboard` | All projects + status table | PM, TL |
| `/projects/[id]` | Project detail + report preview + send email | PM, TL |
| `/projects/[id]/pm` | PM questionnaire (10 steps) | PM only |
| `/projects/[id]/tl` | TL questionnaire (8 steps) | TL only |
| `/settings` | Schedule, branding, email recipients, logo upload | PM, TL |

---

## UI Screens — Full Detail

### 1. Login Page (dark theme)
- Dark hero background with blue gradient
- Top nav: SDI logo + Home | Use Cases | Support | Sign In
- Left: "Service Delivery Intelligence" hero text + tagline:
  "Structured quarterly reviews for Product Managers and Tech Leads —
  AI-analysed and delivered automatically."
- Right: Card with Login / Sign Up tab switcher
  - Work Email, Password, Login button (no role selector — role fetched from DB after login)
- Footer: SELISE DIGITAL PLATFORMS

### 2. Sign Up Page (dark theme)
- Same dark background as login
- Sign Up tab active in the same card
- Fields: Full Name, Last Name, Work Email, Password
- Role selector: Product Manager / Tech Lead
- "Create Account" button
- Link: "Already have an account? Login"

### 3. Dashboard (light theme)
- Heading: "Project Reviews"
- "Add Project" button top right → opens New Project slide-in modal
- Project table columns: PROJECT | QUARTER | PRODUCT MANAGER | TECH LEAD | STATUS | ACTION
- Legend above table: ● Not started ● One role submitted ● Both submitted / ready ● Report sent
- Status chips:
  - Grey "Not started" → neither PM nor TL has submitted
  - Amber "Awaiting Tech Lead" → PM submitted, TL pending
  - Amber "Awaiting PM" → TL submitted, PM pending
  - Purple "Processing" → both submitted, AI/PDF generating
  - Green "Report ready" → report available
  - Blue "Report sent" → email delivered
- Action button rules (role-aware):
  - Only the assigned PM/TL for a project gets an action button for their own section
  - Other users see nothing in the Action column unless the report is ready/sent
  - "Fill your section" → shown to the assigned user who hasn't submitted yet
  - "View progress" → shown to the assigned user who has submitted, waiting on the other role
  - "View Report" → shown to everyone once both have submitted
- Left sidebar: Projects | Settings | Logout

### 4. New Project (right-side slide-in modal)
- Triggered by "Add Project" button — slides in from right
- Fields:
  - Project Name (text)
  - Customer Name (text)
  - Delivery Cadence: Monthly / Quarterly toggle
  - Quarter: Q1 | Q2 | Q3 | Q4 selector + Year
  - Assign PM: dropdown of registered PMs
  - Assign TL: dropdown of registered TLs
  - Recipient Emails: tag-style email input
- Buttons: Cancel | Create Project (primary blue)

### 5. PM Questionnaire (11 steps)
- Header: Customer + Quarter, "Product Manager Review" title
- Blue progress bar + "Step X of 11" top right
- "Draft saved automatically" on every step
- Previous | Next buttons
- prepared_by is auto-populated from the logged-in PM's full name + role
  (e.g. "John Smith, Product Manager") — not a questionnaire step
- Reporting period is auto-populated from project.quarter — not a questionnaire step
- Steps: Delivery Focus, Delivery Status, Service Overview, Key Achievements,
  Workstream Status, Service Metrics, Customer Feedback, Relationship Health,
  ITSM & Service Maturity, Additional Notes, Review Summary
- Step 11: Review Summary
  - "Review your answers before submitting"
  - Lists each answer with Edit link
  - Note: "Submitting notifies your admin — the AI report generates
    once both PM and TL have submitted"
  - Previous | Submit Review (green) buttons
- Overwrite Warning modal (if resubmitting):
  - "You already submitted the Product Manager section for [Customer] [Quarter].
    Editing will replace your previous answers and may require the Tech Lead
    to review again."
  - Cancel | Overwrite buttons

### 6. TL Questionnaire (9 steps)
- Header: "Tech Lead Review" title
- Same step-by-step UX as PM
- Steps: Technical Delivery Focus, Delivery Status, Technical Achievements,
  Support & Incidents, Quality & Health, Risks & Issues, ITSM & Technical Maturity,
  Next Quarter Focus, Review Summary
- Status question (tl_q2): shows PM's answer above TL's choice for comparison
  - If they differ → inline warning:
    "Differs from Customer Manager Course — this disagreement will be
    flagged in the report"
- Step 9: Review Summary → Submit Review

### 7. Question Types

**Choice — Status (Green / Amber / Red)**
- Three coloured cards: Green "On Track" | Amber "At Risk" | Red "Critical"
- Selected card gets highlighted border
- "Add your justification" free text below
- TL version: shows PM's selection above for comparison, disagreement flagged inline

**Choice — Reporting Period**
- Quarter selector: Q1 | Q2 | Q3 | Q4 toggle buttons
- Year dropdown
- TL version: pre-filled and locked from PM session

**Email List**
- Tag-style email input — emails shown as removable chips
- Helper text: "Add stakeholder emails — they'll receive the final PDF"
- "Send a copy to myself" checkbox

**Numeric — Metrics Table**
- Structured table: Metric | Target | Actual | Status (auto-computed)
- PM rows: CSAT Score | SLA Compliance % | Release Success Rate
- Status auto-computed: ≥ target → Green | within 5% → Amber | >5% below → Red
- TL version: incident numbers (Total | Resolved | Open)
  + "Add incident detail" expandable for major incidents

**Free Text**
- Large textarea with placeholder guidance
- Character count shown
- Auto-saved on blur

### 8. Report Preview Page
- Header: Customer name (bold) | Quarter badge | Prepared by: [PM name], [TL name]
- Top right: Download PDF button + Send Report button (primary)
- Left sidebar navigation to all sections with scroll-spy active highlighting
- Each section tagged: "PM Submitted" (blue) | "TL Submitted" (blue) | "AI Synthesised" (purple)
- S11 Cross-Analysis: each finding tagged:
  COMPLEMENT (green) | AGREE (blue) | BLIND SPOT (amber) | DISAGREE (red)
- S14 Management Attention: cards with title + description + urgency
- S15 ITSM Maturity Summary: cross-analysis findings with PM/TL perspective panels
- S16 Closing Note: grey/blue highlighted box

### 9. Settings Page
- Subtitle: "Report delivery schedule and branding for SELISE Digital Platforms"
- Left panel — Schedule:
  - Delivery Cadence toggle: Monthly | Quarterly
  - Send on day of month dropdown (1st–31st)
  - Email Recipients: tag-style list with + Add button and × to remove
- Right panel — Branding:
  - Organisation Logo: "SELISE" — used on all reports
  - Customer Logo: Upload button (per customer, stored in Supabase Storage)
  - Live Cover Page Preview: real-time mini render of PDF cover
    Caption: "Live preview of the generated PDF cover page"

---

## PM Questions (10 steps total)

`prepared_by` is not a questionnaire step — it's auto-populated from the
logged-in PM's `full_name` + role (e.g. "John Smith, Product Manager").
Reporting period is also auto-populated from project.quarter — not a step.

### Delivery & Overview → S1, S2
| Key | Question | Input Type |
|-----|----------|------------|
| pm_q1 | "What was the overall delivery focus and key activities this quarter?" | Free text |
| pm_q2 | "What is the overall service delivery status?" | Choice: Green / Amber / Red |
| pm_q3 | "Describe the active services, delivery model, team composition, and reporting cadence." | Free text |

### Achievements & Delivery → S3, S4
| Key | Question | Input Type |
|-----|----------|------------|
| pm_q4 | "What were the key achievements this quarter and what business value did they deliver?" | Free text |
| pm_q5 | "Summarise each active workstream — its status (Green/Amber/Red), progress, and key notes." | Free text |

### Metrics & Customer → S5, S9
| Key | Question | Input Type |
|-----|----------|------------|
| pm_q6 | "What were the key service metrics? Cover CSAT, SLA compliance %, release success rate — include target vs actual." | Numeric table |
| pm_q7 | "How was the customer relationship? Cover satisfaction, communication, responsiveness, business alignment, areas of concern." | Free text |
| pm_q8 | "Overall relationship health?" | Choice: Green / Amber / Red |

### ITSM & Service Maturity → S15
| Key | Question | Input Type |
|-----|----------|------------|
| itsm_pm_1 | "Were SLAs/SLOs reviewed with the client this quarter, and did they clearly understand what's covered under standard support vs. billable work?" | Free text |
| itsm_pm_2 | "Is there a clear line between standard requests (included) and enhancement work (billable/upsell)? Did the client understand this distinction this quarter?" | Free text |
| itsm_pm_3 | "What proactive ITSM improvements or modernization opportunities were identified and presented to the client this quarter?" | Free text |
| itsm_pm_4 | "Does the client have a documented, understood escalation path? Was it tested or used correctly if an escalation occurred this quarter?" | Free text |
| itsm_pm_5 | "What did the team do this quarter to help the client better understand ITSM concepts relevant to their environment?" | Free text |
| itsm_pm_6 | "How was the business value and risk of maintenance/change activities communicated to the client this quarter?" | Free text |

---

## TL Questions (8 steps total)

### Delivery & Achievements → S1, S3, S4
| Key | Question | Input Type |
|-----|----------|------------|
| tl_q1 | "From a technical standpoint, what was the delivery focus and key engineering activities this quarter?" | Free text |
| tl_q2 | "What is your assessment of the overall delivery status?" | Choice: Green / Amber / Red |
| tl_q3 | "What were the key technical achievements? Include releases, performance improvements, security work, or architecture changes." | Free text |

### Incidents & Quality → S5, S6, S7
| Key | Question | Input Type |
|-----|----------|------------|
| tl_q4 | "What were the support and incident numbers? Cover total, resolved, open, critical/major incidents — for major ones include date, issue, root cause, action, status." | Numeric + expandable |
| tl_q5 | "How was overall quality and delivery health? Cover code quality, QA, release management, documentation, communication, team stability." | Free text |

### Risks & Next Quarter → S8, S12
| Key | Question | Input Type |
|-----|----------|------------|
| tl_q6 | "What risks, issues, or dependencies exist? For each: type, impact (High/Med/Low), owner, mitigation or next step." | Free text |
| tl_q7 | "What should be the technical focus for next quarter? Include blockers, tech debt, and priorities." | Free text |

### ITSM & Technical Maturity → S15
| Key | Question | Input Type |
|-----|----------|------------|
| itsm_tl_1 | "Is the software/infrastructure inventory (CMDB or equivalent) current? Were any major gaps in dependency or EOL tracking found this quarter?" | Free text |
| itsm_tl_2 | "What was the patch/vulnerability remediation cadence this quarter? Were there any overdue critical patches?" | Free text |
| itsm_tl_3 | "What percentage of incidents this quarter were caught by automated monitoring vs. client-reported? What's the biggest manual-task automation opportunity right now?" | Free text |
| itsm_tl_4 | "Were any recurring issues this quarter analyzed via root cause analysis? What prevention steps came out of it?" | Free text |
| itsm_tl_5 | "Are the client's critical third-party/vendor dependencies inventoried with known failure-mode impact? Did any cause issues this quarter?" | Free text |

---

## Report Structure (16 sections — do not change)

```
S1  Executive Summary          → 4 prose paragraphs, inline status badge
S2  Service Overview           → 2-col table (Area | Summary), 5 rows
S3  Key Achievements           → numbered list, bold title + impact
S4  Delivery Summary           → 4-col table + Delivery Status Legend
S5  Service Performance Metrics → 7-row metrics table
S6  Support & Incident Summary  → ticket counts table + incidents table
S7  Quality & Delivery Health   → 4-col table, 6 areas
S8  Risks, Issues & Dependencies → 5-col table
S9  Customer Feedback           → 2-col table + inline relationship health badge

── AI GENERATED ─────────────────────────────────────────────

S10 Value Delivered            → 4 paragraphs: Business Value, Operational Value,
                                  Technical Value, Strategic Value
S11 Cross-Analysis Summary     → findings tagged AGREE/DISAGREE/COMPLEMENT/BLIND_SPOT
S12 Lessons Learned            → numbered list with context and action
S13 Next Quarter Focus         → table (Focus Area | Expected Outcome | Owner)
S14 Management Attention       → urgency cards (High/Medium/Low)
S15 ITSM Maturity Summary      → AI-synthesised cross-analysis of PM+TL ITSM answers, tagged AGREE/DISAGREE/COMPLEMENT/BLIND_SPOT
S16 Closing Note               → grey box, professional tone

COVER PAGE
→ Full page background: assets/cover_bg.png (must be PNG)
→ SELISE logo top right — cover page only
→ Dark banner bottom 25%: Customer Name | Reporting Period | Date
→ Customer logo bottom right (Supabase Storage) — optional

FOOTER (all pages except cover):
[Customer Name] — [Reporting Period] | Page X | Generated by Service Delivery Intelligence
```

---

## analysis.json Schema

```json
{
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
      "ticket_counts": { "total": "...", "resolved": "...", "open": "...", "critical": "...", "major": "...", "recurring": "..." },
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
      "business_value": "...",
      "operational_value": "...",
      "technical_value": "...",
      "strategic_value": "..."
    },
    "s11_cross_analysis": [
      { "topic": "...", "relationship": "AGREE|DISAGREE|COMPLEMENT|BLIND_SPOT", "finding": "..." }
    ],
    "s12_lessons_learned": [{ "lesson": "...", "context": "...", "action": "..." }],
    "s13_next_quarter_focus": [
      { "focus_area": "...", "expected_outcome": "...", "owner": "Product Manager|Tech Lead|Product Manager, Tech Lead" }
    ],
    "s14_management_attention": [
      { "item": "...", "type": "Decision|Approval|Budget|Resource|Escalation|Misalignment",
        "explanation": "...", "urgency": "High|Medium|Low",
        "source": "Product Manager|Tech Lead|Product Manager, Tech Lead|Disagreement" }
    ],
    "s15_itsm_maturity": [
      { "topic": "...", "pm_perspective": "...", "tl_perspective": "...", "finding": "...", "relationship": "AGREE|DISAGREE|COMPLEMENT|BLIND_SPOT" }
    ],
    "s16_closing_note": "..."
  }
}
```

---

## Report → Question Mapping

Every placeholder in the 15-section report is filled by a specific question or AI synthesis.
This is the source of truth — never deviate from this mapping.

| Report Section | Placeholder | Filled By | Source |
|----------------|-------------|-----------|--------|
| Cover: Customer Name | [Customer Name] | customer_name | PM (project creation) |
| Cover: Reporting Period | [Q2 2026] | quarter | PM (project creation) |
| Cover: Date | [28 June, 2026] | system date | Auto |
| Cover: Customer Logo | logo box bottom right | customer_logo.png | Supabase Storage |
| S1: Delivery focus | [main delivery focus areas] + [major workstreams] | pm_q1 + tl_q1 | PM + TL synthesised |
| S1: Overall status badge | [Green / Amber / Red] | pm_q2 vs tl_q2 | PM + TL — disagreement flagged |
| S1: Highlights | [positive highlights] | pm_q4 + tl_q3 | PM + TL synthesised |
| S1: Areas requiring attention | [risks, escalations...] | tl_q6 | TL |
| S1: Next quarter preview | [next priorities] | tl_q7 + pm_q1 | AI synthesis from S12 |
| S2: Active Services | [Active Services] | pm_q3 parsed | PM |
| S2: Delivery Model | [Delivery Model] | pm_q3 parsed | PM |
| S2: Key Stakeholders | [Key Stakeholders] | pm_q3 parsed | PM |
| S2: Team Composition | [Team Composition] | pm_q3 parsed | PM |
| S2: Reporting Cadence | [Reporting Cadence] | pm_q3 parsed | PM |
| S3: Achievements 1–4 | [Achievement] + [impact] | pm_q4 + tl_q3 | PM + TL merged, deduplicated |
| S4: Workstream rows | [Workstream / Status / Summary / Notes] | pm_q5 parsed | PM |
| S4: Status badges | Green / Amber / Red per row | pm_q5 parsed | PM |
| S5: SLA Compliance | [Target] [Actual] [Status] | pm_q6 parsed | PM |
| S5: Ticket Resolution Rate | [Target] [Actual] [Status] | tl_q4 parsed | TL |
| S5: Avg Response Time | [Target] [Actual] [Status] | tl_q4 parsed | TL |
| S5: Avg Resolution Time | [Target] [Actual] [Status] | tl_q4 parsed | TL |
| S5: Release Success Rate | [Target] [Actual] [Status] | pm_q6 parsed | PM |
| S5: Defect Leakage | [Target] [Actual] [Status] | pm_q6 parsed | PM |
| S5: CSAT | [Target] [Actual] [Status] | pm_q6 parsed | PM |
| S6: Ticket counts table | Total / Resolved / Open / Critical / Major / Recurring | tl_q4 parsed | TL |
| S6: Major incidents table | Date / Issue / Impact / Root Cause / Action / Status | tl_q4 parsed | TL |
| S7: Code Quality | [Observation] [Status] [Improvement Action] | tl_q5 parsed | TL |
| S7: QA | [Observation] [Status] [Improvement Action] | tl_q5 parsed | TL |
| S7: Release Management | [Observation] [Status] [Improvement Action] | tl_q5 parsed | TL |
| S7: Documentation | [Observation] [Status] [Improvement Action] | tl_q5 parsed | TL |
| S7: Communication | [Observation] [Status] [Improvement Action] | tl_q5 parsed | TL |
| S7: Team Stability | [Observation] [Status] [Improvement Action] | tl_q5 parsed | TL |
| S8: Risk rows | Type / Description / Impact / Owner / Mitigation | tl_q6 parsed | TL |
| S8: Issue rows | Type / Description / Impact / Owner / Next Step | tl_q6 parsed | TL |
| S8: Dependency rows | Type / Description / Impact / Owner / Action | tl_q6 parsed | TL |
| S9: Customer Satisfaction | [Feedback] | pm_q7 parsed | PM |
| S9: Communication | [Feedback] | pm_q7 parsed | PM |
| S9: Responsiveness | [Feedback] | pm_q7 parsed | PM |
| S9: Business Alignment | [Feedback] | pm_q7 parsed | PM |
| S9: Areas of Concern | [Feedback] | pm_q7 parsed | PM |
| S9: Relationship health badge | [Green / Amber / Red] | pm_q8 | PM |
| S10: Business Value | [paragraph] | AI synthesis | Agent (S3, S5, S9) |
| S10: Operational Value | [paragraph] | AI synthesis | Agent (S6, S7) |
| S10: Technical Value | [paragraph] | AI synthesis | Agent (S3, S7) |
| S10: Strategic Value | [paragraph] | AI synthesis | Agent (S8, S13) |
| S11: Cross-Analysis | [findings tagged AGREE/DISAGREE/COMPLEMENT/BLIND_SPOT] | AI synthesis | Agent (all questions) |
| S12: Lessons Learned | [lesson + context + action] | AI synthesis | Agent (S6, S7, S8 + disagreements) |
| S13: Focus Area table | Focus Area / Expected Outcome / Owner | AI synthesis | Agent (pm_q1 + tl_q7) |
| S14: Management Attention | Item / Type / Urgency / Source | AI synthesis | Agent (S8, S9 + disagreements) |
| S15: ITSM Maturity Summary | [cross-analysis findings] | AI synthesis | Agent (itsm_pm_1–6 + itsm_tl_1–5) |
| S16: Closing Note | [professional closing paragraph] | AI synthesis | Agent (S13) |

**Parsing rules for free-text answers:**
- pm_q3 → parsed into 5 fields: active_services, delivery_model, key_stakeholders, team_composition, reporting_cadence
- pm_q5 → parsed into array of workstream rows: { workstream, status, summary, notes }
- pm_q6 → parsed into metric rows: { metric, target, actual } — status auto-computed
- tl_q4 → parsed into ticket counts + major incident rows
- tl_q5 → parsed into 6 quality area rows: { area, observation, status, improvement_action }
- tl_q6 → parsed into risk/issue/dependency rows: { type, description, impact, owner, mitigation }

**Status auto-computation for S5 metrics:**
- actual >= target → Green
- within 5% below target → Amber
- more than 5% below target → Red

**S1 next quarter preview** is generated last — pulls from S12 focus areas after AI synthesis.

| Relationship | What AI Does |
|---|---|
| Both agree | Reinforce as strong confirmed signal |
| They disagree | Flag in S13 Management Attention + tag as DISAGREE in S10 |
| They complement | Merge into richer insight + tag as COMPLEMENT |
| One sees risk, other doesn't | Surface as BLIND SPOT in S10 + lesson in S11 |
| One answered, other didn't | Note the gap — do not fabricate |

**Status disagreement rule:** pm_q2 ≠ tl_q2 → always escalates to S14,
flagged inline in TL questionnaire in real time.

**Owner field in S13:** "Product Manager" | "Tech Lead" | "Product Manager, Tech Lead" — never "Both"
**Source field in S14:** "Product Manager" | "Tech Lead" | "Product Manager, Tech Lead" | "Disagreement" — never "Both"

---

## Key Rules & Decisions

- PM and TL answer independently and simultaneously — neither sees other's full answers until report is generated, and neither waits for the other
- Same project + same quarter = overwrite with warning modal
- Both PM and TL can create projects and set recipient emails
- Both Assign PM and Assign TL are mandatory when creating a project
- TL sees all projects on dashboard and can open any awaiting TL submission
- AI triggers only when BOTH have submitted
- PDF generated after AI analysis completes — stored in Supabase Storage bucket "reports"
- projects.pdf_url stores the PDF public URL
- All free-text answers described naturally — AI parses into structured tables
- Date format: DD Month, YYYY (e.g. 28 June, 2026)
- Status badges: Green / Amber / Red — inline, never on separate line
- AI must generate original insights — never copy-paste input text
- Customer logo optional — hide if not uploaded
- Role selector removed from login page — role fetched from DB after login
- SEND_EMAIL=False during all development

---

## Email Format (HTML)

**Subject:** Quarterly Service Delivery Report — [Customer Name] | [Quarter]

**Body:**
- Dear Stakeholder,
- Opening paragraph (customer, period, prepared by)
- **Quick Summary** (navy heading with bottom border)
- **Overall Status:** [badge] — or PM/TL separate if disagreement
- **Key Highlights:** [full text]
- **Focus Next Quarter:** [full text]
- **Action Required:** [list]
- Closing + PDF attachment note
- Regards, SELISE Digital Platforms

---

## Environment Variables (.env.local)

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# Resend
RESEND_API_KEY=
SENDER_EMAIL=reviews@selise.ch

# Email control
SEND_EMAIL=False        # False in dev, True in production

# Scheduler
CRON_SECRET=            # shared secret between Vercel cron and the cron route
ALLOW_DATE_SIMULATION=true  # dev only — never set in Vercel prod
```

---

## Folder Structure

```
service-delivery-intelligence/
├── CLAUDE.md
├── README.md
├── .env.local
├── .env.example
├── public/
│   └── assets/
│       ├── cover_bg.jpg
│       └── selise_logo.png
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── projects/
│   │   │   └── [id]/
│   │   │       ├── page.tsx        # Project detail + report preview
│   │   │       ├── pm/page.tsx     # PM questionnaire
│   │   │       └── tl/page.tsx     # TL questionnaire
│   │   └── settings/page.tsx
│   ├── components/
│   │   ├── ui/                     # Shadcn components
│   │   ├── StatusBadge.tsx         # Green/Amber/Red badge
│   │   ├── QuestionStep.tsx        # Single question UI
│   │   ├── ProgressBar.tsx         # Questionnaire progress
│   │   ├── CrossAnalysisTag.tsx    # AGREE/DISAGREE/COMPLEMENT/BLIND_SPOT tag
│   │   ├── ReportSection.tsx       # Each of 14 sections
│   │   └── ProjectCard.tsx         # Dashboard project row
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── anthropic.ts
│   │   ├── agent.ts                # AI analysis logic
│   │   ├── pdf.ts                  # PDF generation
│   │   ├── email.ts                # Resend email sender
│   │   └── scheduler.ts
│   └── types/
│       └── index.ts
├── package.json
└── tailwind.config.ts
```

---

## Build Phases

| Phase | What to Build | Status |
|-------|--------------|--------|
| 1 | Project scaffold — Next.js 14, Supabase, Shadcn/ui, Tailwind, TypeScript | ✅ |
| 2 | Auth — signup (role selection), login, protected routes | ✅ |
| 3 | Database — Supabase schema, migrations | ✅ |
| 4 | Dashboard — project table, status chips, role-aware view | ✅ |
| 5 | New Project — slide-in modal, assign PM/TL, create session | ✅ |
| 6 | PM Questionnaire — 11 steps, all question types, auto-save, review summary, overwrite modal | ✅ |
| 7 | TL Questionnaire — 9 steps, disagreement flagging, auto-save | ✅ |
| 8 | AI Agent — Claude API, analysis.json, cross-analysis tags, ITSM synthesis | ✅ |
| 9 | PDF Generation — 16-section report + Value Delivered + ITSM Maturity, cover page, all tables | ✅ |
| 10 | Report Preview — web view, section tags, sidebar nav, scroll-spy | ✅ |
| 11 | Email — HTML body, Resend, manual send + scheduler | ✅ |
| 12 | Settings — cadence, send day, recipients, Vercel cron, date simulation | ✅ |
| 13 | End-to-end test — full flow from signup to email received | ⬜ |

---

## Development Rules

- Always read CLAUDE.md before starting any session
- Build one phase at a time — do not skip phases
- Each phase must be tested before moving to next
- SEND_EMAIL=False during all development
- Use TypeScript strictly — no `any` types
- All Supabase queries use Row Level Security (RLS)
- Claude API calls go through lib/agent.ts only
- PDF output must match terminal version exactly
- Never deviate from question set, report structure, or AI reasoning rules above

---

## Known Issues / Pending Fixes

- PDF page break orphan issue — section headers can appear at the bottom of a page without
  content following them; partial fix applied (ensureSpace 100pt before section headers),
  may still occur with very tall first rows
- Cover background image must be PNG — use `assets/cover_bg.png` (not .jpg)
- SEND_EMAIL=False during all development — never set to True until Phase 13

---

## Last Updated
July 2, 2026 — ITSM Maturity step added to both questionnaires.
PM: 11 steps (Step 9 = ITSM & Service Maturity, Step 10 = Additional Notes, Step 11 = Review Summary).
TL: 9 steps (Step 7 = ITSM & Technical Maturity, Step 8 = Next Quarter Focus, Step 9 = Review Summary).
Report expanded to 16 sections: S15 = ITSM Maturity Summary (AI-synthesised), S16 = Closing Note (was S15).
analysis.json: added s15_itsm_maturity, renamed s14_closing_note → s16_closing_note.
DB migrations required: ALTER TABLE pm_answers ADD COLUMN itsm_pm_1..6 text; ALTER TABLE tl_answers ADD COLUMN itsm_tl_1..5 text.
