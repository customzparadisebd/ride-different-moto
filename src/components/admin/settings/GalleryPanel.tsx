import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  GripVertical, 
  Info, 
  Image as ImageIcon,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  GalleryThumbnails
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  getGalleryItems, 
  createGalleryItem, 
  updateGalleryItem, 
  deleteGalleryItem,
  reorderGalleryItems 
} from "@/lib/gallery.functions";
import { SingleImageUpload } from "@/components/admin/SingleImageUpload";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function SortableGalleryItem({ id, item, onEdit, onDelete, onMove }: any) {
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
        isDragging ? "border-primary shadow-2xl ring-2 ring-primary/20 scale-[1.02] opacity-90" : "hover:border-primary/30"
      )}
    >
      <div className={cn("h-1 w-full transition-colors", item.active ? "bg-primary" : "bg-muted")} />
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-5 items-center">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary p-2 rounded-md hover:bg-primary/5 transition-colors"
          title="Drag to reorder"
        >
          <GripVertical className="size-5" />
        </button>

        <div className="relative aspect-square w-full sm:w-32 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
          {item.image ? (
            <img 
              src={item.image} 
              alt={item.alt} 
              className="h-full w-full object-cover transition-transform group-hover:scale-105" 
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground/40">
              <ImageIcon className="h-6 w-6" />
            </div>
          )}
          {!item.active && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Badge variant="outline" className="text-[9px] uppercase tracking-wider border-red-500 text-red-500 bg-red-500/10">
                Hidden
              </Badge>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-bold uppercase tracking-tight text-foreground dark:text-white truncate">
              {item.alt || "CZP Gallery Image"}
            </h3>
            {item.active && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
          </div>
          <div className="flex items-center gap-3 text-[9px] font-mono uppercase tracking-tighter text-muted-foreground/60">
            <span>Pos: {item.order}</span>
            <span>•</span>
            <span className={cn(item.active ? "text-emerald-500/80" : "text-amber-500/80")}>
              {item.active ? "Visible on storefront" : "Hidden from storefront"}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 bg-accent/20 p-1.5 rounded-lg border border-border/50">
          <div className="flex flex-col gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 hover:text-primary hover:bg-primary/10" 
              onClick={(e) => { e.stopPropagation(); onMove("up"); }}
              title="Move Up"
            >
              <ArrowUp className="h-4 w-4"/>
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 hover:text-primary hover:bg-primary/10" 
              onClick={(e) => { e.stopPropagation(); onMove("down"); }}
              title="Move Down"
            >
              <ArrowDown className="h-4 w-4"/>
            </Button>
          </div>
          <div className="w-[1px] h-10 bg-border/50 mx-1" />
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10" 
            onClick={onEdit}
            title="Edit Details"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10" 
            onClick={onDelete}
            title="Delete Image"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function GalleryPanel() {
  const queryClient = useQueryClient();
  const fetchItems = useServerFn(getGalleryItems);
  const addItem = useServerFn(createGalleryItem);
  const editItem = useServerFn(updateGalleryItem);
  const removeItem = useServerFn(deleteGalleryItem);
  const reorderItemsFn = useServerFn(reorderGalleryItems);

  const { data: rawItems = [], isLoading } = useQuery({
    queryKey: ["admin-gallery-items"],
    queryFn: () => fetchItems({ data: { admin: true } }),
  });

  const [items, setItems] = useState<any[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (rawItems) {
      setItems(rawItems);
      setIsDirty(false);
    }
  }, [rawItems]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const result = arrayMove(items, oldIndex, newIndex);
        setIsDirty(true);
        return result;
      });
    }
  };

  const moveItem = (id: string, direction: "up" | "down") => {
    const index = items.findIndex((m) => m.id === id);
    if ((direction === "up" && index > 0) || (direction === "down" && index < items.length - 1)) {
      const newIndex = direction === "up" ? index - 1 : index + 1;
      const newItems = [...items];
      [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
      setItems(newItems);
      setIsDirty(true);
    }
  };

  const saveOrder = async () => {
    try {
      await reorderItemsFn({ data: { ids: items.map((m) => m.id) } });
      toast.success("Gallery order saved");
      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: ["admin-gallery-items"] });
    } catch (e: any) {
      toast.error(e.message || "Failed to save order");
    }
  };

  const addMutation = useMutation({
    mutationFn: (data: any) => addItem({ data }),
    onSuccess: () => {
      toast.success("Gallery image added");
      setIsAdding(false);
      queryClient.invalidateQueries({ queryKey: ["admin-gallery-items"] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to add"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => editItem({ data }),
    onSuccess: () => {
      toast.success("Gallery image updated");
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-gallery-items"] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to update"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeItem({ data: id }),
    onSuccess: () => {
      toast.success("Gallery image deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-gallery-items"] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to delete"),
  });

  if (isLoading) return <div className="p-12 text-center text-muted-foreground animate-pulse">Loading gallery...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between sticky top-0 z-20 py-4 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <GalleryThumbnails className="h-6 w-6 text-primary" />
            Gallery Management
          </h2>
          <p className="text-xs text-muted-foreground">Manage modified motorcycle builds gallery.</p>
        </div>
        <div className="flex gap-3">
          {isDirty && (
            <>
              <Button 
                onClick={() => { setItems(rawItems); setIsDirty(false); }} 
                variant="outline" 
                size="sm"
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" /> Reset
              </Button>
              <Button 
                onClick={saveOrder} 
                variant="onyx" 
                size="sm"
                className="gap-2 shadow-lg shadow-black/20"
              >
                <Save className="h-4 w-4" /> Save New Order
              </Button>
            </>
          )}
          <Button onClick={() => setIsAdding(true)} variant="red" size="sm" className="gap-2 shadow-lg shadow-red-500/20">
            <Plus className="h-4 w-4" /> Add Image
          </Button>
        </div>
      </div>

      <Alert className="bg-primary/5 dark:bg-primary/10 border-primary/20">
        <Info className="h-4 w-4 text-primary" />
        <AlertTitle className="text-primary font-bold uppercase tracking-widest text-[10px]">Gallery Instructions</AlertTitle>
        <AlertDescription className="text-xs text-foreground/80 dark:text-white/80">
          Images here are displayed in the main storefront Gallery. Use 1:1 square aspect ratio for best results.
        </AlertDescription>
      </Alert>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
        <SortableContext items={items.map((m) => m.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {items.map((m) => (
              <SortableGalleryItem 
                key={m.id} 
                id={m.id} 
                item={m} 
                onEdit={() => setEditingId(m.id)} 
                onDelete={() => {
                  if(confirm(`Are you sure you want to permanently delete this gallery image?`)) {
                    deleteMutation.mutate(m.id);
                  }
                }}
                onMove={(dir: "up" | "down") => moveItem(m.id, dir)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      
      {isAdding && (
        <GalleryItemForm 
          onSave={(d: any) => addMutation.mutate(d)} 
          onCancel={() => setIsAdding(false)} 
          isSaving={addMutation.isPending} 
        />
      )}
      
      {editingId && (
        <GalleryItemForm 
          initialData={items.find(m => m.id === editingId)} 
          onSave={(updates: any) => updateMutation.mutate({ id: editingId, updates })} 
          onCancel={() => setEditingId(null)} 
          isSaving={updateMutation.isPending} 
        />
      )}

      {items.length === 0 && !isAdding && (
        <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl bg-accent/20">
          <ImageIcon className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="text-lg font-bold uppercase tracking-tight text-foreground/60">Gallery is empty</h3>
          <Button onClick={() => setIsAdding(true)} variant="outline" className="mt-6">Add First Image</Button>
        </div>
      )}
    </div>
  );
}

function GalleryItemForm({ initialData, onSave, onCancel, isSaving }: any) {
  const [formData, setFormData] = useState({
    image_url: initialData?.image || "",
    alt_text: initialData?.alt || "",
    is_active: initialData?.active ?? true,
  });

  const [imageMode, setImageMode] = useState<"upload" | "url">(
    initialData?.image?.includes("supabase.co") ? "upload" : "url"
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-full max-w-lg border-primary/20 shadow-2xl overflow-hidden">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold uppercase tracking-tight text-primary">
              {initialData ? "Edit Gallery Image" : "New Gallery Image"}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel}><X className="h-4 w-4"/></Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-1">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Image</Label>
              <div className="flex gap-1 p-0.5 rounded-md bg-accent/40 border border-border">
                <Button type="button" variant="ghost" size="sm" className={cn("h-6 px-2 text-[9px] uppercase font-bold", imageMode === "upload" && "bg-background shadow-sm")} onClick={() => setImageMode("upload")}>Upload</Button>
                <Button type="button" variant="ghost" size="sm" className={cn("h-6 px-2 text-[9px] uppercase font-bold", imageMode === "url" && "bg-background shadow-sm")} onClick={() => setImageMode("url")}>URL</Button>
              </div>
            </div>

            {imageMode === "upload" ? (
              <SingleImageUpload 
                value={formData.image_url} 
                onChange={(url) => setFormData({ ...formData, image_url: url })} 
                bucket="products" 
                pathPrefix="gallery" 
                guideline="800x800 (1:1) recommended"
              />
            ) : (
              <Input value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} placeholder="Image URL" />
            )}
            
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Alt Text / Description</Label>
              <Input value={formData.alt_text} onChange={(e) => setFormData({ ...formData, alt_text: e.target.value })} placeholder="e.g. Modified Pulsar N160 Front View" />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
              <Label className="text-xs font-bold uppercase tracking-widest">Show on storefront</Label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
            <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
            <Button variant="red" size="sm" onClick={() => onSave(formData)} disabled={isSaving || !formData.image_url}>
              {isSaving ? "Saving..." : initialData ? "Update Image" : "Add to Gallery"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
