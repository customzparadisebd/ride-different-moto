import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { listOrders } from "@/lib/orders.functions";
import { StatusBadge } from "@/components/admin/orders/StatusBadge";
import { formatBDT } from "@/lib/format";
import { ShoppingBag } from "lucide-react";

interface CustomerOrderSummaryDialogProps {
  phone: string | null;
  name: string;
  onOpenChange: (open: boolean) => void;
}

export function CustomerOrderSummaryDialog({
  phone,
  name,
  onOpenChange,
}: CustomerOrderSummaryDialogProps) {
  const fetchOrders = useServerFn(listOrders);
  
  const ordersQuery = useQuery({
    queryKey: ["customer-orders", phone],
    queryFn: () =>
      fetchOrders({
        data: {
          customerPhone: phone || "",
          pageSize: 50,
          page: 1,
          sortBy: "created_at",
          sortDir: "desc",
          tab: "all",
        } as any,
      }),
    enabled: Boolean(phone),
  });

  const orders = ordersQuery.data?.rows ?? [];

  return (
    <Dialog open={Boolean(phone)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-card border-border shadow-2xl">
        <DialogHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <DialogTitle className="font-display text-xl uppercase tracking-wider text-foreground">
                {name}
              </DialogTitle>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-tight">
                Total Orders ({orders.length})
              </p>
            </div>
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <ShoppingBag className="size-5" />
            </div>
          </div>
        </DialogHeader>

        <div className="mt-6 space-y-3">
          {ordersQuery.isLoading ? (
            <p className="text-center py-8 text-sm text-muted-foreground">Loading order history...</p>
          ) : orders.length === 0 ? (
            <p className="text-center py-8 text-sm text-muted-foreground">No orders found for this customer.</p>
          ) : (
            orders.map((order) => {
              const itemCount = order.order_items.reduce((sum, item) => sum + item.quantity, 0);
              return (
                <div 
                  key={order.id} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border bg-secondary/30 p-4 transition-all hover:bg-secondary/50 hover:border-primary/20"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Link
                        to="/ad/orders/$id"
                        params={{ id: order.id }}
                        className="font-mono text-sm font-black tracking-tighter text-primary hover:underline"
                        onClick={() => onOpenChange(false)}
                      >
                        {order.invoice_no}
                      </Link>
                      <span className="text-muted-foreground">|</span>
                      <span className="text-xs font-mono text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString("en-GB")}
                      </span>
                    </div>
                    <div className="text-[11px] font-bold uppercase text-muted-foreground tracking-tight">
                      Items: {itemCount} | Total: {formatBDT(order.total)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <StatusBadge value={order.status} className="h-6 text-[10px]" />
                    <Link
                      to="/ad/orders/$id"
                      params={{ id: order.id }}
                      className="rounded-md border border-border bg-card px-3 py-1 text-[10px] font-bold uppercase transition-colors hover:bg-primary hover:text-primary-foreground hover:border-primary"
                      onClick={() => onOpenChange(false)}
                    >
                      View
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
