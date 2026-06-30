create table public.settings (
  id                  uuid primary key default gen_random_uuid(),
  organisation_name   text not null default 'SELISE Digital Platforms',
  organisation_logo   text,
  delivery_cadence    text not null default 'quarterly'
                      check (delivery_cadence in ('monthly','quarterly')),
  send_on_day         integer default 5,
  recipient_emails    text[] not null default '{}',
  updated_at          timestamp with time zone default now()
);

alter table public.settings enable row level security;

create policy "Authenticated users can read settings"
  on public.settings for select
  to authenticated
  using (true);

create policy "Authenticated users can update settings"
  on public.settings for update
  to authenticated
  using (true);

-- Insert default row
insert into public.settings (organisation_name, delivery_cadence, send_on_day)
values ('SELISE Digital Platforms', 'quarterly', 5);
