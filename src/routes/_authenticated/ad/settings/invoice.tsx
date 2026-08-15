import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { InvoiceSettingsPanel } from "@/components/admin/settings/InvoiceSettingsPanel";
import { getMyAccess } from "@/lib/orders.functions";

export const Route = createFileRoute("/_authenticated/ad/settings/invoice")({
  head: () => ({
    meta: [
      { title: "Invoice Settings — CZP Ops" },
      { property: "og:title", content: "Invoice Settings — CZP Ops" },
      { name: "description", content: "Customz Paradise BD Admin Panel" },
    ],
  }),
  component: AdminInvoiceSettings,
});

function AdminInvoiceSettings() {
  const access = useServerFn(getMyAccess);
  const accessQuery = useQuery({ queryKey: ["admin-access"], queryFn: () => access({}) });
  const canManage = accessQuery.data?.permissions.includes("products.manage") ?? false;

  return (
    <section className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide">
        Invoice Labeling & Management
      </h1>
      <p className="text-xs text-muted-foreground">
        Manage the invoice numbering system and labeling rules.
      </p>

      <div className="mt-8">
        <InvoiceSettingsPanel canManage={canManage} />
      </div>
      
      <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-card">
        <h3 className="font-display text-sm font-bold uppercase tracking-wide mb-4">
          Invoice Labeling Reference
        </h3>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="space-y-2">
            <p><span className="text-muted-foreground">Invoice Number:</span> {`{Prefix}-{Sequence}`}</p>
            <p><span className="text-muted-foreground">Order ID:</span> System UUID</p>
            <p><span className="text-muted-foreground">Customer:</span> Name + Phone</p>
          </div>
          <div className="space-y-2">
            <p><span className="text-muted-foreground">Prices:</span> BDT (৳)</p>
            <p><span className="text-muted-foreground">Layout:</span> POS Card (680px)</p>
            <p><span className="text-muted-foreground">Font:</span> Professional Monospace</p>
          </div>
        </div>
      </div>
    </section>
  );
}
