-- Run in Supabase SQL Editor for project taapkaasfeecuagmyrbh.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null
);

create table if not exists public.pulldowns (
  id uuid primary key default gen_random_uuid(),
  driver_name text not null,
  requested_for text,
  item_number text,
  quantity integer not null default 1,
  location text,
  branch text default 'OH01',
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
alter table public.pulldowns enable row level security;

create policy "admin can read own access row" on public.admin_users
for select to authenticated using (user_id = auth.uid());

create policy "approved admin can read pulldowns" on public.pulldowns
for select to authenticated using (
  exists (select 1 from public.admin_users a where a.user_id = auth.uid())
);

-- PullDown Tracker employees can create records after signing in.
create policy "authenticated users can add pulldowns" on public.pulldowns
for insert to authenticated with check (true);

-- After creating your one Auth user, replace the email and run this line:
-- insert into public.admin_users (user_id, email)
-- select id, email from auth.users where email = 'YOUR-EMAIL-HERE';
