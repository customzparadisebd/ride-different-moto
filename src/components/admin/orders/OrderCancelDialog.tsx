import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Loader2 } from "lucide-react";
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
import { cancelSteadfastShipment } from "@/lib/steadfast.functions";
 
type OrderCancelDialogProps = {
  order: { id: string; invoice_no: string; consignment_id?: string | null } | null;
  onOpenChange: (open: boolean) => void;
  onFinished: () => void;
};
 
export function OrderCancelDialog({ order, onOpenChange, onFinished }: OrderCancelDialogProps) {
  const cancelShipment = useServerFn(cancelSteadfastShipment);
 
  const mutation = useMutation({
    mutationFn: () => cancelShipment({ data: { orderId: order?.id ?? "" } }),
    onSuccess: (res) => {
      if (res.success) {
        toast.success(res.message || "Shipment cancelled successfully.");
        onFinished();
        onOpenChange(false);
      } else {
        toast.error(res.message || "Could not cancel the shipment.");
      }
    },
    onError: (error: Error) => toast.error(error.message || "Cancel failed."),
  });
 
  return (
    <Dialog open={!!order} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10">
            <AlertTriangle className="h-6 w-6 text-rose-500" />
          </div>
          <DialogTitle className="mt-4 font-display text-xl font-bold uppercase">
            Cancel Shipment
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel the SteadFast shipment for invoice{" "}
            <span className="font-semibold text-foreground">{order?.invoice_no}</span>?
            <br />
            Consignment ID: <span className="font-mono text-xs">{order?.consignment_id}</span>
          </DialogDescription>
        </DialogHeader>
 
        <div className="rounded-lg bg-rose-500/5 p-3 text-xs text-rose-600 dark:text-rose-400">
          This will call the SteadFast API to cancel the booking. Once cancelled, the order's courier status will be reset and you can book it again if needed.
        </div>
 
        <DialogFooter className="mt-6 flex gap-2 sm:justify-end">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Go Back
          </Button>
          <Button
            variant="destructive"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cancelling…
              </>
            ) : (
              "Yes, Cancel Booking"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
