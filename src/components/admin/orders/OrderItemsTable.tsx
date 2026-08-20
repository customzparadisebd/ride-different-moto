import { formatBDT } from "@/lib/format";

export type AdminOrderItem = {
  id: string;
  product_name: string;
  variant: string | null;
  image_url: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
};

/** Ordered items with image, variant/attributes, qty, unit price and subtotal. */
export function OrderItemsTable({ items }: { items: AdminOrderItem[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-card">
      <table className="w-full min-w-[640px] text-sm">
        <caption className="sr-only">Ordered items</caption>
        <thead className="border-b border-border bg-accent/50 dark:bg-secondary text-left text-xs uppercase tracking-wider">
          <tr>
            <th className="p-3">Product</th>
            <th className="p-3">Variant</th>
            <th className="p-3 text-right">Unit price</th>
            <th className="p-3 text-right">Qty</th>
            <th className="p-3 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr>
              <td colSpan={5} className="p-6 text-center text-muted-foreground">
                No items recorded on this order.
              </td>
            </tr>
          )}
          {items.map((item) => (
            <tr key={item.id} className="border-b border-border last:border-0">
              <td className="p-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-accent/30 dark:bg-secondary">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.product_name}
                        loading="lazy"
                        className="size-full object-cover"
                      />
                    ) : (
                      <span className="text-[10px] uppercase text-muted-foreground">No img</span>
                    )}
                  </span>
                  <span className="font-semibold">{item.product_name}</span>
                </div>
              </td>
              <td className="p-3 text-muted-foreground">{item.variant || "—"}</td>
              <td className="p-3 text-right">{formatBDT(Number(item.unit_price))}</td>
              <td className="p-3 text-right">{item.quantity}</td>
              <td className="p-3 text-right font-semibold">{formatBDT(Number(item.line_total))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
