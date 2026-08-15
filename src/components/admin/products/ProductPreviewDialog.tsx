import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProductDetail } from "@/routes/products.$slug.tsx";
import { type ProductFormValue } from "./ProductForm";
import { type StorefrontProduct } from "@/lib/storefront.shared";
import { useQuery } from "@tanstack/react-query";
import { listProductColors, listProduct360Images } from "@/lib/products.functions";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ProductPreviewDialogProps {
  value: ProductFormValue;
  productId: string | null;
  onClose: () => void;
}

export function ProductPreviewDialog({ value, productId, onClose }: ProductPreviewDialogProps) {
  const fetchColors = useServerFn(listProductColors);
  const fetch360 = useServerFn(listProduct360Images);
  const [isPreviewActive, setIsPreviewActive] = useState(value.isActive);

  // Load existing data if we have a product ID to merge with unsaved changes
  const colorsQuery = useQuery({
    queryKey: ["product-preview-colors", productId],
    queryFn: () => fetchColors({ data: { productId: productId! } }),
    enabled: !!productId,
  });

  const images360Query = useQuery({
    queryKey: ["product-preview-360", productId],
    queryFn: () => fetch360({ data: { productId: productId! } }),
    enabled: !!productId,
  });

  const mockProduct: StorefrontProduct = {
    id: productId || "preview",
    name: value.name || "Product Name Preview",
    sku: value.sku || "PREVIEW-SKU",
    slug: value.slug || "preview-slug",
    category: value.category,
    description: value.description,
    details: value.details,
    price: Number(value.price) || 0,
    offerPrice: value.offerPrice ? Number(value.offerPrice) : null,
    imageUrl: value.imageUrl,
    gallery: [
      value.imageUrl,
      ...value.images
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean),
    ].filter(Boolean),
    bikeCompatibility: value.bikeCompatibility
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    universal: value.isUniversal,
    inStock: Number(value.stockQty) > 0,
    stockQty: Number(value.stockQty),
    bestDeal: value.isBestDeal,
    featured: value.isFeatured,
    newArrival: value.isNewArrival,
    badgeEnabled: value.badgeEnabled,
    badgeText: value.badgeText,
    isActive: isPreviewActive,
    has360View: value.has360View,
    colors: (colorsQuery.data?.rows ?? []).map((c: any) => ({
      id: c.id,
      name: c.name,
      swatch: c.swatch,
      priceDelta: Number(c.price_delta),
      image: c.image_url,
      isActive: c.is_active,
    })),
    product360Images: (images360Query.data?.rows ?? []).map((img: any) => ({
      id: img.id,
      imageUrl: img.image_url,
      displayOrder: img.display_order,
    })),
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] overflow-hidden flex flex-col p-0 bg-background border-border shadow-2xl">
        <DialogHeader className="px-6 py-4 border-b border-border flex flex-row items-center justify-between shrink-0 bg-muted/30">
          <div className="space-y-1">
            <DialogTitle className="font-display text-xl font-bold uppercase tracking-wide">
              Live Storefront Preview
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Visualizing product exactly as customers will see it.
            </p>
          </div>
          
          <div className="flex items-center gap-6 px-4 py-2 rounded-full bg-background border border-border shadow-sm">
            <div className="flex items-center gap-3">
              <Label 
                htmlFor="publish-toggle" 
                className={cn(
                  "text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer",
                  !isPreviewActive ? "text-primary" : "text-muted-foreground/40"
                )}
              >
                Draft
              </Label>
              <Switch
                id="publish-toggle"
                checked={isPreviewActive}
                onCheckedChange={setIsPreviewActive}
                className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-primary"
              />
              <Label 
                htmlFor="publish-toggle" 
                className={cn(
                  "text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer",
                  isPreviewActive ? "text-green-500" : "text-muted-foreground/40"
                )}
              >
                Public
              </Label>
            </div>
            
            <div className="h-4 w-px bg-border" />
            
            <div className="flex items-center gap-2">
               <div className={cn(
                 "size-2 rounded-full animate-pulse",
                 isPreviewActive ? "bg-green-500" : "bg-primary"
               )} />
               <span className="text-[10px] font-black uppercase tracking-tighter">
                 {isPreviewActive ? "Live Preview" : "Draft Preview"}
               </span>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto bg-background custom-scrollbar">
          {!isPreviewActive && (
            <div className="bg-primary/10 border-b border-primary/20 px-6 py-2 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                Previewing unpublished state — This product is currently hidden from customers
              </p>
            </div>
          )}
          <div className="pb-20">
            <ProductDetail product={mockProduct} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
