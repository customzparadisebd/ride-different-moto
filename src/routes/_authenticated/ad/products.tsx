// ============================================================
// PRODUCT MANAGEMENT SCREEN
// Purpose: Full product catalog in the database — search/filter,
//          create, edit, quick stock change, activate/deactivate,
//          merchandising flags and send-to-Recycle-Bin.
// Status: COMPLETED
// Security: Editing requires the products.manage permission; all
//          writes are re-checked and audited server-side.
// Future: Image upload (currently an image URL) once storage is on.
// ============================================================
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import {
  emptyProductForm,
  ProductForm,
  type ProductFormValue,
  toProductInput,
} from "@/components/admin/products/ProductForm";
import { ProductDetail } from "@/routes/products.$slug.tsx";
import { ProductColorsPanel } from "@/components/admin/products/ProductColorsPanel";
import { Product360Panel } from "@/components/admin/products/Product360Panel";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Image as ImageIcon } from "lucide-react";
import { ProductImageUpload } from "@/components/admin/products/ProductImageUpload";
import { X, CheckSquare, Square, Trash2, Tag, Eye, EyeOff, LayoutPanelLeft } from "lucide-react";
import {
  bulkUpdateProducts,
  bulkRecycleProducts,
  bulkUpdateProductImages,
  listProductColors,
  listProduct360Images,
} from "@/lib/products.functions";
import { SafeImage } from "@/components/SafeImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatBDT } from "@/lib/format";
import { getMyAccess } from "@/lib/orders.functions";
import {
  createProduct,
  listProducts,
  setProductStock,
  softDeleteProduct,
  toggleProductFlag,
  updateProduct,
} from "@/lib/products.functions";
import {
  categoryLabel,
  PRODUCT_CATEGORIES,
  STOCK_FILTERS,
  stockStatus,
} from "@/lib/products.shared";
import { getStoreSettings } from "@/lib/store-settings.functions";

export const Route = createFileRoute("/_authenticated/ad/products")({
  head: () => ({
    meta: [
      { title: "Products — CZP Ops" },
      { property: "og:title", content: "Products — CZP Ops" },
      { name: "description", content: "Customz Paradise BD Admin Panel" },
    ],
  }),
  component: AdminProducts,
});

type ProductRow = {
  id: string;
  name: string;
  sku: string;
  slug: string;
  image_url: string | null;
  category: string;
  bike_compatibility: string[];
  is_universal: boolean;
  description: string | null;
  details: string | null;
  images: unknown;
  badge_enabled: boolean;
  badge_text: string | null;
  price: number | string;
  offer_price: number | string | null;
  stock_qty: number;
  is_best_deal: boolean;
  is_featured: boolean;
  is_new_arrival: boolean;
  is_active: boolean;
  has_360_view: boolean;
  video_enabled: boolean;
  video_platform: string | null;
  video_url: string | null;
  out_of_stock_toggle: boolean;
};

function toFormValue(row: ProductRow): ProductFormValue {
  return {
    name: row.name,
    sku: row.sku,
    slug: row.slug,
    imageUrl: row.image_url ?? "",
    category: row.category,
    bikeCompatibility: (row.bike_compatibility ?? []).join(", "),
    isUniversal: row.is_universal,
    has360View: row.has_360_view ?? false,
    description: row.description ?? "",
    details: row.details ?? "",
    images: Array.isArray(row.images) ? (row.images as string[]).join("\n") : "",
    badgeEnabled: row.badge_enabled ?? false,
    badgeText: row.badge_text ?? "",
    price: String(Number(row.price)),
    offerPrice: row.offer_price === null ? "" : String(Number(row.offer_price)),
    stockQty: String(row.stock_qty),
    isBestDeal: row.is_best_deal,
    isFeatured: row.is_featured,
    isNewArrival: row.is_new_arrival,
    isActive: row.is_active,
    videoEnabled: row.video_enabled ?? false,
    videoPlatform: row.video_platform ?? "youtube",
    videoUrl: row.video_url ?? "",
    outOfStockToggle: row.out_of_stock_toggle ?? false,
  };
}

function AdminProducts() {
  const queryClient = useQueryClient();
  const fetchProducts = useServerFn(listProducts);
  const fetchAccess = useServerFn(getMyAccess);
  const fetchSettings = useServerFn(getStoreSettings);
  const create = useServerFn(createProduct);
  const update = useServerFn(updateProduct);
  const stock = useServerFn(setProductStock);
  const flag = useServerFn(toggleProductFlag);
  const recycle = useServerFn(softDeleteProduct);
  const bulkUpdate = useServerFn(bulkUpdateProducts);
  const bulkRecycle = useServerFn(bulkRecycleProducts);
  const bulkImages = useServerFn(bulkUpdateProductImages);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [stockFilter, setStockFilter] = useState<(typeof STOCK_FILTERS)[number]>("all");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [previewing, setPreviewing] = useState<ProductFormValue | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // PRODUCT COLOR MANAGEMENT — panel opens for one product at a time.
  const [colorsFor, setColorsFor] = useState<ProductRow | null>(null);
  // PRODUCT 360 MANAGEMENT
  const [view360For, setView360For] = useState<ProductRow | null>(null);

  const accessQuery = useQuery({ queryKey: ["admin-access"], queryFn: () => fetchAccess({}) });
  const canManage = accessQuery.data?.permissions.includes("products.manage") ?? false;
  const settingsQuery = useQuery({ queryKey: ["store-settings"], queryFn: () => fetchSettings() });
  const lowThreshold = settingsQuery.data?.lowStockThreshold ?? 3;

  const listQuery = useQuery({
    queryKey: ["admin-products", search, category, stockFilter, page],
    queryFn: async () => {
      try {
        return await fetchProducts({
          data: { search, category, stock: stockFilter, page, pageSize: 25 } as never,
        });
      } catch (err: any) {
        toast.error("Invalid pagination or filter parameters", {
          description: err.message || "Please check your search filters.",
        });
        throw err;
      }
    },
    placeholderData: (previous) => previous,
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-recycle-bin"] });
  };
  const onError = (error: Error) => toast.error(error.message || "That action failed.");

  const createMutation = useMutation({
    mutationFn: create,
    onSuccess: () => {
      toast.success("Product created");
      setCreating(false);
      refresh();
    },
    onError,
  });
  const updateMutation = useMutation({
    mutationFn: update,
    onSuccess: () => {
      toast.success("Product saved");
      setEditing(null);
      refresh();
    },
    onError,
  });
  const stockMutation = useMutation({
    mutationFn: stock,
    onSuccess: () => {
      toast.success("Stock updated");
      refresh();
    },
    onError,
  });
  const flagMutation = useMutation({ mutationFn: flag, onSuccess: refresh, onError });
  const recycleMutation = useMutation({
    mutationFn: recycle,
    onSuccess: () => {
      toast.success("Moved to Recycle Bin");
      refresh();
    },
    onError,
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: bulkUpdate,
    onSuccess: () => {
      toast.success("Products updated");
      setSelectedIds([]);
      refresh();
    },
    onError,
  });

  const bulkRecycleMutation = useMutation({
    mutationFn: bulkRecycle,
    onSuccess: () => {
      toast.success("Products moved to Recycle Bin");
      setSelectedIds([]);
      refresh();
    },
    onError,
  });
  const bulkImagesMutation = useMutation({
    mutationFn: bulkImages,
    onSuccess: () => {
      toast.success("Product images updated");
      setSelectedIds([]);
      refresh();
    },
    onError,
  });

  const rows = (listQuery.data?.rows ?? []) as unknown as ProductRow[];
  const total = listQuery.data?.total ?? 0;
  const pageCount = Math.max(Math.ceil(total / 25), 1);

  const toggleAll = () => {
    if (selectedIds.length === rows.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(rows.map((r) => r.id));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((i) => i !== id) : [...current, id]
    );
  };

  return (
    <section className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-wide">Products</h1>
          <p className="text-xs text-muted-foreground">
            {total} product(s) · low-stock alert at {lowThreshold} units
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="steel" size="sm" asChild>
            <Link to="/ad/recycle-bin">Recycle Bin</Link>
          </Button>
          {canManage ? (
            <Button
              variant="red"
              size="sm"
              onClick={() => {
                setEditing(null);
                setCreating((current) => !current);
              }}
            >
              {creating ? "Close form" : "Add product"}
            </Button>
          ) : null}
        </div>
      </div>

      {creating ? (
        <div className="mt-4 rounded-xl border border-border bg-card p-4 shadow-card">
          <h2 className="font-display text-lg font-bold uppercase">New product</h2>
          <div className="mt-3">
            <ProductForm
              initial={emptyProductForm}
              isPending={createMutation.isPending}
              submitLabel="Create product"
              onCancel={() => setCreating(false)}
              onPreview={(v) => {
                setPreviewing(v);
                setPreviewingId(null);
              }}
              onSubmit={(value) => createMutation.mutate({ data: toProductInput(value) as never })}
            />
          </div>
        </div>
      ) : null}

      {editing ? (
        <div className="mt-4 rounded-xl border border-border bg-card p-4 shadow-card">
          <h2 className="font-display text-lg font-bold uppercase">Edit {editing.name}</h2>
          <div className="mt-3">
            <ProductForm
              key={editing.id}
              initial={toFormValue(editing)}
              isPending={updateMutation.isPending}
              submitLabel="Save changes"
              onCancel={() => setEditing(null)}
              onPreview={(v) => {
                setPreviewing(v);
                setPreviewingId(editing.id);
              }}
              onSubmit={(value) =>
                updateMutation.mutate({
                  data: { id: editing.id, ...toProductInput(value) } as never,
                })
              }
            />
          </div>
        </div>
      ) : null}

      {colorsFor ? (
        <ProductColorsPanel
          key={colorsFor.id}
          productId={colorsFor.id}
          productName={colorsFor.name}
          basePrice={
            colorsFor.offer_price === null ? Number(colorsFor.price) : Number(colorsFor.offer_price)
          }
          canManage={canManage}
          onClose={() => setColorsFor(null)}
        />
      ) : null}

      {view360For ? (
        <Product360Panel
          key={view360For.id}
          productId={view360For.id}
          productName={view360For.name}
          canManage={canManage}
          onClose={() => setView360For(null)}
        />
      ) : null}

      {previewing && (
        <ProductPreviewDialog
          value={previewing}
          productId={previewingId}
          onClose={() => {
            setPreviewing(null);
            setPreviewingId(null);
          }}
        />
      )}

      {/* ---- Filters ---- */}
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search name, SKU or slug"
          className="h-11"
        />
        <select
          className="h-11 rounded-md border border-input bg-background px-3 text-sm"
          value={category}
          onChange={(event) => {
            setCategory(event.target.value);
            setPage(1);
          }}
        >
          <option value="all">All categories</option>
          {PRODUCT_CATEGORIES.map((entry) => (
            <option key={entry} value={entry}>
              {categoryLabel(entry)}
            </option>
          ))}
        </select>
        <select
          className="h-11 rounded-md border border-input bg-background px-3 text-sm"
          value={stockFilter}
          onChange={(event) => {
            setStockFilter(event.target.value as (typeof STOCK_FILTERS)[number]);
            setPage(1);
          }}
        >
          <option value="all">Any stock level</option>
          <option value="in_stock">In stock</option>
          <option value="out_of_stock">Out of stock</option>
        </select>
      </div>

      {/* ---- Table ---- */}
      <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card shadow-card">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="border-b border-border bg-secondary text-left text-xs uppercase tracking-wider">
            <tr>
              <th className="p-3 w-10">
                <button
                  type="button"
                  onClick={toggleAll}
                  className="flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  {selectedIds.length === rows.length && rows.length > 0 ? (
                    <CheckSquare className="size-4 text-primary" />
                  ) : (
                    <Square className="size-4" />
                  )}
                </button>
              </th>
              <th className="p-3">Product</th>
              <th className="p-3">SKU</th>
              <th className="p-3">Category</th>
              <th className="p-3 text-right">Price</th>
              <th className="p-3 text-right">Offer</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Flags</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {listQuery.isLoading && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-muted-foreground">
                  Loading products…
                </td>
              </tr>
            )}
            {!listQuery.isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-muted-foreground">
                  No products yet. Use “Add product” to create your first one.
                </td>
              </tr>
            )}
            {rows.map((row) => {
              const status = stockStatus(row.stock_qty, lowThreshold);
              return (
                <tr
                  key={row.id}
                  className={`border-b border-border last:border-0 transition-colors ${
                    selectedIds.includes(row.id) ? "bg-primary/5" : ""
                  }`}
                >
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => toggleOne(row.id)}
                      className="flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {selectedIds.includes(row.id) ? (
                        <CheckSquare className="size-4 text-primary" />
                      ) : (
                        <Square className="size-4" />
                      )}
                    </button>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 overflow-hidden rounded-md border border-border">
                        {row.image_url ? (
                          <SafeImage
                            src={row.image_url}
                            alt={row.name}
                            width={96}
                            height={96}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div>
                        <span className="font-semibold">{row.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {row.is_active ? "Active" : "Inactive"}
                          {row.is_universal ? " · Universal fit" : ""}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground">{row.sku}</td>
                  <td className="p-3 text-muted-foreground">{categoryLabel(row.category)}</td>
                  <td className="p-3 text-right">{formatBDT(Number(row.price))}</td>
                  <td className="p-3 text-right">
                    {row.offer_price === null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <span className="font-semibold text-primary">
                        {formatBDT(Number(row.offer_price))}
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Input
                        className="h-9 w-20"
                        defaultValue={String(row.stock_qty)}
                        inputMode="numeric"
                        disabled={!canManage}
                        onBlur={(event) => {
                          const next = Number(event.target.value);
                          if (Number.isFinite(next) && next !== row.stock_qty) {
                            stockMutation.mutate({ data: { id: row.id, stockQty: next } });
                          }
                        }}
                      />
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${
                          status.key === "in_stock"
                            ? "bg-primary/15 text-primary"
                            : status.key === "low_stock"
                              ? "bg-amber-500/15 text-amber-600"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {status.label}
                      </span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      <FlagChip
                        label="Deal"
                        on={row.is_best_deal}
                        disabled={!canManage}
                        onClick={() =>
                          flagMutation.mutate({
                            data: { id: row.id, field: "isBestDeal", value: !row.is_best_deal },
                          })
                        }
                      />
                      <FlagChip
                        label="Featured"
                        on={row.is_featured}
                        disabled={!canManage}
                        onClick={() =>
                          flagMutation.mutate({
                            data: { id: row.id, field: "isFeatured", value: !row.is_featured },
                          })
                        }
                      />
                      <FlagChip
                        label="New"
                        on={row.is_new_arrival}
                        disabled={!canManage}
                        onClick={() =>
                          flagMutation.mutate({
                            data: { id: row.id, field: "isNewArrival", value: !row.is_new_arrival },
                          })
                        }
                      />
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="steel"
                        size="sm"
                        disabled={!canManage}
                        onClick={() => {
                          setCreating(false);
                          setEditing(row);
                        }}
                      >
                        Edit
                      </Button>
                      <Button variant="steel" size="sm" onClick={() => setColorsFor(row)}>
                        Colours
                      </Button>
                      <Button
                        variant="steel"
                        size="sm"
                        disabled={!canManage}
                        onClick={() => setView360For(row)}
                      >
                        360 View
                      </Button>
                      <Button
                        variant="steel"
                        size="sm"
                        disabled={!canManage}
                        onClick={() =>
                          flagMutation.mutate({
                            data: { id: row.id, field: "isActive", value: !row.is_active },
                          })
                        }
                      >
                        {row.is_active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={!canManage}
                        onClick={() => {
                          const reason = window.prompt(
                            `Move “${row.name}” to the Recycle Bin? Optional reason:`,
                            "",
                          );
                          if (reason === null) return;
                          recycleMutation.mutate({ data: { id: row.id, reason } });
                        }}
                      >
                        Recycle
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">
          Page {page} of {pageCount}
        </span>
        <div className="flex gap-2">
          <Button
            variant="steel"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(current - 1, 1))}
          >
            Previous
          </Button>
          <Button
            variant="steel"
            size="sm"
            disabled={page >= pageCount}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      {selectedIds.length > 0 && canManage && (
        <div className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-4 rounded-full border border-border bg-card/95 px-6 py-3 shadow-2xl backdrop-blur-md">
            <span className="text-sm font-bold uppercase tracking-wider text-primary">
              {selectedIds.length} Selected
            </span>

            <div className="h-6 w-px bg-border mx-2" />

            <div className="flex items-center gap-2">
              <Button
                variant="steel"
                size="sm"
                className="h-9 gap-2 rounded-full px-4"
                onClick={() =>
                  bulkUpdateMutation.mutate({ data: { ids: selectedIds, isActive: true } as any })
                }
              >
                <Eye className="size-4" />
                Publish
              </Button>
              <Button
                variant="steel"
                size="sm"
                className="h-9 gap-2 rounded-full px-4"
                onClick={() =>
                  bulkUpdateMutation.mutate({ data: { ids: selectedIds, isActive: false } as any })
                }
              >
                <EyeOff className="size-4" />
                Unpublish
              </Button>

              <div className="relative group">
                <Button variant="steel" size="sm" className="h-9 gap-2 rounded-full px-4">
                  <Tag className="size-4" />
                  Category
                </Button>
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block animate-in fade-in zoom-in-95 duration-200">
                  <div className="w-48 overflow-hidden rounded-xl border border-border bg-card shadow-2xl p-1">
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() =>
                          bulkUpdateMutation.mutate({
                            data: { ids: selectedIds, category: cat } as any,
                          })
                        }
                        className="w-full px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide hover:bg-primary/10 hover:text-primary transition-colors rounded-lg"
                      >
                        {categoryLabel(cat)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="h-6 w-px bg-border mx-2" />
              <div className="relative group">
                <Button variant="steel" size="sm" className="h-9 gap-2 rounded-full px-4">
                  <ImageIcon className="size-4" />
                  Images
                </Button>
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block animate-in fade-in zoom-in-95 duration-200">
                   <div className="w-80 overflow-hidden rounded-xl border border-border bg-card shadow-2xl p-4 space-y-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Bulk Image Update</p>
                      
                      <div className="space-y-4">
                        <ProductImageUpload
                          label="Replace Main Images"
                          multiple={false}
                          value=""
                          onChange={(url: string | string[]) => {
                            if (window.confirm(`Replace main image for ${selectedIds.length} products?`)) {
                               bulkImagesMutation.mutate({ data: { ids: selectedIds, imageUrl: url as string } });
                            }
                          }}
                        />
                        
                        <div className="h-px bg-border" />
                        
                        <ProductImageUpload
                          label="Replace Gallery Images"
                          multiple={true}
                          value={[]}
                          onChange={(urls: string | string[]) => {
                            if (Array.isArray(urls) && window.confirm(`Replace entire gallery for ${selectedIds.length} products?`)) {
                               bulkImagesMutation.mutate({ data: { ids: selectedIds, replaceGallery: urls } });
                            }
                          }}
                        />

                        <div className="h-px bg-border" />
                        
                        <ProductImageUpload
                          label="Append to Gallery"
                          multiple={true}
                          value={[]}
                          onChange={(urls: string | string[]) => {
                            if (Array.isArray(urls) && window.confirm(`Append ${urls.length} images to gallery for ${selectedIds.length} products?`)) {
                               bulkImagesMutation.mutate({ data: { ids: selectedIds, appendGallery: urls } });
                            }
                          }}
                        />
                      </div>
                   </div>
                </div>
              </div>
              <div className="h-6 w-px bg-border mx-2" />

              <Button
                variant="destructive"
                size="sm"
                className="h-9 gap-2 rounded-full px-4"
                onClick={() => {
                  const reason = window.prompt(
                    `Move ${selectedIds.length} products to the Recycle Bin? Optional reason:`,
                    ""
                  );
                  if (reason === null) return;
                  bulkRecycleMutation.mutate({ data: { ids: selectedIds, reason } as any });
                }}
              >
                <Trash2 className="size-4" />
                Recycle
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="ml-2 size-8 rounded-full p-0 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => setSelectedIds([])}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {!canManage ? (
        <p className="mt-3 text-xs text-muted-foreground">
          You can view products but only accounts with the “Manage products” permission can change
          them.
        </p>
      ) : null}
    </section>
  );
}

function FlagChip({
  label,
  on,
  disabled,
  onClick,
}: {
  label: string;
  on: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full border px-2 py-0.5 text-xs font-semibold uppercase transition ${
        on
          ? "border-primary bg-primary/15 text-primary"
          : "border-border text-muted-foreground hover:text-foreground"
      } disabled:opacity-50`}
    >
      {label}
    </button>
  );
}

function ProductPreviewDialog({
  value,
  productId,
  onClose,
}: {
  value: ProductFormValue;
  productId: string | null;
  onClose: () => void;
}) {
  const fetchProduct = useServerFn(listProducts);

  const fetchColors = useServerFn(listProductColors);
  const fetch360 = useServerFn(listProduct360Images);

  const { data: existingProduct } = useQuery({
    queryKey: ["admin-product-detail", productId],
    queryFn: async () => {
      if (!productId) return null;
      const [pRes, cRes, iRes] = await Promise.all([
        fetchProduct({ data: { search: productId, page: 1, pageSize: 1 } as any }),
        fetchColors({ data: { productId } }),
        fetch360({ data: { productId } }),
      ]);
      const product = pRes.rows[0];
      if (!product) return null;
      return { ...product, colors: cRes.rows, product360Images: iRes.rows.map((r) => r.image_url) };
    },
    enabled: !!productId,
  });

  const mockProduct = {
    id: productId || "preview",
    slug: value.slug,
    name: value.name,
    description: value.description,
    details: value.details,
    category: value.category,
    image: value.imageUrl,
    gallery: value.images.split("\n").filter(Boolean),
    price: Number(value.price),
    offerPrice: value.offerPrice ? Number(value.offerPrice) : null,
    stockQty: Number(value.stockQty),
    inStock: Number(value.stockQty) > 0,
    universal: value.isUniversal,
    bikeCompatibility: value.bikeCompatibility
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    bestDeal: value.isBestDeal,
    featured: value.isFeatured,
    newArrival: value.isNewArrival,
    badgeText: value.badgeEnabled ? value.badgeText : null,
    colors: (existingProduct as any)?.colors || [],
    has360View: value.has360View,
    product360Images: (existingProduct as any)?.product360Images || [],
    sortOrder: 0,
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] w-[1200px] h-[90vh] p-0 overflow-y-auto bg-background border-border">
        <div className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-background/80 px-6 py-4 backdrop-blur-md">
          <div>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide">Live Preview</h2>
            <p className="text-xs text-muted-foreground italic">
              * Showing draft content. Colors and 360 view reflect currently saved state.
            </p>
          </div>
          <Button variant="steel" size="icon" onClick={onClose} className="rounded-full" aria-label="Close">
            <X className="size-5" />
          </Button>
        </div>
        <div className="p-6">
          <ProductDetail product={mockProduct as any} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
