import { useState, useRef, useEffect } from "react";
import { Info, AlertCircle, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Bulk360UploaderProps {
  productId: string;
  onSave: (items: { imageUrl: string }[]) => Promise<void>;
  isPending: boolean;
  currentCount: number;
}

export function Bulk360Uploader({ onSave, isPending, currentCount }: Bulk360UploaderProps) {
  const [urls, setUrls] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playInterval = useRef<number | null>(null);

  useEffect(() => {
    if (isPlaying) {
      playInterval.current = window.setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % previewImages.length);
      }, 100);
    } else if (playInterval.current) {
      clearInterval(playInterval.current);
    }
    return () => {
      if (playInterval.current) clearInterval(playInterval.current);
    };
  }, [isPlaying, previewImages.length]);

  const validateUrls = (text: string) => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const errors: string[] = [];
    const valid: string[] = [];

    lines.forEach((line, i) => {
      try {
        new URL(line);
        valid.push(line);
      } catch {
        errors.push(`Line ${i + 1}: Invalid URL`);
      }
    });

    if (lines.length > 0 && lines.length < 24) {
      errors.push("Sequence recommended to be at least 24 images for smooth rotation.");
    }

    setValidationErrors(errors);
    setPreviewImages(valid);
    if (valid.length > 0) setCurrentIndex(0);
  };

  const handleSubmit = async () => {
    if (validationErrors.length > 0) {
      toast.error("Please fix validation errors first.");
      return;
    }
    if (previewImages.length === 0) {
      toast.error("Paste some image URLs first.");
      return;
    }

    await onSave(previewImages.map((imageUrl) => ({ imageUrl })));
    setUrls("");
    setPreviewImages([]);
  };

  return (
    <div className="space-y-4 border-t border-border pt-6 mt-6">
      <div className="flex items-center gap-2">
        <h3 className="font-display text-base font-bold uppercase">Bulk Sequence Uploader</h3>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
          Current: {currentCount} frames
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">
            Paste Image URLs (One per line)
          </Label>
          <Textarea
            placeholder="https://.../frame-01.webp&#10;https://.../frame-02.webp"
            rows={10}
            className="font-mono text-xs"
            value={urls}
            onChange={(e) => {
              setUrls(e.target.value);
              validateUrls(e.target.value);
            }}
          />
          {validationErrors.length > 0 && (
            <div className="rounded-lg bg-destructive/5 p-3 border border-destructive/20 space-y-1">
              {validationErrors.map((err, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-[10px] text-destructive font-medium"
                >
                  <AlertCircle className="size-3" />
                  {err}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">
            Sequence Preview & Scrubber
          </Label>
          <div className="aspect-square w-full rounded-xl border border-border bg-black relative overflow-hidden group">
            {previewImages.length > 0 ? (
              <>
                <img
                  src={previewImages[currentIndex]}
                  alt="Preview"
                  className="size-full object-contain"
                />
                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <Button aria-label="Pause preview"
                      size="icon"
                      variant="ghost"
                      className="size-8 rounded-full text-white hover:bg-white/20"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
                    </Button>
                    <Slider
                      value={[currentIndex]}
                      max={previewImages.length - 1}
                      step={1}
                      onValueChange={([val]) => {
                        if (typeof val === "number") {
                          setCurrentIndex(val);
                          setIsPlaying(false);
                        }
                      }}
                      className="flex-1"
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-white/50 uppercase">
                    <span>Frame {currentIndex + 1}</span>
                    <span>Total {previewImages.length}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="size-full flex flex-col items-center justify-center text-muted-foreground/30 p-8 text-center">
                <Play className="size-12 mb-2 opacity-10" />
                <p className="text-xs uppercase tracking-widest font-bold">Paste URLs to preview</p>
              </div>
            )}
          </div>
          <div className="flex items-start gap-2 text-[10px] text-muted-foreground bg-secondary/50 p-2 rounded">
            <Info className="size-3 shrink-0 mt-0.5" />
            <p>
              Pre-save sequence scrubber: drag the slider to verify the rotation order manually
              before confirming.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          variant="red"
          size="touch"
          disabled={isPending || previewImages.length === 0 || validationErrors.length > 0}
          onClick={handleSubmit}
        >
          {isPending ? "Applying Sequence..." : "Confirm & Save Sequence"}
        </Button>
      </div>
    </div>
  );
}
