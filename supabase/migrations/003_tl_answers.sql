create table public.tl_answers (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid references public.projects(id) on delete cascade,
  tl_q1         text,
  tl_q2         text check (tl_q2 in ('Green','Amber','Red')),
  tl_q3         text,
  tl_q4         text,
  tl_q5         text,
  tl_q6         text,
  tl_q7         text,
  submitted_by  uuid references public.users(id),
  submitted_at  timestamp with time zone default now()
);

alter table public.tl_answers enable row level security;

create policy "Authenticated users can read tl_answers"
  on public.tl_answers for select
  to authenticated
  using (true);

create policy "Authenticated users can insert tl_answers"
  on public.tl_answers for insert
  to authenticated
  with check (auth.uid() = submitted_by);

create policy "Authenticated users can update tl_answers"
  on public.tl_answers for update
  to authenticated
  using (auth.uid() = submitted_by);
