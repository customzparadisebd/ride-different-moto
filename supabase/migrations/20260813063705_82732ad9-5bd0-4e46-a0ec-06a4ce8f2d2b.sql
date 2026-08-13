ALTER TABLE public.store_settings 
ADD COLUMN IF NOT EXISTS whatsapp_floating_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS whatsapp_floating_position TEXT DEFAULT 'bottom-right';

-- Ensure existing row has defaults
UPDATE public.store_settings SET 
  whatsapp_floating_enabled = COALESCE(whatsapp_floating_enabled, TRUE),
  whatsapp_floating_position = COALESCE(whatsapp_floating_position, 'bottom-right')
WHERE id = 'default';
