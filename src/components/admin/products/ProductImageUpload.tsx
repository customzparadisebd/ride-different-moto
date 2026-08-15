import React, { useCallback, useState } from "react";
import { Upload, X, Loader2, Image as ImageIcon, MoveHorizontal, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProductImageUploadProps {
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  maxFiles?: number;
  label?: string;
  guideline?: string;
}

const RECOMMENDED_WIDTH = 1000;
const RECOMMENDED_HEIGHT = 1000;
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const RECOMMENDED_SIZE = 500 * 1024; // 500KB

export function ProductImageUpload({
  value,
  onChange,
  multiple = false,
  maxFiles = 10,
  label,
  guideline = "1000x1000px WebP, <500KB. Optimized for fast mobile loading.",
}: ProductImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const images = Array.isArray(value) ? value : value ? [value] : [];

  const validateImage = (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith("image/")) {
        resolve("Invalid file type. Please upload an image.");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        resolve("File is too large. Maximum size is 2MB.");
        return;
      }

      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        if (img.width < 500 || img.height < 500) {
          resolve(`Image dimensions too small (${img.width}x${img.height}). Minimum 500x500px recommended.`);
          return;
        }
        resolve(null);
      };
      img.onerror = () => {
        resolve("Failed to load image for validation.");
      };
    });
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const newUrls: string[] = [...images];

    try {
      const filesArray = Array.from(files);
      for (const file of filesArray) {
        if (!file) continue;
        
        const currentIndex = filesArray.indexOf(file);
        if (!multiple && currentIndex > 0) break;
        if (multiple && newUrls.length >= maxFiles) {
          toast.warning(`Maximum ${maxFiles} images allowed.`);
          break;
        }

        const errorMsg = await validateImage(file);
        if (errorMsg) {
          toast.error(errorMsg);
          continue;
        }

        if (file.size > RECOMMENDED_SIZE) {
          toast.info(`Note: ${file.name} is larger than recommended 500KB.`);
        }

        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { data: _data, error: uploadError } = await supabase.storage
          .from("products")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("products")
          .getPublicUrl(filePath);

        if (multiple) {
          newUrls.push(publicUrl);
        } else {
          newUrls[0] = publicUrl;
          break;
        }
      }

      onChange(multiple ? newUrls : (newUrls[0] ?? ""));
      toast.success(multiple ? "Images uploaded successfully" : "Image uploaded successfully");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const next = [...images];
    next.splice(index, 1);
    onChange(multiple ? next : (next[0] ?? ""));
  };

  const moveImage = (index: number, direction: "left" | "right") => {
    if (!multiple) return;
    const next = [...images];
    const newIndex = direction === "left" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= next.length) return;
    
    const currentItem = next[index];
    const nextItem = next[newIndex];
    if (currentItem !== undefined && nextItem !== undefined) {
      next[index] = nextItem;
      next[newIndex] = currentItem;
    }
    onChange(next);
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

      <div className={cn(
        "grid gap-4",
        multiple ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" : "grid-cols-1 max-w-[240px]"
      )}>
        {images.map((url, index) => (
          <div 
            key={`${url}-${index}`}
            className="group relative aspect-square rounded-lg border border-border bg-muted overflow-hidden transition-all hover:border-cyan-500/50"
          >
            <img 
              src={url} 
              alt={`Product ${index + 1}`} 
              className="w-full h-full object-cover"
            />
            
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
              <Button
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
                  <Button
                    type="button"
                    variant="steel"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    disabled={index === 0}
                    onClick={() => moveImage(index, "left")}
                  >
                    <MoveHorizontal className="h-4 w-4 rotate-180" />
                  </Button>
                  <Button
                    type="button"
                    variant="steel"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    disabled={index === images.length - 1}
                    onClick={() => moveImage(index, "right")}
                  >
                    <MoveHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            
            {index === 0 && !multiple && (
              <div className="absolute bottom-0 left-0 right-0 bg-cyan-500 text-[9px] font-bold text-black uppercase py-0.5 text-center tracking-tighter">
                Main Image
              </div>
            )}
          </div>
        ))}

        {(multiple || images.length === 0) && (
          <label className={cn(
            "flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed border-border bg-muted/30 cursor-pointer hover:bg-muted/50 hover:border-cyan-500/50 transition-all",
            uploading && "pointer-events-none opacity-50"
          )}>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              multiple={multiple}
              onChange={(e) => handleUpload(e.target.files)}
            />
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
            ) : (
              <>
                <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
                  {multiple ? "Add Images" : "Upload Image"}
                </span>
              </>
            )}
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
              Allowed: WebP, JPEG, PNG. Max 2MB per file.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
