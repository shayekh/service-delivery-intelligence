-- Migrations 008 and 009 were created as files but never fully applied to
-- the live database — pm_q2_justification and pm_q8_notes were missing,
-- causing every pm_answers upsert (draft save and submit) to fail with
-- 42703 "column does not exist". This re-applies the missing pieces
-- idempotently.
alter table public.pm_answers
  add column if not exists reporting_period text,
  add column if not exists pm_q_notes text,
  add column if not exists pm_q2_justification text,
  add column if not exists pm_q8_notes text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'pm_answers_project_id_key'
  ) then
    alter table public.pm_answers
      add constraint pm_answers_project_id_key unique (project_id);
  end if;
end $$;

alter table public.pm_answers
  alter column submitted_at drop default;
