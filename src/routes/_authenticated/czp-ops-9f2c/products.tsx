// ============================================================
// PRODUCTS (catalog reference)
// Purpose: Lets staff look up what they are selling — name, image,
//          category, price, offer price and stock flag — while
//          taking an order.
// Status: COMPLETED (read-only)
// Future: Editing products requires a products table in the
//          database; the catalog is currently code-managed.
// ============================================================
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { adminHead } from "@/components/admin/AdminShell";
import { SafeImage } from "@/components/SafeImage";
import { Input } from "@/components/ui/input";
import { getProducts } from "@/data/catalog";
import { discountPercent, formatBDT } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/czp-ops-9f2c/products")({
  head: () => adminHead("Products — CZP Ops"),
  component: AdminProducts,
});

function AdminProducts() {
  const products = useMemo(() => getProducts(), []);
  const [search, setSearch] = useState("");

  const term = search.trim().toLowerCase();
  const visible = products.filter(
    (product) =>
      !term ||
      product.name.toLowerCase().includes(term) ||
      product.category.toLowerCase().includes(term),
  );

  return (
    <section className="mx-auto max-w-6xl">
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide">Products</h1>
      <p className="text-xs text-muted-foreground">
        {products.length} product(s) in the live catalog · reference view for order taking
      </p>

      <Input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search by name or category"
        className="mt-4 h-11 max-w-sm"
      />

      <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card shadow-card">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-border bg-secondary text-left text-xs uppercase tracking-wider">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">Category</th>
              <th className="p-3 text-right">Price</th>
              <th className="p-3 text-right">Offer</th>
              <th className="p-3">Stock</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  No products match that search.
                </td>
              </tr>
            )}
            {visible.map((product) => {
              const off = discountPercent(product.price, product.offerPrice);
              return (
                <tr key={product.id} className="border-b border-border last:border-0">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 overflow-hidden rounded-md border border-border">
                        <SafeImage src={product.image} alt={product.name} width={96} height={96} className="h-full w-full object-cover" />
                      </div>
                      <span className="font-semibold">{product.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground">{product.category}</td>
                  <td className="p-3 text-right">{formatBDT(product.price)}</td>
                  <td className="p-3 text-right">
                    {product.offerPrice ? (
                      <span className="font-semibold text-primary">
                        {formatBDT(product.offerPrice)}
                        {off ? <span className="ml-1 text-xs">(−{off}%)</span> : null}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${
                        product.inStock
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {product.inStock ? "In stock" : "Out of stock"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        This catalog is managed in the site code. Ask for a product database if you want to add,
        edit or price products from here.
      </p>
    </section>
  );
}
