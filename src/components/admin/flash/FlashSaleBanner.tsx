import React from "react";
import { Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CountdownTimer } from "@/components/CountdownTimer";
import type { FlashSale } from "@/lib/flash.shared";

interface FlashSaleBannerProps {
  sale: FlashSale;
}

export function FlashSaleBanner({ sale }: FlashSaleBannerProps) {
  return (
    <div className="w-full bg-primary/10 border border-primary/20 rounded-xl p-4 sm:p-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden relative group">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Flame className="size-24 text-primary" />
      </div>
      
      <div className="space-y-2 relative z-10">
        <div className="flex items-center gap-2">
          <Badge className="bg-primary text-white font-bold uppercase tracking-tighter px-3 py-1 animate-pulse">
            Flash Sale 🔥
          </Badge>
          {sale.discountType === "percentage" ? (
            <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/5">
              -{sale.discountValue}% OFF
            </Badge>
          ) : (
            <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/5">
              Special Price
            </Badge>
          )}
        </div>
        <div>
          <h3 className="text-xl sm:text-2xl font-display font-black uppercase tracking-tighter text-white">
            {sale.name}
          </h3>
          {sale.description && (
            <p className="text-sm text-white/60 max-w-md">{sale.description}</p>
          )}
        </div>
      </div>

      <div className="relative z-10 bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/5 flex flex-col items-center sm:items-end gap-1">
        <CountdownTimer 
          endDate={sale.endDate} 
          endTime={sale.endTime} 
          className="text-lg sm:text-xl" 
        />
        <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Limited Time Only</p>
      </div>
    </div>
  );
}
