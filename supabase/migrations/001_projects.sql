create table public.projects (
  id                uuid primary key default gen_random_uuid(),
  project_name      text not null,
  customer_name     text not null,
  review_cadence    text not null check (review_cadence in ('monthly', 'quarterly')),
  quarter           text not null,
  start_date        date not null default current_date,
  assigned_pm       uuid references public.users(id),
  assigned_tl       uuid references public.users(id),
  recipient_emails  text[] not null default '{}',
  status            text not null default 'awaiting_pm'
                    check (status in ('awaiting_pm','awaiting_tl','processing','generating_pdf','ready','sent')),
  pdf_url           text,
  email_sent_at     timestamp with time zone,
  created_by        uuid references public.users(id),
  created_at        timestamp with time zone default now()
);

alter table public.projects enable row level security;

create policy "Authenticated users can read all projects"
  on public.projects for select
  to authenticated
  using (true);

create policy "Authenticated users can insert projects"
  on public.projects for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "Authenticated users can update projects"
  on public.projects for update
  to authenticated
  using (true);
