import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { AUDIT_ACTIONS, PERMISSIONS } from "./admin.shared";
import { 
  customerListInput, 
  customerDeleteInput, 
  customerRestoreInput, 
  customerPurgeInput,
  customerUpdateInput 
} from "./customers.shared";

export const listAdminCustomers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => customerListInput.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    assertAccess(
      await resolveActor(context.userId, context.claims as never),
      PERMISSIONS.ordersView,
    );

    let query = context.supabase.from("customers").select("*", { count: "exact" });
    
    query = data.deleted ? query.not("deleted_at", "is", null) : query.is("deleted_at", null);

    if (data.search) {
      const term = `%${data.search}%`;
      query = query.or(`name.ilike.${term},phone.ilike.${term},email.ilike.${term},city.ilike.${term},district.ilike.${term},area.ilike.${term}`);
    }

    if (data.status === "fraud") {
      query = query.eq("is_fraud", true);
    } else if (data.status === "active") {
      query = query.gt("total_orders", 0);
    }

    const from = (data.page - 1) * data.pageSize;
    const { data: rows, count, error } = await query
      .order("updated_at", { ascending: false })
      .range(from, from + data.pageSize - 1);

    if (error) throw new Error("Could not load customers.");

    return { rows: rows ?? [], total: count ?? 0, page: data.page, pageSize: data.pageSize };
  });

export const softDeleteCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => customerDeleteInput.parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    
    // Only Admin and Super Admin can delete
    const isPrivileged = actor.isSuperAdmin || actor.roles.includes("admin");
    if (!isPrivileged) throw new Error("Only Admin and Super Admin can delete customer records.");

    const before = await context.supabase
      .from("customers")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (!before.data) throw new Error("Customer not found.");

    const { error } = await context.supabase
      .from("customers")
      .update({
        deleted_at: new Date().toISOString() as any,
        deleted_by: context.userId,
        delete_reason: data.reason || null,
      } as any)
      .eq("id", data.id);
    if (error) throw new Error("Could not move customer to Recycle Bin.");

    await auditFromActor(actor, {
      action: "customer.recycled",
      targetType: "customer",
      targetId: data.id,
      targetLabel: before.data.name,
      oldValue: before.data,
      metadata: { reason: data.reason || null },
    });
    return { ok: true };
  });

export const restoreCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => customerRestoreInput.parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    
    // Only Admin and Super Admin can restore
    const isPrivileged = actor.isSuperAdmin || actor.roles.includes("admin");
    if (!isPrivileged) throw new Error("Only Admin and Super Admin can restore customer records.");

    const before = await context.supabase
      .from("customers")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (!before.data) throw new Error("Customer not found.");

    const { error } = await context.supabase
      .from("customers")
      .update({ deleted_at: null, deleted_by: null, delete_reason: null } as any)
      .eq("id", data.id);
    if (error) throw new Error("Could not restore customer.");

    await auditFromActor(actor, {
      action: "customer.restored",
      targetType: "customer",
      targetId: data.id,
      targetLabel: before.data.name,
    });
    return { ok: true };
  });

export const purgeCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => customerPurgeInput.parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    
    // Only Admin and Super Admin can permanently delete
    const isPrivileged = actor.isSuperAdmin || actor.roles.includes("admin");
    if (!isPrivileged) throw new Error("Only Admin and Super Admin can permanently delete records.");

    const before = await context.supabase
      .from("customers")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (!before.data) throw new Error("Customer not found.");
    
    if (before.data.phone !== data.confirmPhone) {
      throw new Error("The typed phone number does not match.");
    }
    
    if (!(before.data as any).deleted_at) {
      throw new Error("Move the customer to the Recycle Bin before deleting permanently.");
    }

    const { error } = await context.supabase.from("customers").delete().eq("id", data.id);
    if (error) throw new Error("Could not permanently delete customer.");

    await auditFromActor(actor, {
      action: "customer.purged",
      targetType: "customer",
      targetId: data.id,
      targetLabel: before.data.name,
      oldValue: before.data,
    });
    return { ok: true };
  });

export const getCustomerAuditTrail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ customerId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    
    // Only Admin and Super Admin can view specific audit trails for customers
    const isPrivileged = actor.isSuperAdmin || actor.roles.includes("admin");
    if (!isPrivileged) throw new Error("Only Admin and Super Admin can view customer audit trails.");

    const { data: logs, error } = await context.supabase
      .from("admin_audit_log")
      .select("*")
      .eq("target_type", "customer")
      .eq("target_id", data.customerId)
      .order("created_at", { ascending: false });

    if (error) throw new Error("Could not load customer audit trail.");

    return logs ?? [];
  });

export const updateAdminCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => customerUpdateInput.parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    
    // Only Admin and Super Admin can edit customer profiles
    assertAccess(actor, PERMISSIONS.customersManage);

    const before = await context.supabase
      .from("customers")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    
    if (!before.data) throw new Error("Customer not found.");

    const { id, ...patch } = data;
    const { error } = await context.supabase
      .from("customers")
      .update(patch as any)
      .eq("id", id);
      
    if (error) throw new Error("Could not update customer.");

    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.customerUpdated,
      targetType: "customer",
      targetId: id,
      targetLabel: before.data.name,
      oldValue: Object.fromEntries(
        Object.keys(patch).map(key => [key, (before.data as any)[key]])
      ),
      newValue: patch,
    });

    return { ok: true };
  });
