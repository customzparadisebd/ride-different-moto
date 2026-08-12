// ============================================================
// ORDER ACTIVITY LOG DIALOG
// Purpose: Shows who created / edited / assigned / printed an order
//          and when, from the append-only order_events history.
// ============================================================
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getOrderActivity } from "@/lib/orders.functions";
import { statusLabel } from "@/lib/orders.shared";

export function OrderActivityDialog({
  order,
  onOpenChange,
}: {
  order: { id: string; invoice_no: string } | null;
  onOpenChange: (open: boolean) => void;
}) {
  const fetchActivity = useServerFn(getOrderActivity);
  const activityQuery = useQuery({
    queryKey: ["order-activity", order?.id],
    queryFn: () => fetchActivity({ data: { orderId: order!.id } }),
    enabled: Boolean(order),
  });

  return (
    <Dialog open={Boolean(order)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Activity log</DialogTitle>
          <DialogDescription>
            Every recorded action on order {order?.invoice_no}.
          </DialogDescription>
        </DialogHeader>
        {activityQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading activity…</p>
        ) : null}
        <ol className="space-y-3">
          {(activityQuery.data?.events ?? []).map((event) => (
            <li key={event.id} className="rounded-lg border border-border bg-card p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold uppercase tracking-wide text-primary">
                  {statusLabel(event.event_type)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(event.created_at).toLocaleString("en-GB")}
                </span>
              </div>
              {event.message ? <p className="mt-1">{event.message}</p> : null}
              <p className="mt-1 text-xs text-muted-foreground">By {event.actor_label}</p>
            </li>
          ))}
          {!activityQuery.isLoading && (activityQuery.data?.events.length ?? 0) === 0 ? (
            <li className="text-sm text-muted-foreground">No activity recorded yet.</li>
          ) : null}
        </ol>
      </DialogContent>
    </Dialog>
  );
}