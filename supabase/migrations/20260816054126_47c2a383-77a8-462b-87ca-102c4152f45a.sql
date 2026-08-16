-- AI Settings Table for future order data extraction
CREATE TABLE public.ai_settings (
  id text PRIMARY KEY DEFAULT 'default',
  enabled boolean NOT NULL DEFAULT false,
  provider text NOT NULL DEFAULT 'gemini' CHECK (provider IN ('gemini', 'openai', 'custom')),
  model_name text,
  api_key text,
  credentials jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  CONSTRAINT single_row CHECK (id = 'default')
);

-- Grant access to authenticated users (RBAC enforced in code)
GRANT SELECT, INSERT, UPDATE ON public.ai_settings TO authenticated;
GRANT ALL ON public.ai_settings TO service_role;

-- Enable RLS
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can view AI settings"
  ON public.ai_settings
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can update AI settings"
  ON public.ai_settings
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Initial row
INSERT INTO public.ai_settings (id, enabled, provider)
VALUES ('default', false, 'gemini')
ON CONFLICT (id) DO NOTHING;
