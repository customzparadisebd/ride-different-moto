import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Printer, ArrowLeft, Download } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { getOrder } from "@/lib/orders.functions";
import { listLogos } from "@/lib/logos.functions";
import { formatBDT } from "@/lib/format";
import { deliveryZoneLabel, paymentMethodLabel, statusLabel } from "@/lib/orders.shared";

export const Route = createFileRoute("/_authenticated/ad/invoice/$id")({
  head: () => ({
    meta: [
      { title: "Invoice — CZP Ops" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: InvoicePage,
});

function InvoicePage() {
  const { id } = Route.useParams();
  const fetchOrder = useServerFn(getOrder);
  const fetchLogos = useServerFn(listLogos);
  const printRef = useRef<HTMLDivElement>(null);

  const orderQuery = useQuery({
    queryKey: ["admin-order-invoice", id],
    queryFn: () => fetchOrder({ data: { orderId: id } }),
  });

  const logosQuery = useQuery({
    queryKey: ["site-logos"],
    queryFn: () => fetchLogos({}),
  });

  const handlePrint = () => {
    window.print();
  };

  if (orderQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-sm text-muted-foreground font-display uppercase tracking-widest">Generating Invoice...</p>
        </div>
      </div>
    );
  }

  if (orderQuery.isError || !orderQuery.data) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <h1 className="text-2xl font-black uppercase tracking-tighter text-destructive">Invoice Error</h1>
          <p className="mt-2 text-muted-foreground text-sm">We couldn't load the order data for this invoice.</p>
          <Button variant="steel" className="mt-6 w-full" asChild>
            <Link to="/ad/orders">Return to Orders</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { order, items } = orderQuery.data;
  const invoiceLogo = logosQuery.data?.find(l => l.category === 'invoice' && l.is_active)?.url 
    || logosQuery.data?.find(l => l.category === 'main' && l.is_active)?.url
    || "/logo.png"; // Fallback to local brand asset

  const subtotal = Number(order.subtotal);
  const discount = Number(order.discount);
  const shipping = Number(order.shipping);
  const total = Number(order.total);
  const advance = Number(order.advance_paid ?? 0);
  const due = Math.max(total - advance, 0);

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 print:bg-white print:p-0">
      {/* Action Bar - Hidden on print */}
      <div className="sticky top-0 z-50 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-md print:hidden">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link
            to="/ad/orders/$id"
            params={{ id: order.id }}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to Order
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="h-9 gap-2 uppercase tracking-widest text-[10px] font-bold">
              <Printer className="size-3" />
              Print Invoice
            </Button>
            <Button variant="steel" size="sm" className="h-9 gap-2 uppercase tracking-widest text-[10px] font-bold">
              <Download className="size-3" />
              Save PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Invoice Sheet */}
      <div className="mx-auto my-8 max-w-4xl bg-white p-8 shadow-2xl dark:bg-white dark:text-black print:my-0 print:w-full print:max-w-none print:shadow-none sm:p-12">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-6 border-b-4 border-black pb-8 sm:flex-row sm:items-center">
          <div>
            <img 
              src={invoiceLogo} 
              alt="Customz Paradise BD" 
              className="h-16 w-auto object-contain print:h-20"
            />
          </div>
          <div className="text-right sm:text-right">
            <h1 className="font-display text-2xl font-black uppercase tracking-tighter leading-none">CUSTOMZ PARADISE BD</h1>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-widest text-neutral-500">Ride Different. Be Different.</p>
            <div className="mt-4 text-[11px] leading-relaxed text-neutral-600">
              <p>Mirpur, Dhaka, Bangladesh</p>
              <p>Hotline: +880 1890-722202</p>
              <p>Email: customzparadisebd@gmail.com</p>
              <p>Web: www.customzparadisebd.com</p>
            </div>
          </div>
        </div>

        {/* Invoice Meta */}
        <div className="mt-8 grid grid-cols-1 gap-8 border-b border-neutral-200 pb-8 sm:grid-cols-2">
          <div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Bill To</h2>
            <div className="mt-3">
              <p className="font-display text-xl font-bold uppercase">{order.customer_name}</p>
              <p className="mt-1 text-sm font-semibold">{order.customer_phone}</p>
              <div className="mt-2 max-w-xs text-xs leading-relaxed text-neutral-600">
                <p>{order.address_line}</p>
                <p>{order.city}</p>
                <p className="mt-2 inline-block rounded bg-neutral-100 px-2 py-0.5 text-[10px] font-bold uppercase italic text-black print:bg-neutral-50">
                  Zone: {deliveryZoneLabel(order.delivery_zone)}
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:text-right">
            <div className="space-y-4">
              <div>
                <h3 className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Invoice Number</h3>
                <p className="text-sm font-black text-primary">{order.invoice_no}</p>
              </div>
              <div>
                <h3 className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Order ID</h3>
                <p className="text-[11px] font-mono font-medium">{order.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <div>
                <h3 className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Status</h3>
                <p className="text-[10px] font-bold uppercase italic">{statusLabel(order.status)}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Order Date</h3>
                <p className="text-sm font-bold">{new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              </div>
              <div>
                <h3 className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Payment Method</h3>
                <p className="text-[11px] font-bold uppercase">{paymentMethodLabel(order.payment_method)}</p>
              </div>
              <div>
                <h3 className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Payment Status</h3>
                <p className="text-[10px] font-bold uppercase italic">{statusLabel(order.payment_status)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mt-8">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-black text-[10px] font-black uppercase tracking-widest">
                <th className="py-3 w-16">Item</th>
                <th className="py-3">Description</th>
                <th className="py-3 text-center">Qty</th>
                <th className="py-3 text-right">Unit Price</th>
                <th className="py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {items.map((item: any) => (
                <tr key={item.id} className="text-xs">
                  <td className="py-4 align-top">
                    <div className="size-12 overflow-hidden rounded border border-neutral-100 bg-neutral-50 print:border-neutral-200">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.product_name}
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-[8px] uppercase text-neutral-300">No Img</div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 align-top">
                    <p className="font-bold uppercase leading-tight">{item.product_name}</p>
                    {item.variant && (
                      <p className="mt-1 text-[9px] font-medium uppercase text-neutral-500">
                        Variant: <span className="text-black">{item.variant}</span>
                      </p>
                    )}
                  </td>
                  <td className="py-4 align-top text-center font-medium">{item.quantity}</td>
                  <td className="py-4 align-top text-right">{formatBDT(Number(item.unit_price))}</td>
                  <td className="py-4 align-top text-right font-bold">{formatBDT(Number(item.line_total))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="mt-8 flex flex-col justify-between gap-8 sm:flex-row">
          <div className="flex-1">
            {order.notes && (
              <div className="rounded-lg bg-neutral-50 p-4 border border-neutral-100">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">Customer Note</h3>
                <p className="text-[11px] italic text-neutral-600">"{order.notes}"</p>
              </div>
            )}
            <div className="mt-6 text-[10px] text-neutral-400 max-w-xs leading-relaxed uppercase font-medium">
              <p>Thank you for choosing Customz Paradise BD. All modifications are subject to our terms of service.</p>
            </div>
          </div>
          
          <div className="w-full sm:w-64">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span>{formatBDT(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Discount</span>
                  <span>-{formatBDT(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-neutral-600">
                <span>Delivery Charge</span>
                <span>{formatBDT(shipping)}</span>
              </div>
              <div className="flex justify-between border-t border-neutral-200 pt-2 text-sm font-black uppercase">
                <span>Grand Total</span>
                <span>{formatBDT(total)}</span>
              </div>
              <div className="flex justify-between text-neutral-500 pt-1">
                <span>Advance Paid</span>
                <span>{formatBDT(advance)}</span>
              </div>
              
              <div className="mt-4 flex flex-col items-center justify-center rounded-lg bg-black p-3 text-white">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-70">Amount Due on Delivery</span>
                <span className="text-xl font-black">{formatBDT(due)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 border-t border-neutral-100 pt-8 text-center text-[9px] font-medium uppercase tracking-[0.2em] text-neutral-400">
          <p>Important: This is a computer generated invoice and does not require a physical signature.</p>
          <p className="mt-2">Rafi Gazi (Rabbee) Apps · www.customzparadisebd.com</p>
        </div>
      </div>
      
      {/* Print Specific CSS */}
      <style>{`
        @media print {
          @page {
            margin: 0;
            size: auto;
          }
          body {
            background: white !important;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
