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
import { toast } from "sonner";

import { SafeImage } from "@/components/SafeImage";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { discountPercent, formatBDT } from "@/lib/format";
import { basePrice, type StorefrontProduct } from "@/lib/storefront.shared";

export function ProductCard({ product }: { product: StorefrontProduct }) {
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const activePrice = basePrice(product);
  const discount = discountPercent(product.price, product.offerPrice ?? undefined);
  const hasColors = product.colors.length > 0;

  const handleAdd = () => {
    if (busy || !product.inStock) return;
    // Products with colour variations must be configured on the detail page.
    if (hasColors) {
      void navigate({ to: "/products/$slug", params: { slug: product.slug } });
      return;
    }
    setBusy(true);
    addItem({ product });
    toast.success("Added to cart", { description: product.name });
    window.setTimeout(() => setBusy(false), 600);
  };

  const handleOrderNow = () => {
    if (!product.inStock) return;
    if (hasColors) {
      void navigate({ to: "/products/$slug", params: { slug: product.slug } });
      return;
    }
    addItem({ product });
    void navigate({ to: "/checkout" });
  };

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card">
      <Link
        to="/products/$slug"
        params={{ slug: product.slug }}
        className="relative block"
        aria-label={`View ${product.name}`}
      >
        <SafeImage
          src={product.image ?? ""}
          alt={product.name}
          width={800}
          height={800}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          containerClassName="aspect-square w-full"
        />
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {discount !== null && (
            <span className="rounded bg-gradient-red px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary-foreground sm:text-[10px]">
              -{discount}% Off
            </span>
          )}
          {product.badgeText ? (
            <span className="rounded bg-onyx px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-onyx-foreground sm:text-[10px]">
              {product.badgeText}
            </span>
          ) : null}
          {product.bestDeal && (
            <span className="rounded bg-onyx px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-onyx-foreground sm:text-[10px]">
              Best Deal
            </span>
          )}
          {product.newArrival && (
            <span className="rounded border border-border bg-background px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-foreground sm:text-[10px]">
              New
            </span>
          )}
        </div>
        {!product.inStock && (
          <span className="absolute right-2 top-2 rounded bg-secondary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-secondary-foreground sm:text-[10px]">
            Out of Stock
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-3">
        <h3 className="font-display text-base font-bold uppercase leading-tight tracking-wide sm:text-base">
          <Link to="/products/$slug" params={{ slug: product.slug }} className="hover:text-primary">
            {product.name}
          </Link>
        </h3>
        {product.description && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {product.description}
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-baseline gap-2">
          <span className="font-display text-lg font-bold text-primary">
            {formatBDT(activePrice)}
          </span>
          {discount !== null && (
            <span className="text-sm text-muted-foreground line-through">
              {formatBDT(product.price)}
            </span>
          )}
        </div>

        {/* Colour indicator — full selection happens on the detail page. */}
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
              {hasColors ? "Choose Color" : "Add to Cart"}
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
              Order Now
            </span>
          </Button>
        </div>
      </div>
    </article>
  );
}
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
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
