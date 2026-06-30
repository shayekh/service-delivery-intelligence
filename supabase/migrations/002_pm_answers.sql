create table public.pm_answers (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid references public.projects(id) on delete cascade,
  prepared_by   text not null,
  pm_q1         text,
  pm_q2         text check (pm_q2 in ('Green','Amber','Red')),
  pm_q3         text,
  pm_q4         text,
  pm_q5         text,
  pm_q6         text,
  pm_q7         text,
  pm_q8         text check (pm_q8 in ('Green','Amber','Red')),
  submitted_by  uuid references public.users(id),
  submitted_at  timestamp with time zone default now()
);

alter table public.pm_answers enable row level security;

create policy "Authenticated users can read pm_answers"
  on public.pm_answers for select
  to authenticated
  using (true);

create policy "Authenticated users can insert pm_answers"
  on public.pm_answers for insert
  to authenticated
  with check (auth.uid() = submitted_by);

create policy "Authenticated users can update pm_answers"
  on public.pm_answers for update
  to authenticated
  using (auth.uid() = submitted_by);
