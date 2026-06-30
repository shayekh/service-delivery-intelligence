alter table public.projects
  add column if not exists error_message text;
