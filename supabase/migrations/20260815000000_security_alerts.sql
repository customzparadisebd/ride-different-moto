-- Security Alerts Table
CREATE TABLE public.admin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- 'info', 'warning', 'error', 'security'
    metadata JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, UPDATE, DELETE ON public.admin_notifications TO authenticated;
GRANT ALL ON public.admin_notifications TO service_role;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own notifications" ON public.admin_notifications
    FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Trigger to alert on invoice collision
CREATE OR REPLACE FUNCTION public.alert_on_invoice_collision()
RETURNS TRIGGER AS $$
BEGIN
    -- Create notification for all admins
    INSERT INTO public.admin_notifications (user_id, title, message, type, metadata)
    SELECT 
        ur.user_id,
        'DUPLICATE INVOICE DETECTED',
        'Collision detected for invoice ' || NEW.invoice_no || '. Security event logged.',
        'security',
        jsonb_build_object(
            'invoice_no', NEW.invoice_no,
            'collision_id', NEW.id,
            'timestamp', NEW.detected_at
        )
    FROM public.user_roles ur
    WHERE ur.role IN ('admin', 'user'); 
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_invoice_collision_alert
AFTER INSERT ON public.invoice_collisions
FOR EACH ROW EXECUTE FUNCTION public.alert_on_invoice_collision();
