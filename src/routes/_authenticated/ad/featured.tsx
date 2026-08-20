import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { GripVertical, Save, Trash2, Package, Monitor } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { listProducts, updateFeaturedProducts } from "@/lib/products.functions";
import { getSectionSettings } from "@/lib/sections.functions";
import { storefrontProductsQuery } from "@/lib/storefront.queries";
import { SectionPreviewDialog } from "@/components/admin/settings/SectionPreviewDialog";



export const Route = createFileRoute("/_authenticated/ad/featured")({
  component: FeaturedAdminPage,
});

function SortableItem({ id, product, onRemove, onUpdate }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group mb-3 flex items-center gap-4 rounded-lg border bg-card p-3 shadow-sm transition-colors ${
        isDragging ? "border-primary/50 ring-2 ring-primary/20" : "hover:border-primary/30"
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="size-5" />
      </button>

      {product.image_url ? (
        <img src={product.image_url} alt="" className="size-12 rounded object-cover bg-muted" />
      ) : (
        <div className="size-12 rounded bg-muted flex items-center justify-center text-[10px] text-muted-foreground">
          No image
        </div>
      )}

      <div className="flex-1 min-w-0">
        <h4 className="font-medium truncate text-sm">{product.name}</h4>
        <div className="flex items-center gap-2 mt-1">
          <Badge
            variant={product.is_best_deal ? "destructive" : "secondary"}
            className="text-[10px] px-1.5 h-4"
          >
            {product.is_best_deal ? "Best Deal" : "Featured"}
          </Badge>
          <span className="text-xs text-muted-foreground">SKU: {product.sku}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id={`badge-${id}`}
            checked={product.badge_enabled}
            onCheckedChange={(checked) => onUpdate(id, { badge_enabled: !!checked })}
          />
          <Input
            value={product.badge_text || ""}
            onChange={(e) => onUpdate(id, { badge_text: e.target.value })}
            placeholder="Label (e.g. 20% OFF)"
            className="h-8 w-32 text-xs"
            disabled={!product.badge_enabled}
          />
        </div>
        <Button aria-label="Delete"
          variant="ghost"
          size="icon"
          className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => onRemove(id)}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function FeaturedAdminPage() {
  const queryClient = useQueryClient();
  const fetchProducts = useServerFn(listProducts);
  const mutateFeatured = useServerFn(updateFeaturedProducts);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["admin-products-featured"],
    queryFn: () => fetchProducts({ data: { pageSize: 100, activeOnly: true } }),
  });

  const [localItems, setLocalItems] = useState<any[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [previewSection, setPreviewSection] = useState<any | null>(null);

  const fetchSectionSettings = useServerFn(getSectionSettings);
  const { data: sectionSettings = [] } = useQuery({
    queryKey: ["section-settings"],
    queryFn: () => fetchSectionSettings({ data: undefined }),
  });



  useEffect(() => {
    if (productsData?.rows) {
      const featured = productsData.rows
        .filter((p: any) => p.is_featured || p.is_best_deal)
        .sort((a: any, b: any) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
      setLocalItems(featured);
    }
  }, [productsData]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLocalItems((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const result = arrayMove(items, oldIndex, newIndex);
        setIsDirty(true);
        return result;
      });
    }
  };

  const removeItem = (id: string) => {
    setLocalItems((items) => items.filter((i) => i.id !== id));
    setIsDirty(true);
  };

  const updateItem = (id: string, updates: any) => {
    setLocalItems((items) => items.map((i) => (i.id === id ? { ...i, ...updates } : i)));
    setIsDirty(true);
  };

  const saveChanges = async () => {
    try {
      const items = localItems.map((item, index) => ({
        id: item.id,
        sortOrder: index,
        badgeText: item.badge_text,
        badgeEnabled: item.badge_enabled,
      }));

      await mutateFeatured({ data: { items } });
      setIsDirty(false);
      toast.success("Featured products updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["admin-products-featured"] });
      queryClient.invalidateQueries({ queryKey: storefrontProductsQuery().queryKey });
    } catch (err: any) {
      toast.error(err.message || "Failed to save changes.");
    }
  };

  if (isLoading)
    return (
      <div className="p-8 text-center text-muted-foreground">Loading featured products...</div>
    );

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold uppercase tracking-tight">
            Featured & Best Deals
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage the products displayed in the featured section of your homepage.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isDirty && (
            <Button onClick={saveChanges} className="gap-2">
              <Save className="size-4" /> Save Order
            </Button>
          )}
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              const setting = sectionSettings.find((s: any) => s.id === "featured_deals");
              if (setting) setPreviewSection(setting);
            }}
          >
            <Monitor className="size-4" /> Preview Section
          </Button>
        </div>
      </div>

      {previewSection && (
        <SectionPreviewDialog
          open={!!previewSection}
          onOpenChange={(open) => !open && setPreviewSection(null)}
          section={previewSection}
        />
      )}


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Homepage Arrangement</CardTitle>
              <CardDescription>
                Drag and drop to change the display order on the homepage.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {localItems.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed rounded-xl border-muted">
                  <Package className="mx-auto size-12 text-muted-foreground mb-4 opacity-20" />
                  <p className="text-muted-foreground">No featured products selected.</p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                  modifiers={[restrictToVerticalAxis]}
                >
                  <SortableContext
                    items={localItems.map((i) => i.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {localItems.map((item) => (
                      <SortableItem
                        key={item.id}
                        id={item.id}
                        product={item}
                        onRemove={removeItem}
                        onUpdate={updateItem}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="border-border/60 shadow-sm sticky top-24">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Add Products</CardTitle>
              <CardDescription>
                Only products with "Featured" or "Best Deal" flags can be managed here. Edit
                products to enable these flags.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-4 italic">
                Currently displaying products with 'Featured' or 'Best Deal' enabled.
              </div>
              <Button asChild variant="outline" className="w-full gap-2">
                <a href="/ad/products">
                  <Package className="size-4" /> Go to Products Management
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
