// ============================================================
// NEW MANUAL ORDER SCREEN
// Purpose: Dedicated page for phone/walk-in orders, using the same
//          order pipeline as the website checkout.
// Status: COMPLETED
// Security: Requires the orders.create permission; the server
//          function re-checks it and audits the created order.
// ============================================================
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { ManualOrderForm } from "@/components/admin/orders/ManualOrderForm";
import { Button } from "@/components/ui/button";
import { createManualOrder, getMyAccess } from "@/lib/orders.functions";
import { newIdempotencyKey } from "@/lib/orders.shared";

export const Route = createFileRoute("/_authenticated/ad/orders/new")({
  head: () => ({ meta: [{ title: "New order — CZP Ops" }] }),
  component: NewManualOrder,
});

function NewManualOrder() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const access = useServerFn(getMyAccess);
  const submit = useServerFn(createManualOrder);
  const [key, setKey] = useState(newIdempotencyKey);

  const accessQuery = useQuery({ queryKey: ["admin-access"], queryFn: () => access({}) });
  const canCreate = accessQuery.data?.permissions.includes("orders.create") ?? false;

  const mutation = useMutation({
    mutationFn: submit,
    onSuccess: (result) => {
      toast.success(`Order ${result.invoiceNo} created`);
      setKey(newIdempotencyKey());
      void queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      void navigate({ to: "/ad/orders/$id", params: { id: result.orderId } });
    },
    onError: (error: Error) => toast.error(error.message || "Could not create the order."),
  });

  return (
    <section className="mx-auto max-w-5xl">
      <Link
        to="/ad/orders"
        className="text-xs uppercase tracking-wider text-muted-foreground underline"
      >
        ← All orders
      </Link>
      <h1 className="mt-2 font-display text-3xl font-bold uppercase tracking-wide">
        New manual order
      </h1>
      <p className="text-xs text-muted-foreground">
        Same invoice series and database as website orders.
      </p>

      {accessQuery.isLoading ? (
        <p className="py-16 text-center text-sm text-muted-foreground">Loading…</p>
      ) : canCreate ? (
        <ManualOrderForm
          idempotencyKey={key}
          isPending={mutation.isPending}
          onSubmit={(input) => mutation.mutate({ data: input as never })}
        />
      ) : (
        <div className="mt-8 rounded-xl border border-border bg-card p-6 text-center shadow-card">
          <p className="text-sm text-muted-foreground">
            Your role cannot create orders. Ask an admin for the “Create manual orders” permission.
          </p>
          <Button variant="steel" size="touch" className="mt-4" asChild>
            <Link to="/ad/orders">Back to orders</Link>
          </Button>
        </div>
      )}
    </section>
  );
}
