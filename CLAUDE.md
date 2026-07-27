# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Service Delivery Intelligence — CLAUDE.md (Web App Version)

> Persistent memory for this project.
> Read this before doing anything. Update when plan evolves.

---

## Design System

All UI and PDF design decisions (colors, typography, spacing, component patterns) are documented in:

**[`docs/design-system.md`](docs/design-system.md)**

Read this before touching any visual/UI code. Key constants to know:
- Web brand accent: `blue-600` (interactive), `#741B47` (PDF section headers)
- Neutral system: Tailwind `slate` scale throughout
- PDF color constants: `SECTION_COLOR`, `NAVY`, `GREY_BODY`, `GREY_FOOTER` — all in `src/lib/pdf.ts`
- Section card wrapper: `src/components/report/SectionCard.tsx` — every report section uses this

---

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build (run to check TypeScript errors)
npm run lint     # ESLint
npm run start    # Start production server (after build)
```

No test suite exists. TypeScript errors surface via `npm run build`.

**PowerShell note:** use `curl.exe` (not `curl`) when testing API routes — `curl` is aliased to `Invoke-WebRequest` in PowerShell and does not accept `-H` the same way.

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
There is no public signup — any authenticated user can add new users from
the `/users` page, which sends them an email invite to set their password.

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
| AI | Anthropic Claude API — `CLAUDE_MODEL = "claude-sonnet-4-6"` (in `src/lib/agent.ts`). Claude Sonnet 5 is available and confirmed as a drop-in replacement (`claude-sonnet-5`) if upgraded later — requires bumping `max_tokens` (new tokenizer produces ~30% more tokens for the same text) and confirming no `temperature`/`top_p`/`top_k`/manual `thinking.budget_tokens` params are set (all now return 400 on Sonnet 5). Currently staying on 4.6. |
| PDF Generation | pdf-lib |
| Email | Resend |
| Hosting | Vercel |
| Storage | Supabase Storage (PDFs, logos) |

---

## Roles

| Role | What They Can Do |
|------|-----------------|
| Product Manager | Create projects, answer PM questionnaire, view reports, invite new users |
| Tech Lead | View all projects, answer TL questionnaire, view reports, invite new users |

No admin role. No delivery manager role.
There is no self-service signup — new accounts are created by an existing
user via `/users` ("Add User": full name, email, role), which sends an
email invite; the invited person sets their own password via `/set-password`.
Both roles can view all projects and reports on the dashboard, and both can
add new users — the `/users` page and invite action have no extra
role gate beyond being logged in (see `requireAuth()` in `src/lib/auth.ts`).

---

## Core Workflow

```
USER MANAGEMENT / INVITE (no public signup)
→ Any logged-in user opens /users → "Add User"
→ Enters Full Name, Work Email, selects role (Product Manager / Tech Lead)
→ inviteUserAction (src/app/(app)/users/actions.ts) rejects duplicate emails,
  creates the auth user + users row, sends an invite email (Resend) with a
  Supabase-generated action link
→ Invitee opens the email link → lands on /set-password → sets password →
  redirected to /dashboard
→ If an invite link expires, /set-password shows an "Invite link expired"
  card that lets the invitee request a new one (resendInviteAction)

LOGIN
→ User visits /login → Work Email + Password → supabase.auth.signInWithPassword
  (client-side, no server action) → redirected to /dashboard
→ "Forgot password?" link → /forgot-password → enters email →
  requestPasswordResetAction sends a Resend email with a Supabase recovery
  link (always resolves silently — no email-enumeration signal either way)
→ Recovery link opens /reset-password → new password → updateUser({password})
  → redirected to /dashboard
→ Both the invite and recovery links use Supabase's implicit-flow hash
  tokens, parsed manually client-side in SetPasswordForm.tsx /
  ResetPasswordForm.tsx (setSession from the URL hash) since the app's
  Supabase browser client is otherwise configured for PKCE

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
→ project status: "ready"

PDF GENERATION (triggers automatically right after agent, same server action)
→ 16-section Quarterly Service Delivery Report generated immediately after generateAnalysis() succeeds
→ Saved to Supabase Storage bucket "reports" at path `{projectId}/report.pdf` (upsert: true — overwrites on regeneration)
→ projects.pdf_url stores the public URL
→ PDF generation is best-effort: if it fails, status is still "ready" and the web report is viewable; the PDF API route (/api/projects/[id]/pdf) will attempt on-demand generation as a fallback
→ "View PDF" button (renamed from "Download PDF") opens projects.pdf_url directly in a new tab if set (no generation delay); falls back to the API route only if pdf_url is null

EMAIL
→ Scheduler (Vercel Cron, daily) checks settings.delivery_cadence + send_on_day
  → Monthly: sends every month on the configured day
  → Quarterly: sends on the configured day in Jan/Apr/Jul/Oct
  → On a matching day, sweeps ALL projects currently status='ready' and emails
    them to settings.recipient_emails (global distribution list)
  → Only the scheduler sets status: 'sent' and email_sent_at
→ Manual send (PM or TL, from report preview page) → sends to project.recipient_emails
  (project-specific stakeholders) → sets manual_email_sent_at only, does NOT
  change status or email_sent_at — status stays 'ready' until the scheduler
  actually sends it. This keeps the scheduler's WHERE status='ready' query
  reliable regardless of how many times a project has been manually sent.
→ HTML email + PDF attachment via Resend
```

### Status Logic
- Initial status on project creation: `not_started`
- PM and TL can answer simultaneously — no waiting for each other
- Status logic:
  - Neither submitted → `not_started`
  - PM submitted only → `awaiting_tl`
  - TL submitted only → `awaiting_pm`
  - Both submitted → `processing` → AI triggers automatically → `ready` → `sent` (scheduler only)
- **`status` is exclusively controlled by the scheduler.** Manual send never changes it.

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
customer_name     text        -- UI label is "Account Name" (see Business Unit note below) — column name unchanged
business_unit     text        -- one of 16 fixed values (Retail & Services (RNB), Insurance & Banking (INB), Manufacturing & Engineering (MNE), Telecom & Technology (TNT), Blocks BD-ST (BLK), ORDERMONKEY (OMK), Signature (SIG), Total Experience Lab (TXL), GenesisX (GNX), Human Resource (HMR), Finance & Legal (FNL), Marketing (MKT), General Admin (GAM), IT Operations (ITO), Consulting (CON), Sourcing (SRC)); required on New Project form; nullable in DB for legacy pre-migration rows (dashboard shows "—" if null)
review_cadence    text        -- 'monthly' | 'quarterly'
quarter           text        -- 'Q1 2026' | 'Q2 2026' | 'Q3 2026' | 'Q4 2026'
start_date        date        -- auto set on creation
assigned_pm       uuid references users
assigned_tl       uuid references users
recipient_emails  text[]      -- project-specific stakeholders, used by manual send
status            text        -- 'awaiting_pm' | 'awaiting_tl' | 'processing' | 'generating_pdf' | 'ready' | 'sent'
pdf_url                text
email_sent_at          timestamp   -- set by scheduler only
manual_email_sent_at   timestamp   -- set by manual send only
created_by             uuid references users
created_at        timestamp
```
**Migration:** `supabase/migrations/013_projects_business_unit.sql` adds `business_unit` with a check constraint on the 16 values above — confirm this has actually been run against live Supabase before relying on the column (per the standing migration-confirmation rule below).

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
organisation_logo   text        -- Supabase Storage URL (column exists; branding UI not built — see Known Issues)
delivery_cadence    text        -- 'monthly' | 'quarterly'
send_on_day         integer     -- day of month (e.g. 5), capped 1-28
recipient_emails    text[]      -- global distribution list, used by scheduler only
updated_at          timestamp
```
**Note:** actual column names are `delivery_cadence`, `send_on_day`, `recipient_emails` — NOT `schedule_cadence`/`send_day`/`distribution_emails`. This mismatch caused real bugs earlier (see Known Issues / Resolved). Always verify against live schema before writing queries.

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
| `/forgot-password` | Request a password-reset email | Unauthenticated |
| `/reset-password` | Set new password from a recovery-link session | Public route, but requires the recovery link's session (see Middleware note) |
| `/set-password` | Set password from an invite (or expired-invite resend) | Public route, but requires the invite link's session |
| `/users` | User Management — list users, "Add User" (invite) | Any authenticated user (PM, TL) |
| `/dashboard` | All projects + status table | PM, TL |
| `/projects/[id]` | Project detail + report preview + send email | PM, TL |
| `/projects/[id]/pm` | PM questionnaire (11 steps) | PM only (own draft/answers) |
| `/projects/[id]/tl` | TL questionnaire (9 steps) | TL only (own draft/answers) |
| `/settings` | Schedule (cadence, send day), distribution list | Any authenticated user (PM, TL) |
| `/api/cron/scheduled-send` | Scheduler endpoint (Vercel Cron, daily) | `CRON_SECRET` bearer auth only — NOT session-based; excluded from middleware |

**No public signup route exists** — accounts are created only via `/users` → "Add User" (invite flow).

**Middleware note:** `middleware.ts`'s matcher excludes `api|` from its negative lookahead — ALL `/api/*` routes bypass session-auth middleware and handle their own auth internally (session-based via `createServerSupabaseClient()` for most routes, or `CRON_SECRET` for the cron route). This was a real bug — see Known Issues / Resolved.

---

## UI Screens — Full Detail

### 1. Login Page (dark theme)
- Dark hero background with blue gradient
- Top nav: SDI logo + Home | Use Cases | Support | Sign In
- Left: "Service Delivery Intelligence" hero text + tagline:
  "Structured quarterly reviews for Product Managers and Tech Leads —
  AI-analysed and delivered automatically."
- Right: Card with Work Email, Password, Login button (no role selector — role fetched from DB after login; no signup tab — there is no self-service signup)
- "Forgot password?" link next to the Password field → `/forgot-password`
- Footer: SELISE DIGITAL PLATFORMS

### 2. User Management Page (`/users`, light theme)
- Heading: "User Management" + subtitle "Add Product Managers and Tech Leads — they'll receive an email invite to set up their account."
- Search box (name, email, or role) — client-side filter in `UsersView.tsx`
- "Add User" button → modal (`AddUserModal.tsx`): Full Name, Work Email, role selector (Product Manager / Tech Lead) → `inviteUserAction` (rejects duplicate emails, creates the auth user + `users` row, sends invite email)
- Table (`UsersTable.tsx`): Name | Email (+ "Pending" badge if invited but password not yet set) | Role — paginated with the same rows-per-page/page-number controls as the dashboard's `ProjectsTable.tsx` (10/25/50 options, "Showing X–Y of Z")

### 2a. Forgot Password / Reset Password (dark theme, same `AuthShell` as login)
- `/forgot-password`: single Work Email field → `requestPasswordResetAction` always shows the same generic "check your email" confirmation, whether or not the address matches an account (no enumeration signal)
- `/reset-password`: opened from the emailed recovery link; parses Supabase's implicit-flow hash tokens client-side (same mechanism as `/set-password`, see `ResetPasswordForm.tsx`) to establish a session, then New Password + Confirm Password → `supabase.auth.updateUser({ password })` → redirect to `/dashboard`
- Invalid/expired recovery link → message + link back to `/forgot-password` to request a new one

### 3. Dashboard (light theme)
- Heading: "Project Reviews"
- "Add Project" button top right → opens New Project slide-in modal
- Project table columns: PROJECT | ACCOUNT NAME | BUSINESS UNIT | QUARTER | PRODUCT MANAGER | TECH LEAD | STATUS | ACTION
  - Project column: initials avatar + `project_name` only (Account Name split out into its own column, no longer a subtitle here)
  - Account Name column: `customer_name` (DB column name unchanged — only the UI label is "Account Name")
  - Business Unit column: `business_unit` value, left-aligned; shows plain em dash "—" for legacy rows where it's null
  - Product Manager / Tech Lead columns: show the assignee's name (`assigned_pm_name` / `assigned_tl_name`, or "—" if unset) directly — NOT a submission-status indicator. Submission/progress state is fully covered by the Status column and its chips/legend below.
  - Quarter column supports ascending/descending sort (chronological, not alphabetical)
- Per-column filters: every column above (Project, Account Name, Business Unit, Quarter, Product Manager, Tech Lead, Status) has its own filter icon in the header → opens a popover (search box, "(Select all)", checkboxes, Clear/Apply buttons) scoped to that column's distinct values. There is no separate global "Filter" button/panel — filtering is entirely per-column.
  - Popover renders via a React portal to `document.body` (escapes the table wrapper's `overflow-hidden` clipping) with `position: fixed` coordinates computed from the trigger button, closed via outside-click detection.
  - Selected values remain visible in the popover list even while a search query is typed that doesn't match their label.
- Global search box (separate from column filters) matches against: project name, account name, business unit, quarter, product manager name, tech lead name, and the derived status label — all substring/case-insensitive.
- Legend above table (6 entries, each a distinct color — not a shared "both submitted/ready" bucket):
  - ● Not started (slate-400 grey) — neither role has submitted
  - ● One role submitted (amber-400)
  - ● Both submitted (indigo-500) — both roles submitted, AI/PDF not yet marked ready
  - ● Report ready (green-500)
  - ● Processing (purple-500)
  - ● Report sent (blue-500)
- Status chips:
  - Grey "Not started" → neither PM nor TL has submitted
  - Amber "Awaiting Tech Lead" → PM submitted, TL pending
  - Amber "Awaiting PM" → TL submitted, PM pending
  - Purple "Processing" → both submitted, AI/PDF generating
  - Green "Report ready" → report available (PDF exists, may or may not have been manually sent — see "✓ manually sent" sub-indicator)
  - Blue "Report sent" → scheduler has sent it (status only flips here via scheduler)
- Secondary indicator: "✓ manually sent" shown below "Report ready" chip when `manual_email_sent_at` is set but `status` is still `ready`
- Action button rules (role-aware):
  - Only the assigned PM/TL for a project gets an action button for their own section
  - Other users see nothing in the Action column unless the report is ready/sent
  - Single consolidated action button per row (no separate edit pencil icon) — label is state-aware: "Fill your section" (not started) / "Continue" (draft exists, not submitted) / "View progress" (submitted, waiting on other role) / "View Report" (both submitted)
  - Delete icon: visible only when (a) neither PM nor TL has submitted yet, AND (b) the current user is `assigned_pm` or `assigned_tl` for that specific project — re-verified server-side on every delete request, not just client-side
- Left sidebar: Projects | User Management | Settings | Logout

### 4. New Project (right-side slide-in modal)
- Triggered by "Add Project" button — slides in from right
- Fields (in order):
  - Account Name (text) — UI label only; maps to `customer_name` column. Placeholder: "e.g. Service 7000 AG". Required; validation message "Account name is required."
  - Project Name (text). Placeholder: "e.g. Customer Portal"
  - Business Unit (searchable combobox, required) — exactly 16 fixed values, see `projects.business_unit` in the schema above. Validation message "Business unit is required."
  - Delivery Cadence: Monthly / Quarterly toggle
  - Quarter: Q1 | Q2 | Q3 | Q4 selector + Year
  - Assign Product Manager: searchable combobox of registered PMs
  - Assign Tech Lead: searchable combobox of registered TLs
  - Recipient Emails: tag-style email input (project-specific stakeholders, used by manual send)
  - Business Unit / Assign Product Manager / Assign Tech Lead all share one reusable `SearchableSelect` component (in `NewProjectModal.tsx`) — a combobox with a search input filtering the option list, not a plain `<select>`
- Analysis mode selector: two-card selector, "Deterministic" (default, active) vs. "Adaptive" (disabled, "Coming Soon" badge — no pipeline branching exists yet, see Analysis Mode section below)
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
  **ITSM & Service Maturity**, Additional Notes, Review Summary
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
- Resume/edit access: only the assigned PM can resume/edit their own unsubmitted draft; access is via the same consolidated dashboard action button ("Continue"), not a separate icon

### 6. TL Questionnaire (9 steps)
- Header: "Tech Lead Review" title
- Same step-by-step UX as PM
- Steps: Technical Delivery Focus, Delivery Status, Technical Achievements,
  Support & Incidents, Quality & Health, Risks & Issues, **ITSM & Technical Maturity**,
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

**ITSM step questions** — free text, same styling as other free-text steps, no special question type

### 8. Report Preview Page (web) — VERIFIED against `page.tsx`, `ReportHeader.tsx`, and `ReportSidebar.tsx`
- Header (`ReportHeader.tsx`): Account Name leads, Project Name follows muted and same font weight — `{customer_name} · {project_name}` as a single `h1` (`font-medium`, not `font-bold`), e.g. "ipex AG · Case Management Portal". Below that: quarter · Product Manager name with a "Product Manager" pill badge · Tech Lead name with a "Tech Lead" pill badge — always spelled out in full, never abbreviated "PM"/"TL".
- Top right: **"View PDF" button** (renamed from "Download PDF" — it opens the PDF in a new browser tab via `window.open`, it does not force a file download; user can save from the browser's own PDF viewer) + Send Report button (primary; label is "Send Report" or "Resend Report" based on `manual_email_sent_at`, shows "Last sent manually on [date]" hint — independent of `status`)
- Left sidebar navigation to all sections with scroll-spy active highlighting, plain sequential numbering (no "S" prefix in UI)
- Each section tagged: "PM Submitted" (blue) | "TL Submitted" (blue) | "AI Synthesised" (purple)
- A "Focus Lens" stepper (`FocusLensBar.tsx` / `FocusLensStepper.tsx`) lets the user jump between flagged items (Blind Spots, Disagreements, Complements, Agreed, Risks, Urgent) across the Cross-Analysis Summary, ITSM Maturity Summary, Risks & Dependencies, and Management Attention sections. The stepper is a fixed pill at the bottom of the viewport (`border-slate-600` for visibility). The currently-selected item gets a brief entry flash plus a persistent `blue-600` box-shadow outline + light blue tint that stays until the user steps to another item or exits.
- **Web report preview uses 18 sections** (more granular than the 16-section PDF — see note below):
  ```
  From Submission (11):
  01 Executive Summary          — ExecutiveSummary, data: ss.s1_executive_summary
  02 Service Overview           — ServiceOverview, data: ss.s2_service_overview
  03 Delivery Status            — DeliveryStatusSection, data: ss.s1_executive_summary (reused)
  04 Health Rating              — HealthRating, data: report_meta (reused)
  05 Key Achievements           — KeyAchievements, data: ss.s3_achievements
  06 Delivery Summary           — DeliverySummaryTable, data: ss.s4_delivery_summary
  07 Service Metrics            — ReportMetricsTable, data: ss.s5_metrics
  08 Support & Incidents        — SupportIncidents, data: ss.s6_support_summary
  09 Quality & Health           — ReportQualityHealthTable, data: ss.s7_quality_health
  10 Risks & Dependencies       — RisksTable, data: ss.s8_risks
  11 Customer Feedback          — CustomerFeedbackSection, data: ss.s9_customer_feedback

  AI Synthesised (7):
  12 Value Delivered            — ValueDelivered, data: ai.s10_value_delivered
  13 Cross-Analysis Summary     — CrossAnalysisSummary, data: ai.s10_cross_analysis
  14 Lessons Learned            — LessonsLearnedList, data: ai.s11_lessons_learned
  15 Next Quarter Focus         — NextQuarterFocusTable, data: ai.s12_next_quarter_focus
  16 ITSM Maturity Summary      — ItsmMaturitySection, data: ai.s15_itsm_maturity
     (tag + topic + finding text only in UI — NO PM/TL perspective panels shown;
     pm_perspective/tl_perspective fields still generated by AI and stored in
     analysis_results, just not rendered)
  17 Management Attention       — ManagementAttentionCards, data: ai.s13_management_attention
  18 Closing Note               — ClosingNoteCard, data: ai.s16_closing_note
  ```
- **Render order in `page.tsx` is confirmed correct**: ITSM Maturity (16) renders before Management Attention (17) — matches intent (topic flows into what needs attention next).
- **Web (18 sections) vs. PDF (16 sections) — intentionally different, not a bug.** The web page splits "Delivery Status" and "Health Rating" into their own standalone sections (03, 04) for scannable navigation, while the PDF folds this same underlying data (`s1_executive_summary`, `report_meta`) into inline badges within Executive Summary (S1) and Customer Feedback (S9) respectively, favoring compactness. Both pull from identical data — only display granularity differs. This was verified by reading `page.tsx`, `ReportSidebar.tsx`, and `pdf.ts` side by side; confirm this divergence remains intentional if either file is touched again.

### 9. Settings Page
- Subtitle: "Report delivery schedule and distribution list for SELISE Digital Platforms"
- Two sections, each with independent Save button:
  - **Schedule**: Delivery Cadence toggle (Monthly | Quarterly), Send on Day of Month (1–28), helper text explaining quarterly = Jan/Apr/Jul/Oct
  - **Distribution List**: chip-based email list (Enter/comma to add, × to remove, dupe/format validation) — labeled "Recipients for scheduled reports", subtext clarifies this is separate from each project's individual stakeholders
- **Branding is NOT built** — no logo upload, no cover page preview, explicitly descoped from Phase 12. `organisation_logo` column exists in DB but has no UI.

---

## PM Questions (11 steps total)

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

### ITSM & Service Maturity → S15 (display position 15, internal key `s15_itsm_maturity`)
| Key | Question | Input Type |
|-----|----------|------------|
| itsm_pm_1 | "Were SLAs/SLOs reviewed with the client this quarter, and did they clearly understand what's covered under standard support vs. billable work?" | Free text |
| itsm_pm_2 | "Is there a clear line between standard requests (included) and enhancement work (billable/upsell)? Did the client understand this distinction this quarter?" | Free text |
| itsm_pm_3 | "What proactive ITSM improvements or modernization opportunities were identified and presented to the client this quarter?" | Free text |
| itsm_pm_4 | "Does the client have a documented, understood escalation path? Was it tested or used correctly if an escalation occurred this quarter?" | Free text |
| itsm_pm_5 | "What did the team do this quarter to help the client better understand ITSM concepts relevant to their environment?" | Free text |
| itsm_pm_6 | "How was the business value and risk of maintenance/change activities communicated to the client this quarter?" | Free text |

### Additional Notes (Step 10)
Free text — open notes field, no fixed report mapping.

---

## TL Questions (9 steps total)

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

### Risks → S8
| Key | Question | Input Type |
|-----|----------|------------|
| tl_q6 | "What risks, issues, or dependencies exist? For each: type, impact (High/Med/Low), owner, mitigation or next step." | Free text |

### ITSM & Technical Maturity → S15 (display position 15, internal key `s15_itsm_maturity`)
| Key | Question | Input Type |
|-----|----------|------------|
| itsm_tl_1 | "Is the software/infrastructure inventory (CMDB or equivalent) current? Were any major gaps in dependency or EOL tracking found this quarter?" | Free text |
| itsm_tl_2 | "What was the patch/vulnerability remediation cadence this quarter? Were there any overdue critical patches?" | Free text |
| itsm_tl_3 | "What percentage of incidents this quarter were caught by automated monitoring vs. client-reported? What's the biggest manual-task automation opportunity right now?" | Free text |
| itsm_tl_4 | "Were any recurring issues this quarter analyzed via root cause analysis? What prevention steps came out of it?" | Free text |
| itsm_tl_5 | "Are the client's critical third-party/vendor dependencies inventoried with known failure-mode impact? Did any cause issues this quarter?" | Free text |

### Next Quarter Focus → S13
| Key | Question | Input Type |
|-----|----------|------------|
| tl_q7 | "What should be the technical focus for next quarter? Include blockers, tech debt, and priorities." | Free text |

---

## Report Structure — PDF (16 sections) — VERIFIED against `pdf.ts`

PDF section headers use plain "S" + number labels via `drawSectionHeader()`. **The printed label number and the underlying `analysis.json` key name do NOT match numerically** (leftover from before ITSM was inserted) — cosmetic only, not a functional bug, since `pdf.ts` reads the correct property regardless of the label string printed. Confirmed end-to-end: `agent.ts` generates these exact key names and `pdf.ts` reads the same exact key names — no mismatch in actual data flow.

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
                                    printed label → actual analysis.json key read
S10 Value Delivered             → "10" → ai.s10_value_delivered       [matches]
S11 Cross-Analysis Summary      → "11" → ai.s10_cross_analysis        [key says s10]
S12 Lessons Learned             → "12" → ai.s11_lessons_learned       [key says s11]
S13 Next Quarter Focus          → "13" → ai.s12_next_quarter_focus    [key says s12]
S14 ITSM Maturity Summary       → "14" → ai.s15_itsm_maturity         [key says s15]
S15 Management Attention        → "15" → ai.s13_management_attention [key says s13]
S16 Closing Note                → "16" → ai.s16_closing_note          [matches]
```

**PDF order confirmed correct**: ITSM Maturity (labeled S14) prints before Management Attention (labeled S15) — matches intent.

**Cleanup opportunity (cosmetic, low priority):** `ai_generated` key names don't reflect either their PDF label or web display numbers. Renaming them for self-consistency would require touching the Claude API prompt schema in `agent.ts` plus every reader (`pdf.ts`, `page.tsx`) — not urgent since everything works correctly today, just confusing to read.

## Report Structure — Web Preview (18 sections)

See "Report Preview Page" under UI Screens above for the full verified 18-section breakdown. Web and PDF intentionally differ in granularity (web splits Delivery Status and Health Rating into standalone sections; PDF folds them into inline badges) — both read from the same underlying data.

```
COVER PAGE
→ Full page background: assets/cover_bg.png (must be PNG)
→ SELISE logo top right — cover page only
→ Dark banner bottom 25%: Customer Name | Reporting Period | Date
→ Customer logo bottom right (Supabase Storage) — optional, hidden if not uploaded

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
}
```
**Note:** VERIFIED actual key names from `agent.ts`'s Claude API schema, confirmed to exactly match what `pdf.ts` and `page.tsx` read. `s10_value_delivered` and `s10_cross_analysis` both use the `s10` prefix for two different fields — unusual but functionally fine since they're distinct object keys. There is no `s14_*` key; numbering jumps from `s13_management_attention` to `s15_itsm_maturity`. Key names do not correspond to PDF label numbers or web display numbers — see Report Structure sections above for the real mapping.

---

## Report → Question Mapping

Every placeholder in the 16-section report is filled by a specific question or AI synthesis.
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
| S10: Business Value | [paragraph] | `ai.s10_value_delivered.business_value` | Agent (S3, S5, S9) |
| S10: Operational Value | [paragraph] | `ai.s10_value_delivered.operational_value` | Agent (S6, S7) |
| S10: Technical Value | [paragraph] | `ai.s10_value_delivered.technical_value` | Agent (S3, S7) |
| S10: Strategic Value | [paragraph] | `ai.s10_value_delivered.strategic_value` | Agent (S8, S13) |
| S11: Cross-Analysis | [findings tagged AGREE/DISAGREE/COMPLEMENT/BLIND_SPOT] | `ai.s10_cross_analysis` | Agent (all questions) |
| S12: Lessons Learned | [lesson + context + action] | `ai.s11_lessons_learned` | Agent (S6, S7, S8 + disagreements) |
| S13: Focus Area table | Focus Area / Expected Outcome / Owner | `ai.s12_next_quarter_focus` | Agent (pm_q1 + tl_q7) |
| S14 (PDF label)/S15 (web label): ITSM Maturity Summary | [cross-analysis findings, tag + topic + finding only in UI] | `ai.s15_itsm_maturity` | Agent (itsm_pm_1–6 + itsm_tl_1–5) |
| S15 (PDF label)/S17 (web label): Management Attention | Item / Type / Urgency / Source | `ai.s13_management_attention` | Agent (S8, S9 + disagreements) |
| S16: Closing Note | [professional closing paragraph] | `ai.s16_closing_note` | Agent (S13) |

**Reminder:** column above uses actual `analysis.json` key paths (verified against `agent.ts`, `pdf.ts`, `page.tsx`). PDF section labels and web display numbers differ from each other and from these key names — see Report Structure sections for the full mapping.

**Parsing rules for free-text answers:**
- pm_q3 → parsed into 5 fields: active_services, delivery_model, key_stakeholders, team_composition, reporting_cadence
- pm_q5 → parsed into array of workstream rows: { workstream, status, summary, notes }
- pm_q6 → parsed into metric rows: { metric, target, actual } — status auto-computed
- tl_q4 → parsed into ticket counts + major incident rows
- tl_q5 → parsed into 6 quality area rows: { area, observation, status, improvement_action }
- tl_q6 → parsed into risk/issue/dependency rows: { type, description, impact, owner, mitigation }
- itsm_pm_1–6 + itsm_tl_1–5 → parsed into topic-based cross-analysis array: { topic, pm_perspective, tl_perspective, finding, relationship }

**Status auto-computation for S5 metrics:**
- actual >= target → Green
- within 5% below target → Amber
- more than 5% below target → Red

**S1 next quarter preview** is generated last — pulls from S12 focus areas after AI synthesis.

| Relationship | What AI Does |
|---|---|
| Both agree | Reinforce as strong confirmed signal |
| They disagree | Flag in S14 Management Attention + tag as DISAGREE |
| They complement | Merge into richer insight + tag as COMPLEMENT |
| One sees risk, other doesn't | Surface as BLIND SPOT |
| One answered, other didn't | Note the gap — do not fabricate. This applies to ITSM (S15) too — if one role's ITSM answer doesn't address a topic the other raised, tag as BLIND_SPOT rather than inventing a stance for the silent side. |

**Status disagreement rule:** pm_q2 ≠ tl_q2 → always escalates to S14 Management Attention,
flagged inline in TL questionnaire in real time.

**Owner field in S13:** "Product Manager" | "Tech Lead" | "Product Manager, Tech Lead" — never "Both"
**Source field in S14:** "Product Manager" | "Tech Lead" | "Product Manager, Tech Lead" | "Disagreement" — never "Both"

**Wording rule — no "PM"/"TL" abbreviations in generated or customer-facing text:** `SYSTEM_PROMPT` in `src/lib/agent.ts` explicitly instructs the model to always write "Product Manager" and "Tech Lead" in full in all generated prose (findings, explanations, lessons, closing note, value paragraphs) — never the abbreviations "PM"/"TL". Deterministic (non-AI) fallback strings that touch customer-facing report/UI text follow the same rule (e.g. the disagreement fallback text in `applyComputedFields()`, and the mismatch warning in `HealthRating.tsx`). "PM"/"TL" abbreviations are still fine in internal-only, non-report UI (dashboard admin labels like "Assign PM", status filter option "Awaiting PM") — the rule applies specifically to report/analysis content a customer or stakeholder will read.

**`SYSTEM_PROMPT` tone & consistency rules (added on top of the schema instructions):** in addition to the numbered schema-generation rules, the prompt includes a tone/writing-style section (avoid AI-sounding stock phrases like "leverage", "robust", "seamlessly", "delve into", "furthermore", "it's worth noting"; prefer concrete, direct, varied prose) and an evidence & consistency section (evidence-based claims only, no hype/upsell language, issue→impact→cause→action→prevention→owner structure for risks/lessons/management-attention items using only existing schema fields, internal-contradiction self-checks, and the rule that overall delivery status must reflect the most severe underlying signal present rather than an averaged rollup). These are prompt-text instructions only — no schema/PDF/UI structural changes were made alongside them.

**PDF document title metadata:** `PdfBuilder.create()` in `src/lib/pdf.ts` sets the PDF's internal document title (`doc.setTitle(...)`) to `"{projectName} | {period}"` — this is what Chrome/Edge's built-in PDF viewer shows as the browser tab title when the PDF is opened, distinct from the Supabase Storage file name (`report.pdf`) in the URL path. Existing already-generated PDFs won't have this until regenerated.

---

## Key Rules & Decisions

- PM and TL answer independently and simultaneously — neither sees other's full answers until report is generated, and neither waits for the other
- Same project + same quarter = overwrite with warning modal
- Both PM and TL can create projects and set recipient emails
- Both Assign PM and Assign TL are mandatory when creating a project
- Business Unit is mandatory when creating a project (dropdown, 16 fixed values — see `projects.business_unit` in schema)
- TL sees all projects on dashboard and can open any awaiting TL submission
- AI triggers only when BOTH have submitted
- PDF is generated automatically right after generateAnalysis() succeeds (in pm/actions.ts and tl/actions.ts), not on download-click — stored in Supabase Storage bucket "reports" at `{projectId}/report.pdf`
- projects.pdf_url stores the PDF public URL; "View PDF" button opens it directly if set, falls back to on-demand generation if null
- All free-text answers described naturally — AI parses into structured tables
- Date format: DD Month, YYYY (e.g. 28 June, 2026)
- Status badges: Green / Amber / Red — inline, never on separate line
- AI must generate original insights — never copy-paste input text
- Customer logo optional — hide if not uploaded
- Role selector removed from login page — role fetched from DB after login
- SEND_EMAIL=False during local development by default
- **Manual "Send Report" never changes `project.status`** — it only sets `manual_email_sent_at`. Only the scheduler (cron) sets `status: 'sent'` and `email_sent_at`. This decoupling exists because the scheduler's `WHERE status = 'ready'` query must remain reliable regardless of how many times a project has been manually sent — if manual send flipped status, the scheduler would never pick that project up again.
- Project deletion: only available when neither PM nor TL has submitted (checked via `submitted_at IS NULL`, not row existence — draft rows from auto-save exist before submission and must not block deletion), and restricted to the project's own `assigned_pm` or `assigned_tl` (re-verified server-side, not just client-rendered)
- Draft resume/edit: only the role owner (PM edits own `pm_answers` draft, TL edits own `tl_answers` draft) can resume an in-progress unsubmitted questionnaire; accessed via the single consolidated dashboard action button, not a separate edit icon

---

## Email Format (HTML)

**Subject:** [Monthly|Quarterly] Service Delivery Report — [Project Name] | [Quarter]
(uses `project_name`, not `customer_name` — decided for consistency with header/body; cadence word is currently hardcoded as "Quarterly" regardless of `review_cadence` — see Known Issues)

**Body:**
- Dear Stakeholder,
- Header banner: project_name · quarter
- Opening paragraph: "...Report for [project_name], prepared by [PM name], Product Manager, [TL name], Tech Lead..."
- **Quick Summary** (navy heading with bottom border)
- **Overall Status:** [badge] — or PM/TL separate if disagreement, with inline warning note
- **Key Highlights:** [full text]
- **Focus Next Quarter:** [full text]
- **Action Required:** [list of High urgency management attention items]
- PDF attachment note
- Closing + Regards, SELISE Digital Platforms
- Footer: generated-by note + recipient count

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
SEND_EMAIL=False        # False in dev by default; flip to True only when actively testing real sends, flip back after

# Scheduler
CRON_SECRET=            # shared secret between Vercel cron and the cron route — local dev value is fine as a weak placeholder, MUST be a fresh random value in Vercel production (never reuse the dev one)
ALLOW_DATE_SIMULATION=true  # dev only — NEVER set in Vercel production; gated together with NODE_ENV !== "production" as a second safety layer
```

### Local Testing Notes
- `ALLOW_DATE_SIMULATION=true` + `?simulate_date=YYYY-MM-DD` query param on `/api/cron/scheduled-send` lets you test schedule matching without waiting for the real date. Both `ALLOW_DATE_SIMULATION=true` AND `NODE_ENV !== "production"` must be true for the override to take effect — either gate failing means the real date is used.
- Vercel Cron does NOT run locally (`next dev` doesn't simulate cron triggers) — only the route's internal logic can be tested locally via manual curl; the actual scheduled trigger only exists once deployed.
- **PowerShell users:** `curl` is aliased to `Invoke-WebRequest`, which does not accept `-H` the same way. Use `curl.exe` explicitly to get real curl behavior:
  ```powershell
  curl.exe -H "Authorization: Bearer dev-cron-secret-change-in-production" "http://localhost:3000/api/cron/scheduled-send?simulate_date=2026-07-05"
  ```

### Production Deployment Checklist (Vercel)
- All env vars from `.env.local` must be **manually** added to Vercel (Settings → Environment Variables → Production scope) — they do NOT carry over automatically from local, and a partial set (e.g. only `CRON_SECRET` added) will break the entire site (middleware creates a Supabase client on every request; missing Supabase env vars → site-wide `MIDDLEWARE_INVOCATION_FAILED` 500).
- `CRON_SECRET` in production must be a freshly generated random value — `openssl rand -hex 32` or `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` — never the local dev placeholder.
- `ALLOW_DATE_SIMULATION` must NOT be set in Vercel production under any circumstances.
- After adding or changing env vars, a **Redeploy** is required to pick them up — adding a var alone does not affect an already-running deployment.
- Vercel Cron jobs appear under the project's **Cron Jobs** tab post-deploy (reads schedule from `vercel.json`, which must be committed to the repo); can be manually triggered there for testing without waiting for the real scheduled time.
- Vercel's Hobby (free) tier supports a single daily cron job — sufficient for this project's needs — but has a non-commercial-use restriction worth being aware of as this moves toward genuine internal production use at SELISE.
- Before setting `SEND_EMAIL=True` in production: check `settings.recipient_emails` (global distribution list) and confirm which projects are currently `status='ready'` — the next scheduler tick will email ALL of them to that list with no confirmation step.

---

## Folder Structure

```
service-delivery-intelligence/
├── CLAUDE.md
├── README.md
├── .env.local
├── .env.example
├── vercel.json                     # Vercel Cron schedule config — must be committed
├── public/
│   └── assets/
│       ├── cover_bg.png            # must be PNG, not .jpg
│       └── selise_logo.png
├── src/
│   ├── app/
│   │   ├── (auth)/                 # public, unauthenticated routes (see middleware.ts PUBLIC_ROUTES)
│   │   │   ├── login/page.tsx
│   │   │   ├── set-password/        # invite (and expired-invite resend) flow
│   │   │   ├── forgot-password/     # request a reset email
│   │   │   └── reset-password/      # set new password from recovery link
│   │   ├── (app)/                  # authenticated routes, behind middleware
│   │   │   └── users/               # User Management — list + "Add User" invite modal
│   │   ├── dashboard/page.tsx
│   │   ├── projects/
│   │   │   └── [id]/
│   │   │       ├── page.tsx        # Project detail + report preview
│   │   │       ├── pm/page.tsx     # PM questionnaire
│   │   │       └── tl/page.tsx     # TL questionnaire
│   │   ├── settings/page.tsx
│   │   └── api/
│   │       ├── settings/route.ts              # GET/PATCH global settings
│   │       ├── cron/scheduled-send/route.ts    # Vercel Cron target, CRON_SECRET auth
│   │       └── projects/[id]/
│   │           ├── route.ts                    # DELETE (pre-submission only, assigned users only)
│   │           └── send-email/route.ts         # Manual send, sets manual_email_sent_at only
│   ├── components/
│   │   ├── ui/                     # Shadcn components
│   │   ├── StatusBadge.tsx         # Green/Amber/Red badge
│   │   ├── QuestionStep.tsx        # Single question UI
│   │   ├── ProgressBar.tsx         # Questionnaire progress
│   │   ├── CrossAnalysisTag.tsx    # AGREE/DISAGREE/COMPLEMENT/BLIND_SPOT tag
│   │   ├── ReportSection.tsx       # Each report section
│   │   ├── ItsmMaturitySection.tsx # S15 — tag + topic + finding only in UI
│   │   ├── ReportSidebar.tsx       # Section nav + scroll-spy
│   │   ├── SendReportButton.tsx    # Manual send dialog, chip-based recipients
│   │   └── dashboard/
│   │       ├── ProjectsTable.tsx
│   │       └── DeleteProjectButton.tsx
│   ├── lib/
│   │   ├── supabase-server.ts      # Session-based client (createServerSupabaseClient)
│   │   ├── supabase-admin.ts       # Admin/service-role client — REQUIRED for non-session contexts (cron, curl, webhooks)
│   │   ├── anthropic.ts
│   │   ├── agent.ts                # AI analysis logic — CLAUDE_MODEL constant lives here
│   │   ├── pdf.ts                  # PDF generation
│   │   ├── email.ts                # Resend sender — sendReportEmail, sendInviteEmail, sendPasswordResetEmail
│   │   ├── invite.ts                # generateInviteLink (admin generateLink, invite→recovery fallback)
│   │   ├── password-reset.ts        # generatePasswordResetLink (admin generateLink, type: "recovery")
│   │   └── db.ts                   # getAnalysisResult (session) + getAnalysisResultAdmin (admin, for cron)
│   └── types/
│       └── index.ts
├── middleware.ts                   # Session-auth for pages; matcher EXCLUDES all /api/* routes
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
| 11 | Email — HTML body, Resend, manual send (decoupled from status) | ✅ |
| 12 | Settings — cadence, send day, distribution list, Vercel cron scheduler, date simulation, verified end-to-end in production | ✅ |
| 13 | End-to-end test — full flow from signup to email received | ✅ |

---

## Development Rules

- Always read CLAUDE.md before starting any session
- Build one phase at a time — do not skip phases
- Each phase must be tested before moving to next
- SEND_EMAIL=False during local development by default
- Use TypeScript strictly — no `any` types
- All Supabase queries use Row Level Security (RLS)
- **Always use the admin client (`supabase-admin.ts`) for server-side code that runs in non-session contexts** (cron routes, webhooks, anything invoked without a browser session cookie). The session client (`supabase-server.ts`) silently returns empty results under RLS in these contexts rather than erroring — this has caused real bugs (see Known Issues / Resolved).
- **Any time a build includes a SQL migration, explicitly confirm with the person whether it has actually been run against Supabase** — do not assume a written/planned migration was executed. Writing the SQL and running it are two separate steps; skipping this confirmation caused three separate production bugs today.
- **Verify actual live Supabase schema (column names) before writing queries** — do not trust that a schema documented here or in a migration plan matches what's actually in the database. Column name mismatches (e.g. assumed `schedule_cadence` vs actual `delivery_cadence`) caused repeated 500 errors.
- Claude API calls go through lib/agent.ts only
- PDF output must match terminal version exactly
- Never deviate from question set, report structure, or AI reasoning rules above

---

## Known Issues / Pending Fixes

- PDF page break orphan issue — section headers can appear at the bottom of a page without
  content following them; partial fix applied (ensureSpace 100pt before section headers),
  may still occur with very tall first rows
- Cover background image must be PNG — use `assets/cover_bg.png` (not .jpg)
- Email subject/PDF title cadence word ("Quarterly Service Delivery Report") is hardcoded — does not adapt based on `review_cadence` being 'monthly'. A monthly-cadence project's email/PDF will still say "Quarterly." Deferred fix — decision pending on whether to make dynamic, keep as-is, or genericize.
- Report Structure section numbering has a known divergence between internal `analysis.json` keys (s10–s16) and actual UI display order/numbering after the ITSM reorder — see note under Report Structure. Verify against `ReportSidebar.tsx` directly rather than trusting doc numbers blindly until this is cleaned up.
- Branding/logo upload (Settings page) was explicitly descoped from Phase 12 — `organisation_logo` and `customer_logos` table/column exist in schema but have no UI. Do not build features assuming this exists.
- Vercel plan is Hobby (free) tier — technically restricted to non-commercial use; worth revisiting with whoever manages SELISE's Vercel account as this becomes genuine internal production tooling.

## Known Issues / Resolved (today's session — recorded so these bug classes aren't repeated)

- **Settings API column name mismatch**: route code assumed `schedule_cadence`/`send_day`/`distribution_emails`; actual table used `delivery_cadence`/`send_on_day`/`recipient_emails`. Every PATCH returned 500. Root cause: migration SQL was written but schema was never verified against the live table before writing route code.
- **Missing `updated_by` column**: route tried to write `updated_by: user.id` on every settings PATCH; column never existed in the table. Same root cause as above — assumption not verified against live schema.
- **Postgres rejected UPDATE with no WHERE clause**: `admin.from("settings").update(patch)` had no `.eq()` filter; Postgres safety setting rejected it with `UPDATE requires a WHERE clause` (code 21000). Fixed by fetching the row's `id` first and adding explicit `.eq("id", existing.id)`.
- **Middleware blocked all `/api/*` routes**: matcher applied session-auth redirect broadly, with no exclusion for API routes. Broke the cron endpoint specifically, since it authenticates via `CRON_SECRET` bearer token (no session cookie) — middleware redirected it to `/login` before the route's own auth check ever ran, returning login-page HTML instead of JSON. Fixed by adding `api|` to the matcher's negative lookahead, excluding all `/api/*` from middleware entirely (each API route already handles its own auth internally).
- **RLS silently blocked cron's analysis fetch**: `getAnalysisResult()` used the session-based Supabase client inside the cron route, which has no browser session. RLS on `analysis_results` silently returned zero rows (not an error) rather than the real row that existed, producing a false "No analysis found." Fixed by adding `getAnalysisResultAdmin()` using the admin/service-role client for this non-session context.
- **Dynamic import broke Next.js dev bundler**: `await import("@/lib/supabase-admin")` inside a function body failed to resolve at runtime in dev (`Cannot find module './_rsc_...'`). Fixed by converting to a static top-level import.
- **ITSM migration columns coded but never run**: `itsm_pm_1-6`/`itsm_tl_1-5` columns were referenced in code but the `ALTER TABLE` was never executed against the live database — same pattern as the settings table issue. Always confirm migrations were actually run, not just written/planned.

---

## Analysis Mode

`projects.analysis_mode` is a text column (check-constrained to `'deterministic' | 'non_deterministic'`, default `'deterministic'`).

The New Project modal exposes a two-card selector. **Deterministic** is selected by default and is the only active option. The other card's UI label is **"Adaptive"** (renamed from "Investigative"; DB value remains `non_deterministic` — label-only rename, not a schema change) and is rendered disabled with a "Coming Soon" badge — it cannot be clicked or selected.

**No pipeline branching exists yet.** `agent.ts` / `generateAnalysis()` ignores `analysis_mode` entirely. The column is captured on project creation solely to avoid a schema migration later when Tier 2 (agentic, tool-use loop) analysis ships.

**DB migration (must be run in Supabase before deploying):**
```sql
alter table projects
  add column if not exists analysis_mode text not null default 'deterministic'
  check (analysis_mode in ('deterministic', 'non_deterministic'));
```

---

## Token Cost Tracking

Every AI analysis run captures token usage and cost from the Anthropic API response and persists it to Supabase.

**Where cost data lives:**
- `analysis_results` table: two new columns — `token_usage` (jsonb) and `cost_usd` (float8)
- `token_usage` stores `{ model, input_tokens, output_tokens, total_tokens, cache_creation_input_tokens, cache_read_input_tokens, cost_usd }`
- Older rows (before this feature) will have `NULL` in both columns — they are excluded from aggregate stats

**How cost is calculated (`src/lib/agent.ts`):**
- Pricing config is in the `MODEL_PRICING` constant at the top of `agent.ts` — update it there if Anthropic changes rates
- Formula: `(input / 1M × $3.00) + (output / 1M × $15.00) + (cache_write / 1M × $3.75) + (cache_read / 1M × $0.30)`
- Cache tokens extracted via `usage as unknown as Record<string, number>` because the SDK's `Usage` type doesn't include cache fields in its TypeScript definition even though they appear at runtime when caching is active

**Where it surfaces:**
- Console log on every run: `[generateAnalysis] tokens — input: X, output: Y, total: Z, cost_usd: $N`
- No UI currently — the tracking pipeline is live and persisting data to `analysis_results`, but there is no page rendering it yet. `getAnalysisCostStats()` in `src/lib/db.ts` and a ready-made card component at `src/components/settings/AnalysisCostCard.tsx` exist and are unused, pending a decision on where to surface them.

**Migration required (run in Supabase before deploying):**
```sql
alter table analysis_results
  add column if not exists token_usage jsonb,
  add column if not exists cost_usd float8;
```

**Future note:** If the pipeline ever moves to multiple API calls per analysis (e.g. Tier 2 agentic with chained calls), `calculateCost()` in `agent.ts` should be called per-call and the results summed before passing the final `TokenUsage` to `saveAnalysisResult`. The current schema stores one `token_usage` blob per analysis row — it would need to become an array or a separate `token_usage_events` table if per-call granularity matters.

---

## Last Updated
July 28, 2026 — Removed public signup in favor of invite-based user management; added Forgot/Reset Password; searchable New Project dropdowns; paginated Users table:
- **Signup removed**: `/signup` page and `SignupForm.tsx` deleted. Accounts are now created only via `/users` ("Add User" modal → `inviteUserAction` in `src/app/(app)/users/actions.ts`), which sends an invite email and reuses the existing `/set-password` flow. `/users` page (`UsersView.tsx`, `UsersTable.tsx`, `AddUserModal.tsx`, `AddUserButton.tsx`) and sidebar entry ("User Management") are new; `src/lib/invite.ts` (`generateInviteLink`) and the invite email in `src/lib/email.ts` (`sendInviteEmail`) were introduced with this change
- **Forgot / Reset Password**: new `/forgot-password` (`ForgotPasswordForm.tsx` + `requestPasswordResetAction`) and `/reset-password` (`ResetPasswordForm.tsx`) pages, mirroring the invite-link pattern — `src/lib/password-reset.ts` (`generatePasswordResetLink`, admin `generateLink({type:"recovery"})`) + `sendPasswordResetEmail`/`buildPasswordResetEmailHtml` in `email.ts`. Always resolves silently regardless of whether the email matches an account (no enumeration signal). Both new routes added to `middleware.ts`'s `PUBLIC_ROUTES`; `/reset-password` deliberately excluded from `REDIRECT_IF_AUTHENTICATED_ROUTES` for the same reason as `/set-password` (its client-side `setSession()` call makes the browser "authenticated" mid-flow). "Forgot password?" link added next to the Password field on `/login`
- **New Project modal** (`NewProjectModal.tsx`): Business Unit, Assign Product Manager, and Assign Tech Lead converted from plain `<select>` to a shared searchable `SearchableSelect` combobox (search box + filtered option list); "Assign PM"/"Assign TL" labels spelled out in full
- **Users table** (`UsersTable.tsx`): added pagination matching the dashboard's `ProjectsTable.tsx` pattern (10/25/50 rows-per-page selector, "Showing X–Y of Z", numbered page buttons)

July 26, 2026 — Business Unit field, dashboard per-column filters, report header/wording fixes, AI prompt tone/consistency rules, Focus Lens stepper, PDF title metadata, "View PDF" rename:
- **DB**: `projects.business_unit` added (migration `013_projects_business_unit.sql`, 16 fixed values, check-constrained) — confirm this migration has actually been run against live Supabase before relying on it
- **New Project modal** (`NewProjectModal.tsx`): field order changed to Account Name (UI label for `customer_name`) → Project Name → Business Unit (new required dropdown) → Delivery Cadence → Quarter → Assign PM/TL → Recipient Emails; disabled analysis-mode card relabeled "Investigative" → "Adaptive" (DB value still `non_deterministic`)
- **Dashboard** (`ProjectsTable.tsx`): added Account Name and Business Unit as their own columns; Product Manager/Tech Lead columns now show the assignee's name instead of a submission-status indicator (removed `SubmissionCell`); legend split "Both submitted / ready" into two distinct entries ("Both submitted" — indigo-500, "Report ready" — green-500); replaced the old global filter panel entirely with per-column filter popovers (Project, Account Name, Business Unit, Quarter, Product Manager, Tech Lead, Status), rendered via `createPortal` to escape the table wrapper's `overflow-hidden` clipping; global search extended to also match business unit, quarter, and status label
- **Report header** (`ReportHeader.tsx`): now shows Account Name leading, Project Name following in muted styling, both same font weight (`font-medium` on the shared `h1`); PM/TL badges spelled out in full ("Product Manager" / "Tech Lead", never abbreviated)
- **Report wording** (`agent.ts`, `HealthRating.tsx`): added `SYSTEM_PROMPT` rule 9 forbidding "PM"/"TL" abbreviations in any AI-generated prose; fixed hardcoded fallback strings in `applyComputedFields()` and the mismatch warning in `HealthRating.tsx` to spell out full role names
- **`agent.ts` `SYSTEM_PROMPT`**: added a tone/writing-style section (avoid AI-sounding stock phrases, prefer concrete direct prose) and an evidence & consistency section (evidence-based claims, no hype/upsell language, issue→impact→cause→action→prevention→owner structure, internal-contradiction checks, overall-status-reflects-most-severe-signal rule) — prompt text only, no schema/PDF/UI structural changes
- **Focus Lens stepper** (`FocusLensStepper.tsx`, `globals.css`): pill border darkened to `border-slate-600` for visibility; currently-selected item now gets a persistent `blue-600` box-shadow outline + light blue background tint (not just a fading 2s flash) that stays until the user steps away or exits
- **PDF** (`pdf.ts`): `PdfBuilder.create()` now sets the PDF's document title metadata to `"{projectName} | {period}"`, shown as the browser tab title when the PDF is opened (distinct from the Storage file name `report.pdf`)
- **"Download PDF" → "View PDF"** (`DownloadPdfButton.tsx`): renamed to accurately reflect that it opens the PDF in a new tab (`window.open`) rather than forcing a file download; no logic change

July 6, 2026 — Token cost tracking added (additive instrumentation only, no prompt/model/max_tokens changes):
- `analysis_results` table: new `token_usage` (jsonb) and `cost_usd` (float8) columns
- `src/lib/agent.ts`: `MODEL_PRICING` config, `calculateCost()`, usage capture after API call, console logging; `generateAnalysis` now returns `{ analysis, tokenUsage }`
- `src/lib/db.ts`: `saveAnalysisResult` updated to accept optional `TokenUsage`; new `getAnalysisCostStats()` for Settings page aggregates
- `src/components/settings/AnalysisCostCard.tsx`: new component (unused/dormant) — exists for future use, not currently rendered anywhere
- `src/app/(app)/settings/page.tsx`: no UI change — cost card was added then removed; page unchanged from pre-tracking state
- Both action files (`pm/actions.ts`, `tl/actions.ts`) updated to destructure `{ analysis, tokenUsage }` from `generateAnalysis`
- DB migration SQL documented above — must be run in Supabase before deploying

---

## Last Updated (previous)
July 2, 2026 — Full sync pass plus code-verified correction pass:

**Sync pass:** corrected all remaining stale step/section counts (PM 11 steps, TL 9
steps). Removed out-of-scope Branding/logo UI description from Settings page section
(explicitly descoped from Phase 12; DB columns exist but no UI). Documented manual-send/
scheduler status decoupling as a permanent Key Rule. Added Known Issues / Resolved log —
six production bugs found and fixed during Phase 12 deployment (schema mismatches,
missing WHERE clause, middleware blocking /api/*, RLS/session-context bug in cron,
dynamic import bundler issue, unrun ITSM migration). Added Local Testing Notes and
Production Deployment Checklist sections. Added AI model note — currently on
claude-sonnet-4-6, Sonnet 5 confirmed available as drop-in upgrade if needed later.
Phase 12 confirmed fully verified end-to-end in production.

**Code-verification pass (this update):** read `pdf.ts`, `agent.ts`, `page.tsx`, and
`ReportSidebar.tsx` directly to resolve a suspected section-numbering discrepancy from
the prior sync pass. Findings:
- PDF (16 sections, S1-S16) and web report preview (18 sections) are **intentionally
  different structures**, not a bug — web splits Delivery Status and Health Rating into
  standalone sections for navigation; PDF folds the same data into inline badges for
  compactness. Both confirmed correct and now documented separately.
- `analysis.json` key names in `ai_generated` (verified: `s10_value_delivered`,
  `s10_cross_analysis`, `s11_lessons_learned`, `s12_next_quarter_focus`,
  `s13_management_attention`, `s15_itsm_maturity`, `s16_closing_note` — note no `s14_*`
  exists) do NOT match either PDF label numbers or web display numbers. Confirmed
  cosmetic only — `agent.ts` and `pdf.ts`/`page.tsx` all reference the identical key
  names correctly, so no functional bug exists, just confusing internal naming from
  before the ITSM section was inserted. Flagged as optional low-priority cleanup.
- ITSM Maturity Summary section order confirmed correct in both PDF and web — sits
  before Management Attention in both, as intended.

Report Structure, analysis.json schema, and Report → Question Mapping sections above
now reflect ground truth from the actual codebase rather than assumed structure.
Phase 13 (end-to-end test) remains outstanding.