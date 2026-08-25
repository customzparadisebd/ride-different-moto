// ============================================================
// PRODUCT DETAIL PAGE
// Purpose: Main product showcase with gallery, pricing,
//          description and bike-fitment data.
// Status: COMPLETED
// Security: Uses RLS; price logic validated on checkout server.
// ============================================================
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Maximize2, CheckCircle2, ChevronRight, MessageCircle, ShieldCheck, Truck, RotateCcw, Zap, Package, Bike } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

import { getStorefrontProduct } from "@/lib/storefront.functions";
import { getFlashSales } from "@/lib/flash.functions";
import { getActiveSaleForProduct, calculateFlashPrice } from "@/lib/flash-utils";
import { FlashSaleBanner } from "@/components/admin/flash/FlashSaleBanner";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductVideo } from "@/components/product/ProductVideo";
import { SafeHtml } from "@/components/product/SafeHtml";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/lib/cart";
import { formatBDT } from "@/lib/format";
import { useLanguage } from "@/lib/i18n";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppFloating } from "@/components/WhatsAppFloating";
import { cn } from "@/lib/utils";
import type { ProductColor, StorefrontProduct } from "@/lib/storefront.shared";

export const Route = createFileRoute("/products/$slug")({
  loader: async ({ params, context }) => {
    return context.queryClient.ensureQueryData({
      queryKey: ["product", params.slug],
      queryFn: () => getStorefrontProduct({ data: { slug: params.slug } }),
    });
  },
  component: ProductDetail,
});

export function ProductDetail({ product: manualProduct }: { product?: StorefrontProduct }) {
  const { slug } = Route.useParams();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const fetchProduct = useServerFn(getStorefrontProduct);
  const storefrontQuery = useSuspenseQuery({
    queryKey: ["product", slug],
    queryFn: () => fetchProduct({ data: { slug } }),
  });
  
  const product = manualProduct || storefrontQuery.data;

  const fetchFlashSales = useServerFn(getFlashSales);
  const { data: sales = [] } = useQuery({
    queryKey: ["flash-sales"],
    queryFn: () => fetchFlashSales({ data: undefined }),
    staleTime: 60000,
  });

  const [color, setColor] = useState<ProductColor | null>(
    (product?.colors && product.colors.length > 0) ? (product.colors[0] as ProductColor) : null
  );

  // Keep the selected colour in sync with the product that finished loading.
  useEffect(() => {
    const colors = (product?.colors ?? []) as ProductColor[];
    setColor((current) => {
      if (colors.length === 0) return null;
      const match = current ? colors.find((c) => c.id === current.id) : undefined;
      return match ?? (colors[0] as ProductColor);
    });
  }, [product?.id, product?.colors]);

  const selectColor = (next: ProductColor) => {
    setColor(next);
    if (!manualProduct && next.linkedProductSlug && next.linkedProductSlug !== product?.slug) {
      void navigate({ to: "/products/$slug", params: { slug: next.linkedProductSlug } });
    }
  };
  const [qty, setQty] = useState(1);

  if (!product) return null;

  const activeSale = getActiveSaleForProduct(product.id, sales);
  const baseUnitPrice = product.price + (color?.priceDelta || 0);
  const isFlashActive = activeSale !== null;
  
  const displayUnitPrice = isFlashActive 
    ? calculateFlashPrice(baseUnitPrice, activeSale!) 
    : (product.offerPrice ? product.offerPrice + (color?.priceDelta || 0) : baseUnitPrice);
  
  const wasPrice = isFlashActive 
    ? baseUnitPrice 
    : (product.offerPrice ? baseUnitPrice : null);

  const discountValue = isFlashActive 
    ? (activeSale!.discountType === "percentage" ? activeSale!.discountValue : Math.round((1 - displayUnitPrice / baseUnitPrice) * 100))
    : (wasPrice ? Math.round((1 - displayUnitPrice / wasPrice) * 100) : null);

  const isActuallyInStock = product.inStock && !product.outOfStockManual;

  const handleAddToCart = (thenCheckout: boolean) => {
    if (!isActuallyInStock) return;
    addItem({ 
      product: product as any, 
      color, 
      qty, 
      flashSaleId: activeSale?.id || null,
      unitPrice: isFlashActive ? displayUnitPrice : undefined 
    } as any);
    
    if (thenCheckout) {
      void navigate({ to: "/checkout" });
    } else {
      toast.success(t("common.addedToCart"), {
        description: `${product.name} (${color?.name || "Standard"})`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {!manualProduct && <Header />}
      
      <main className="container mx-auto px-4 py-8 lg:py-12">
        <nav className="mb-8 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          <a href="/" className="hover:text-primary transition-colors">Home</a>
          <ChevronRight className="size-3" />
          <a href="/products" className="hover:text-primary transition-colors">Shop</a>
          <ChevronRight className="size-3" />
          <span className="text-white truncate max-w-[200px]">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div className="space-y-6">
            <ProductGallery 
              images={[product.image || "", ...(product.gallery || [])]} 
              productName={product.name}
              activeColorImage={color?.image ?? null}
            />

            {product.videoUrl && (
              <Card className="bg-zinc-900/50 border-white/5 overflow-hidden">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-white flex items-center gap-2">
                    <Zap className="size-4 text-primary" />
                    Product Showcase
                  </h3>
                </div>
                <ProductVideo url={product.videoUrl} platform="youtube" productName={product.name} />
              </Card>
            )}
          </div>

          <div className="flex flex-col">
            {isFlashActive && <FlashSaleBanner sale={activeSale!} />}
            
            <div className="mb-6 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {product.category && (
                  <Badge variant="outline" className="border-primary/30 text-primary uppercase text-[10px] tracking-widest px-2">
                    {product.category}
                  </Badge>
                )}
                {product.sku && (
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                    SKU: {product.sku}
                  </span>
                )}
              </div>
              
              <h1 className="font-display text-4xl font-black uppercase leading-[0.9] tracking-tighter text-white lg:text-5xl">
                {product.name}
              </h1>
              
              <div className="flex items-center gap-3">
                <div className="flex items-baseline gap-3">
                  <span className={cn("font-display text-3xl font-black", isFlashActive ? "text-primary" : "text-primary")}>
                    {formatBDT(displayUnitPrice)}
                  </span>
                  {wasPrice && (
                    <span className="text-xl text-muted-foreground line-through decoration-primary/40">
                      {formatBDT(wasPrice)}
                    </span>
                  )}
                </div>
                {discountValue && (
                  <Badge className="bg-gradient-red text-white border-none text-xs font-bold px-2 py-0.5 animate-pulse">
                    -{discountValue}% OFF
                  </Badge>
                )}
              </div>
            </div>

            <Separator className="bg-white/5 mb-8" />

            {product.description && (
              <div className="mb-8 prose prose-invert prose-sm max-w-none">
                <p className="text-white/70 leading-relaxed text-base italic border-l-2 border-primary/30 pl-4">
                  {product.description}
                </p>
              </div>
            )}

            <div className="space-y-8 mb-10">
              {product.colors.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/60">
                      Select Color
                    </label>
                    {color && (
                      <span className="text-xs font-bold text-primary uppercase tracking-wider">
                        {color.name} {color.priceDelta > 0 && `(+৳${color.priceDelta})`}
                      </span>
                    )}
                  </div>
                  <div className="rounded-xl border border-border bg-card p-6">
                    <div className="flex flex-wrap gap-3">
                      {product.colors.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => selectColor(c)}
                          className={cn(
                            "group relative flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all",
                            color?.id === c.id 
                              ? "border-primary bg-primary/5 ring-4 ring-primary/10" 
                              : "border-white/5 bg-black/20 hover:border-white/20"
                          )}
                        >
                          <span 
                            className="size-10 rounded-full border border-black/20 shadow-inner"
                            style={{ backgroundColor: c.swatch }}
                          />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">
                            {c.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-widest text-white/60 block">
                  Quantity
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 items-center rounded-lg border border-white/10 bg-black/40 p-1">
                    <button 
                      onClick={() => setQty(Math.max(1, qty - 1))}
                      className="flex size-10 items-center justify-center rounded hover:bg-white/5 text-white transition-colors"
                    >
                      -
                    </button>
                    <span className="w-12 text-center font-display text-lg font-bold text-white">
                      {qty}
                    </span>
                    <button 
                      onClick={() => setQty(Math.min(10, qty + 1))}
                      className="flex size-10 items-center justify-center rounded hover:bg-white/5 text-white transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex-1">
                    <div className={cn(
                      "flex items-center gap-2 rounded-lg px-4 py-3 border text-xs font-bold uppercase tracking-widest",
                      isActuallyInStock 
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                        : "bg-red-500/10 border-red-500/20 text-red-500"
                    )}>
                      <Package className="size-4" />
                      {isActuallyInStock ? "In Stock & Ready to Ship" : "Currently Out of Stock"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              <Button
                variant="steel"
                size="lg"
                onClick={() => handleAddToCart(false)}
                disabled={!isActuallyInStock}
                className="h-14 font-black uppercase tracking-widest"
              >
                {t("nav.cart")}
              </Button>
              <Button
                variant="red"
                size="lg"
                onClick={() => handleAddToCart(true)}
                disabled={!isActuallyInStock}
                className="h-14 font-black uppercase tracking-widest"
              >
                {product.badgeText === "Pre-order" ? "Pre-order Now" : t("common.orderNow")}
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 rounded-2xl bg-zinc-900/30 border border-white/5">
              <div className="flex flex-col items-center text-center gap-2">
                <Truck className="size-5 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-tighter text-white/60">Fast Delivery</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <ShieldCheck className="size-5 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-tighter text-white/60">Genuine Parts</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <RotateCcw className="size-5 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-tighter text-white/60">Easy Return</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <CheckCircle2 className="size-5 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-tighter text-white/60">Quality Tested</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-10">
            {product.bikeModels && product.bikeModels.length > 0 && (
              <section className="space-y-6">
                <h2 className="text-2xl font-display font-black uppercase tracking-tighter text-white flex items-center gap-3">
                  <Bike className="size-6 text-primary" />
                  Bike Fitment
                </h2>
                <div className="flex flex-wrap gap-2">
                  {product.bikeModels.map((bike: any) => (
                    <Badge 
                      key={bike.id} 
                      variant="outline" 
                      className="bg-white/5 border-white/10 text-white font-medium py-1.5 px-4"
                    >
                      {bike.brand} {bike.model}
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-6">
              <h2 className="text-2xl font-display font-black uppercase tracking-tighter text-white">Product Description</h2>
              <SafeHtml
                className="prose prose-invert max-w-none text-white/70 text-lg leading-relaxed"
                html={product.description || "No description available."}
              />

            </section>
          </div>
          
          <div className="space-y-6">
             <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
                <h3 className="text-xl font-display font-black uppercase tracking-tighter text-white mb-4">Need Expert Advice?</h3>
                <p className="text-white/60 text-sm mb-6 leading-relaxed">
                  Confused about fitment? Our modification experts are ready to help you choose the best part for your beast.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full border-primary/30 text-primary hover:bg-primary hover:text-white transition-all gap-2 h-12 font-bold"
                  asChild
                >
                  <a href="https://wa.me/8801890722202" target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="size-5" />
                    Chat on WhatsApp
                  </a>
                </Button>
             </div>
          </div>
        </div>
      </main>

      {!manualProduct && <Footer />}
      {!manualProduct && <WhatsAppFloating />}
    </div>
  );
}
