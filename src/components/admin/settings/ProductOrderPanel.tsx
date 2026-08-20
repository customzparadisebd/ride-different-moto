import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { 
  GripVertical, 
  Info, 
  Save, 
  RotateCcw,
  LayoutGrid,
  Search,
  ArrowUp,
  ArrowDown
} from "lucide-react";
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

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { listProducts, reorderProducts } from "@/lib/products.functions";
import { cn } from "@/lib/utils";

function SortableProductItem({ id, product, onMove }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group overflow-hidden rounded-lg border border-border bg-card transition-all duration-200",
        isDragging ? "border-primary shadow-2xl ring-2 ring-primary/20 scale-[1.01] opacity-90" : "hover:border-primary/30"
      )}
    >
      <div className="p-3 sm:p-4 flex gap-4 items-center">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary p-2 rounded-md hover:bg-primary/5 transition-colors"
        >
          <GripVertical className="size-5" />
        </button>

        <div className="relative size-12 sm:size-16 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
          {product.image_url ? (
            <img 
              src={product.image_url} 
              alt={product.name} 
              className="h-full w-full object-cover" 
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground/40">
              <LayoutGrid className="h-6 w-6" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-sm font-bold uppercase tracking-tight text-foreground truncate">
              {product.name}
            </h3>
            {!product.is_active && (
              <Badge variant="outline" className="text-[8px] h-4 uppercase tracking-tighter border-red-500 text-red-500 bg-red-500/10">
                Inactive
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-[9px] font-mono uppercase tracking-tighter text-muted-foreground/60">
            <span className="bg-primary/5 px-1.5 py-0.5 rounded text-primary font-bold">{product.sku}</span>
            <span>•</span>
            <span className="uppercase">{product.category.replace('-', ' ')}</span>
            <span>•</span>
            <span>Order: {product.sort_order || 0}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1 bg-accent/20 p-1 rounded-lg border border-border/50">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 hover:text-primary hover:bg-primary/10" 
            onClick={() => onMove("up")}
            title="Move Up"
          >
            <ArrowUp className="h-3.5 w-3.5"/>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 hover:text-primary hover:bg-primary/10" 
            onClick={() => onMove("down")}
            title="Move Down"
          >
            <ArrowDown className="h-3.5 w-3.5"/>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ProductOrderPanel() {
  const queryClient = useQueryClient();
  const fetchProductsFn = useServerFn(listProducts);
  const reorderFn = useServerFn(reorderProducts);

  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  // We fetch a larger page size for ordering UI
  const { data: rawData, isLoading } = useQuery({
    queryKey: ["admin-products-order"],
    queryFn: () => fetchProductsFn({ data: { page: 1, pageSize: 500 } as any }),
  });

  const rawProducts = (rawData?.rows || []) as any[];

  useEffect(() => {
    if (rawProducts.length > 0) {
      setProducts(rawProducts);
      setIsDirty(false);
    }
  }, [rawProducts]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setProducts((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const result = arrayMove(items, oldIndex, newIndex);
        setIsDirty(true);
        return result;
      });
    }
  };

  const moveProduct = (id: string, direction: "up" | "down") => {
    const index = products.findIndex((m) => m.id === id);
    if ((direction === "up" && index > 0) || (direction === "down" && index < products.length - 1)) {
      const newIndex = direction === "up" ? index - 1 : index + 1;
      const newProducts = [...products];
      [newProducts[index], newProducts[newIndex]] = [newProducts[newIndex], newProducts[index]];
      setProducts(newProducts);
      setIsDirty(true);
    }
  };

  const saveOrder = async () => {
    try {
      await reorderFn({ data: { ids: products.map((m) => m.id) } });
      toast.success("Product arrangement saved");
      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products-order"] });
    } catch (e: any) {
      toast.error(e.message || "Failed to save order");
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div className="p-12 text-center text-muted-foreground animate-pulse">Loading product list...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-20 py-4 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <LayoutGrid className="h-6 w-6 text-primary" />
            Product Arrangement
          </h2>
          <p className="text-xs text-muted-foreground">Define the display order of products on the storefront.</p>
        </div>
        <div className="flex gap-2">
          {isDirty && (
            <>
              <Button 
                onClick={() => { setProducts(rawProducts); setIsDirty(false); }} 
                variant="outline" 
                size="sm"
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" /> Reset
              </Button>
              <Button 
                onClick={saveOrder} 
                variant="red" 
                size="sm"
                className="gap-2 shadow-lg shadow-red-500/20"
              >
                <Save className="h-4 w-4" /> Save Order
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Alert className="bg-primary/5 dark:bg-primary/10 border-primary/20">
          <Info className="h-4 w-4 text-primary" />
          <AlertTitle className="text-primary font-bold uppercase tracking-widest text-[10px]">Arrangement Rules</AlertTitle>
          <AlertDescription className="text-xs text-foreground/80 dark:text-white/80 leading-relaxed">
            Drag products to reorder. The top product appears first on the website. New products are added to the end by default.
          </AlertDescription>
        </Alert>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input 
            placeholder="Search products to reorder..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
        <SortableContext items={filteredProducts.map((m) => m.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {filteredProducts.map((p) => (
              <SortableProductItem 
                key={p.id} 
                id={p.id} 
                product={p} 
                onMove={(dir: "up" | "down") => moveProduct(p.id, dir)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {filteredProducts.length === 0 && (
        <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl bg-accent/20">
          <h3 className="text-lg font-bold uppercase tracking-tight text-foreground/60">No Products Found</h3>
        </div>
      )}
    </div>
  );
}