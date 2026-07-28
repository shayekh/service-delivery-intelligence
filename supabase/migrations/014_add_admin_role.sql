-- Widen users.role to allow 'admin' alongside the existing
-- 'product_manager' / 'tech_lead' values, for a single hardcoded
-- admin@sdi.com account (see scripts/seed-admin.mjs).
alter table public.users drop constraint if exists users_role_check;
alter table public.users add constraint users_role_check
  check (role in ('product_manager', 'tech_lead', 'admin'));
