import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Flame, Timer, ShoppingCart } from "lucide-react";
import { format } from "date-fns";
import { calculateFlashPrice } from "@/lib/flash-utils";
import { formatBDT } from "@/lib/format";
import type { FlashSaleInput } from "@/lib/flash.shared";

interface FlashSalePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: FlashSaleInput;
  products: { id: string; name: string; price: number; imageUrl?: string }[];
}

export function FlashSalePreviewDialog({ open, onOpenChange, sale, products }: FlashSalePreviewDialogProps) {
  const selectedProducts = products.filter(p => sale.productIds.includes(p.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-zinc-950 border-white/10 text-white overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-orange-500 to-primary animate-pulse" />
        
        <DialogHeader className="pt-4">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Flame className="size-5 fill-current" />
            <span className="text-xs font-bold uppercase tracking-[0.2em]">Live Preview Mode</span>
          </div>
          <DialogTitle className="text-3xl font-display font-black uppercase tracking-tight leading-none">
            {sale.name || "Untitled Flash Sale"}
          </DialogTitle>
          <DialogDescription className="text-white/60 text-lg italic">
            {sale.description || "Get exclusive discounts on premium motorcycle gear!"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-center items-center text-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Discount Active</span>
              <div className="text-4xl font-display font-black text-primary">
                {sale.discountType === "percentage" ? `${sale.discountValue}%` : formatBDT(sale.discountValue)}
              </div>
              <span className="text-xs text-white/40 mt-1 uppercase tracking-wider">
                {sale.discountType === "percentage" ? "OFF Total Price" : "Flat Final Price"}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-center items-center text-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Schedule</span>
              <div className="flex items-center gap-2 text-white font-mono text-sm">
                <Timer className="size-4 text-primary" />
                {sale.startDate ? sale.startDate : "Immediate"}
                {sale.startTime && ` @ ${sale.startTime}`}
              </div>
              <span className="text-[10px] text-white/40 mt-1 italic">Ends: {sale.endDate || "Manually"}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold uppercase tracking-widest text-white/80">Affected Products ({selectedProducts.length})</h4>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {selectedProducts.length > 0 ? (
                selectedProducts.map((p) => {
                  const flashPrice = calculateFlashPrice(p.price, sale as any);
                  return (
                    <div key={p.id} className="p-3 rounded-lg bg-black/40 border border-white/5 flex items-center gap-3">
                      <div className="size-12 rounded bg-white/5 flex-shrink-0 flex items-center justify-center overflow-hidden border border-white/10">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt="" className="size-full object-cover" />
                        ) : (
                          <ShoppingCart className="size-5 text-white/20" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white uppercase truncate tracking-tight">{p.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-black text-primary">{formatBDT(flashPrice)}</span>
                          <span className="text-[10px] text-white/40 line-through">{formatBDT(p.price)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full py-8 text-center bg-white/5 rounded-lg border border-dashed border-white/10">
                  <p className="text-xs text-muted-foreground">No products selected yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-white/10 flex justify-between items-center">
          <Badge className={sale.isActive ? "bg-emerald-500 text-white" : "bg-zinc-800 text-muted-foreground"}>
            {sale.isActive ? "SALE LIVE" : "SALE DRAFT"}
          </Badge>
          <p className="text-[10px] text-white/40 italic">
            Preview reflects calculations based on current selection.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
