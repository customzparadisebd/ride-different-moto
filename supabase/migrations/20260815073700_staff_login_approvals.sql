-- Create staff login approval table
create type public.login_approval_status as enum ('pending', 'approved', 'rejected', 'expired');

create table public.staff_login_approvals (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    email text not null,
    full_name text,
    status public.login_approval_status not null default 'pending',
    ip_address text,
    user_agent text,
    device_info jsonb,
    location_info jsonb,
    expires_at timestamptz not null default (now() + interval '10 minutes'),
    approved_at timestamptz,
    approved_by uuid references auth.users(id) on delete set null,
    rejected_at timestamptz,
    rejected_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now()
);

-- Grant permissions
grant select on public.staff_login_approvals to authenticated;
grant all on public.staff_login_approvals to service_role;

-- Enable RLS
alter table public.staff_login_approvals enable row level security;

-- Policies
-- 1. Staff can read their own requests
create policy "Staff can view own login requests"
on public.staff_login_approvals
for select
to authenticated
using (auth.uid() = user_id);

-- 2. Admins can view all requests
create policy "Admins can view all login requests"
on public.staff_login_approvals
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- 3. Admins can update status
create policy "Admins can update login requests"
on public.staff_login_approvals
for update
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- 4. Service role/triggers for inserts
create policy "Service role can insert login requests"
on public.staff_login_approvals
for insert
to service_role
with check (true);

-- Indexes
create index staff_login_approvals_user_id_idx on public.staff_login_approvals(user_id);
create index staff_login_approvals_status_idx on public.staff_login_approvals(status);
create index staff_login_approvals_expires_at_idx on public.staff_login_approvals(expires_at);
