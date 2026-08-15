import { useState } from "react";
import { Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface ProductVideoProps {
  platform: 'youtube' | 'facebook' | 'instagram' | 'tiktok';
  url: string;
  productName: string;
}

export function ProductVideo({ platform, url, productName }: ProductVideoProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Parse embed URL
  const getEmbedUrl = (url: string, platform: string) => {
    if (platform === 'youtube') {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      const videoId = (match && match[2] && match[2].length === 11) ? match[2] : null;
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : url;
    }
    // Simple pass-through for others, standard embedding often requires specific platform scripts/SDKs
    return url;
  };

  const platformLabel = platform.charAt(0).toUpperCase() + platform.slice(1);

  return (
    <div className="mt-8">
      <button
        type="button"
        aria-label={`Watch product video for ${productName}`}
        className="group relative block w-full cursor-pointer overflow-hidden rounded-2xl border border-border bg-card text-left transition-all hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        onClick={() => setIsOpen(true)}
      >
        <div className="flex items-center gap-6 p-6">
          <div className="relative flex size-16 shrink-0 items-center justify-center rounded-2xl bg-onyx text-primary shadow-lg transition-transform group-hover:scale-105">
            <div className="absolute inset-0 rounded-2xl bg-primary/10 opacity-0 group-hover:opacity-100" />
            <Play className="size-8 fill-primary" />
          </div>
          
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-lg font-bold uppercase tracking-wide text-foreground sm:text-xl">
              Watch Product Video
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              See the <span className="text-primary font-semibold">{productName}</span> in action on {platformLabel}.
            </p>
          </div>

          <div className="hidden sm:block">
            <div className="rounded-full border border-border px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:border-primary group-hover:text-primary transition-colors">
              Play Now
            </div>
          </div>
        </div>

        {/* Glossy overlay effect */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-5xl overflow-hidden p-0 bg-black border-none shadow-2xl">
          <VisuallyHidden>
            <DialogTitle>Product Video: {productName}</DialogTitle>
          </VisuallyHidden>
          
          <button
            type="button"
            aria-label="Close video"
            onClick={() => setIsOpen(false)}
            className="absolute right-4 top-4 z-50 rounded-full bg-black/60 p-2 text-white/70 hover:bg-black hover:text-white transition-all shadow-lg backdrop-blur-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X className="size-6" />
          </button>

          <div className="relative aspect-video w-full bg-black">
            {platform === 'youtube' ? (
              <iframe
                className="h-full w-full"
                src={getEmbedUrl(url, platform)}
                title={`${productName} Video`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center text-white">
                <Play className="size-16 mb-4 text-primary opacity-50" />
                <h2 className="text-2xl font-bold font-display uppercase mb-2">Watch on {platformLabel}</h2>
                <p className="max-w-md text-sm text-white/60 mb-6">
                  This video is hosted on {platformLabel}. Click below to watch the original content.
                </p>
                <Button variant="red" size="lg" asChild>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    Open Video in New Tab
                  </a>
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
