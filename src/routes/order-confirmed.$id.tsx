import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { OrderSuccessAnimation } from "@/components/checkout/OrderSuccessAnimation";
import { site } from "@/data/site";
import { formatBDT } from "@/lib/format";
import { getOrderPublic } from "@/lib/orders-public.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/order-confirmed/$id")({
  head: () => ({
    meta: [
      { title: `Order Confirmed — ${site.name}` },
      { name: "description", content: "Thank you for your order! Your motorcycle parts modification is being processed." },
      { property: "og:title", content: `Order Confirmed — ${site.name}` },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  loader: async ({ params }) => {
    return { id: params.id };
  },
  component: OrderConfirmedPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="font-display text-3xl font-bold uppercase">Order not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">We couldn't find the order you're looking for.</p>
      <Button variant="red" size="touch" className="mt-6" asChild>
        <Link to="/shop">Back to Shop</Link>
      </Button>
    </div>
  ),
});

function OrderConfirmedPage() {
  const { id } = Route.useLoaderData();
  const fetchOrder = useServerFn(getOrderPublic);

  const { data, isLoading, error } = useQuery({
    queryKey: ["order-public", id],
    queryFn: () => fetchOrder({ data: { id } }),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    throw notFound();
  }

  const { order, items } = data;

  return (
    <section className="mx-auto max-w-2xl px-4 py-16 text-center">
      <style>{`
        .czp-reveal{opacity:0;transform:translateY(12px);animation:czp-reveal .6s cubic-bezier(.2,.8,.3,1) forwards}
        @keyframes czp-reveal{to{opacity:1;transform:translateY(0)}}
        @media (prefers-reduced-motion: reduce){.czp-reveal{animation:none;opacity:1;transform:none}}
      `}</style>
      
      <OrderSuccessAnimation />

      <h1
        className="czp-reveal mt-4 font-display text-3xl font-bold uppercase tracking-wide"
        style={{ animationDelay: "0.95s" }}
      >
        Order Confirmed
      </h1>
      
      <p className="czp-reveal mt-2 text-sm text-muted-foreground" style={{ animationDelay: "1.08s" }}>
        Thank you, <strong>{order.customer_name}</strong>! Our team will call you at <strong>{order.customer_phone}</strong> shortly to confirm delivery details.
      </p>

      <div
        className="czp-reveal mt-8 rounded-xl border border-border bg-card text-left shadow-card overflow-hidden"
        style={{ animationDelay: "1.1s" }}
      >
        <div className="bg-secondary/30 p-5 border-b border-border">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Invoice Number</p>
          <p className="font-display text-3xl font-bold text-primary">{order.invoice_no}</p>
        </div>
        
        <div className="p-5 space-y-6">
          <div>
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Order Items</h2>
            <ul className="space-y-2">
              {items.map((item: any) => (
                <li key={item.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.product_name} {item.variant ? `(${item.variant})` : ""} <span className="text-foreground font-medium">x{item.quantity}</span>
                  </span>
                  <span className="font-medium">{formatBDT(item.line_total)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-between items-center border-t border-border pt-4">
            <span className="text-sm font-semibold uppercase">Total Amount Payable</span>
            <span className="font-display text-2xl font-bold text-primary">{formatBDT(order.total)}</span>
          </div>

          <div className="text-xs text-muted-foreground border-t border-border pt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="font-semibold text-foreground uppercase mb-1">Shipping To</p>
              <p>{order.city}</p>
              <p className="line-clamp-2">{order.address_line}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-foreground uppercase mb-1">Payment Method</p>
              <p className="capitalize">{order.payment_method.replace(/_/g, ' ')}</p>
            </div>
          </div>
        </div>
      </div>

      <div
        className="czp-reveal mt-8 flex flex-wrap justify-center gap-3"
        style={{ animationDelay: "1.24s" }}
      >
        <Button variant="red" size="touch" asChild>
          <Link to="/shop">Continue Shopping</Link>
        </Button>
        <Button variant="steel" size="touch" asChild>
          <Link to="/">Back Home</Link>
        </Button>
      </div>

      <div className="czp-reveal mt-8 rounded-lg border border-border bg-secondary/60 p-4 text-center" style={{ animationDelay: "1.35s" }}>
        <p className="text-xs text-muted-foreground">Having any problem with your order? Need help tracking?</p>
        <a
          href={`https://wa.me/${site.phone.replace(/\D/g, '')}?text=Hi! I need help with my order ${order.invoice_no} on Customz Paradise BD.`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#25D366] px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 fill-current">
            <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.95 1.16-.17.2-.35.22-.65.07-.3-.15-1.13-.42-2.15-1.33-.8-.71-1.33-1.59-1.48-1.89-.15-.3-.02-.46.13-.61.15-.15.3-.35.45-.53.15-.17.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.68-1.63-.93-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47s1.06 2.87 1.21 3.07c.15.2 2.09 3.2 5.07 4.37.71.28 1.26.45 1.69.58.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.28.17-1.41-.07-.12-.27-.2-.57-.35zM12.04 21.5h-.01a9.4 9.4 0 0 1-4.79-1.31l-.34-.2-3.56.93.95-3.47-.22-.36a9.37 9.37 0 0 1-1.44-5.01c0-5.18 4.22-9.4 9.42-9.4 2.51 0 4.87.98 6.64 2.76a9.34 9.34 0 0 1 2.75 6.65c0 5.18-4.23 9.41-9.4 9.41zM20.5 3.49A11.3 11.3 0 0 0 12.04 0C5.79 0 .71 5.08.7 11.32c0 1.99.52 3.94 1.51 5.66L.6 24l7.18-1.88a11.3 11.3 0 0 0 4.25 1.08h.01c6.24 0 11.32-5.08 11.33-11.32 0-3.02-1.18-5.87-3.32-8.02z" />
          </svg>
          WhatsApp Support
        </a>
      </div>
    </section>
  );
}
