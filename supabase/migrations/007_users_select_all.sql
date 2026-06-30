-- The original "Users can read their own row" policy restricted every
-- select on public.users to auth.uid() = id, which broke any query that
-- needs to list other users (PM/TL dropdowns, assignee name lookups).
drop policy if exists "Users can read their own row" on public.users;

create policy "Authenticated users can read all users"
  on public.users for select
  to authenticated
  using (true);
