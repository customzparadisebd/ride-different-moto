import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const debugInvoiceSettings = createServerFn({ method: "POST" }).handler(async () => {
    const { data, error } = await supabaseAdmin.from("invoice_settings").select("*");
    return { data, error };
});
