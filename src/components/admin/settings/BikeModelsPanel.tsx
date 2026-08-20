import React, { useState } from "react";
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
  AlertCircle
} from "lucide-react";

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

export function BikeModelsPanel() {
  const queryClient = useQueryClient();
  const fetchModels = useServerFn(getAdminBikeModels);
  const addModel = useServerFn(createBikeModel);
  const editModel = useServerFn(updateBikeModel);
  const removeModel = useServerFn(deleteBikeModel);
  const reorderModels = useServerFn(reorderBikeModels);

  const { data: models = [], isLoading } = useQuery({
    queryKey: ["admin-bike-models"],
    queryFn: () => fetchModels({ data: undefined }),
  });

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const addMutation = useMutation({
    mutationFn: (data: any) => addModel({ data }),
    onSuccess: () => {
      toast.success("Bike model added");
      setIsAdding(false);
      queryClient.invalidateQueries({ queryKey: ["admin-bike-models"] });
      queryClient.invalidateQueries({ queryKey: ["storefront-bike-models"] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to add bike model"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; updates: any }) => editModel({ data }),
    onSuccess: () => {
      toast.success("Bike model updated");
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-bike-models"] });
      queryClient.invalidateQueries({ queryKey: ["storefront-bike-models"] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to update bike model"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeModel({ data: { id } }),
    onSuccess: () => {
      toast.success("Bike model deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-bike-models"] });
      queryClient.invalidateQueries({ queryKey: ["storefront-bike-models"] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to delete bike model"),
  });

  const reorderMutation = useMutation({
    mutationFn: (ids: string[]) => reorderModels({ data: { ids } }),
    onSuccess: () => {
      toast.success("Order updated");
      queryClient.invalidateQueries({ queryKey: ["admin-bike-models"] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to reorder"),
  });

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading bike models...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Monitor className="h-6 w-6 text-primary" />
            Bike Model Management
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage the "Explore My Bike Models" and "Bike Models" storefront sections.
          </p>
        </div>
        <Button onClick={() => setIsAdding(true)} variant="red" size="sm" className="gap-2 shadow-lg shadow-red-500/20">
          <Plus className="h-4 w-4" /> Add Bike Model
        </Button>
      </div>

      <Alert className="bg-primary/5 dark:bg-primary/10 border-primary/20">
        <Info className="h-4 w-4 text-primary" />
        <AlertTitle className="text-primary font-bold uppercase tracking-widest text-[10px]">Image Specifications</AlertTitle>
        <AlertDescription className="text-xs text-foreground/80 dark:text-white/80">
          Recommended resolution: <strong>1200 × 800px (3:2 ratio)</strong>. Max size: 200KB. WebP/AVIF preferred.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4">
        {isAdding && (
          <ModelForm
            onSave={(data) => addMutation.mutate(data)}
            onCancel={() => setIsAdding(false)}
            isSaving={addMutation.isPending}
          />
        )}

        {models.map((model) => (
          <div key={model.id}>
            {editingId === model.id ? (
              <ModelForm
                initialData={model}
                onSave={(updates) => updateMutation.mutate({ id: model.id, updates })}
                onCancel={() => setEditingId(null)}
                isSaving={updateMutation.isPending}
              />
            ) : (
              <Card className="border-border bg-card dark:bg-black/40 backdrop-blur-sm group overflow-hidden">
                <div className={cn("h-1 w-full transition-colors", model.is_active ? "bg-primary" : "bg-muted")} />
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* Thumbnail Preview */}
                    <div className="relative aspect-[3/2] w-full sm:w-48 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                      {model.image_url ? (
                        <img 
                          src={model.image_url} 
                          alt={model.alt_text || model.name} 
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground/40">
                          <ImageIcon className="h-8 w-8" />
                        </div>
                      )}
                      {!model.is_active && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Badge variant="outline" className="text-[10px] uppercase tracking-wider border-red-500 text-red-500 bg-red-500/10">
                            Inactive
                          </Badge>
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
                            {model.is_active && (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            )}
                          </div>
                          <p className="text-xs text-primary font-bold uppercase tracking-[0.2em]">
                            {model.label || "Modification Parts"}
                          </p>
                          <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-tighter text-muted-foreground/60 mt-1">
                            <span>Slug: {model.slug}</span>
                            <span>•</span>
                            <span>Order: {model.sort_order}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground hover:text-primary transition-colors"
                            onClick={() => setEditingId(model.id)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground hover:text-destructive transition-colors"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this bike model?")) {
                                deleteMutation.mutate(model.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 pt-2 border-t border-border/50">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={!!model.is_active}
                            onCheckedChange={(checked) => 
                              updateMutation.mutate({ 
                                id: model.id, 
                                updates: { is_active: checked } 
                              })
                            }
                          />
                          <Label className="text-[10px] font-bold uppercase tracking-widest cursor-pointer">
                            {model.is_active ? "Published" : "Draft Mode"}
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ))}
        
        {models.length === 0 && !isAdding && (
          <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl bg-accent/20">
            <ImageIcon className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-bold uppercase tracking-tight text-foreground/60">No Bike Models Found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
              Start adding bike models to display them in the storefront explore section.
            </p>
            <Button onClick={() => setIsAdding(true)} variant="outline" className="mt-6 border-primary/20 hover:bg-primary/5">
              Add First Model
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function ModelForm({ 
  initialData, 
  onSave, 
  onCancel, 
  isSaving 
}: { 
  initialData?: any; 
  onSave: (data: any) => void; 
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    slug: initialData?.slug || "",
    label: initialData?.label || "Modification Parts",
    image_url: initialData?.image_url || "",
    alt_text: initialData?.alt_text || "",
    sort_order: initialData?.sort_order || 0,
    is_active: initialData?.is_active ?? true,
  });

  const [imageMode, setImageMode] = useState<"upload" | "url">(
    initialData?.image_url?.includes("supabase.co") ? "upload" : "url"
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const generateSlug = () => {
    if (!formData.name) return;
    const slug = formData.name
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
    setFormData(prev => ({ ...prev, slug }));
  };

  return (
    <Card className="border-primary/20 bg-card shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
      <CardHeader className="pb-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-lg font-bold uppercase text-primary">
            {initialData ? `Edit: ${initialData.name}` : "New Bike Model"}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Bike Name
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Pulsar N160"
                    required
                    className="h-11 border-border focus:ring-primary/20"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={generateSlug}
                    className="h-11 px-3 text-[10px] uppercase font-bold tracking-tighter"
                  >
                    Auto Slug
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  URL Slug
                </Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g. pulsar-n160"
                  required
                  className="h-11 font-mono text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="label" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Display Label (Sub-label)
                </Label>
                <Input
                  id="label"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="e.g. Modification Parts"
                  className="h-11"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sort_order" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Display Order
                  </Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Status
                  </Label>
                  <div className="flex items-center gap-3 h-11 px-3 border border-border rounded-md bg-accent/20">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <span className="text-xs font-bold uppercase tracking-tighter">
                      {formData.is_active ? "Active" : "Draft"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Bike Model Image
                  </Label>
                  <div className="flex p-0.5 rounded-md bg-accent/40 border border-border">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-6 px-2 text-[9px] uppercase font-bold tracking-tighter rounded-sm",
                        imageMode === "upload" && "bg-background shadow-sm text-primary"
                      )}
                      onClick={() => setImageMode("upload")}
                    >
                      Upload
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-6 px-2 text-[9px] uppercase font-bold tracking-tighter rounded-sm",
                        imageMode === "url" && "bg-background shadow-sm text-primary"
                      )}
                      onClick={() => setImageMode("url")}
                    >
                      URL
                    </Button>
                  </div>
                </div>

                {imageMode === "upload" ? (
                  <SingleImageUpload
                    value={formData.image_url}
                    onChange={(url) => setFormData({ ...formData, image_url: url })}
                    bucket="products"
                    pathPrefix="bike-models"
                    guideline="1200x800px (3:2) WebP recommended."
                  />
                ) : (
                  <div className="space-y-2">
                    <Input
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="Paste image URL here"
                      className="h-11 font-mono text-xs"
                    />
                    {formData.image_url && (
                      <div className="relative aspect-[3/2] w-full overflow-hidden rounded-lg border border-border bg-muted">
                        <img src={formData.image_url} className="h-full w-full object-cover" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="alt_text" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Image Alt Text (SEO)
                </Label>
                <Input
                  id="alt_text"
                  value={formData.alt_text}
                  onChange={(e) => setFormData({ ...formData, alt_text: e.target.value })}
                  placeholder="e.g. Bajaj Pulsar N160 Modification Accessories"
                  className="h-11"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-border/50">
            <Button type="button" variant="ghost" onClick={onCancel} className="uppercase font-bold tracking-widest text-xs">
              Discard Changes
            </Button>
            <Button 
              type="submit" 
              variant="red" 
              disabled={isSaving}
              className="px-8 shadow-3d-primary active:translate-y-[2px] transition-all"
            >
              {isSaving ? "Saving..." : (initialData ? "Update Model" : "Create Model")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
