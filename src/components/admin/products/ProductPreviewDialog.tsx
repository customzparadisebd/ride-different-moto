import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { type ProductFormValue } from "./ProductForm";
import { type StorefrontProduct } from "@/lib/storefront.shared";
import { useQuery } from "@tanstack/react-query";
import { listProductColors, listProduct360Images } from "@/lib/products.functions";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ProductDetail } from "@/routes/products.$slug";
import { X } from "lucide-react";



interface ProductPreviewDialogProps {
  value: ProductFormValue;
  productId: string | null;
  onClose: () => void;
}

export function ProductPreviewDialog({ value, productId, onClose }: ProductPreviewDialogProps) {
  const [isPreviewActive, setIsPreviewActive] = useState(value.isActive);
  const fetchColors = useServerFn(listProductColors);
  const fetch360 = useServerFn(listProduct360Images);
  
  const DetailPreview = ({ product }: { product: StorefrontProduct }) => (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Gallery */}
        <div className="lg:col-span-7 xl:col-span-8">
          <ProductGallery
            images={product.gallery}
            productName={product.name}
          />

        </div>

        {/* Right: Info */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-8">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {product.universal && (
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px] uppercase font-bold tracking-widest">Universal Fit</Badge>
              )}
              {product.newArrival && (
                <Badge className="bg-green-500 text-white border-none text-[10px] uppercase font-bold tracking-widest">New Arrival</Badge>
              )}
            </div>
            
            <h1 className="font-display text-4xl font-bold uppercase tracking-tight leading-[0.9]">
              {product.name}
            </h1>
            
            <div className="flex items-baseline gap-4">
              <span className="text-3xl font-black text-primary">
                {formatBDT(product.offerPrice || product.price)}
              </span>
              {product.offerPrice && (
                <span className="text-xl text-muted-foreground line-through decoration-primary/40">
                  {formatBDT(product.price)}
                </span>
              )}
            </div>
          </div>

          <Separator className="bg-white/5" />

          {/* Color Selection Mock */}
          {product.colors && product.colors.length > 0 && (
            <div className="space-y-4">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Select Color</Label>
              <div className="flex flex-wrap gap-3">
                {product.colors.map((color) => (
                  <button
                    key={color.id}
                    className="group relative size-10 rounded-full border-2 border-white/10 p-0.5 transition-all hover:border-primary"
                  >
                    <div
                      className="h-full w-full rounded-full"
                      style={{ backgroundColor: color.swatch }}
                    />
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-bold uppercase tracking-widest opacity-0 transition-opacity group-hover:opacity-100">
                      {color.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <Button className="w-full h-14 text-sm font-bold uppercase tracking-widest gap-3 shadow-3d-primary active:translate-y-[2px] transition-all">
              <ShoppingCart className="size-5" />
              Add to Cart
            </Button>
            
            <Button variant="outline" className="w-full h-14 border-white/10 hover:bg-white/5 text-sm font-bold uppercase tracking-widest transition-all">
              Buy It Now
            </Button>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-2 gap-4 py-6">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
              <Truck className="size-5 text-primary" />
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold uppercase tracking-tight">Fast Delivery</p>
                <p className="text-[8px] text-muted-foreground uppercase">Across Bangladesh</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
              <ShieldCheck className="size-5 text-primary" />
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold uppercase tracking-tight">Secure Pay</p>
                <p className="text-[8px] text-muted-foreground uppercase">100% Protection</p>
              </div>
            </div>
          </div>

          {/* Compatibility */}
          {product.bikeCompatibility && product.bikeCompatibility.length > 0 && (
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <RefreshCw className="size-3" /> Compatible Bikes
              </p>
              <div className="flex flex-wrap gap-1.5">
                {product.bikeCompatibility.map((bike) => (
                  <Badge key={bike} variant="outline" className="bg-black/20 border-white/10 text-[9px] uppercase font-bold">
                    {bike}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Description Section */}
      <div className="mt-20 max-w-4xl">
        <h3 className="font-display text-2xl font-bold uppercase tracking-tight mb-8">Product Details</h3>
        <div 
          className="prose prose-invert prose-red max-w-none text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: product.description || "No description provided." }}
        />
      </div>
    </div>
  );


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
    slug: value.slug || "preview-slug",
    name: value.name || "Product Name Preview",
    description: value.description || null,
    details: value.details || null,
    category: value.category,
    image: value.imageUrl || null,
    gallery: [
      value.imageUrl,
      ...value.images
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean),
    ].filter(Boolean),
    price: Number(value.price) || 0,
    offerPrice: value.offerPrice ? Number(value.offerPrice) : null,
    stockQty: Number(value.stockQty),
    inStock: Number(value.stockQty) > 0,
    outOfStockManual: value.outOfStockToggle,
    universal: value.isUniversal,
    bikeCompatibility: value.bikeCompatibility
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    bestDeal: value.isBestDeal,
    featured: value.isFeatured,
    newArrival: value.isNewArrival,
    badgeText: value.badgeText || null,
    colors: (colorsQuery.data?.rows ?? []).map((c: any) => ({
      id: c.id,
      name: c.name,
      swatch: c.swatch,
      priceDelta: Number(c.price_delta),
      image: c.image_url,
    })),
    has360View: value.has360View,
    product360Images: (images360Query.data?.rows ?? []).map((img: any) => img.image_url),
    videoEnabled: value.videoEnabled,
    videoPlatform: value.videoPlatform as any,
    videoUrl: value.videoUrl,
    sortOrder: null,
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
                  !isPreviewActive ? "text-primary" : "text-muted-foreground/40",
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
                  isPreviewActive ? "text-green-500" : "text-muted-foreground/40",
                )}
              >
                Public
              </Label>
            </div>

            <div className="h-4 w-px bg-border" />

            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "size-2 rounded-full animate-pulse",
                  isPreviewActive ? "bg-green-500" : "bg-primary",
                )}
              />
              <span className="text-[10px] font-black uppercase tracking-tighter text-foreground">
                {isPreviewActive ? "Live Preview" : "Draft Preview"}
              </span>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto bg-background custom-scrollbar">
          <div className="pb-20">
            <DetailPreview product={mockProduct} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
