import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, Save, X, Upload, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  getHeroSlides,
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
  restoreOldHeroSlides,
} from "@/lib/hero.functions";


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


  const { data: slides = [], isLoading } = useQuery({
    queryKey: ["hero-slides-admin"],
    queryFn: () => fetchSlides({ data: { admin: true } }),
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mobileFileInputRef = useRef<HTMLInputElement>(null);

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
    onError: (e: any) => toast.error(e.message || "Failed to add slide"),
  });

  const updateMutation = useMutation({
    mutationFn: editSlide,
    onSuccess: () => {
      toast.success("Slide updated");
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["hero-slides-admin"] });
      queryClient.invalidateQueries({ queryKey: ["hero-slides"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to update slide"),
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


  const handleSave = (id: string, formData: FormData) => {
    const data = {
      title: formData.get("title") as string,
      subtitle: formData.get("subtitle") as string,
      image_url: formData.get("image_url") as string,
      mobile_image_url: (formData.get("mobile_image_url") as string) || null,
      link_url: formData.get("link_url") as string,
      sort_order: parseInt(formData.get("sort_order") as string) || 0,
      is_active: formData.get("is_active") === "on",
    };
    updateMutation.mutate({ data: { id, updates: data } });
  };

  const handleAdd = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = {
      title: formData.get("title") as string,
      subtitle: formData.get("subtitle") as string,
      image_url: formData.get("image_url") as string,
      mobile_image_url: (formData.get("mobile_image_url") as string) || null,
      link_url: formData.get("link_url") as string,
      sort_order: parseInt(formData.get("sort_order") as string) || 0,
      is_active: true,
    };
    addMutation.mutate({ data });
  };

  if (isLoading)
    return <div className="p-8 text-center text-muted-foreground">Loading slides...</div>;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-wide">Hero Slider</h1>
          <p className="text-sm text-muted-foreground">
            Manage the banners displayed on the homepage. Recommended aspect ratio: 21:9 (Desktop).
          </p>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} variant="red" size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Add Slide
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="rounded-xl border border-primary/20 bg-card p-6 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold uppercase text-primary">New Slide</h2>
            <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <form onSubmit={handleAdd} className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Slide Title (Main Heading)</Label>
              <Input id="title" name="title" required placeholder="e.g. Perfect Price" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle (Optional)</Label>
              <Input id="subtitle" name="subtitle" placeholder="e.g. For limited time only" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image_url">Desktop Image URL</Label>
              <div className="flex gap-2">
                <Input id="image_url" name="image_url" required placeholder="CDN URL preferred" />
                <Button
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile_image_url">Mobile Image URL (Recommended 4:5)</Label>
              <div className="flex gap-2">
                <Input
                  id="mobile_image_url"
                  name="mobile_image_url"
                  placeholder="CDN URL preferred"
                />
                <Button
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="link_url">Link Destination</Label>
              <Input
                id="link_url"
                name="link_url"
                placeholder="e.g. /products/visor or all-products"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sort_order">Sort Order</Label>
              <Input
                id="sort_order"
                name="sort_order"
                type="number"
                defaultValue={slides.length + 1}
              />
            </div>
            <div className="flex items-end pt-2">
              <Button
                type="submit"
                variant="red"
                className="w-full"
                disabled={addMutation.isPending}
              >
                {addMutation.isPending ? "Adding..." : "Create Slide"}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-6">
        {slides.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
            No slides found. Add your first banner above.
          </div>
        ) : (
          [...slides]
            .sort((a, b) => a.order - b.order)
            .map((slide) => (
              <div
                key={slide.id}
                className={`group relative overflow-hidden rounded-xl border transition-all duration-300 ${
                  slide.active
                    ? "border-border bg-card"
                    : "border-dashed border-muted-foreground/30 bg-muted/5 opacity-80"
                } ${editingId === slide.id ? "ring-2 ring-primary shadow-2xl scale-[1.01]" : "hover:border-primary/50"}`}
              >
                {editingId === slide.id ? (
                  <form
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
                        <Label>Subtitle</Label>
                        <Input name="subtitle" defaultValue={slide.label || ""} />
                      </div>
                      <div className="space-y-2">
                        <Label>Desktop Image URL</Label>
                        <div className="flex gap-2">
                          <Input
                            name="image_url"
                            id={`img-${slide.id}`}
                            defaultValue={slide.image}
                            required
                          />
                          <Button
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
                          <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={(e) =>
                              handleFileUpload(e, "desktop", (url) => {
                                const input = document.getElementById(
                                  `img-${slide.id}`,
                                ) as HTMLInputElement;
                                if (input) input.value = url;
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Mobile Image URL</Label>
                        <div className="flex gap-2">
                          <Input
                            name="mobile_image_url"
                            id={`mobile-img-${slide.id}`}
                            defaultValue={slide.mobileImage || ""}
                          />
                          <Button
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
                          <input
                            type="file"
                            ref={mobileFileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={(e) =>
                              handleFileUpload(e, "mobile", (url) => {
                                const input = document.getElementById(
                                  `mobile-img-${slide.id}`,
                                ) as HTMLInputElement;
                                if (input) input.value = url;
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Link URL</Label>
                        <Input name="link_url" defaultValue={slide.bikeSlug} />
                      </div>
                      <div className="space-y-2">
                        <Label>Order</Label>
                        <Input name="sort_order" type="number" defaultValue={slide.order} />
                      </div>
                      <div className="flex items-center gap-4 pt-4">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`active-${slide.id}`}
                            name="is_active"
                            defaultChecked={slide.active}
                          />
                          <Label htmlFor={`active-${slide.id}`}>Active</Label>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 border-t pt-4">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="red"
                        size="sm"
                        className="gap-2"
                        disabled={updateMutation.isPending}
                      >
                        <Save className="h-4 w-4" />{" "}
                        {updateMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col sm:flex-row">
                    <div className="relative h-48 w-full shrink-0 overflow-hidden sm:h-auto sm:w-64 bg-black">
                      <img
                        src={slide.image}
                        alt={slide.alt}
                        className="h-full w-full object-cover opacity-80 transition-transform group-hover:scale-110 duration-700"
                      />
                      {!slide.active && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white border border-white/20">
                            Inactive
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col justify-between p-6">
                      <div>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary border border-primary/20">
                                {slide.order}
                              </span>
                              <h3 className="font-display text-xl font-bold uppercase tracking-wide">
                                {slide.bikeName}
                              </h3>
                            </div>
                            {slide.label && (
                              <p className="text-sm text-muted-foreground">{slide.label}</p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                              onClick={() => setEditingId(slide.id)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                if (confirm("Delete this slide?"))
                                  deleteMutation.mutate({ data: slide.id });
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-2 text-xs">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="font-semibold uppercase tracking-tighter opacity-50">
                              Link:
                            </span>
                            <code className="rounded bg-muted px-1 py-0.5">{slide.bikeSlug}</code>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="font-semibold uppercase tracking-tighter opacity-50 text-[10px]">
                              Image URL:
                            </span>
                            <span className="truncate max-w-[200px]">{slide.image}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
        )}
      </div>
    </div>
  );
}
