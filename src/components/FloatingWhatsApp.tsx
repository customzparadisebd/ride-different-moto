import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { getStoreSettings } from "@/lib/store-settings.functions";
import { getSiteSettings } from "@/lib/site-settings.functions";
import { type SiteSettings } from "@/lib/settings.shared";

export function FloatingWhatsApp() {
  const loadStore = useServerFn(getStoreSettings);
  const { data: storeSettings } = useQuery({
    queryKey: ["store-settings"],
    queryFn: () => loadStore(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: siteSettings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: () => getSiteSettings(),
  });

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Small delay to prevent layout shift during hydration and show entrance animation
    const timer = setTimeout(() => setIsVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!storeSettings || !storeSettings.whatsappFloatingEnabled) return null;

  const position = storeSettings.whatsappFloatingPosition as
    "bottom-right" | "bottom-left" | "top-right" | "top-left";

  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
    "top-right": "top-24 right-6",
    "top-left": "top-24 left-6",
  }[position || "bottom-right"];

  const whatsappNumber = (siteSettings as SiteSettings)?.whatsapp || storeSettings.whatsappPhone;
  const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/\D/g, "")}`;

  return (
    <div
      className={cn(
        "fixed z-50 transition-all duration-500",
        positionClasses,
        isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0",
      )}
    >
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex items-center justify-center rounded-full bg-[#25D366] p-3 text-white shadow-lg transition-transform hover:scale-110 active:scale-95 sm:p-4"
        aria-label="Contact us on WhatsApp"
      >
        <MessageCircle className="size-6 sm:size-7" />

        {/* Tooltip-like label on hover for desktop */}
        <span className="absolute right-full mr-3 hidden whitespace-nowrap rounded-lg bg-black/80 px-3 py-1.5 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 lg:block">
          Chat with Us
        </span>

        {/* Ping animation for attention */}
        <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#25D366]/40" />
      </a>
    </div>
  );
}
