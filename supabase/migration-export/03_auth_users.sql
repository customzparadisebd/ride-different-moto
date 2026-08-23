-- =====================================================================
--  CUSTOMZ PARADISE BD - admin/staff accounts
--  Run AFTER 02_data.sql.
--
--  Password hashes in auth.users are NOT exportable (the auth schema is
--  locked down), so accounts are re-created by invitation/reset instead of
--  by copying hashes. Do this in your new Supabase project:
--
--   1. Authentication -> Users -> "Add user" (or "Invite user") and create:
--        - customzparadisebd@gmail.com   (Super Admin / owner)
--        - the second staff account you use, if you still need it
--      Use "Auto Confirm User" so the email is confirmed immediately.
--
--   2. Copy each new user's UUID from that screen.
--
--   3. Replace the placeholders below and run this file. It links the new
--      auth account to the app's profile + role + permission rows that were
--      imported in 02_data.sql.
-- =====================================================================

-- ---- Super Admin -----------------------------------------------------
-- Replace 00000000-0000-0000-0000-000000000000 with the new user's UUID.
DO $$
DECLARE
  v_user_id uuid := '00000000-0000-0000-0000-000000000000';
  v_email   text := 'customzparadisebd@gmail.com';
BEGIN
  IF v_user_id = '00000000-0000-0000-0000-000000000000' THEN
    RAISE NOTICE 'Skipped: set v_user_id to the real UUID first.';
    RETURN;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, access_status, mfa_required)
  VALUES (v_user_id, v_email, 'Super Admin', 'approved', false)
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        access_status = 'approved';

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'super_admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;

-- ---- Additional staff account (optional) ------------------------------
-- Copy the block above, change the UUID/email/name and use
-- 'admin', 'manager' or 'staff' for the role.

-- ---- Clean up orphaned rows from the old project ----------------------
-- The imported profiles/roles reference the OLD user UUIDs, which no longer
-- exist. After linking your new accounts above, remove the stale rows:
--
-- DELETE FROM public.user_roles
--  WHERE user_id NOT IN (SELECT id FROM auth.users);
-- DELETE FROM public.user_permissions
--  WHERE user_id NOT IN (SELECT id FROM auth.users);
-- DELETE FROM public.profiles
--  WHERE id NOT IN (SELECT id FROM auth.users);
