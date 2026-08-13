CREATE TABLE public.not_found_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    path TEXT NOT NULL,
    referrer TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_agent TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Access control
GRANT INSERT ON public.not_found_logs TO anon, authenticated;
GRANT SELECT ON public.not_found_logs TO authenticated;
GRANT ALL ON public.not_found_logs TO service_role;

-- RLS
ALTER TABLE public.not_found_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log a 404" ON public.not_found_logs
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Admins can view 404 logs" ON public.not_found_logs
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
