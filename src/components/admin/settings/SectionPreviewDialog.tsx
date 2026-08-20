import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { type SectionSetting } from "@/lib/sections.shared";
import { SectionHeading } from "@/components/home/SectionHeading";
import { ProductCard } from "@/components/ProductCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Info, ArrowRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface SectionPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  section: SectionSetting;
}

export function SectionPreviewDialog({ open, onOpenChange, section }: SectionPreviewDialogProps) {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["preview-products", section.productCategory, section.displayLimit],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(section.displayLimit);

      if (section.productCategory && section.productCategory !== "all") {
        query = query.eq("category", section.productCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0 overflow-hidden bg-background border-white/10">
        <DialogHeader className="p-6 border-b border-white/5 shrink-0 bg-black/40">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-display font-bold uppercase tracking-wider flex items-center gap-2">
              <span className="text-primary">Preview:</span> {section.name}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto bg-[#0a0a0a] relative">
          {/* Background decoration to match storefront */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />
          
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
            {!section.enabled && (
              <Alert className="mb-8 bg-yellow-500/10 border-yellow-500/20 text-yellow-500">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  This section is currently <strong>disabled</strong> and will not appear on the live homepage.
                </AlertDescription>
              </Alert>
            )}

            <SectionHeading
              eyebrow={section.productCategory ? (section.productCategory === "all" ? "Our Collection" : section.productCategory.replace(/-/g, " ")) : "Shop Now"}
              title={section.name}
              action={section.showSeeAll ? (
                <Button 
                  variant="ghost" 
                  className="group h-auto p-0 font-display text-xs font-bold uppercase tracking-widest text-primary hover:bg-transparent"
                >
                  {section.buttonText}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              ) : undefined}
            />

            <div className="mt-8">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-muted-foreground animate-pulse">Loading preview products...</p>
                </div>
              ) : products.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product as any} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl bg-white/5">
                  <p className="text-muted-foreground">No products found for this category.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 bg-black/60 border-t border-white/5 flex justify-between items-center shrink-0">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
            Storefront Preview Mode • Matches Desktop Layout
          </p>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-xs uppercase font-bold tracking-widest">
            Close Preview
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
