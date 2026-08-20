import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Monitor, Smartphone } from "lucide-react";
import { HeroSlider } from "@/components/home/HeroSlider";
import { type HeroSlide } from "@/data/types";

interface SlidePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slide: {
    bikeName: string;
    label?: string | null;
    image: string;
    mobileImage?: string | null;
    bikeSlug?: string | null;
    isFullBanner?: boolean;
  } | Array<{
    bikeName: string;
    label?: string | null;
    image: string;
    mobileImage?: string | null;
    bikeSlug?: string | null;
    isFullBanner?: boolean;
  }>;

}

export function HeroSlidePreview({ open, onOpenChange, slide }: SlidePreviewProps) {
  // Use all provided slides if available, otherwise just the single one
  const previewSlides: HeroSlide[] = Array.isArray(slide) 
    ? slide.map((s, i) => ({
        id: `preview-${i}`,
        bikeName: s.bikeName || "Slide Preview",
        label: s.label || null,
        image: s.image || "",
        mobileImage: s.mobileImage || null,
        alt: s.bikeName || "Hero Slide",
        bikeSlug: s.bikeSlug || "all-products",
        order: i,
        active: true,
        isFullBanner: s.isFullBanner || false
      }))
    : [{
        id: 'preview',
        bikeName: slide.bikeName || "Slide Preview",
        label: slide.label || null,
        image: slide.image || "",
        mobileImage: slide.mobileImage || null,
        alt: slide.bikeName || "Hero Slide",
        bikeSlug: slide.bikeSlug || "all-products",
        order: 0,
        active: true,
        isFullBanner: slide.isFullBanner || false
      }];


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] lg:max-w-6xl overflow-hidden p-0 gap-0 border-none bg-onyx">
        <DialogHeader className="p-4 bg-card border-b border-border">
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="font-display text-lg font-bold uppercase tracking-wide">Slide Preview</DialogTitle>
          </div>
        </DialogHeader>
        
        <Tabs defaultValue="desktop" className="w-full">
          <div className="bg-muted/30 px-4 py-2 flex justify-center border-b border-border">
            <TabsList className="grid w-64 grid-cols-2 bg-background/50">
              <TabsTrigger value="desktop" className="gap-2 text-xs uppercase font-bold tracking-wider">
                <Monitor className="size-3.5" /> Desktop
              </TabsTrigger>
              <TabsTrigger value="mobile" className="gap-2 text-xs uppercase font-bold tracking-wider">
                <Smartphone className="size-3.5" /> Mobile
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="relative bg-onyx min-h-[400px] flex items-center justify-center p-4 lg:p-8">
            <TabsContent value="desktop" className="mt-0 w-full focus-visible:outline-none">
              <div className="w-full max-w-5xl mx-auto overflow-hidden rounded-lg shadow-2xl border border-white/10">
                <HeroSlider slides={previewSlides} />
              </div>
            </TabsContent>
            
            <TabsContent value="mobile" className="mt-0 w-full flex justify-center focus-visible:outline-none">
              <div className="w-[375px] h-[667px] overflow-hidden rounded-[2.5rem] border-[8px] border-zinc-800 shadow-2xl bg-onyx relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-6 bg-zinc-800 rounded-b-2xl z-50" />
                <div className="h-full overflow-y-auto hide-scrollbar">
                   <HeroSlider slides={previewSlides} />
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
