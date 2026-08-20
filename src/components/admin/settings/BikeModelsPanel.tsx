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
  Eye, 
  EyeOff, 
  Info, 
  Image as ImageIcon,
  Monitor,
  CheckCircle2,
  AlertCircle,
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group overflow-hidden rounded-lg border border-border bg-card transition-colors",
        isDragging ? "border-primary/50 ring-2 ring-primary/20" : "hover:border-primary/30"
      )}
    >
      <div className={cn("h-1 w-full transition-colors", model.is_active ? "bg-primary" : "bg-muted")} />
      <div className="p-4 sm:p-6 flex flex-col sm:flex-row gap-6">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground self-center"
        >
          <GripVertical className="size-5" />
        </button>

        <div className="relative aspect-[3/2] w-full sm:w-48 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
          {model.image_url ? (
            <img 
              src={model.image_url} 
              alt={model.alt_text || model.name} 
              className="h-full w-full object-cover" 
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground/40">
              <ImageIcon className="h-8 w-8" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold uppercase tracking-tight text-foreground dark:text-white">
                  {model.name}
                </h3>
              </div>
              <p className="text-xs text-primary font-bold uppercase tracking-[0.2em]">
                {model.label || "Modification Parts"}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => onMove("up")}><ArrowUp className="h-4 w-4"/></Button>
              <Button variant="ghost" size="icon" onClick={() => onMove("down")}><ArrowDown className="h-4 w-4"/></Button>
              <Button variant="ghost" size="icon" onClick={onEdit}><Edit2 className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="text-destructive" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
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
  const reorderModels = useServerFn(reorderBikeModels);

  const { data: rawModels = [], isLoading } = useQuery({
    queryKey: ["admin-bike-models"],
    queryFn: () => fetchModels({ data: undefined }),
  });

  const [models, setModels] = useState<any[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    setModels(rawModels);
  }, [rawModels]);

  const sensors = useSensors(
    useSensor(PointerSensor),
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
      await reorderModels({ data: { ids: models.map((m) => m.id) } });
      toast.success("Order saved");
      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: ["admin-bike-models"] });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const addMutation = useMutation({
    mutationFn: (data: any) => addModel({ data }),
    onSuccess: () => {
      toast.success("Added");
      setIsAdding(false);
      queryClient.invalidateQueries({ queryKey: ["admin-bike-models"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => editModel({ data }),
    onSuccess: () => {
      toast.success("Updated");
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-bike-models"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeModel({ data: { id } }),
    onSuccess: () => {
      toast.success("Deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-bike-models"] });
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Bike Model Management</h2>
        <div className="flex gap-2">
          {isDirty && <Button onClick={saveOrder} variant="primary">Save Order</Button>}
          <Button onClick={() => setIsAdding(true)} variant="red">Add Model</Button>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
        <SortableContext items={models.map((m) => m.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {models.map((m) => (
              <SortableBikeModelItem 
                key={m.id} 
                id={m.id} 
                model={m} 
                onEdit={() => setEditingId(m.id)} 
                onDelete={() => deleteMutation.mutate(m.id)}
                onMove={(dir: "up" | "down") => moveModel(m.id, dir)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      
      {isAdding && <ModelForm onSave={(d) => addMutation.mutate(d)} onCancel={() => setIsAdding(false)} isSaving={addMutation.isPending} />}
      {editingId && (
        <ModelForm 
          initialData={models.find(m => m.id === editingId)} 
          onSave={(updates) => updateMutation.mutate({ id: editingId, updates })} 
          onCancel={() => setEditingId(null)} 
          isSaving={updateMutation.isPending} 
        />
      )}
    </div>
  );
}

function ModelForm({ initialData, onSave, onCancel, isSaving }: any) {
  const [formData, setFormData] = useState(initialData || { name: "", slug: "", sort_order: 0, is_active: true });
  return (
    <Card className="p-6">
      <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Name" />
      <Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="Slug" />
      <div className="flex gap-2 mt-4">
        <Button onClick={() => onSave(formData)}>{isSaving ? "Saving..." : "Save"}</Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </Card>
  );
}
