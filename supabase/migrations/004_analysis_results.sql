create table public.analysis_results (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid references public.projects(id) on delete cascade,
  analysis      jsonb not null,
  generated_at  timestamp with time zone default now()
);

alter table public.analysis_results enable row level security;

create policy "Authenticated users can read analysis_results"
  on public.analysis_results for select
  to authenticated
  using (true);

create policy "Service role can insert analysis_results"
  on public.analysis_results for insert
  to authenticated
  with check (true);
