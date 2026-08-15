import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StickyNote } from "lucide-react";

interface OrderNoteDialogProps {
  order: { invoice_no: string; notes: string | null } | null;
  onOpenChange: (open: boolean) => void;
}

export function OrderNoteDialog({ order, onOpenChange }: OrderNoteDialogProps) {
  if (!order || !order.notes) return null;

  return (
    <Dialog open={Boolean(order)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border shadow-2xl">
        <DialogHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-2 text-blue-500">
            <StickyNote className="size-5" />
            <DialogTitle className="font-display text-xl uppercase tracking-wider">
              Note: {order.invoice_no}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-2">
          <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 p-4">
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground font-medium">
              {order.notes}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
