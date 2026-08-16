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
    setProgress(10);

    try {
      const fileExt = "webp";
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${pathPrefix}/${fileName}`;

      setProgress(30);
      const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file);

      if (uploadError) throw uploadError;

      setProgress(80);
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(filePath);

      setProgress(100);
      onChange(publicUrl);
      toast.success("Image uploaded successfully");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
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
              "flex flex-col items-center justify-center aspect-video sm:aspect-[21/9] w-full max-w-md rounded-lg border-2 border-dashed border-border bg-muted/30 hover:bg-muted/50 transition-all",
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

        {guideline && (
          <p className="text-[9px] text-muted-foreground leading-tight">
            {guideline}
          </p>
        )}
      </div>
    </div>
  );
}
