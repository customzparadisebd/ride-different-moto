import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { SafeImage } from "@/components/SafeImage";
import { Button } from "@/components/ui/button";
import type { Product } from "@/data/types";
import { useCart } from "@/lib/cart";
import { discountPercent, formatBDT } from "@/lib/format";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const discount = discountPercent(product.price, product.offerPrice);
  const activePrice = product.offerPrice ?? product.price;

  const handleAdd = () => {
    if (busy || !product.inStock) return;
    setBusy(true);
    addItem(product);
    toast.success("Added to cart", { description: product.name });
    window.setTimeout(() => setBusy(false), 600);
  };

  const handleOrderNow = () => {
    if (!product.inStock) return;
    addItem(product);
    void navigate({ to: "/checkout" });
  };

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card">
      <div className="relative">
        <SafeImage
          src={product.image}
          alt={product.alt}
          width={800}
          height={800}
          sizes="(max-width: 640px) 50vw, 25vw"
          containerClassName="aspect-square w-full"
        />
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {discount !== null && (
            <span className="rounded bg-gradient-red px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
              -{discount}% Off
            </span>
          )}
          {product.bestDeal && (
            <span className="rounded bg-onyx px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-onyx-foreground">
              Best Deal
            </span>
          )}
          {product.newArrival && (
            <span className="rounded border border-border bg-background px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-foreground">
              New
            </span>
          )}
        </div>
        {!product.inStock && (
          <span className="absolute right-2 top-2 rounded bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
            Out of Stock
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <h3 className="font-display text-base font-bold uppercase leading-tight tracking-wide">
          {product.name}
        </h3>
        {product.description && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{product.description}</p>
        )}

        <div className="mt-2 flex flex-wrap items-baseline gap-2">
          <span className="font-display text-lg font-bold text-primary">
            {formatBDT(activePrice)}
          </span>
          {product.offerPrice && (
            <span className="text-sm text-muted-foreground line-through">
              {formatBDT(product.price)}
            </span>
          )}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 pt-1">
          <Button
            variant="steel"
            size="sm"
            onClick={handleAdd}
            disabled={busy || !product.inStock}
            className="min-w-0"
          >
            <span className="truncate">Add to Cart</span>
          </Button>
          <Button
            variant="red"
            size="sm"
            onClick={handleOrderNow}
            disabled={!product.inStock}
            className="min-w-0"
          >
            <span className="truncate">Order Now</span>
          </Button>
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
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