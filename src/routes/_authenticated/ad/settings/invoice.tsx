import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { InvoiceSettingsPanel } from "@/components/admin/settings/InvoiceSettingsPanel";
import { getMyAccess } from "@/lib/orders.functions";

export const Route = createFileRoute("/_authenticated/ad/settings/invoice")({
  beforeLoad: ({ context }) => {
    const access = context.access;
    if (access.primaryRole !== "super_admin" && access.primaryRole !== "admin") {
      throw redirect({ to: "/ad", replace: true });
    }
  },
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
  const canManage = accessQuery.data?.permissions.includes("orders.manage") ?? false;

  return (
    <section className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide">
          Invoice Settings
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Manage the invoice numbering sequence for newly created orders.
        </p>
      </div>

      <InvoiceSettingsPanel canManage={canManage} />
      
      <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-card">
        <h3 className="font-display text-sm font-bold uppercase tracking-wide mb-4">
          Invoice Control Guidelines
        </h3>
        <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
          <p>
            <strong className="text-foreground">Sequential Integrity:</strong> The system automatically increments the serial by 1 for every new order. 
            If you set a starting number, the sequence will continue from that point exactly.
          </p>
          <p>
            <strong className="text-foreground">Historical Data:</strong> Changing these settings <span className="text-red-500 font-bold">DOES NOT</span> affect existing orders or their invoice numbers. 
            Only FUTURE orders will follow the new sequence.
          </p>
          <p>
            <strong className="text-foreground">Prefix Management:</strong> The "CZP-" prefix is the brand standard. You can update it, but it's recommended to keep it consistent for accounting purposes.
          </p>
        </div>
      </div>
    </section>
  );
}
