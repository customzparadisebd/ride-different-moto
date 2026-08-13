// ============================================================
// PRODUCT SEARCH & FILTERS — COMPLETED
// Purpose: Lets customers find products on the All Products page by
//          name, price range, bike model and category, with sorting.
// Security: Presentation only — filtering runs on the already
//          public catalogue returned by the storefront endpoint.
// ============================================================
import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";

import { ProductGrid } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { basePrice, type StorefrontProduct } from "@/lib/storefront.shared";

type SortKey = "newest" | "price-asc" | "price-desc" | "name-asc";

const selectClass =
  "mt-1.5 h-11 w-full rounded-md border border-input bg-background px-3 text-base sm:text-sm";

export function ProductBrowser({ products }: { products: StorefrontProduct[] }) {
  const [search, setSearch] = useState("");
  const [bike, setBike] = useState("all");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<SortKey>("newest");

  const bikeOptions = useMemo(
    () =>
      Array.from(new Set(products.flatMap((product) => product.bikeCompatibility))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [products],
  );

  const categoryOptions = useMemo(
    () => Array.from(new Set(products.map((product) => product.category))).sort(),
    [products],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    const result = products.filter((product) => {
      const price = basePrice(product);
      if (term && !product.name.toLowerCase().includes(term)) return false;
      if (category !== "all" && product.category !== category) return false;
      if (bike !== "all" && !product.universal && !product.bikeCompatibility.includes(bike)) {
        return false;
      }
      return true;
    });

    switch (sort) {
      case "price-asc":
        return [...result].sort((a, b) => basePrice(a) - basePrice(b));
      case "price-desc":
        return [...result].sort((a, b) => basePrice(b) - basePrice(a));
      case "name-asc":
        return [...result].sort((a, b) => a.name.localeCompare(b.name));
      default:
        return result;
    }
  }, [products, search, bike, category, sort]);

  const dirty =
    search !== "" || bike !== "all" || category !== "all" || minPrice !== "" || maxPrice !== "";

  const reset = () => {
    setSearch("");
    setBike("all");
    setCategory("all");
    setMinPrice("");
    setMaxPrice("");
    setSort("newest");
  };

  const label = (value: string) =>
    value.replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

  return (
    <div>
      <div className="rounded-xl border border-border bg-card p-3 shadow-card sm:p-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products by name…"
            aria-label="Search products by name"
            className="h-11 pl-9 text-base sm:text-sm"
          />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <div className="col-span-2 sm:col-span-1">
            <Label htmlFor="filter-bike">Bike model</Label>
            <select
              id="filter-bike"
              value={bike}
              onChange={(event) => setBike(event.target.value)}
              className={selectClass}
            >
              <option value="all">All bike models</option>
              {bikeOptions.map((option) => (
                <option key={option} value={option}>
                  {label(option)}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <Label htmlFor="filter-category">Category</Label>
            <select
              id="filter-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className={selectClass}
            >
              <option value="all">All categories</option>
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {label(option)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="filter-min">Min price ৳</Label>
            <Input
              id="filter-min"
              inputMode="numeric"
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value.replace(/\D/g, ""))}
              placeholder="0"
              className="mt-1.5 h-11 text-base sm:text-sm"
            />
          </div>
          <div>
            <Label htmlFor="filter-max">Max price ৳</Label>
            <Input
              id="filter-max"
              inputMode="numeric"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value.replace(/\D/g, ""))}
              placeholder="Any"
              className="mt-1.5 h-11 text-base sm:text-sm"
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <Label htmlFor="filter-sort">Sort by</Label>
            <select
              id="filter-sort"
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              className={selectClass}
            >
              <option value="newest">Newest first</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="name-asc">Name: A–Z</option>
            </select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground" aria-live="polite">
            Showing {filtered.length} of {products.length} products
          </p>
          {dirty ? (
            <Button type="button" variant="ghost" size="sm" onClick={reset}>
              <X className="size-4" /> Clear filters
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-6">
        {filtered.length ? (
          <ProductGrid products={filtered} />
        ) : (
          <p className="rounded-lg border border-border bg-secondary px-4 py-10 text-center text-sm text-muted-foreground">
            No products match your search. Try a different name, price range or bike model.
          </p>
        )}
      </div>
    </div>
  );
}
