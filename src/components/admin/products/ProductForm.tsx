// ============================================================
// PRODUCT FORM (create / edit)
// Purpose: All product fields in one compact form — identity,
//          pricing, stock, compatibility and merchandising flags.
// Status: COMPLETED
// Security: Presentation only; the server re-validates every field.
// ============================================================
import { useState } from "react";
import { Play } from "lucide-react";
import { Switch } from "@/components/ui/switch";

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
import { ProductImageUpload } from "./ProductImageUpload";
import { VideoPreview } from "./VideoPreview";

export type ProductFormValue = {
  name: string;
  sku: string;
  slug: string;
  imageUrl: string;
  category: string;
  bikeCompatibility: string;
  isUniversal: boolean;
  has360View: boolean;
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
  videoEnabled: boolean;
  videoPlatform: string;
  videoUrl: string;
  outOfStockToggle: boolean;
};

export const emptyProductForm: ProductFormValue = {
  name: "",
  sku: "",
  slug: "",
  imageUrl: "",
  category: "accessories",
  bikeCompatibility: "",
  isUniversal: false,
  has360View: false,
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
  videoEnabled: false,
  videoPlatform: "youtube",
  videoUrl: "",
  outOfStockToggle: false,
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
    has360View: value.has360View,
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
    videoEnabled: value.videoEnabled,
    videoPlatform: value.videoPlatform as any,
    videoUrl: value.videoUrl.trim(),
    outOfStockToggle: value.outOfStockToggle,
  };
}

export function ProductForm({
  initial,
  isPending,
  submitLabel,
  onSubmit,
  onCancel,
  onPreview,
}: {
  initial: ProductFormValue;
  isPending: boolean;
  submitLabel: string;
  onSubmit: (value: ProductFormValue) => void;
  onCancel: () => void;
  onPreview: (value: ProductFormValue) => void;
}) {
  const [value, setValue] = useState<ProductFormValue>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof ProductFormValue>(key: K, next: ProductFormValue[K]) => {
    setValue((current) => ({ ...current, [key]: next }));
    if (errors[key as string]) {
      setErrors((prev) => {
        const nextErrors = { ...prev };
        delete nextErrors[key as string];
        return nextErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!value["name"].trim()) newErrors["name"] = "Product name is required.";
    else if (value["name"].trim().length < 2)
      newErrors["name"] = "Product name must be at least 2 characters.";

    if (!value["sku"].trim()) newErrors["sku"] = "SKU is required.";

    if (!value["price"].trim()) newErrors["price"] = "Regular price is required.";
    else if (!(Number(value["price"]) > 0))
      newErrors["price"] = "Please enter a valid regular price greater than 0.";

    if (value["offerPrice"].trim()) {
      if (!(Number(value["offerPrice"]) > 0)) {
        newErrors["offerPrice"] = "Please enter a valid offer price.";
      } else if (Number(value["offerPrice"]) >= Number(value["price"])) {
        newErrors["offerPrice"] = "Offer Price cannot be higher than Regular Price.";
      }
    }

    if (!value["category"]) newErrors["category"] = "Please select a valid category.";

    if (!value["imageUrl"].trim()) newErrors["imageUrl"] = "Main product image URL is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (validate()) {
      onSubmit(value);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Product name"
          required
          error={errors["name"] || undefined}
          example="Example: Bajaj Pulsar N160 Front Mudguard"
        >
          <Input
            className="h-11"
            placeholder="Enter full product name"
            value={value["name"]}
            onChange={(event) => {
              set("name", event.target.value);
              if (!value["slug"]) set("slug", slugify(event.target.value));
            }}
          />
        </Field>
        <Field
          label="SKU"
          required
          error={errors["sku"] || undefined}
          example="Example: CZP-MUD-001"
        >
          <Input
            className="h-11"
            placeholder="Unique stock keeping unit"
            value={value["sku"]}
            onChange={(e) => set("sku", e.target.value)}
          />
        </Field>
        <Field label="URL slug" required example="Example: pulsar-n160-front-mudguard">
          <Input
            className="h-11"
            placeholder="URL-friendly identifier"
            value={value.slug}
            onChange={(e) => set("slug", slugify(e.target.value))}
          />
        </Field>
        <Field
          label="Category"
          required
          error={errors["category"] || undefined}
          example="Select the primary category"
        >
          <select
            className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-red-500 transition-shadow"
            value={value["category"]}
            onChange={(e) => set("category", e.target.value)}
          >
            {PRODUCT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {categoryLabel(category)}
              </option>
            ))}
          </select>
        </Field>
        <div className="sm:col-span-2">
          <ProductImageUpload
            label="Main Product Image"
            value={value["imageUrl"]}
            onChange={(url) => set("imageUrl", url as string)}
            multiple={false}
          />
          <div className="mt-4">
            <Field
              label="Or Paste Image URL"
              optional
              error={errors["imageUrl"] || undefined}
              example="Example: https://.../image.webp"
            >
              <Input
                className="h-11"
                placeholder="https://example.com/product-image.jpg"
                value={value["imageUrl"]}
                onChange={(e) => set("imageUrl", e.target.value)}
              />
            </Field>
          </div>
        </div>
        <Field label="Bike compatibility" example="Example: Pulsar N160, Pulsar N250, Dominar 400">
          <Input
            className="h-11"
            placeholder="Comma separated bike models"
            value={value.bikeCompatibility}
            onChange={(e) => set("bikeCompatibility", e.target.value)}
          />
        </Field>
        <Field
          label="Regular price (৳)"
          required
          error={errors["price"] || undefined}
          example="Example: 1200"
        >
          <Input
            className="h-11"
            inputMode="numeric"
            placeholder="0.00"
            value={value["price"]}
            onChange={(e) => set("price", e.target.value)}
          />
        </Field>
        <Field
          label="Offer price (৳)"
          optional
          error={errors["offerPrice"] || undefined}
          example="Example: 950 (Must be lower than regular price)"
        >
          <Input
            className="h-11"
            inputMode="numeric"
            placeholder="Optional discount price"
            value={value["offerPrice"]}
            onChange={(e) => set("offerPrice", e.target.value)}
          />
        </Field>
        <Field label="Stock quantity" required example="Example: 25">
          <Input
            className="h-11"
            inputMode="numeric"
            placeholder="Available stock"
            value={value.stockQty}
            onChange={(e) => set("stockQty", e.target.value)}
          />
        </Field>
        <Field label="Custom badge text" optional example="Example: Best Seller, Limited Edition">
          <Input
            className="h-11"
            placeholder="Badge text (e.g. 15% OFF)"
            value={value.badgeText}
            onChange={(e) => set("badgeText", e.target.value)}
          />
        </Field>
        <Field
          label="Short Description"
          required
          example="Example: High-quality carbon fiber mudguard for Bajaj Pulsar N160."
          className="sm:col-span-2"
        >
          <Textarea
            rows={2}
            placeholder="Brief overview for search and catalog pages"
            value={value.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </Field>
        <Field
          label="Full product details"
          required
          example="Include materials, fitment, included items, and installation instructions."
          className="sm:col-span-2"
        >
          <Textarea
            rows={5}
            placeholder="Full technical specifications and details"
            value={value.details}
            onChange={(e) => set("details", e.target.value)}
          />
        </Field>
        <div className="sm:col-span-2">
          <ProductImageUpload
            label="Gallery Images"
            multiple
            value={value.images.split(/\r?\n/).filter(Boolean)}
            onChange={(urls) => set("images", (urls as string[]).join("\n"))}
            guideline="Up to 10 additional images. 1000x1000px WebP format recommended."
          />
          <div className="mt-4">
            <Field
              label="Or Gallery image URLs (One per line)"
              optional
              example="Paste one URL per line"
            >
              <Textarea
                rows={3}
                placeholder="https://example.com/gallery1.webp&#10;https://example.com/gallery2.webp"
                value={value.images}
                onChange={(e) => set("images", e.target.value)}
              />
            </Field>
          </div>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <Check
          label="Active (visible on the website)"
          checked={value.isActive}
          onChange={(v) => set("isActive", v)}
        />
        <Check
          label="Enable 360° View"
          checked={value.has360View}
          onChange={(v) => set("has360View", v)}
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
        <Check
          label="Manual Stock Out"
          checked={value.outOfStockToggle}
          onChange={(v) => set("outOfStockToggle", v)}
        />
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="font-display text-base font-bold uppercase tracking-wide">Product Video</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Showcase your product with a video link
            </p>
          </div>
          <Switch
            checked={value.videoEnabled}
            onCheckedChange={(v: boolean) => set("videoEnabled", v)}
            className="data-[state=checked]:bg-red-500"
          />
        </div>

        {value.videoEnabled && (
          <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t border-border animate-in fade-in slide-in-from-top-2 duration-300">
            <Field
              label="Video Platform"
              required
              example="Select where the video is hosted"
            >
              <select
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-red-500 transition-shadow"
                value={value.videoPlatform}
                onChange={(e) => set("videoPlatform", e.target.value)}
              >
                <option value="youtube">YouTube</option>
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
              </select>
            </Field>
            <Field
              label="Video URL"
              required
              error={errors["videoUrl"]}
              example="Paste the full video link"
            >
              <Input
                className="h-11"
                placeholder="https://..."
                value={value.videoUrl}
                onChange={(e) => set("videoUrl", e.target.value)}
              />
            </Field>

            {value.videoUrl && (
              <div className="sm:col-span-2 space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Video Preview
                </Label>
                <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-lg border border-border bg-black shadow-inner">
                  <VideoPreview
                    platform={value.videoPlatform as any}
                    url={value.videoUrl}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {value.offerPrice.trim() && Number(value.price) > 0 ? (
        <p className="text-xs text-muted-foreground">
          Customers will see {formatBDT(Number(value.offerPrice))} instead of{" "}
          {formatBDT(Number(value.price))}.
        </p>
      ) : null}

      {Object.keys(errors).length > 0 ? (
        <p className="text-sm font-bold text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
          Please correct the highlighted fields before saving.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="red" size="touch" disabled={isPending}>
          {isPending ? "Saving…" : submitLabel}
        </Button>
        <Button
          type="button"
          variant="steel"
          size="touch"
          onClick={() => validate() && onPreview(value)}
        >
          Preview
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
  required,
  optional,
  error,
  example,
  guideline,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
  optional?: boolean;
  error?: string | null | undefined;
  example?: string;
  guideline?: string;
}) {
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1.5">
        <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          {label}
          {required && (
            <span className="text-destructive font-black" title="Required">
              *
            </span>
          )}
          {optional && (
            <span className="text-[10px] font-medium lowercase text-muted-foreground/60">
              (Optional)
            </span>
          )}
        </Label>
        {example && (
          <span className="text-[10px] italic text-muted-foreground/50 hidden sm:inline truncate max-w-[200px]">
            {example}
          </span>
        )}
      </div>
      <div>
        {children}
        {guideline && (
          <p className="mt-1.5 text-[10px] leading-tight text-cyan-500 font-medium">
            <span className="font-bold uppercase mr-1 opacity-70">Recommended:</span>
            {guideline}
          </p>
        )}
        {error && (
          <p className="mt-1 text-xs font-semibold text-destructive animate-in fade-in slide-in-from-top-1">
            {error}
          </p>
        )}
      </div>
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
