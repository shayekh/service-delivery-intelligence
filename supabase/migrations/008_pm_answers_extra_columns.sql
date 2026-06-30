-- pm_q2_justification is separate from pm_q2 because pm_q2 has a
-- check constraint restricting it to 'Green'|'Amber'|'Red' — a combined
-- "Green|justification text" value would violate that constraint.
alter table public.pm_answers
  add column if not exists reporting_period text,
  add column if not exists pm_q_notes text,
  add column if not exists pm_q2_justification text;

alter table public.pm_answers
  add constraint pm_answers_project_id_key unique (project_id);

-- submitted_at previously defaulted to now(), which meant every draft
-- save (insert) looked "submitted" immediately. The PM questionnaire
-- autosaves a draft on every step, and the Overwrite Warning modal and
-- the dashboard's pm_submitted flag both depend on submitted_at only
-- being set on actual final submission.
alter table public.pm_answers
  alter column submitted_at drop default;
