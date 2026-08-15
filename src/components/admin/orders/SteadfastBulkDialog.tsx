// ============================================================
// SEND TO STEADFAST — BULK CONFIRMATION + PROGRESS
// Purpose: Confirms the selected order count, sends the orders to
//          SteadFast in small batches (so progress can be shown)
//          and lists a success/failed result per order.
// Status: COMPLETED
// Security: No API credentials touch the browser — the server
//          function reads them and enforces shipments.create.
// ============================================================
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { bulkSendToSteadfast } from "@/lib/steadfast.functions";
import type { BulkShipmentRow } from "@/lib/steadfast.shared";

const BATCH_SIZE = 5;

export function SteadfastBulkDialog({
  open,
  orderIds,
  onOpenChange,
  onFinished,
}: {
  open: boolean;
  orderIds: string[];
  onOpenChange: (open: boolean) => void;
  onFinished: (successIds: string[]) => void;
}) {
  const queryClient = useQueryClient();
  const send = useServerFn(bulkSendToSteadfast);

  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(0);
  const [results, setResults] = useState<BulkShipmentRow[]>([]);

  const reset = () => {
    setSending(false);
    setDone(0);
    setResults([]);
  };

  const run = async () => {
    setSending(true);
    setResults([]);
    setDone(0);
    const collected: BulkShipmentRow[] = [];

    try {
      // Batched so the dialog can report progress on large selections.
      for (let i = 0; i < orderIds.length; i += BATCH_SIZE) {
        const batch = orderIds.slice(i, i + BATCH_SIZE);
        const { results: batchResults } = await send({ data: { orderIds: batch } });
        collected.push(...batchResults);
        setResults([...collected]);
        setDone(Math.min(i + batch.length, orderIds.length));
      }

      const sent = collected.filter((row) => row.success).length;
      const failed = collected.filter((row) => !row.success && !row.skipped).length;
      if (sent) toast.success(`${sent} order(s) sent to SteadFast`);
      if (failed) toast.error(`${failed} order(s) failed — retry them from this list`);

      void queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      onFinished(collected.filter((row) => row.success).map((row) => row.orderId));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bulk sending failed.");
    } finally {
      setSending(false);
    }
  };

  const progress = orderIds.length ? Math.round((done / orderIds.length) * 100) : 0;
  const finished = results.length > 0 && !sending;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (sending) return;
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <img
              src="https://www.steadfast.com.bd/landing-page/asset/images/logo/logo.svg"
              alt="SteadFast Courier"
              className="h-8 w-auto"
            />
            <DialogTitle className="font-display uppercase">Send to SteadFast</DialogTitle>
          </div>
          <DialogDescription>
            {finished
              ? "Results for this batch. Failed orders stay selectable for a retry — already booked orders are never sent twice."
              : `${orderIds.length} order(s) will be sent to SteadFast as Cash-on-Delivery consignments.`}
          </DialogDescription>
        </DialogHeader>

        {/* ---- Progress feedback ---- */}
        {sending ? (
          <div className="space-y-2">
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">
              Sending… {done} of {orderIds.length}
            </p>
          </div>
        ) : null}

        {/* ---- Per-order results ---- */}
        {results.length > 0 ? (
          <ul className="max-h-64 space-y-2 overflow-y-auto text-sm">
            {results.map((row) => (
              <li key={row.orderId} className="rounded-md border border-border p-2 leading-snug">
                <span className="font-semibold">{row.invoiceNo}</span>{" "}
                <span
                  className={
                    row.success
                      ? "text-primary"
                      : row.skipped
                        ? "text-muted-foreground"
                        : "text-destructive"
                  }
                >
                  {row.success ? "Sent" : row.skipped ? "Skipped" : "Failed"}
                </span>
                <span className="block text-xs text-muted-foreground">{row.message}</span>
                {row.consignmentId ? (
                  <span className="block text-xs text-muted-foreground">
                    Consignment {row.consignmentId}
                    {row.trackingCode ? ` · Tracking ${row.trackingCode}` : ""}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}

        <DialogFooter>
          <Button
            variant="steel"
            size="touch"
            disabled={sending}
            onClick={() => {
              reset();
              onOpenChange(false);
            }}
          >
            {finished ? "Close" : "Cancel"}
          </Button>
          {!finished ? (
            <Button variant="red" size="touch" disabled={sending} onClick={() => void run()}>
              {sending ? "Sending…" : `Confirm & send ${orderIds.length}`}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
