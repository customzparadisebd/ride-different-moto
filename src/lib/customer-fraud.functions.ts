import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { AUDIT_ACTIONS, PERMISSIONS } from "./admin.shared";

const fraudMarkInput = z.object({
  phoneNumber: z.string().trim().min(5).max(20),
  markType: z.enum(["fraud", "warning"]),
  label: z.string().trim().max(50).optional(),
  note: z.string().trim().min(1, "Note is required").max(1000),
});

export const getFraudMark = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ phoneNumber: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: mark, error } = await context.supabase
      .from("customer_fraud_marks")
      .select("*")
      .eq("phone_number", data.phoneNumber)
      .maybeSingle();

    if (error) throw new Error("Could not load fraud status");
    return mark;
  });

export const setFraudMark = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => fraudMarkInput.parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);

    // Only admins/super admins can mark/update fraud
    assertAccess(actor, PERMISSIONS.customersManage);

    const { error } = await context.supabase.from("customer_fraud_marks").upsert({
      phone_number: data.phoneNumber,
      mark_type: data.markType,
      label: data.label || null,
      note: data.note,
      marked_by: context.userId,
      marked_by_label: actor.fullName || actor.email || "Admin",
      updated_at: new Date().toISOString(),
    });

    if (error) throw new Error("Could not save fraud mark");

    await auditFromActor(actor, {
      action: "customer.fraud_marked",
      targetType: "customer",
      targetId: data.phoneNumber,
      targetLabel: `Phone: ${data.phoneNumber}`,
      newValue: data,
    });

    return { success: true };
  });

export const removeFraudMark = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ phoneNumber: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);

    assertAccess(actor, PERMISSIONS.customersManage);

    const { error } = await context.supabase
      .from("customer_fraud_marks")
      .delete()
      .eq("phone_number", data.phoneNumber);

    if (error) throw new Error("Could not remove fraud mark");

    await auditFromActor(actor, {
      action: "customer.fraud_removed",
      targetType: "customer",
      targetId: data.phoneNumber,
      targetLabel: `Phone: ${data.phoneNumber}`,
    });

    return { success: true };
  });
