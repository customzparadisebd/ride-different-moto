import React, { useState, useRef } from "react";
import imageCompression from "browser-image-compression";
import {
  Upload,
  X,
  Loader2,
  Image as ImageIcon,
  AlertCircle,
  RefreshCw,
  GripVertical,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ProductImageUploadProps {
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  maxFiles?: number;
  label?: string;
  guideline?: string;
}

interface UploadStatus {
  file: File;
  id: string;
  progress: number;
  status: "pending" | "processing" | "uploading" | "completed" | "error";
  error?: string;
  url?: string;
}

export function ProductImageUpload({
  value,
  onChange,
  multiple = false,
  maxFiles = 10,
  label,
  guideline = "1000x1000px WebP, <500KB. Optimized for fast mobile loading.",
}: ProductImageUploadProps) {
  const [uploads, setUploads] = useState<UploadStatus[]>([]);
  const images = Array.isArray(value) ? value : value ? [value] : [];
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const processAndUpload = async (uploadId: string, file: File) => {
    setUploads((prev) =>
      prev.map((u) => (u.id === uploadId ? { ...u, status: "processing", progress: 5 } : u)),
    );

    try {
      // 1. Generate optimized WebP
      setUploads((prev) =>
        prev.map((u) => (u.id === uploadId ? { ...u, progress: 10 } : u)),
      );
      
      const options = {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        fileType: "image/webp",
      };

      const compressedFile = await imageCompression(file, options);
      
      setUploads((prev) => prev.map((u) => (u.id === uploadId ? { ...u, progress: 40 } : u)));

      // 2. Upload to storage
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.webp`;
      const filePath = `products/${fileName}`;

      setUploads((prev) =>
        prev.map((u) => (u.id === uploadId ? { ...u, status: "uploading", progress: 50 } : u)),
      );

      const { error: uploadError } = await supabase.storage
        .from("products")
        .upload(filePath, compressedFile, {
          contentType: "image/webp",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("products").getPublicUrl(filePath);

      setUploads((prev) =>
        prev.map((u) =>
          u.id === uploadId ? { ...u, status: "completed", progress: 100, url: publicUrl } : u,
        ),
      );

      // Note: Multi-size and AVIF generation are handled by the responsive image pipeline 
      // in SafeImage.tsx via CDN-level transformations (?format=avif&w=...), 
      // but we ensure the source is now a high-quality optimized WebP.

      return publicUrl;
    } catch (error: any) {
      setUploads((prev) =>
        prev.map((u) => (u.id === uploadId ? { ...u, status: "error", error: error.message } : u)),
      );
      throw error;
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);
    const newUploads: UploadStatus[] = filesArray.map((file) => ({
      file,
      id: Math.random().toString(36).substring(7),
      progress: 0,
      status: "pending",
    }));

    const firstUpload = newUploads[0];
    if (!multiple && firstUpload) {
      setUploads([firstUpload]);
    } else {
      setUploads((prev) => [...prev, ...newUploads]);
    }

    const completedUrls: string[] = [];

    for (const upload of newUploads) {
      if (multiple && images.length + completedUrls.length >= maxFiles) {
        toast.warning(`Maximum ${maxFiles} images allowed.`);
        break;
      }

      try {
        const url = await processAndUpload(upload.id, upload.file);
        if (url) completedUrls.push(url);
      } catch (err) {
        // Handled in state
      }
    }

    if (completedUrls.length > 0) {
      const nextImages = multiple ? [...images, ...completedUrls] : [completedUrls[0]];
      const finalValue = multiple ? nextImages : nextImages[0] || "";
      onChange(finalValue as string | string[]);

      setTimeout(() => {
        setUploads((prev) => prev.filter((u) => u.status !== "completed"));
      }, 3000);
    }
  };

  const retryUpload = async (upload: UploadStatus) => {
    try {
      const url = await processAndUpload(upload.id, upload.file);
      if (url) {
        const nextImages = multiple ? [...images, url] : [url];
        const finalValue = multiple ? nextImages : nextImages[0] || "";
        onChange(finalValue as string | string[]);

        setTimeout(() => {
          setUploads((prev) => prev.filter((u) => u.status !== "completed"));
        }, 3000);
      }
    } catch (err) {
      // Handled
    }
  };

  const removeImage = (index: number) => {
    const next = [...images];
    next.splice(index, 1);
    const finalValue = multiple ? next : next[0] || "";
    onChange(finalValue as string | string[]);
  };

  const handleSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const next = [...images];
    const item = next[dragItem.current];
    if (item) {
      const draggedItemContent = next.splice(dragItem.current, 1)[0]!;
      next.splice(dragOverItem.current, 0, draggedItemContent);
      dragItem.current = null;
      dragOverItem.current = null;
      onChange(next);
    }
  };

  return (
    <div className="space-y-4">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            {label}
          </label>
        </div>
      )}

      {uploads.length > 0 && (
        <div className="space-y-2 mb-4">
          {uploads.map((upload) => (
            <div
              key={upload.id}
              className="flex flex-col gap-1.5 p-3 rounded-lg border border-border bg-muted/30"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  {upload.status === "processing" ? (
                    <RefreshCw className="h-3 w-3 animate-spin text-cyan-500" />
                  ) : upload.status === "uploading" ? (
                    <Loader2 className="h-3 w-3 animate-spin text-cyan-500" />
                  ) : upload.status === "completed" ? (
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                  ) : upload.status === "error" ? (
                    <AlertCircle className="h-3 w-3 text-destructive" />
                  ) : (
                    <ImageIcon className="h-3 w-3 text-muted-foreground" />
                  )}
                  <span className="text-[10px] font-medium truncate max-w-[150px]">
                    {upload.file.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold uppercase text-muted-foreground">
                    {upload.status}
                  </span>
                  {upload.status === "error" && (
                    <Button aria-label="Retry upload"
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => retryUpload(upload)}
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  )}
                  <Button aria-label="Remove"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => setUploads((prev) => prev.filter((u) => u.id !== upload.id))}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <Progress value={upload.progress} className="h-1 bg-background" />
              {upload.error && (
                <p className="text-[9px] text-destructive font-medium">{upload.error}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <div
        className={cn(
          "grid gap-4",
          multiple
            ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
            : "grid-cols-1 max-w-[240px]",
        )}
      >
        {images.map((url, index) => (
          <div
            key={`${url}-${index}`}
            draggable={multiple}
            onDragStart={() => (dragItem.current = index)}
            onDragEnter={() => (dragOverItem.current = index)}
            onDragEnd={handleSort}
            onDragOver={(e) => e.preventDefault()}
            className={cn(
              "group relative aspect-square rounded-lg border border-border bg-muted overflow-hidden transition-all hover:border-cyan-500/50 cursor-move",
              multiple && "active:scale-95 active:rotate-1",
            )}
          >
            <img
              src={url}
              alt={`Product ${index + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />

            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
              <Button aria-label="Remove"
                type="button"
                variant="destructive"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => removeImage(index)}
              >
                <X className="h-4 w-4" />
              </Button>

              {multiple && (
                <div className="flex gap-1">
                  <GripVertical className="h-5 w-5 text-white/50" />
                </div>
              )}
            </div>

            {index === 0 && !multiple && (
              <div className="absolute bottom-0 left-0 right-0 bg-cyan-500 text-[9px] font-bold text-black uppercase py-0.5 text-center tracking-tighter">
                Main Image
              </div>
            )}

            {multiple && (
              <div className="absolute top-1 left-1 size-5 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-[9px] font-bold text-white">
                {index + 1}
              </div>
            )}
          </div>
        ))}

        {(multiple || images.length === 0) && (
          <label
            className={cn(
              "flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed border-border bg-muted/30 cursor-pointer hover:bg-muted/50 hover:border-cyan-500/50 transition-all",
              uploads.some((u) => u.status !== "completed" && u.status !== "error") &&
                "pointer-events-none opacity-50",
            )}
          >
            <input
              type="file"
              className="hidden"
              accept="image/*"
              multiple={multiple}
              onChange={(e) => handleFiles(e.target.files)}
            />
            <Upload className="h-6 w-6 text-muted-foreground mb-2" />
            <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
              {multiple ? "Add Images" : "Upload Image"}
            </span>
          </label>
        )}
      </div>

      <div className="rounded-md bg-muted/30 border border-border/50 p-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-3.5 w-3.5 text-cyan-500 mt-0.5" />
          <div className="space-y-1">
            <p className="text-[10px] leading-tight text-cyan-500 font-medium">
              <span className="font-bold uppercase mr-1 opacity-70">Recommended:</span>
              {guideline}
            </p>
            <p className="text-[9px] text-muted-foreground leading-tight">
              Allowed: WebP, JPEG, PNG. Max 2MB per file. Drag images to reorder.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
