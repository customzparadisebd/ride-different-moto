CREATE POLICY "Staff can update courier shipments" ON public.courier_shipments FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can create tracking events" ON public.courier_tracking_events FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));

GRANT SELECT, INSERT, UPDATE ON public.courier_shipments TO authenticated;
GRANT SELECT, INSERT ON public.courier_tracking_events TO authenticated;
GRANT SELECT ON public.couriers TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.couriers TO authenticated;
GRANT SELECT ON public.courier_api_logs TO authenticated;
GRANT ALL ON public.courier_shipments TO service_role;
GRANT ALL ON public.courier_tracking_events TO service_role;
GRANT ALL ON public.couriers TO service_role;
GRANT ALL ON public.courier_api_logs TO service_role;
GRANT ALL ON public.courier_credentials TO service_role;