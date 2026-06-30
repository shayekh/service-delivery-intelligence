alter table public.tl_answers
  add column if not exists tl_q2_justification text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'tl_answers_project_id_key'
  ) then
    alter table public.tl_answers
      add constraint tl_answers_project_id_key unique (project_id);
  end if;
end $$;

alter table public.tl_answers
  alter column submitted_at drop default;
