import { Play, Youtube, Facebook, Instagram } from "lucide-react";

interface VideoPreviewProps {
  platform: 'youtube' | 'facebook' | 'instagram' | 'tiktok';
  url: string;
}

export function VideoPreview({ platform, url }: VideoPreviewProps) {
  if (!url) return null;

  // Simple parsers for preview display
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  if (platform === 'youtube') {
    const videoId = getYouTubeId(url);
    if (videoId) {
      return (
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      );
    }
  }

  // Fallback for other platforms where embedding is trickier or requires SDKs
  const PlatformIcon = {
    youtube: Youtube,
    facebook: Facebook,
    instagram: Instagram,
    tiktok: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-8">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.09-1.47-.15-.1-.3-.21-.45-.32v6.59c.02 2.1-.81 4.35-2.52 5.57-1.9 1.41-4.58 1.64-6.74.73-2.21-.92-3.86-3.17-3.89-5.59-.01-2.3 1.45-4.67 3.5-5.69 1.15-.57 2.46-.83 3.74-.73V13.01c-.83-.14-1.72.02-2.46.42-.93.52-1.51 1.51-1.48 2.58.01.93.59 1.83 1.44 2.2 1.05.47 2.38.17 3.03-.78.36-.54.51-1.2.49-1.85V.02z" />
      </svg>
    )
  }[platform];

  return (
    <div className="flex flex-col items-center justify-center w-full h-full text-white bg-onyx gap-3">
      <PlatformIcon className="size-10 text-primary" />
      <div className="text-center px-4">
        <p className="text-xs font-bold uppercase tracking-wider">{platform} Video</p>
        <p className="text-[10px] opacity-60 mt-1 truncate max-w-[200px]">{url}</p>
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
        <Play className="size-12 fill-white text-white" />
      </div>
    </div>
  );
}
