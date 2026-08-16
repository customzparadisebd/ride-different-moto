# Security Hardening Plan

This plan addresses findings from the Supabase database linter and manual security audit to ensure a robust production environment for CUSTOMZ PARADISE BD.

## Changes

### Database Security (Supabase)

- **Enable RLS on `stress_test_settings`**: Ensure all tables in the public schema have Row Level Security enabled.
- **Set `search_path` for `SECURITY DEFINER` functions**: Update `tr_orders_assign_invoice_no` and `alert_on_invoice_collision` to include `SET search_path = public` to prevent search path hijacking.
- **Restrict function execution**: Revoke `EXECUTE` on `public` for sensitive security-definer functions that should not be callable by `anon` or general `authenticated` roles directly through the Data API.
- **Add missing RLS policies**: Create restrictive policies for `courier_credentials`, `login_attempts`, `mfa_backup_codes`, and `steadfast_stats` to ensure they are only accessible by authorized roles or through security-definer functions.

### API & Application Hardening

- **Hardened Admin Authentication**: Update `resolveActor` in `src/lib/admin.server.ts` to include more robust session validation and ensure MFA is strictly enforced for all administrative paths.
- **X-Frame-Options & Security Headers**: Enhance the existing `src/start.ts` configuration (or equivalent middleware) to ensure `X-Frame-Options: DENY` and `Content-Security-Policy` are strictly enforced to prevent clickjacking and XSS.
- **Audit Log Integrity**: Ensure all sensitive database triggers (like the invoice collision trigger) are also logged in the `admin_audit_log` for a unified forensic trail.

## Technical Details

### Database Migrations

```sql
-- 1. Hardening Security Definer Functions
ALTER FUNCTION public.tr_orders_assign_invoice_no() SET search_path = public;
ALTER FUNCTION public.alert_on_invoice_collision() SET search_path = public;
ALTER FUNCTION public.increment_steadfast_count(merchant_id text) SET search_path = public;
ALTER FUNCTION public.generate_next_invoice_no(prefix text) SET search_path = public;

-- 2. Revoke Public Execution on Internal Security Definer Functions
REVOKE EXECUTE ON FUNCTION public.tr_orders_assign_invoice_no() FROM public;
REVOKE EXECUTE ON FUNCTION public.alert_on_invoice_collision() FROM public;
REVOKE EXECUTE ON FUNCTION public.increment_steadfast_count(text) FROM public;
REVOKE EXECUTE ON FUNCTION public.generate_next_invoice_no(text) FROM public;

-- 3. Enable RLS on remaining tables
ALTER TABLE public.stress_test_settings ENABLE ROW LEVEL SECURITY;

-- 4. Secure tables missing policies (Service Role only access where applicable)
-- Example for courier_credentials:
DROP POLICY IF EXISTS "Service role only" ON public.courier_credentials;
CREATE POLICY "Service role only" ON public.courier_credentials FOR ALL TO service_role USING (true);
GRANT ALL ON public.courier_credentials TO service_role;

-- 5. Secure login_attempts (Staff/Admin viewable, Service role insertable)
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view login attempts" ON public.login_attempts 
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can manage login attempts" ON public.login_attempts 
  FOR ALL TO service_role USING (true);
```

### Application Code

- Refactor `src/lib/admin.server.ts` to strictly validate `claims.aal` even if `mfa_required` is not explicitly set in the profile yet (default to true).
- Verify `src/start.ts` middleware correctly attaches security headers for SSR responses.
