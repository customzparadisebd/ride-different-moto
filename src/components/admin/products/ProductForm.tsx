// ============================================================
// PRODUCT FORM (create / edit)
// Purpose: All product fields in one compact form — identity,
//          pricing, stock, compatibility and merchandising flags.
// Status: COMPLETED
// Security: Presentation only; the server re-validates every field.
// ============================================================
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatBDT } from "@/lib/format";
import {
  categoryLabel,
  PRODUCT_CATEGORIES,
  slugify,
  type ProductInput,
} from "@/lib/products.shared";

export type ProductFormValue = {
  name: string;
  sku: string;
  slug: string;
  imageUrl: string;
  category: string;
  bikeCompatibility: string;
  isUniversal: boolean;
  description: string;
  details: string;
  images: string;
  badgeEnabled: boolean;
  badgeText: string;
  price: string;
  offerPrice: string;
  stockQty: string;
  isBestDeal: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  isActive: boolean;
};

export const emptyProductForm: ProductFormValue = {
  name: "",
  sku: "",
  slug: "",
  imageUrl: "",
  category: "accessories",
  bikeCompatibility: "",
  isUniversal: false,
  description: "",
  details: "",
  images: "",
  badgeEnabled: false,
  badgeText: "",
  price: "",
  offerPrice: "",
  stockQty: "0",
  isBestDeal: false,
  isFeatured: false,
  isNewArrival: false,
  isActive: true,
};

export function toProductInput(value: ProductFormValue): ProductInput {
  return {
    name: value.name.trim(),
    sku: value.sku.trim(),
    slug: value.slug.trim() || slugify(value.name),
    imageUrl: value.imageUrl.trim(),
    category: value.category as ProductInput["category"],
    bikeCompatibility: value.bikeCompatibility
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
    isUniversal: value.isUniversal,
    description: value.description.trim(),
    details: value.details.trim(),
    // One gallery image URL per line.
    images: value.images
      .split(/\r?\n/)
      .map((entry) => entry.trim())
      .filter(Boolean),
    badgeEnabled: value.badgeEnabled,
    badgeText: value.badgeText.trim(),
    price: Number(value.price) || 0,
    offerPrice: value.offerPrice.trim() ? Number(value.offerPrice) : null,
    stockQty: Number(value.stockQty) || 0,
    isBestDeal: value.isBestDeal,
    isFeatured: value.isFeatured,
    isNewArrival: value.isNewArrival,
    isActive: value.isActive,
  };
}

export function ProductForm({
  initial,
  isPending,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: ProductFormValue;
  isPending: boolean;
  submitLabel: string;
  onSubmit: (value: ProductFormValue) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState<ProductFormValue>(initial);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof ProductFormValue>(key: K, next: ProductFormValue[K]) =>
    setValue((current) => ({ ...current, [key]: next }));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (value.name.trim().length < 2) return setError("Enter the product name.");
    if (value.sku.trim().length < 2) return setError("Enter an SKU.");
    if (!(Number(value.price) > 0)) return setError("Enter a regular price greater than zero.");
    if (value.offerPrice.trim() && Number(value.offerPrice) >= Number(value.price)) {
      return setError("The offer price must be lower than the regular price.");
    }
    setError(null);
    onSubmit(value);
    return undefined;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Product name">
          <Input
            className="h-11"
            value={value.name}
            onChange={(event) => {
              set("name", event.target.value);
              if (!value.slug) set("slug", slugify(event.target.value));
            }}
          />
        </Field>
        <Field label="SKU">
          <Input className="h-11" value={value.sku} onChange={(e) => set("sku", e.target.value)} />
        </Field>
        <Field label="URL slug">
          <Input
            className="h-11"
            value={value.slug}
            onChange={(e) => set("slug", slugify(e.target.value))}
          />
        </Field>
        <Field label="Category">
          <select
            className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={value.category}
            onChange={(e) => set("category", e.target.value)}
          >
            {PRODUCT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {categoryLabel(category)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Image URL">
          <Input
            className="h-11"
            value={value.imageUrl}
            onChange={(e) => set("imageUrl", e.target.value)}
          />
        </Field>
        <Field label="Bike compatibility (comma separated)">
          <Input
            className="h-11"
            placeholder="Yamaha R15 V3, Pulsar NS160"
            value={value.bikeCompatibility}
            onChange={(e) => set("bikeCompatibility", e.target.value)}
          />
        </Field>
        <Field label="Regular price (৳)">
          <Input
            className="h-11"
            inputMode="numeric"
            value={value.price}
            onChange={(e) => set("price", e.target.value)}
          />
        </Field>
        <Field label="Offer price (৳, optional)">
          <Input
            className="h-11"
            inputMode="numeric"
            value={value.offerPrice}
            onChange={(e) => set("offerPrice", e.target.value)}
          />
        </Field>
        <Field label="Stock quantity">
          <Input
            className="h-11"
            inputMode="numeric"
            value={value.stockQty}
            onChange={(e) => set("stockQty", e.target.value)}
          />
        </Field>
        <Field label="Custom badge text (optional)">
          <Input
            className="h-11"
            placeholder="Top Seller"
            value={value.badgeText}
            onChange={(e) => set("badgeText", e.target.value)}
          />
        </Field>
        <Field label="Description" className="sm:col-span-2">
          <Textarea
            rows={3}
            value={value.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </Field>
        <Field label="Full product details" className="sm:col-span-2">
          <Textarea
            rows={4}
            placeholder="Materials, fitment notes, what is in the box…"
            value={value.details}
            onChange={(e) => set("details", e.target.value)}
          />
        </Field>
        <Field label="Gallery image URLs (one per line)" className="sm:col-span-2">
          <Textarea rows={3} value={value.images} onChange={(e) => set("images", e.target.value)} />
        </Field>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <Check
          label="Active (visible on the website)"
          checked={value.isActive}
          onChange={(v) => set("isActive", v)}
        />
        <Check
          label="Universal fit"
          checked={value.isUniversal}
          onChange={(v) => set("isUniversal", v)}
        />
        <Check
          label="Best deal"
          checked={value.isBestDeal}
          onChange={(v) => set("isBestDeal", v)}
        />
        <Check label="Featured" checked={value.isFeatured} onChange={(v) => set("isFeatured", v)} />
        <Check
          label="New arrival"
          checked={value.isNewArrival}
          onChange={(v) => set("isNewArrival", v)}
        />
        <Check
          label="Show custom badge"
          checked={value.badgeEnabled}
          onChange={(v) => set("badgeEnabled", v)}
        />
      </div>

      {value.offerPrice.trim() && Number(value.price) > 0 ? (
        <p className="text-xs text-muted-foreground">
          Customers will see {formatBDT(Number(value.offerPrice))} instead of{" "}
          {formatBDT(Number(value.price))}.
        </p>
      ) : null}

      {error ? <p className="text-sm font-semibold text-destructive">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="red" size="touch" disabled={isPending}>
          {isPending ? "Saving…" : submitLabel}
        </Button>
        <Button type="button" variant="steel" size="touch" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 items-center gap-3 rounded-md border border-border px-3 text-sm">
      <input
        type="checkbox"
        className="h-4 w-4"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}
