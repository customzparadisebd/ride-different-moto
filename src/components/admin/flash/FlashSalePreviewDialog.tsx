import React from "react";
import { format } from "date-fns";
import { Flame, Monitor, Smartphone, Clock, Percent, Banknote, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { FlashSaleInput } from "@/lib/flash.shared";

interface FlashSalePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: FlashSaleInput;
  products: { id: string; name: string; price: number; imageUrl?: string }[];
}

export function FlashSalePreviewDialog({ open, onOpenChange, sale, products }: FlashSalePreviewDialogProps) {
  const selectedProducts = products.filter(p => sale.productIds.includes(p.id));
  const previewProduct = selectedProducts[0] || { name: "Sample Product", price: 10000, imageUrl: "/logo-main.png" };

  const salePrice = sale.discountType === "percentage" 
    ? Math.round(previewProduct.price * (1 - sale.discountValue / 100))
    : sale.discountValue;

  const discountPercent = sale.discountType === "percentage"
    ? sale.discountValue
    : Math.round((1 - sale.discountValue / previewProduct.price) * 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-zinc-950 border-white/10 text-white">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="font-display text-2xl uppercase tracking-tighter flex items-center gap-2">
              <Flame className="size-6 text-primary animate-pulse" />
              Offer Preview
            </DialogTitle>
          </div>
        </DialogHeader>

        <Tabs defaultValue="desktop" className="w-full">
          <div className="flex items-center justify-between mb-4 bg-white/5 p-1 rounded-lg">
            <TabsList className="bg-transparent">
              <TabsTrigger value="desktop" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                <Monitor className="size-4 mr-2" />
                Desktop
              </TabsTrigger>
              <TabsTrigger value="mobile" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                <Smartphone className="size-4 mr-2" />
                Mobile
              </TabsTrigger>
            </TabsList>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground px-3">
              Visual Preview Only
            </div>
          </div>

          <TabsContent value="desktop" className="mt-0 border border-white/10 rounded-xl overflow-hidden bg-zinc-900 shadow-2xl">
            <div className="aspect-[21/9] w-full bg-onyx relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent z-10" />
              {previewProduct.imageUrl && (
                <img 
                  src={previewProduct.imageUrl} 
                  alt="" 
                  className="absolute inset-0 w-full h-full object-cover opacity-50 grayscale group-hover:grayscale-0 transition-all duration-700" 
                />
              )}
              
              <div className="absolute inset-0 z-20 flex flex-col justify-center p-12 space-y-4">
                <Badge className="w-fit bg-primary hover:bg-primary text-white font-bold uppercase tracking-tighter px-3 py-1 animate-bounce">
                  Flash Sale 🔥
                </Badge>
                <h3 className="text-4xl font-display font-black uppercase tracking-tighter text-white drop-shadow-lg">
                  {sale.name || "SALE TITLE"}
                </h3>
                <div className="flex items-baseline gap-4">
                  <span className="text-5xl font-black text-white">৳{salePrice.toLocaleString()}</span>
                  <span className="text-2xl text-white/50 line-through">৳{previewProduct.price.toLocaleString()}</span>
                  <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/10">
                    -{discountPercent}% OFF
                  </Badge>
                </div>
                
                {(sale.endDate || sale.endTime) && (
                  <div className="flex items-center gap-2 text-white/80 font-mono text-lg bg-black/40 backdrop-blur-md w-fit px-4 py-2 rounded-full border border-white/10">
                    <Clock className="size-5 text-primary" />
                    Ends in: 02:45:12
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="mobile" className="mt-0 flex justify-center py-8 bg-zinc-900 border border-white/10 rounded-xl">
            <div className="w-[320px] aspect-[9/16] bg-onyx rounded-[40px] border-[8px] border-zinc-800 shadow-2xl relative overflow-hidden flex flex-col">
              <div className="h-full relative overflow-hidden flex flex-col justify-end p-6 space-y-4">
                <div className="absolute inset-0 z-0">
                  <img src={previewProduct.imageUrl} className="w-full h-full object-cover opacity-40 grayscale" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                </div>
                
                <div className="relative z-10 space-y-3">
                  <Badge className="bg-primary text-[10px] font-bold uppercase tracking-tighter py-0.5">
                    Flash Sale 🔥
                  </Badge>
                  <h3 className="text-2xl font-display font-black uppercase tracking-tighter text-white">
                    {sale.name || "SALE TITLE"}
                  </h3>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-black text-white">৳{salePrice.toLocaleString()}</span>
                      <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/20 py-0">
                        -{discountPercent}%
                      </Badge>
                    </div>
                    <span className="text-sm text-white/40 line-through">৳{previewProduct.price.toLocaleString()}</span>
                  </div>
                  
                  {(sale.endDate || sale.endTime) && (
                    <div className="flex items-center gap-1.5 text-white/90 font-mono text-sm bg-primary/20 backdrop-blur-md w-full justify-center py-2 rounded-xl border border-primary/30">
                      <Clock className="size-4 text-primary" />
                      02:45:12
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 p-4 rounded-lg bg-white/5 border border-white/10">
          <h4 className="text-sm font-bold uppercase tracking-tighter text-white/60 mb-2 flex items-center gap-2">
            <Package className="size-4" />
            Targeted Products ({selectedProducts.length})
          </h4>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2 scrollbar-thin">
            {selectedProducts.map(p => (
              <Badge key={p.id} variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
                {p.name}
              </Badge>
            ))}
            {selectedProducts.length === 0 && (
              <span className="text-xs text-muted-foreground italic">No products selected</span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
