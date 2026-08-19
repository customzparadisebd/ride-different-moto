create table if not exists public._sec_exec_probe (id int primary key);
insert into public._sec_exec_probe(id) values (1) on conflict do nothing;
create or replace function public._sec_exec_probe_fn() returns boolean language sql stable security definer set search_path = public as $$ select true $$;
grant select on public._sec_exec_probe to authenticated;
alter table public._sec_exec_probe enable row level security;
drop policy if exists "probe" on public._sec_exec_probe;
create policy "probe" on public._sec_exec_probe for select to authenticated using (public._sec_exec_probe_fn());
revoke all on function public._sec_exec_probe_fn() from public, anon, authenticated;