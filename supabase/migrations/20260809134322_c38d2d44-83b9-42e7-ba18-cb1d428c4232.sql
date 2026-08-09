insert into public.profiles (id,email,access_status) values ('5778eed7-4c59-4ccb-9c68-055014db40f3','customzparadisebd@gmail.com','approved')
on conflict (id) do update set access_status='approved', email=excluded.email;
insert into public.user_roles (user_id,role) values ('5778eed7-4c59-4ccb-9c68-055014db40f3','super_admin') on conflict do nothing;