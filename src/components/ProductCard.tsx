// ============================================================
// PRODUCT CARD / GRID
// Purpose: Mobile-first product card for the database-backed
//          catalogue — image, name, price, offer badge, colour
//          indicator and Add to Cart. The card links to the
//          dedicated product detail page.
// Status: COMPLETED
// Security: Presentation only; order prices come from the server.
// ============================================================
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { RotateCw, Flame } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { SafeImage } from "@/components/SafeImage";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { discountPercent, formatBDT } from "@/lib/format";
import { useLanguage } from "@/lib/i18n";
import { basePrice, type StorefrontProduct } from "@/lib/storefront.shared";
import { getFlashSales } from "@/lib/flash.functions";
import { getActiveSaleForProduct, calculateFlashPrice } from "@/lib/flash-utils";
import { CountdownTimer } from "@/components/CountdownTimer";

export function ProductCard({ product }: { product: StorefrontProduct }) {
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const { t } = useLanguage();
  
  const fetchFlashSales = useServerFn(getFlashSales);
  const { data: sales = [] } = useQuery({
    queryKey: ["flash-sales"],
    queryFn: () => fetchFlashSales(),
    staleTime: 60000,
  });

  const activeSale = getActiveSaleForProduct(product.id, sales);
  const flashPrice = activeSale ? calculateFlashPrice(product.price, activeSale) : null;
  const isFlashActive = flashPrice !== null;
  
  const activePrice = isFlashActive ? flashPrice : basePrice(product);
  const discount = isFlashActive 
    ? (activeSale.discountType === "percentage" ? activeSale.discountValue : Math.round((1 - flashPrice / product.price) * 100))
    : discountPercent(product.price, product.offerPrice ?? undefined);

  const hasColors = product.colors.length > 0;

  const handleAdd = () => {
    if (busy || !product.inStock) return;
    if (hasColors) {
      void navigate({ to: "/products/", params: { slug: product.slug } });
      return;
    }
    setBusy(true);
    addItem({ product, flashSaleId: activeSale?.id });
    toast.success("Added to cart", { description: product.name });
    window.setTimeout(() => setBusy(false), 600);
  };

  const handleOrderNow = () => {
    if (!product.inStock) return;
    if (hasColors) {
      void navigate({ to: "/products/", params: { slug: product.slug } });
      return;
    }
    addItem({ product, flashSaleId: activeSale?.id });
    void navigate({ to: "/checkout" });
  };

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card">
      <Link
        to="/products/"
        params={{ slug: product.slug }}
        className="relative block"
        aria-label={`View ${product.name}`}
      >
        <SafeImage
          src={product.image ?? ""}
          alt={product.name}
          width={600}
          height={600}
          aspectRatio="1/1"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          containerClassName="aspect-square w-full bg-secondary/5"
          className="transition-transform duration-700 hover:scale-105 object-contain p-2"
        />
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {isFlashActive && (
             <span className="flex items-center gap-1 rounded bg-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary-foreground sm:text-[10px] animate-pulse">
               <Flame className="size-2.5 sm:size-3" />
               Flash Sale
             </span>
          )}
          {discount !== null && (
            <span className="rounded bg-gradient-red px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary-foreground sm:text-[10px]">
              -{discount}% Off
            </span>
          )}
          {product.badgeText && !isFlashActive ? (
            <span className="rounded bg-onyx px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-onyx-foreground sm:text-[10px]">
              {product.badgeText}
            </span>
          ) : null}
          {product.bestDeal && !isFlashActive && (
            <span className="rounded bg-onyx px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-onyx-foreground sm:text-[10px]">
              Best Deal
            </span>
          )}
        </div>
        {!product.inStock && (
          <span className="absolute right-2 top-2 rounded bg-secondary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-secondary-foreground sm:text-[10px]">
            Out of Stock
          </span>
        )}

        {isFlashActive && (activeSale.endDate || activeSale.endTime) && (
          <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm p-1.5 flex justify-center border-t border-white/10">
            <CountdownTimer 
              endDate={activeSale.endDate} 
              endTime={activeSale.endTime} 
              className="text-[10px] sm:text-xs"
            />
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-3">
        <h3 className="font-display text-base font-bold uppercase leading-tight tracking-wide sm:text-base">
          <Link to="/products/" params={{ slug: product.slug }} className="hover:text-primary">
            {product.name}
          </Link>
        </h3>
        
        <div className="mt-2 flex flex-wrap items-baseline gap-2">
          <span className={cn("font-display text-lg font-bold", isFlashActive ? "text-primary" : "text-primary")}>
            {formatBDT(activePrice)}
          </span>
          {(discount !== null || isFlashActive) && (
            <span className="text-sm text-muted-foreground line-through">
              {formatBDT(product.price)}
            </span>
          )}
        </div>

        {/* Colour indicator */}
        {hasColors ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              {product.colors.slice(0, 4).map((color) => (
                <span
                  key={color.id}
                  title={color.name}
                  aria-label={color.name}
                  className="size-5 rounded-full border border-black/40 ring-1 ring-black/10 dark:border-white/40 dark:ring-white/10 sm:size-4"
                  style={{ backgroundColor: color.swatch }}
                />
              ))}
            </div>
            <span className="text-[11px] font-medium text-muted-foreground">
              {product.colors.length} color{product.colors.length > 1 ? "s" : ""}
            </span>
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button
            variant="steel"
            size="sm"
            onClick={handleAdd}
            disabled={busy || !product.inStock}
            className="h-9 w-full min-w-0 sm:h-8"
          >
            <span className="whitespace-nowrap px-2 text-xs font-bold uppercase tracking-wider sm:text-[10px]">
              {hasColors ? t("common.chooseColor") : t("nav.cart")}
            </span>
          </Button>
          <Button
            variant="red"
            size="sm"
            onClick={handleOrderNow}
            disabled={!product.inStock}
            className="h-9 w-full min-w-0 sm:h-8"
          >
            <span className="whitespace-nowrap px-2 text-xs font-bold uppercase tracking-wider sm:text-[10px]">
              {t("common.orderNow")}
            </span>
          </Button>
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products }: { products: StorefrontProduct[] }) {
  if (!products.length) {
    return (
      <p className="rounded-lg border border-border bg-secondary px-4 py-8 text-center text-sm text-muted-foreground">
        No products available in this section yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
