-- =====================================================================
--  CUSTOMZ PARADISE BD - post-migration fixups
--  Run LAST: after 01_schema.sql, 02_data.sql, 03_auth_users.sql.
--
--  What this file does
--    1. Re-aligns the invoice sequences/counters so the next order does NOT
--       reuse an invoice number that already exists.
--    2. Retires stale admin sessions carried over from the old project.
--    3. Verifies the result (row counts + RLS + grants).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. INVOICE NUMBERING
-- ---------------------------------------------------------------------
-- The live numbering source of truth is public.invoice_settings.current_number
-- (used by generate_next_invoice_no). Push it past the highest number that
-- actually exists in orders, counting soft-deleted rows too.
UPDATE public.invoice_settings s
SET current_number = GREATEST(
      s.current_number,
      s.start_number,
      COALESCE((
        SELECT MAX(NULLIF(regexp_replace(o.invoice_no, '\D', '', 'g'), '')::int)
        FROM public.orders o
        WHERE o.invoice_no LIKE s.prefix || '-%'
      ), 0)
    ),
    updated_at = NOW()
WHERE s.id = 'default';

-- Stress-test counter is isolated from production numbering; reset it.
UPDATE public.stress_test_settings
SET current_number = 0, updated_at = NOW()
WHERE id = 'default';

-- Legacy date-based helper (next_invoice_no) uses this sequence. Keep it ahead
-- of the imported order count so it can never collide.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'invoice_seq') THEN
    PERFORM setval('public.invoice_seq', (SELECT COUNT(*) + 1 FROM public.orders));
  END IF;
  IF EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'invoice_number_seq') THEN
    PERFORM setval(
      'public.invoice_number_seq',
      (SELECT GREATEST(current_number, 1) FROM public.invoice_settings WHERE id = 'default')
    );
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 2. STALE SESSIONS (old project's session ids are meaningless here)
-- ---------------------------------------------------------------------
UPDATE public.admin_sessions
SET revoked_at = NOW()
WHERE revoked_at IS NULL;

-- ---------------------------------------------------------------------
-- 3. VERIFICATION - read the output, do not skip
-- ---------------------------------------------------------------------

-- 3a. Next invoice number preview (does NOT consume a number)
SELECT prefix, start_number, current_number,
       prefix || '-' || CASE WHEN current_number + 1 < 10
                             THEN lpad((current_number + 1)::text, 2, '0')
                             ELSE (current_number + 1)::text END AS next_invoice_no
FROM public.invoice_settings WHERE id = 'default';

-- 3b. No duplicate invoice numbers may exist
SELECT invoice_no, COUNT(*) AS copies
FROM public.orders GROUP BY invoice_no HAVING COUNT(*) > 1;

-- 3c. Row counts - compare against the old project table by table
SELECT 'orders' t, COUNT(*) FROM public.orders
UNION ALL SELECT 'order_items', COUNT(*) FROM public.order_items
UNION ALL SELECT 'products', COUNT(*) FROM public.products
UNION ALL SELECT 'product_colors', COUNT(*) FROM public.product_colors
UNION ALL SELECT 'customers', COUNT(*) FROM public.customers
UNION ALL SELECT 'profiles', COUNT(*) FROM public.profiles
UNION ALL SELECT 'user_roles', COUNT(*) FROM public.user_roles
UNION ALL SELECT 'user_permissions', COUNT(*) FROM public.user_permissions
UNION ALL SELECT 'hero_slides', COUNT(*) FROM public.hero_slides
UNION ALL SELECT 'bike_models', COUNT(*) FROM public.bike_models
UNION ALL SELECT 'couriers', COUNT(*) FROM public.couriers
UNION ALL SELECT 'admin_audit_log', COUNT(*) FROM public.admin_audit_log
ORDER BY 1;

-- 3d. Every public table must have RLS enabled (expect zero rows)
SELECT tablename FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = false;

-- 3e. Grants must exist or the app returns permission errors
SELECT table_name, grantee, string_agg(privilege_type, ',' ORDER BY privilege_type) AS privs
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND grantee IN ('anon', 'authenticated', 'service_role')
GROUP BY table_name, grantee ORDER BY table_name, grantee;

-- 3f. Owner bootstrap check - must return super_admin / approved
SELECT p.email, r.role, p.access_status
FROM public.profiles p
LEFT JOIN public.user_roles r ON r.user_id = p.id
WHERE p.email = 'customzparadisebd@gmail.com';
