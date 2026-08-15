// ============================================================
// PRODUCT DETAIL PAGE
// Purpose: Displays complete product information, image gallery and
//          colour-variation selection before adding to the cart.
// Status: COMPLETED
// Security: Public read of active products only; the price shown is
//           recalculated server-side when the order is placed.
// ============================================================
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { Check, Minus, Plus } from "lucide-react";
import { useMemo, useState, useEffect, lazy, Suspense } from "react";
import { toast } from "sonner";

import { SafeImage } from "@/components/SafeImage";
import { ProductGallery } from "@/components/product/ProductGallery";
import { RotateCw } from "lucide-react";
import { ProductVideo } from "@/components/product/ProductVideo";

// 360 viewer is large, load lazily
const Product360Viewer = lazy(() =>
  import("@/components/product/Product360Viewer").then((m) => ({ default: m.Product360Viewer })),
);

import { Button } from "@/components/ui/button";
import { site } from "@/data/site";
import { useCart } from "@/lib/cart";
import { formatBDT } from "@/lib/format";
import { getStorefrontProduct } from "@/lib/storefront.functions";
import {
  basePrice,
  colorPrice,
  compareAtPrice,
  type StorefrontProduct,
} from "@/lib/storefront.shared";
import { cn } from "@/lib/utils";

const productQuery = (slug: string) =>
  queryOptions({
    queryKey: ["storefront-product", slug],
    queryFn: () => getStorefrontProduct({ data: { slug } }),
  });

export const Route = createFileRoute("/products/$slug")({
  loader: async ({ params, context }) => {
    const product = await context.queryClient.ensureQueryData(productQuery(params.slug));
    if (!product) throw notFound();

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      image: product.gallery,
      description: product.description,
      brand: {
        "@type": "Brand",
        name: "Customz Paradise BD",
      },
      offers: {
        "@type": "Offer",
        url: `${site.url}/products/${product.slug}`,
        priceCurrency: "BDT",
        price: product.offerPrice || product.price,
        availability: product.inStock
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      },
    };

    return { name: product.name, description: product.description, jsonLd };
  },

  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return {
        meta: [{ title: `Product — ${site.name}` }, { name: "robots", content: "noindex" }],
      };
    }
    const title = `${loaderData.name} — ${site.name}`;
    const description =
      loaderData.description ??
      `Buy ${loaderData.name} from Customz Paradise BD with nationwide delivery in Bangladesh.`;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
        { property: "og:url", content: `/products/${params.slug}` },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: `/products/${params.slug}` }],
      scripts: [
        {
          type: "application/ld+json",
          children: loaderData.jsonLd ? JSON.stringify(loaderData.jsonLd) : undefined,
        },
      ],
    };
  },

  component: ProductDetailPage,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-xl px-4 py-20 text-center" role="alert">
      <h1 className="font-display text-2xl font-bold uppercase">Product unavailable</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      <Button variant="red" size="touch" className="mt-6" asChild>
        <Link to="/shop">Back to shop</Link>
      </Button>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="font-display text-2xl font-bold uppercase">Product not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This product is no longer available. Browse the full catalogue instead.
      </p>
      <Button variant="red" size="touch" className="mt-6" asChild>
        <Link to="/shop">All products</Link>
      </Button>
    </div>
  ),
});

function ProductDetailPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(productQuery(slug));
  if (!data) return null;
  return <ProductDetail product={data} />;
}

export function ProductDetail({ product }: { product: StorefrontProduct }) {
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [colorId, setColorId] = useState<string | null>(product.colors[0]?.id ?? null);
  const [qty, setQty] = useState(1);
  const [show360, setShow360] = useState(false);

  const color = useMemo(
    () => product.colors.find((entry) => entry.id === colorId) ?? null,
    [product.colors, colorId],
  );

  // PRODUCT COLOR VARIATIONS — price updates with the selected colour.
  const unitPrice = colorPrice(product, color);
  const wasPrice = compareAtPrice(product, color);
  const gallery = product.gallery.length ? product.gallery : [""];

  const add = (thenCheckout: boolean) => {
    if (!product.inStock) return;
    addItem({ product, color, qty });
    if (thenCheckout) {
      void navigate({ to: "/checkout" });
      return;
    }
    toast.success("Added to cart", {
      description: color ? `${product.name} — ${color.name}` : product.name,
    });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
        <Link to="/shop" className="hover:text-primary">
          Shop
        </Link>
        <span className="px-1.5">/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="mt-4 grid gap-6 lg:grid-cols-2 lg:gap-10">
        {/* Gallery Section */}
        <ProductGallery
          images={gallery}
          productName={product.name}
          activeColorImage={color?.image ?? null}
        />

        {product.has360View && product.product360Images.length > 0 ? (
          <div className="mt-4 flex justify-center lg:hidden">
            <Button
              variant="outline"
              size="sm"
              className="group flex items-center gap-2 rounded-full border-primary/30 bg-primary/5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary hover:border-primary hover:bg-primary/10"
              onClick={() => setShow360(true)}
            >
              <RotateCw className="size-4 transition-transform group-hover:rotate-180" />
              Interactive 360° View
            </Button>
          </div>
        ) : null}

        {show360 && (
          <Suspense fallback={null}>
            <Product360Viewer
              images={product.product360Images}
              productName={product.name}
              onClose={() => setShow360(false)}
            />
          </Suspense>
        )}

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {product.newArrival && <Badge tone="outline">New</Badge>}
            {product.bestDeal && <Badge tone="dark">Best Deal</Badge>}
            {product.featured && <Badge tone="dark">Top Seller</Badge>}
            {product.badgeText ? <Badge tone="red">{product.badgeText}</Badge> : null}
          </div>

          <h1 className="mt-2 font-display text-2xl font-bold uppercase leading-tight tracking-tight sm:text-3xl">
            {product.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-baseline gap-3">
            <span className="font-display text-3xl font-bold text-primary">
              {formatBDT(unitPrice)}
            </span>
            {wasPrice ? (
              <span className="text-base text-muted-foreground line-through">
                {formatBDT(wasPrice)}
              </span>
            ) : null}
            {wasPrice ? (
              <span className="rounded bg-gradient-red px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary-foreground">
                Save {formatBDT(wasPrice - unitPrice)}
              </span>
            ) : null}
          </div>

          <p className="mt-2 text-sm">
            {product.inStock ? (
              <span className="font-semibold text-primary">In stock</span>
            ) : (
              <span className="font-semibold text-muted-foreground">Out of stock</span>
            )}
            {product.inStock && product.stockQty <= 5 ? (
              <span className="text-muted-foreground"> — only {product.stockQty} left</span>
            ) : null}
          </p>

          {product.description ? (
            <p className="mt-4 text-sm text-muted-foreground">{product.description}</p>
          ) : null}

          {product.has360View && product.product360Images.length > 0 ? (
            <div className="mt-6 hidden lg:block">
              <Button
                variant="outline"
                className="group flex items-center gap-3 rounded-xl border-primary/30 bg-primary/5 px-6 py-3 text-sm font-bold uppercase tracking-wider text-primary transition-all hover:border-primary hover:bg-primary/10 hover:shadow-lg hover:shadow-primary/10"
                onClick={() => setShow360(true)}
              >
                <div className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:rotate-180">
                  <RotateCw className="size-5" />
                </div>
                <div>
                  <div className="text-left leading-none">Interactive</div>
                  <div className="mt-1 text-left text-[10px] opacity-70">
                    Experience 360° Rotation
                  </div>
                </div>
              </Button>
            </div>
          ) : null}

          {/* Colour chips: visible name + swatch, large touch targets. */}
          {product.colors.length ? (
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Color: <span className="text-foreground">{color?.name ?? "Select"}</span>
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.colors.map((entry) => {
                  const selected = entry.id === colorId;
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => setColorId(entry.id)}
                      aria-pressed={selected}
                      className={cn(
                        "flex min-h-11 items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition",
                        selected
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-card text-muted-foreground hover:border-primary/50",
                      )}
                    >
                      <span
                        className="size-5 shrink-0 rounded-full border border-black/40 dark:border-white/40 ring-1 ring-black/10 dark:ring-white/10"
                        style={{ backgroundColor: entry.swatch }}
                        aria-hidden="true"
                      />
                      <span className="truncate">{entry.name}</span>
                      {selected ? (
                        <Check className="size-4 text-primary" aria-hidden="true" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Quantity + cart actions */}
          <div className="mt-6 flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Qty
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="size-11"
                aria-label="Decrease quantity"
                onClick={() => setQty((current) => Math.max(1, current - 1))}
              >
                <Minus />
              </Button>
              <span className="w-8 text-center font-display text-lg font-bold">{qty}</span>
              <Button
                variant="outline"
                size="icon"
                className="size-11"
                aria-label="Increase quantity"
                onClick={() => setQty((current) => Math.min(20, current + 1))}
              >
                <Plus />
              </Button>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Button
              variant="steel"
              size="touch"
              disabled={!product.inStock}
              onClick={() => add(false)}
            >
              Add to Cart
            </Button>
            <Button
              variant="red"
              size="touch"
              disabled={!product.inStock}
              onClick={() => add(true)}
            >
              Buy Now
            </Button>
          </div>

          {product.details ? (
            <section className="mt-8 rounded-xl border border-border bg-card p-4">
              <h2 className="font-display text-lg font-bold uppercase tracking-wide">
                Product Details
              </h2>
              <div className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                {product.details}
              </div>

              {product.videoEnabled && product.videoUrl && (
                <ProductVideo 
                  platform={product.videoPlatform as any}
                  url={product.videoUrl}
                  productName={product.name}
                />
              )}
            </section>
          ) : (
            product.videoEnabled && product.videoUrl && (
              <ProductVideo 
                platform={product.videoPlatform as any}
                url={product.videoUrl}
                productName={product.name}
              />
            )
          )}

          {product.bikeCompatibility.length || product.universal ? (
            <section className="mt-4 rounded-xl border border-border bg-card p-4">
              <h2 className="font-display text-lg font-bold uppercase tracking-wide">Fitment</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {product.universal
                  ? "Universal fit — suits most motorcycles."
                  : product.bikeCompatibility.join(", ")}
              </p>
            </section>
          ) : null}

          <p className="mt-4 text-xs text-muted-foreground">
            Need help choosing? Call {site.phoneDisplay}.
          </p>
        </div>
      </div>
    </div>
  );
}

function Badge({
  tone,
  children,
}: {
  tone: "red" | "dark" | "outline";
  children: React.ReactNode;
}) {
  const styles = {
    red: "bg-gradient-red text-primary-foreground",
    dark: "bg-onyx text-onyx-foreground",
    outline: "border border-border bg-background text-foreground",
  } as const;
  return (
    <span
      className={cn(
        "rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        styles[tone],
      )}
    >
      {children}
    </span>
  );
}
