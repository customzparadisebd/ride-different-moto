-- 0. Remove temporary probe objects
drop table if exists public._sec_exec_probe;
drop function if exists public._sec_exec_probe_fn();

-- 1. Pin search_path on the remaining mutable function
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 2. Revoke EXECUTE on privileged / internal functions from public API roles.
revoke all on function public.alert_on_invoice_collision() from public, anon, authenticated;
revoke all on function public.generate_next_invoice_no() from public, anon, authenticated;
revoke all on function public.generate_next_invoice_no(boolean) from public, anon, authenticated;
revoke all on function public.increment_steadfast_count(uuid, text) from public, anon, authenticated;
revoke all on function public.tr_orders_assign_invoice_no() from public, anon, authenticated;
revoke all on function public.next_invoice_no() from public, anon, authenticated;
revoke all on function public.handle_updated_at() from public, anon, authenticated;
revoke all on function public.touch_updated_at() from public, anon, authenticated;

-- Role-check helpers stay callable by signed-in users only (required by RLS policies)
revoke all on function public.has_role(uuid, app_role) from public, anon;
revoke all on function public.has_permission(uuid, text) from public, anon;
revoke all on function public.is_staff(uuid) from public, anon;
revoke all on function public.is_super_admin(uuid) from public, anon;
grant execute on function public.has_role(uuid, app_role) to authenticated;
grant execute on function public.has_permission(uuid, text) to authenticated;
grant execute on function public.is_staff(uuid) to authenticated;
grant execute on function public.is_super_admin(uuid) to authenticated;

-- 3. Tighten over-permissive SELECT policies to staff only
drop policy if exists "Staff can view fraud marks" on public.customer_fraud_marks;
create policy "Staff can view fraud marks"
  on public.customer_fraud_marks for select to authenticated
  using (public.is_staff(auth.uid()));

drop policy if exists "Authenticated users can select slides" on public.hero_slides;

drop policy if exists "Staff can read invoice settings" on public.invoice_settings;
create policy "Staff can read invoice settings"
  on public.invoice_settings for select to authenticated
  using (public.is_staff(auth.uid()));

drop policy if exists "Admins can see damages" on public.order_damages;
create policy "Staff can see damages"
  on public.order_damages for select to authenticated
  using (public.is_staff(auth.uid()));

drop policy if exists "Admins can see returns" on public.order_returns;
create policy "Staff can see returns"
  on public.order_returns for select to authenticated
  using (public.is_staff(auth.uid()));

-- 4. Block self-approval / privilege escalation on profiles
create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_privileged boolean;
begin
  if auth.uid() is null then
    return new;
  end if;

  is_privileged := public.has_role(auth.uid(), 'admin'::app_role)
                or public.has_role(auth.uid(), 'super_admin'::app_role);

  if is_privileged then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.access_status := 'pending';
    new.mfa_required := false;
    new.approved_by := null;
    new.approved_at := null;
    return new;
  end if;

  new.access_status := old.access_status;
  new.mfa_required := old.mfa_required;
  new.approved_by := old.approved_by;
  new.approved_at := old.approved_at;
  return new;
end;
$$;

revoke all on function public.prevent_profile_privilege_escalation() from public, anon, authenticated;

drop trigger if exists trg_profiles_prevent_escalation on public.profiles;
create trigger trg_profiles_prevent_escalation
  before insert or update on public.profiles
  for each row execute function public.prevent_profile_privilege_escalation();

-- 5. Avatars: staff-scoped reads instead of world-readable
drop policy if exists "Public read of avatars" on storage.objects;

drop policy if exists "Staff can read avatars" on storage.objects;
create policy "Staff can read avatars"
  on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and public.is_staff(auth.uid()));