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
  Monitor,
  CheckCircle2,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  RotateCcw
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
  getAdminBikeModels, 
  createBikeModel, 
  updateBikeModel, 
  deleteBikeModel,
  reorderBikeModels 
} from "@/lib/bike-models.functions";
import { SingleImageUpload } from "@/components/admin/SingleImageUpload";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function SortableBikeModelItem({ id, model, onEdit, onDelete, onUpdateStatus, onMove }: any) {
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
      <div className={cn("h-1 w-full transition-colors", model.is_active ? "bg-primary" : "bg-muted")} />
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-5 items-center">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary p-2 rounded-md hover:bg-primary/5 transition-colors"
          title="Drag to reorder"
        >
          <GripVertical className="size-5" />
        </button>

        <div className="relative aspect-[3/2] w-full sm:w-40 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
          {model.image_url ? (
            <img 
              src={model.image_url} 
              alt={model.alt_text || model.name} 
              className="h-full w-full object-cover transition-transform group-hover:scale-105" 
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground/40">
              <ImageIcon className="h-6 w-6" />
            </div>
          )}
          {!model.is_active && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Badge variant="outline" className="text-[9px] uppercase tracking-wider border-red-500 text-red-500 bg-red-500/10">
                Inactive
              </Badge>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold uppercase tracking-tight text-foreground dark:text-white truncate">
              {model.name}
            </h3>
            {model.is_active && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
          </div>
          <p className="text-[10px] text-primary font-bold uppercase tracking-[0.2em] mb-2">
            {model.label || "Modification Parts"}
          </p>
          <div className="flex items-center gap-3 text-[9px] font-mono uppercase tracking-tighter text-muted-foreground/60">
            <span>Slug: {model.slug}</span>
            <span>•</span>
            <span>Current Pos: {model.sort_order}</span>
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
            title="Delete Model"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function BikeModelsPanel() {
  const queryClient = useQueryClient();
  const fetchModels = useServerFn(getAdminBikeModels);
  const addModel = useServerFn(createBikeModel);
  const editModel = useServerFn(updateBikeModel);
  const removeModel = useServerFn(deleteBikeModel);
  const reorderModelsFn = useServerFn(reorderBikeModels);

  const { data: rawModels = [], isLoading } = useQuery({
    queryKey: ["admin-bike-models"],
    queryFn: () => fetchModels({ data: undefined }),
  });

  const [models, setModels] = useState<any[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (rawModels) {
      setModels(rawModels);
      setIsDirty(false);
    }
  }, [rawModels]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setModels((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const result = arrayMove(items, oldIndex, newIndex);
        setIsDirty(true);
        return result;
      });
    }
  };

  const moveModel = (id: string, direction: "up" | "down") => {
    const index = models.findIndex((m) => m.id === id);
    if ((direction === "up" && index > 0) || (direction === "down" && index < models.length - 1)) {
      const newIndex = direction === "up" ? index - 1 : index + 1;
      const newModels = [...models];
      [newModels[index], newModels[newIndex]] = [newModels[newIndex], newModels[index]];
      setModels(newModels);
      setIsDirty(true);
    }
  };

  const saveOrder = async () => {
    try {
      await reorderModelsFn({ data: { ids: models.map((m) => m.id) } });
      toast.success("New order saved to live website");
      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: ["admin-bike-models"] });
      queryClient.invalidateQueries({ queryKey: ["storefront-bike-models"] });
    } catch (e: any) {
      toast.error(e.message || "Failed to save order");
    }
  };

  const addMutation = useMutation({
    mutationFn: (data: any) => addModel({ data }),
    onSuccess: () => {
      toast.success("Bike model added");
      setIsAdding(false);
      queryClient.invalidateQueries({ queryKey: ["admin-bike-models"] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to add"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => editModel({ data }),
    onSuccess: () => {
      toast.success("Bike model updated");
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-bike-models"] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to update"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeModel({ data: { id } }),
    onSuccess: () => {
      toast.success("Bike model deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-bike-models"] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to delete"),
  });

  if (isLoading) return <div className="p-12 text-center text-muted-foreground animate-pulse">Loading bike models...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between sticky top-0 z-20 py-4 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Monitor className="h-6 w-6 text-primary" />
            Bike Model Arrangement
          </h2>
          <p className="text-xs text-muted-foreground">Manual ordering for "Explore by Bike Model" storefront section.</p>
        </div>
        <div className="flex gap-3">
          {isDirty && (
            <>
              <Button 
                onClick={() => { setModels(rawModels); setIsDirty(false); }} 
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
            <Plus className="h-4 w-4" /> Add Bike Model
          </Button>
        </div>
      </div>

      <Alert className="bg-primary/5 dark:bg-primary/10 border-primary/20">
        <Info className="h-4 w-4 text-primary" />
        <AlertTitle className="text-primary font-bold uppercase tracking-widest text-[10px]">Ordering Instructions</AlertTitle>
        <AlertDescription className="text-xs text-foreground/80 dark:text-white/80">
          Use the <strong>Grip Icon</strong> to drag & drop models, or the <strong>Up/Down arrows</strong> for precise control. Click <strong>"Save New Order"</strong> to reflect changes on the website.
        </AlertDescription>
      </Alert>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
        <SortableContext items={models.map((m) => m.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {models.map((m) => (
              <SortableBikeModelItem 
                key={m.id} 
                id={m.id} 
                model={m} 
                onEdit={() => setEditingId(m.id)} 
                onDelete={() => {
                  if(confirm(`Are you sure you want to delete "${m.name}"?`)) {
                    deleteMutation.mutate(m.id);
                  }
                }}
                onMove={(dir: "up" | "down") => moveModel(m.id, dir)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      
      {isAdding && (
        <ModelForm 
          nextSortOrder={models.length}
          onSave={(d: any) => addMutation.mutate(d)} 
          onCancel={() => setIsAdding(false)} 
          isSaving={addMutation.isPending} 
        />

      )}
      
      {editingId && (
        <ModelForm 
          initialData={models.find(m => m.id === editingId)} 
          onSave={(updates: any) => updateMutation.mutate({ id: editingId, updates })} 
          onCancel={() => setEditingId(null)} 
          isSaving={updateMutation.isPending} 
        />
      )}

      {models.length === 0 && !isAdding && (
        <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl bg-accent/20">
          <ImageIcon className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="text-lg font-bold uppercase tracking-tight text-foreground/60">No Bike Models Found</h3>
          <Button onClick={() => setIsAdding(true)} variant="outline" className="mt-6">Add First Model</Button>
        </div>
      )}
    </div>
  );
}

function ModelForm({ initialData, onSave, onCancel, isSaving, nextSortOrder = 0 }: any) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    slug: initialData?.slug || "",
    label: initialData?.label || "Modification Parts",
    image_url: initialData?.image_url || "",
    alt_text: initialData?.alt_text || "",
    // New models append to the end of the manual order instead of jumping to the front.
    sort_order: initialData?.sort_order ?? nextSortOrder,
    is_active: initialData?.is_active ?? true,
  });


  const [imageMode, setImageMode] = useState<"upload" | "url">(
    initialData?.image_url && !initialData?.image_url.startsWith('http') ? "upload" : "url"
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-full max-w-2xl border-primary/20 shadow-2xl overflow-hidden">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold uppercase tracking-tight text-primary">
              {initialData ? `Edit: ${initialData.name}` : "New Bike Model"}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel}><X className="h-4 w-4"/></Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Bike Name</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Pulsar N160" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">URL Slug</Label>
                <Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="e.g. pulsar-n160" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Label</Label>
                <Input value={formData.label} onChange={(e) => setFormData({ ...formData, label: e.target.value })} placeholder="e.g. Modification Parts" />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
                <Label className="text-xs font-bold uppercase tracking-widest">Active Storefront</Label>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 space-y-2">
                <div className="flex items-center gap-2 text-primary">
                  <Info className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Smart Image Recommendation</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Best for: <strong className="text-foreground">1200x800px (3:2 ratio)</strong>.
                  Format: <strong className="text-foreground">WebP/AVIF</strong>.
                  Layout: <strong className="text-foreground">Centered subject with padding</strong>.
                </p>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="text-[9px] bg-background/50 p-1.5 rounded border border-border/50">
                    <span className="block text-muted-foreground uppercase mb-0.5">Performance</span>
                    <span className="text-emerald-500 font-medium">95+ Score Target</span>
                  </div>
                  <div className="text-[9px] bg-background/50 p-1.5 rounded border border-border/50">
                    <span className="block text-muted-foreground uppercase mb-0.5">SEO</span>
                    <span className="text-cyan-500 font-medium">Alt Text Required</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-1">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Model Image</Label>
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
                  pathPrefix="bike-models" 
                  guideline="1200x800 (3:2) recommended"
                />
              ) : (
                <div className="space-y-2">
                  <Input 
                    value={formData.image_url} 
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} 
                    placeholder="https://example.com/bike.jpg" 
                    className={cn(formData.image_url && !formData.image_url.startsWith('http') && "border-destructive")}
                  />
                  {formData.image_url && !formData.image_url.startsWith('http') && (
                    <p className="text-[9px] text-destructive font-bold uppercase tracking-tight">Invalid URL format</p>
                  )}
                </div>
              )}
              
              {formData.image_url && (
                <div className="relative aspect-[3/2] w-full overflow-hidden rounded-md border border-border bg-muted mt-2">
                  <img 
                    src={formData.image_url} 
                    alt="Preview" 
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder-bike.jpg";
                      toast.error("Failed to load image from URL");
                    }}
                  />
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-black/60 backdrop-blur-sm text-[9px] border-white/10">Preview</Badge>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Alt Text (SEO)</Label>
                <Input value={formData.alt_text} onChange={(e) => setFormData({ ...formData, alt_text: e.target.value })} placeholder="Image description" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
            <Button variant="ghost" onClick={onCancel} className="uppercase font-bold tracking-widest text-xs">Cancel</Button>
            <Button onClick={() => onSave(formData)} variant="red" disabled={isSaving} className="px-8 shadow-3d-primary active:translate-y-[2px] transition-all">
              {isSaving ? "Saving..." : (initialData ? "Update Model" : "Create Model")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
