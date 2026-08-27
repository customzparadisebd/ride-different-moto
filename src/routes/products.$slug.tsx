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
import { useEffect, useMemo, useState } from "react";
import { Check, ChevronRight, Zap, Package, Bike } from "lucide-react";
import { Card } from "@/components/ui/card";
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

  // Gallery images: product image + gallery + every colour image (deduped),
  // so a colour swatch and its thumbnail are always the same entry.
  const galleryImages = useMemo(() => {
    const list = [product?.image || "", ...(product?.gallery || [])];
    for (const c of (product?.colors ?? []) as ProductColor[]) {
      if (c.image) list.push(c.image);
    }
    return Array.from(new Set(list.filter(Boolean)));
  }, [product?.image, product?.gallery, product?.colors]);

  // Gallery thumbnail -> colour swatch synchronisation.
  const handleGalleryImage = (src: string) => {
    const colors = (product?.colors ?? []) as ProductColor[];
    const match = colors.find((c) => c.image && c.image === src);
    if (match && match.id !== color?.id) setColor(match);
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
        <nav className="mb-8 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          <a href="/" className="transition-colors hover:text-primary">Home</a>
          <ChevronRight className="size-3" />
          <a href="/products" className="transition-colors hover:text-primary">Shop</a>
          <ChevronRight className="size-3" />
          <span className="max-w-[200px] truncate text-foreground">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div className="space-y-6">
            <ProductGallery
              images={galleryImages}
              productName={product.name}
              activeColorImage={color?.image ?? null}
              onSelectImage={handleGalleryImage}
            />

            {product.videoUrl && (
              <Card className="overflow-hidden border-border bg-card">
                <div className="flex items-center justify-between border-b border-border p-4">
                  <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-foreground">
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
                  <Badge variant="outline" className="border-primary/40 px-2 text-[10px] uppercase tracking-widest text-primary">
                    {product.category}
                  </Badge>
                )}
                {product.sku && (
                  <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                    SKU: {product.sku}
                  </span>
                )}
              </div>

              <h1 className="font-display text-4xl font-black uppercase leading-[0.95] tracking-tight text-foreground lg:text-5xl">
                {product.name}
              </h1>

              <div className="flex items-center gap-3">
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-3xl font-black text-primary">
                    {formatBDT(displayUnitPrice)}
                  </span>
                  {wasPrice && (
                    <span className="text-xl text-muted-foreground line-through decoration-primary/50">
                      {formatBDT(wasPrice)}
                    </span>
                  )}
                </div>
                {discountValue && (
                  <Badge className="border-none bg-gradient-red px-2 py-0.5 text-xs font-bold text-primary-foreground">
                    -{discountValue}% OFF
                  </Badge>
                )}
              </div>
            </div>

            <Separator className="mb-8" />

            {product.description && (
              <div className="mb-8">
                <p className="border-l-2 border-primary/50 pl-4 text-base leading-relaxed text-muted-foreground">
                  {product.description}
                </p>
              </div>
            )}

            <div className="mb-10 space-y-8">
              {product.colors.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Select Color
                    </span>
                    {color && (
                      <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                        {color.name}
                        {color.priceDelta > 0 && (
                          <span className="ml-1 text-primary">+৳{color.priceDelta}</span>
                        )}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {product.colors.map((c) => {
                      const selected = color?.id === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => selectColor(c)}
                          aria-pressed={selected}
                          title={c.name}
                          className={cn(
                            "group flex items-center gap-2.5 rounded-full border py-1.5 pl-1.5 pr-4 transition-colors",
                            selected
                              ? "border-primary/60 bg-primary/5"
                              : "border-border bg-card hover:border-foreground/25",
                          )}
                        >
                          <span
                            className={cn(
                              "relative flex size-8 items-center justify-center rounded-full ring-1 ring-inset ring-foreground/10",
                              selected && "ring-2 ring-primary/70",
                            )}
                            style={{ backgroundColor: c.swatch }}
                          >
                            {selected && (
                              <Check
                                className="size-4 text-primary-foreground drop-shadow"
                                strokeWidth={3}
                              />
                            )}
                          </span>
                          <span
                            className={cn(
                              "text-xs font-medium uppercase tracking-wide",
                              selected ? "text-foreground" : "text-muted-foreground",
                            )}
                          >
                            {c.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <span className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Quantity
                </span>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 items-center rounded-lg border border-border bg-card p-1">
                    <button
                      onClick={() => setQty(Math.max(1, qty - 1))}
                      aria-label="Decrease quantity"
                      className="flex size-10 items-center justify-center rounded text-foreground transition-colors hover:bg-muted"
                    >
                      -
                    </button>
                    <span className="w-12 text-center font-display text-lg font-bold text-foreground">
                      {qty}
                    </span>
                    <button
                      onClick={() => setQty(Math.min(10, qty + 1))}
                      aria-label="Increase quantity"
                      className="flex size-10 items-center justify-center rounded text-foreground transition-colors hover:bg-muted"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex-1">
                    <div className={cn(
                      "flex items-center gap-2 rounded-lg border px-4 py-3 text-xs font-semibold uppercase tracking-widest",
                      isActuallyInStock
                        ? "border-emerald-600/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/25 dark:text-emerald-400"
                        : "border-destructive/30 bg-destructive/10 text-destructive"
                    )}>
                      <Package className="size-4" />
                      {isActuallyInStock ? "In Stock & Ready to Ship" : "Currently Out of Stock"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          </div>
        </div>

        <div className="mt-16 space-y-10">
          {product.bikeModels && product.bikeModels.length > 0 && (
            <section className="space-y-5">
              <h2 className="flex items-center gap-3 font-display text-2xl font-bold uppercase tracking-tight text-foreground">
                <Bike className="size-6 text-primary" />
                Bike Fitment
              </h2>
              <div className="flex flex-wrap gap-2">
                {product.bikeModels.map((bike: any) => (
                  <Badge
                    key={bike.id}
                    variant="outline"
                    className="border-border bg-card px-4 py-1.5 font-medium text-foreground"
                  >
                    {bike.brand} {bike.model}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          <section className="space-y-5">
            <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-foreground">
              Product Description
            </h2>
            <SafeHtml
              className="prose max-w-none text-base leading-relaxed text-foreground/85 dark:prose-invert prose-headings:text-foreground prose-strong:text-foreground prose-a:text-primary"
              html={product.description || "No description available."}
            />
          </section>
        </div>
      </main>

      {!manualProduct && <Footer />}
      {!manualProduct && <WhatsAppFloating />}
    </div>
  );
}
