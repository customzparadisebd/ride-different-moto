import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, Save, X, Upload, Loader2, Link2, Layout, Settings2, GripVertical, Monitor } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getHeroSlides,
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
  restoreOldHeroSlides,
  getActiveBikeModelsForAdmin,
  updateBikeModel,
  reorderHeroSlides,
  updateBikeModelImage,
} from "@/lib/hero.functions";
import { SingleImageUpload } from "@/components/admin/SingleImageUpload";
import { ImageSpecGuidance } from "@/components/admin/hero/ImageSpecGuidance";
import { HeroSlidePreview } from "@/components/admin/hero/HeroSlidePreview";

export const Route = createFileRoute("/_authenticated/ad/hero")({
  head: () => ({
    meta: [
      { title: "Manage Hero Slider — CZP Ops" },
      { property: "og:title", content: "Manage Hero Slider — CZP Ops" },
      { name: "description", content: "Customz Paradise BD Admin Panel" },
    ],
  }),
  component: AdminHeroSlides,
});

function AdminHeroSlides() {
  const queryClient = useQueryClient();
  const fetchSlides = useServerFn(getHeroSlides);
  const addSlide = useServerFn(createHeroSlide);
  const editSlide = useServerFn(updateHeroSlide);
  const removeSlide = useServerFn(deleteHeroSlide);
  const restoreSlides = useServerFn(restoreOldHeroSlides);
  const fetchBikeModels = useServerFn(getActiveBikeModelsForAdmin);
  const editBikeModel = useServerFn(updateBikeModel);
  const reorderSlides = useServerFn(reorderHeroSlides);
  const editBikeModelImage = useServerFn(updateBikeModelImage);

  const { data: slides = [], isLoading: slidesLoading } = useQuery({
    queryKey: ["hero-slides-admin"],
    queryFn: () => fetchSlides({ data: { admin: true } }),
  });

  const { data: bikeModels = [], isLoading: modelsLoading } = useQuery({
    queryKey: ["bike-models-admin"],
    queryFn: () => fetchBikeModels(),
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mobileFileInputRef = useRef<HTMLInputElement>(null);

  const [previewSlide, setPreviewSlide] = useState<any>(null);

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "desktop" | "mobile",
    callback: (url: string) => void,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingType(`${type}-${editingId || "new"}`);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    try {
      const res = await fetch("/api/hero/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }

      const { url } = await res.json();
      callback(url);
      toast.success(`${type === "desktop" ? "Desktop" : "Mobile"} banner uploaded`);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploadingType(null);
    }
  };

  const addMutation = useMutation({
    mutationFn: addSlide,
    onSuccess: () => {
      toast.success("Slide added");
      setIsAdding(false);
      queryClient.invalidateQueries({ queryKey: ["hero-slides-admin"] });
      queryClient.invalidateQueries({ queryKey: ["hero-slides"] });
    },
    onError: (e: any) => {
      console.error("Add slide error:", e);
      toast.error(e.message || "Failed to add slide. Please check your inputs.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: editSlide,
    onSuccess: () => {
      toast.success("Slide updated");
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["hero-slides-admin"] });
      queryClient.invalidateQueries({ queryKey: ["hero-slides"] });
    },
    onError: (e: any) => {
      console.error("Update slide error:", e);
      toast.error(e.message || "Failed to update slide. Please check your inputs.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: removeSlide,
    onSuccess: () => {
      toast.success("Slide deleted");
      queryClient.invalidateQueries({ queryKey: ["hero-slides-admin"] });
      queryClient.invalidateQueries({ queryKey: ["hero-slides"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to delete slide"),
  });

  const restoreMutation = useMutation({
    mutationFn: () => restoreSlides({ data: {} }),
    onSuccess: () => {
      toast.success("Old hero slides restored");
      queryClient.invalidateQueries({ queryKey: ["hero-slides-admin"] });
      queryClient.invalidateQueries({ queryKey: ["hero-slides"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to restore slides"),
  });

  const bikeModelMutation = useMutation({
    mutationFn: editBikeModel,
    onSuccess: () => {
      toast.success("Bike model updated");
      queryClient.invalidateQueries({ queryKey: ["bike-models-admin"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to update bike model"),
  });

  const handleSave = (id: string, formData: FormData) => {
    const bikeModelId = formData.get("bike_model_id") as string;
    const data = {
      title: formData.get("title") as string,
      subtitle: formData.get("subtitle") as string,
      image_url: formData.get("image_url") as string,
      mobile_image_url: (formData.get("mobile_image_url") as string) || null,
      link_url: formData.get("link_url") as string,
      sort_order: parseInt(formData.get("sort_order") as string) || 0,
      is_active: formData.get("is_active") === "on",
      bike_model_id: bikeModelId === "none" ? null : (bikeModelId || null),
    };
    updateMutation.mutate({ data: { id, updates: data } });
  };

  const handleAdd = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const bikeModelId = formData.get("bike_model_id") as string;
    const data = {
      title: formData.get("title") as string,
      subtitle: formData.get("subtitle") as string,
      image_url: formData.get("image_url") as string,
      mobile_image_url: (formData.get("mobile_image_url") as string) || null,
      link_url: formData.get("link_url") as string,
      sort_order: parseInt(formData.get("sort_order") as string) || 0,
      is_active: true,
      bike_model_id: bikeModelId === "none" ? null : (bikeModelId || null),
    };
    addMutation.mutate({ data });
  };

  const reorderMutation = useMutation({
    mutationFn: reorderSlides,
    onSuccess: () => {
      toast.success("Order updated");
      queryClient.invalidateQueries({ queryKey: ["hero-slides-admin"] });
      queryClient.invalidateQueries({ queryKey: ["hero-slides"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to reorder"),
  });

  const bikeImageMutation = useMutation({
    mutationFn: editBikeModelImage,
    onSuccess: () => {
      toast.success("Bike image updated");
      queryClient.invalidateQueries({ queryKey: ["bike-models-admin"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to update bike image"),
  });

  const handleSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) return;

    const items = [...slides].sort((a, b) => a.order - b.order);
    const draggedItem = items[dragItem.current];
    if (draggedItem) {
      const newItems = [...items];
      newItems.splice(dragItem.current, 1);
      newItems.splice(dragOverItem.current, 0, draggedItem);

      dragItem.current = null;
      dragOverItem.current = null;
      reorderMutation.mutate({ data: { ids: newItems.map((s) => s.id) } });
    }
  };

  if (slidesLoading || modelsLoading)
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-wide">Homepage Visuals</h1>
          <p className="text-sm text-muted-foreground">
            Manage the Hero Slider banners and Bike Model Explorer cards.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              // Collect all active slides for a full slider preview
              const activeSlides = slides
                .filter(s => s.active)
                .sort((a, b) => a.order - b.order)
                .map(s => ({
                  bikeName: s.bikeName,
                  label: s.label,
                  image: s.image,
                  mobileImage: s.mobileImage,
                  bikeSlug: s.bikeSlug,
                  isFullBanner: s.isFullBanner
                })) as any;

              
              if (activeSlides.length > 0) {
                // We use the first slide as the "current" one in the dialog state
                // but the dialog renders the whole slider.
                setPreviewSlide(activeSlides[0]);
              } else {
                toast.error("No active slides to preview.");
              }
            }}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Monitor className="h-4 w-4" /> Full Slider Preview
          </Button>
          <Button
            onClick={() => restoreMutation.mutate()}
            variant="outline"
            size="sm"
            disabled={restoreMutation.isPending}
          >
            {restoreMutation.isPending ? "Restoring..." : "Restore Defaults"}
          </Button>
        </div>

      </div>

      <Tabs defaultValue="hero" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1">
          <TabsTrigger value="hero" className="gap-2 font-display text-sm uppercase tracking-wide">
            <Layout className="h-4 w-4" /> Hero Slider
          </TabsTrigger>
          <TabsTrigger value="models" className="gap-2 font-display text-sm uppercase tracking-wide">
            <Settings2 className="h-4 w-4" /> Bike Explorer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hero" className="mt-6 space-y-6 animate-in fade-in duration-500">
          <div className="flex justify-end">
            {!isAdding && (
              <Button onClick={() => setIsAdding(true)} variant="red" size="sm" className="gap-2 shadow-lg shadow-red-500/20">
                <Plus className="h-4 w-4" /> Add New Slide
              </Button>
            )}
          </div>

          {isAdding && (
            <Card className="border-primary/20 bg-card shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="font-display text-lg font-bold uppercase text-primary">New Hero Slide</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <form 
                  id="new-slide-form"
                  onSubmit={handleAdd} 
                  className="grid gap-6 sm:grid-cols-2"
                >
                  <div className="space-y-2">
                    <Label htmlFor="title">Slide Title (Main Heading)</Label>
                    <Input id="title" name="title" required placeholder="e.g. Pulsar N160" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bike_model_id">Link to Bike Model (Optional)</Label>
                    <Select name="bike_model_id">
                      <SelectTrigger>
                        <SelectValue placeholder="Select existing model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None / Manual Link</SelectItem>
                        {bikeModels.map((m: any) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name} ({m.slug})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subtitle">Subtitle (Optional)</Label>
                    <Input id="subtitle" name="subtitle" placeholder="e. eyebrow text" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="image_url">Desktop Image URL</Label>
                    <div className="flex gap-2">
                      <Input id="image_url" name="image_url" required placeholder="CDN URL preferred" />
                      <Button aria-label="Upload desktop banner"
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingType === "desktop-new"}
                      >
                        {uploadingType === "desktop-new" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                      </Button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) =>
                          handleFileUpload(e, "desktop", (url) => {
                            const input = document.getElementById("image_url") as HTMLInputElement;
                            if (input) input.value = url;
                          })
                        }
                      />
                    </div>
                    <ImageSpecGuidance 
                      type="desktop" 
                      onPreview={() => {
                        const form = document.getElementById("new-slide-form") as HTMLFormElement;
                        const fd = new FormData(form);
                        setPreviewSlide({
                          bikeName: fd.get("title") as string,
                          subtitle: fd.get("subtitle") as string,
                          image: fd.get("image_url") as string,
                          mobileImage: fd.get("mobile_image_url") as string,
                          bikeSlug: bikeModels.find(m => m.id === fd.get("bike_model_id"))?.slug || fd.get("link_url") as string,
                        });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobile_image_url">Mobile Image URL</Label>
                    <div className="flex gap-2">
                      <Input id="mobile_image_url" name="mobile_image_url" placeholder="CDN URL preferred" />
                      <Button aria-label="Upload mobile image"
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => mobileFileInputRef.current?.click()}
                        disabled={uploadingType === "mobile-new"}
                      >
                        {uploadingType === "mobile-new" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                      </Button>
                      <input
                        type="file"
                        ref={mobileFileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) =>
                          handleFileUpload(e, "mobile", (url) => {
                            const input = document.getElementById("mobile_image_url") as HTMLInputElement;
                            if (input) input.value = url;
                          })
                        }
                      />
                    </div>
                    <ImageSpecGuidance 
                      type="mobile" 
                      onPreview={() => {
                        const form = document.getElementById("new-slide-form") as HTMLFormElement;
                        const fd = new FormData(form);
                        setPreviewSlide({
                          bikeName: fd.get("title") as string,
                          subtitle: fd.get("subtitle") as string,
                          image: fd.get("image_url") as string,
                          mobileImage: fd.get("mobile_image_url") as string,
                          bikeSlug: bikeModels.find(m => m.id === fd.get("bike_model_id"))?.slug || fd.get("link_url") as string,
                        });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="link_url">Manual Destination (if no model selected)</Label>
                    <Input id="link_url" name="link_url" placeholder="e.g. all-products" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sort_order">Sort Order</Label>
                    <Input id="sort_order" name="sort_order" type="number" defaultValue={slides.length + 1} />
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" variant="red" className="w-full shadow-lg shadow-red-500/20" disabled={addMutation.isPending}>
                      {addMutation.isPending ? "Creating..." : "Create Slide"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6">
            {slides.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
                No slides found.
              </div>
            ) : (
              [...slides]
                .sort((a, b) => a.order - b.order)
                .map((slide, index) => (
                  <div
                    key={slide.id}
                    draggable={!editingId}
                    onDragStart={() => (dragItem.current = index)}
                    onDragEnter={() => (dragOverItem.current = index)}
                    onDragEnd={handleSort}
                    onDragOver={(e) => e.preventDefault()}
                    className={`group relative overflow-hidden rounded-xl border transition-all duration-300 ${
                      slide.active ? "border-border bg-card shadow-sm" : "border-dashed border-muted-foreground/30 bg-muted/5 opacity-80"
                    } ${editingId === slide.id ? "ring-2 ring-primary shadow-2xl scale-[1.01]" : "hover:border-primary/50"} ${!editingId ? "cursor-move" : ""}`}
                  >
                    {editingId === slide.id ? (
                       <form
                        id={`edit-form-${slide.id}`}
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSave(slide.id, new FormData(e.currentTarget));
                        }}
                        className="p-6"
                      >
                        <div className="mb-4 grid gap-6 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Title</Label>
                            <Input name="title" defaultValue={slide.bikeName} required />
                          </div>
                          <div className="space-y-2">
                            <Label>Linked Bike Model</Label>
                            <Select name="bike_model_id" defaultValue={slide.bikeModelId || "none"}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">None / Manual Link</SelectItem>
                                {bikeModels.map((m: any) => (
                                  <SelectItem key={m.id} value={m.id}>
                                    {m.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Subtitle</Label>
                            <Input name="subtitle" defaultValue={slide.label || ""} />
                          </div>
                          <div className="space-y-2">
                            <Label>Desktop Image URL</Label>
                            <div className="flex gap-2">
                              <Input name="image_url" id={`img-${slide.id}`} defaultValue={slide.image} required />
                              <Button aria-label="Upload desktop banner"
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingType === `desktop-${slide.id}`}
                              >
                                {uploadingType === `desktop-${slide.id}` ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Upload className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            <ImageSpecGuidance 
                              type="desktop" 
                              onPreview={() => {
                                const form = document.getElementById(`edit-form-${slide.id}`) as HTMLFormElement;
                                const fd = new FormData(form);
                                setPreviewSlide({
                                  bikeName: fd.get("title") as string,
                                  subtitle: fd.get("subtitle") as string,
                                  image: fd.get("image_url") as string,
                                  mobileImage: fd.get("mobile_image_url") as string,
                                  bikeSlug: bikeModels.find(m => m.id === fd.get("bike_model_id"))?.slug || fd.get("link_url") as string,
                                });
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Mobile Image URL</Label>
                            <div className="flex gap-2">
                              <Input name="mobile_image_url" id={`mob-${slide.id}`} defaultValue={slide.mobileImage || ""} />
                              <Button aria-label="Upload mobile banner"
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => mobileFileInputRef.current?.click()}
                                disabled={uploadingType === `mobile-${slide.id}`}
                              >
                                {uploadingType === `mobile-${slide.id}` ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Upload className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            <ImageSpecGuidance 
                              type="mobile" 
                              onPreview={() => {
                                const form = document.getElementById(`edit-form-${slide.id}`) as HTMLFormElement;
                                const fd = new FormData(form);
                                setPreviewSlide({
                                  bikeName: fd.get("title") as string,
                                  subtitle: fd.get("subtitle") as string,
                                  image: fd.get("image_url") as string,
                                  mobileImage: fd.get("mobile_image_url") as string,
                                  bikeSlug: bikeModels.find(m => m.id === fd.get("bike_model_id"))?.slug || fd.get("link_url") as string,
                                });
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Manual Link URL</Label>
                            <Input name="link_url" defaultValue={slide.bikeSlug} />
                          </div>
                          <div className="space-y-2">
                            <Label>Order</Label>
                            <Input name="sort_order" type="number" defaultValue={slide.order} />
                          </div>
                          <div className="flex items-center gap-2 pt-8">
                            <Checkbox id={`act-${slide.id}`} name="is_active" defaultChecked={slide.active} />
                            <Label htmlFor={`act-${slide.id}`}>Active Banner</Label>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 border-t pt-4">
                          <Button type="button" variant="ghost" size="sm" onClick={() => setEditingId(null)}>Cancel</Button>
                          <Button type="submit" variant="red" size="sm" className="gap-2 shadow-lg shadow-red-500/20" disabled={updateMutation.isPending}>
                            <Save className="h-4 w-4" /> {updateMutation.isPending ? "Saving..." : "Save Changes"}
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex flex-col sm:flex-row">
                        <div className="relative h-48 w-full shrink-0 overflow-hidden sm:h-auto sm:w-64 bg-onyx/50">
                          <img
                            src={slide.image}
                            alt={slide.alt}
                            className="h-full w-full object-cover opacity-80 transition-transform group-hover:scale-105 duration-700"
                          />
                          {!slide.active && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                              <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white border border-white/20">
                                Inactive
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-1 flex-col justify-between p-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <GripVertical className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary border border-primary/20">
                                  {index + 1}
                                </span>
                                <h3 className="font-display text-xl font-bold uppercase tracking-wide">
                                  {slide.bikeName}
                                </h3>
                              </div>
                              {slide.label && (
                                <p className="text-xs text-muted-foreground">{slide.label}</p>
                              )}
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary" onClick={() => setEditingId(slide.id)}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => {
                                if (confirm("Delete this slide?")) deleteMutation.mutate({ data: slide.id });
                              }}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-4 text-[10px]">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Link2 className="h-3 w-3" />
                              <span className="font-semibold uppercase tracking-tighter opacity-50">Link:</span>
                              <code className="rounded bg-muted px-1 py-0.5 text-primary">{slide.bikeSlug}</code>
                            </div>
                            {slide.bikeModelId && (
                              <div className="flex items-center gap-1 text-primary/70">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                <span className="font-semibold uppercase tracking-tighter">Mapped to Bike Model</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="models" className="mt-6 animate-in fade-in duration-500">
          <Card className="border-border bg-card/50">
            <CardHeader>
              <CardTitle className="font-display text-lg font-bold uppercase">Bike Explorer Controls</CardTitle>
              <CardDescription>Select which bike models appear in the homepage explorer carousel.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {bikeModels.map((model: any) => (
                  <div key={model.id} className="flex flex-col gap-4 rounded-lg border bg-muted/30 p-4 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-20 shrink-0 overflow-hidden rounded bg-black/20">
                        {model.image_url ? (
                          <img src={model.image_url} alt={model.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[8px] uppercase text-muted-foreground">No Image</div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="font-display font-bold uppercase tracking-wide">{model.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{model.slug}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-6">
                      <div className="flex-1 min-w-[200px]">
                        <SingleImageUpload
                          value={model.image_url || ""}
                          onChange={(url) => bikeImageMutation.mutate({ data: { id: model.id, imageUrl: url } })}
                          guideline="Bike Explorer Card (3:2 suggested)"
                          bucket="hero"
                          pathPrefix="bikes"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`order-${model.id}`} className="text-[10px] uppercase text-muted-foreground">Order</Label>
                        <Input
                          id={`order-${model.id}`}
                          type="number"
                          className="h-8 w-16 text-center text-xs"
                          defaultValue={model.sort_order}
                          onBlur={(e) => {
                            const val = parseInt(e.target.value);
                            if (val !== model.sort_order) {
                              bikeModelMutation.mutate({ data: { id: model.id, updates: { sort_order: val } } });
                            }
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`active-model-${model.id}`}
                          defaultChecked={model.is_active}
                          onCheckedChange={(checked) => {
                            bikeModelMutation.mutate({ data: { id: model.id, updates: { is_active: !!checked } } });
                          }}
                        />
                        <Label htmlFor={`active-model-${model.id}`} className="text-[10px] font-bold uppercase tracking-widest cursor-pointer">
                          {model.is_active ? "Visible" : "Hidden"}
                        </Label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {previewSlide && (
        <HeroSlidePreview
          open={!!previewSlide}
          onOpenChange={(open) => !open && setPreviewSlide(null)}
          slide={previewSlide}
        />
      )}
    </div>
  );
}
