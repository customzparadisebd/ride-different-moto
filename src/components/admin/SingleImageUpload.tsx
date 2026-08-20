import React, { useState, useRef } from "react";
import imageCompression from "browser-image-compression";
import {
  Upload,
  X,
  Loader2,
  Image as ImageIcon,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface SingleImageUploadProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  guideline?: string;
  bucket?: string;
  pathPrefix?: string;
}

export function SingleImageUpload({
  value,
  onChange,
  label,
  guideline = "1000x1000px WebP recommended.",
  bucket = "products",
  pathPrefix = "uploads",
}: SingleImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(5);

    try {
      // 1. Optimize and convert to WebP client-side
      setProgress(15);
      const options = {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1920, // Higher res for banners/bike models
        useWebWorker: true,
        fileType: "image/webp",
      };

      const compressedFile = await imageCompression(file, options);
      setProgress(40);

      // 2. Upload to storage
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.webp`;
      const filePath = `${pathPrefix}/${fileName}`;

      setProgress(60);
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, compressedFile, {
          contentType: "image/webp",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      setProgress(90);
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(filePath);

      setProgress(100);
      onChange(publicUrl);
      toast.success("Optimized image uploaded successfully");
    } catch (err: any) {
      console.error("Upload error details:", err);
      toast.error("Could not upload image. Please ensure your file is a valid image and try again.");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-4">
      {label && (
        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          {label}
        </label>
      )}

      <div className="flex flex-col gap-4">
        {value ? (
          <div className="group relative aspect-video sm:aspect-[21/9] w-full max-w-md rounded-lg border border-border bg-muted overflow-hidden">
            <img src={value} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button aria-label="Remove image"
                variant="destructive"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => onChange("")}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "flex flex-col items-center justify-center aspect-video sm:aspect-[21/9] w-full max-w-md rounded-lg border-2 border-dashed border-border bg-accent/30 dark:bg-muted/30 hover:bg-accent/50 dark:hover:bg-muted/50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              uploading && "pointer-events-none opacity-50"
            )}
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
              <Upload className="h-6 w-6 text-muted-foreground" />
            )}
            <span className="mt-2 text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
              {uploading ? `Uploading ${progress}%` : "Upload Image"}
            </span>
          </button>
        )}

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileUpload}
        />

        {uploading && <Progress value={progress} className="h-1 bg-background" />}

        <div className="rounded-md bg-accent/30 dark:bg-muted/30 border border-border dark:border-border/50 p-2.5">
          <p className="text-[9px] text-cyan-600 dark:text-cyan-500 font-bold uppercase tracking-tight mb-1">
            Auto-Optimization Active
          </p>
          <p className="text-[9px] text-muted-foreground leading-tight">
            Images are automatically converted to optimized WebP and prepared for multi-size AVIF delivery. {guideline}
          </p>
        </div>
      </div>
    </div>
  );
}
