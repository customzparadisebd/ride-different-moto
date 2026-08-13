-- Add phone number and last login IP to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login_ip TEXT;

-- Grant access to the new columns (redundant if already granted on table, but safe)
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- Ensure audit log is traceable by staff ID
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_actor_id ON public.admin_audit_log(actor_id);
