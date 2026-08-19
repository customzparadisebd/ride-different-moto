import React from "react";
import { Flame, Timer } from "lucide-react";
import { CountdownTimer } from "@/components/CountdownTimer";
import type { FlashSale } from "@/lib/flash.shared";

interface FlashSaleBannerProps {
  sale: FlashSale;
}

export function FlashSaleBanner({ sale }: FlashSaleBannerProps) {
  if (!sale) return null;

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/30 p-4 mb-6 group">
      {/* Animated Glow Background */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(229,9,20,0.1),transparent_70%)] animate-pulse" />
      
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-full bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(229,9,20,0.5)] group-hover:scale-110 transition-transform duration-500">
            <Flame className="size-6 text-white fill-current" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-display font-black uppercase tracking-tighter text-white leading-none">
              {sale.name}
            </h3>
            <p className="text-sm text-primary font-bold uppercase tracking-widest flex items-center gap-2">
              Limited Time Flash Offer
              {sale.discountType === "percentage" && (
                <span className="px-2 py-0.5 rounded bg-primary text-white text-[10px]">SAVE {sale.discountValue}%</span>
              )}
            </p>
          </div>
        </div>

        {(sale.endDate || sale.endTime) && (
          <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 self-start md:self-auto">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Offer Ends In</span>
              <CountdownTimer 
                endDate={sale.endDate} 
                endTime={sale.endTime} 
                className="text-lg text-white"
              />
            </div>
            <Timer className="size-5 text-primary" />
          </div>
        )}
      </div>

      {sale.description && (
        <p className="relative mt-3 text-xs text-white/70 italic border-t border-white/5 pt-3">
          {sale.description}
        </p>
      )}
    </div>
  );
}
