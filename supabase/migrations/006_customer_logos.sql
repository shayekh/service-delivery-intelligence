create table public.customer_logos (
  id              uuid primary key default gen_random_uuid(),
  customer_name   text not null,
  logo_url        text not null,
  uploaded_by     uuid references public.users(id),
  uploaded_at     timestamp with time zone default now()
);

alter table public.customer_logos enable row level security;

create policy "Authenticated users can read customer_logos"
  on public.customer_logos for select
  to authenticated
  using (true);

create policy "Authenticated users can insert customer_logos"
  on public.customer_logos for insert
  to authenticated
  with check (auth.uid() = uploaded_by);

create policy "Authenticated users can update customer_logos"
  on public.customer_logos for update
  to authenticated
  using (true);
