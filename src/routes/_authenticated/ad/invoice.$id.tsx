// ============================================================
// PRINTABLE POS INVOICE
// Purpose: Container-bounded POS invoice layout for an order
// Status: COMPLETED
// Security: Same permission-checked getOrder server function
// ============================================================
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { Button } from "@/components/ui/button";
import { site } from "@/data/site";
import { formatBDT } from "@/lib/format";
import { getOrder } from "@/lib/orders.functions";
import { deliveryZoneLabel, paymentMethodLabel } from "@/lib/orders.shared";
import logoDark from "@/assets/logo-dark-bg.png.asset.json";

export const Route = createFileRoute("/_authenticated/ad/invoice/$id")({
  head: () => ({ 
    meta: [
      { title: "Invoice — CZP Ops" }, 
      { property: "og:title", content: "Invoice — CZP Ops" }, 
      { name: "description", content: "Customz Paradise BD POS Invoice" }
    ] 
  }),
  component: InvoicePage,
});

function InvoicePage() {
  const { id } = Route.useParams();
  const fetchOrder = useServerFn(getOrder);
  const query = useQuery({
    queryKey: ["admin-order", id],
    queryFn: () => fetchOrder({ data: { orderId: id } }),
  });

  if (query.isLoading) {
    return <p className="p-10 text-center text-sm text-muted-foreground">Loading invoice…</p>;
  }
  if (query.isError || !query.data) {
    return <p className="p-10 text-center text-sm text-destructive">Invoice not found.</p>;
  }

  const { order, items } = query.data;
  const due = Math.max(Number(order.total) - Number(order.advance_paid), 0);

  return (
    <div className="mx-auto min-h-screen bg-neutral-900 p-4 font-mono text-white print:bg-white print:p-0 print:text-black sm:p-8">
      {/* Action Bar */}
      <div className="mx-auto mb-6 flex max-w-[680px] items-center justify-between gap-3 print:hidden">
        <Link
          to="/ad/orders/$id"
          params={{ id }}
          className="text-xs uppercase tracking-wider text-neutral-400 hover:text-white underline transition-colors"
        >
          ← Back to order
        </Link>
        <Button variant="red" size="sm" onClick={() => window.print()}>
          Print / Save PDF
        </Button>
      </div>

      {/* Main Invoice Card Container */}
      <div className="mx-auto max-w-[680px] overflow-hidden rounded-xl border border-neutral-800 bg-black p-6 shadow-2xl print:border-none print:p-0 print:shadow-none">
        
        {/* 1. Header Layout */}
        <header className="flex flex-col items-center gap-6 border-b border-dashed border-neutral-700 pb-8 text-center sm:flex-row sm:text-left">
          <div className="w-[120px] shrink-0">
            <img 
              src={logoDark.url} 
              alt={site.name} 
              className="h-auto w-full max-w-[120px] object-contain"
            />
          </div>
          
          <div className="flex-1 space-y-1 sm:text-center">
            <h1 className="text-2xl font-bold uppercase tracking-widest">{site.name}</h1>
            <div className="text-sm text-neutral-400 print:text-neutral-600">
              <p>Help Line: {site.phoneDisplay}</p>
              <p className="lowercase">{site.url.replace(/^https?:\/\//, '')}</p>
            </div>
          </div>
          
          {/* Spacer for centering in desktop layout */}
          <div className="hidden w-[120px] sm:block" aria-hidden="true" />
        </header>

        {/* 3. Metadata Section (Two equal columns) */}
        <div className="mt-8 grid gap-0 border-b border-dashed border-neutral-700 sm:grid-cols-2">
          <div className="border-b border-dashed border-neutral-700 p-4 sm:border-b-0 sm:border-r">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-neutral-500 underline decoration-neutral-700 underline-offset-8">
              Invoice Details
            </h2>
            <div className="space-y-2 text-sm">
              <p className="flex justify-between sm:justify-start sm:gap-4">
                <span className="text-neutral-500">Invoice No:</span>
                <span className="font-bold">#{order.invoice_no}</span>
              </p>
              <p className="flex justify-between sm:justify-start sm:gap-4">
                <span className="text-neutral-500">Date:</span>
                <span>{new Date(order.created_at).toLocaleString("en-GB", { 
                  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                })}</span>
              </p>
              <p className="flex justify-between sm:justify-start sm:gap-4">
                <span className="text-neutral-500">Payment:</span>
                <span className="uppercase">[{order.payment_status}]</span>
              </p>
            </div>
          </div>

          <div className="p-4">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-neutral-500 underline decoration-neutral-700 underline-offset-8">
              Invoice To
            </h2>
            <div className="space-y-2 text-sm">
              <p className="font-bold">{order.customer_name}</p>
              <p className="break-words text-neutral-400 print:text-neutral-600">
                {order.address_line}, {order.city}
              </p>
              <p className="text-neutral-300 print:text-neutral-700">Phone: {order.customer_phone}</p>
            </div>
          </div>
        </div>

        {/* 4. Items Table */}
        <div className="mt-8 w-full overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-dashed border-neutral-700 text-xs font-bold uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="py-3 px-2">Product Description</th>
                <th className="py-3 px-2 text-center">Qty</th>
                <th className="py-3 px-2 text-right">Price</th>
                <th className="py-3 px-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dashed divide-neutral-800">
              {items.map((item) => (
                <tr key={item.id} className="align-top">
                  <td className="py-4 px-2">
                    <div className="max-w-[200px] break-words">
                      <p className="font-bold uppercase tracking-tight">{item.product_name}</p>
                      {item.variant && (
                        <p className="text-[10px] leading-tight text-neutral-500">{item.variant}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-2 text-center">{item.quantity}</td>
                  <td className="py-4 px-2 text-right tabular-nums">{formatBDT(Number(item.unit_price))}</td>
                  <td className="py-4 px-2 text-right tabular-nums font-bold">{formatBDT(Number(item.line_total))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Block */}
        <div className="mt-8 flex justify-end">
          <dl className="w-full max-w-[280px] space-y-2 text-sm border-t border-dashed border-neutral-700 pt-4">
            <div className="flex justify-between">
              <dt className="text-neutral-500">Sub Total:</dt>
              <dd className="tabular-nums">{formatBDT(Number(order.subtotal))}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Delivery Fee:</dt>
              <dd className="tabular-nums">{formatBDT(Number(order.shipping))}</dd>
            </div>
            <div className="flex justify-between text-red-500">
              <dt>Discount:</dt>
              <dd className="tabular-nums">-{formatBDT(Number(order.discount))}</dd>
            </div>
            <div className="flex justify-between border-t border-neutral-700 pt-2 text-lg font-black">
              <dt className="uppercase tracking-tighter">Grand Total:</dt>
              <dd className="tabular-nums">{formatBDT(Number(order.total))}</dd>
            </div>
            {Number(order.advance_paid) > 0 && (
              <div className="flex justify-between text-xs text-neutral-400">
                <dt>Advance Paid:</dt>
                <dd className="tabular-nums">{formatBDT(Number(order.advance_paid))}</dd>
              </div>
            )}
            {due > 0 && (
              <div className="flex justify-between border-t border-neutral-800 pt-1 font-bold text-yellow-500">
                <dt>Due Amount:</dt>
                <dd className="tabular-nums">{formatBDT(due)}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* 5. Footer */}
        <footer className="mt-12 border-t border-dashed border-neutral-700 pt-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-neutral-400">
            Thank you for shopping with us!
          </p>
        </footer>
      </div>

      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .mx-auto { margin: 0 !important; max-width: 100% !important; }
          .rounded-xl { border-radius: 0 !important; }
          .shadow-2xl { shadow: none !important; }
          .bg-black { background: white !important; }
          .text-white { color: black !important; }
          .text-neutral-400, .text-neutral-500 { color: #666 !important; }
          .border-neutral-800, .border-neutral-700 { border-color: #ddd !important; }
          .divide-neutral-800 { border-color: #ddd !important; }
        }
      `}</style>
    </div>
  );
}

