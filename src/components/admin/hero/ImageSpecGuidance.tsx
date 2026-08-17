import { Info, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SpecGuidanceProps {
  type: "desktop" | "mobile";
  onPreview?: () => void;
}

export function ImageSpecGuidance({ type, onPreview }: SpecGuidanceProps) {
  const specs = type === "desktop" 
    ? {
        res: "1920 × 820px",
        ratio: "21:9 or 2.34:1",
        size: "< 300KB",
        format: "WebP / AVIF preferred"
      }
    : {
        res: "800 × 1067px",
        ratio: "3:4 or 0.75:1",
        size: "< 150KB",
        format: "WebP / AVIF preferred"
      };

  return (
    <div className="mt-2 rounded-lg border border-primary/20 bg-primary/5 p-3 animate-in fade-in duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-2">
          <Info className="mt-0.5 size-3.5 text-primary shrink-0" />
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Recommended for {type}</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
              <span>Resolution: <strong className="text-foreground">{specs.res}</strong></span>
              <span>Aspect Ratio: <strong className="text-foreground">{specs.ratio}</strong></span>
              <span>Max Size: <strong className="text-foreground">{specs.size}</strong></span>
              <span>Format: <strong className="text-foreground">{specs.format}</strong></span>
            </div>
          </div>
        </div>
        {onPreview && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-2 text-[10px] gap-1.5 uppercase font-bold text-primary hover:text-primary hover:bg-primary/10"
            onClick={onPreview}
          >
            <Eye className="size-3" /> Preview
          </Button>
        )}
      </div>
    </div>
  );
}
