import { AlertTriangle, X } from "lucide-react";
import { useState, useEffect } from "react";
import { getEnvironment } from "@/lib/env";
import { cn } from "@/lib/utils";

export function EnvironmentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const env = getEnvironment();

  useEffect(() => {
    // Only show for staging
    if (env === "staging") {
      // Check session storage to see if dismissed this session
      const isDismissed = sessionStorage.getItem("czp_env_banner_dismissed");
      if (!isDismissed) {
        setIsVisible(true);
      }
    }
  }, [env]);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem("czp_env_banner_dismissed", "true");
  };

  if (!isVisible) return null;

  return (
    <div className="relative z-50 w-full bg-amber-500 py-2 text-black shadow-lg animate-in fade-in slide-in-from-top duration-300">
      <div className="container flex items-center justify-between px-4">
        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-tight">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            Environment: <span className="underline decoration-2">STAGING</span> — Data is not live. Actions will not affect production orders or inventory.
          </span>
        </div>
        <button
          onClick={handleDismiss}
          className="rounded-full p-1 transition-colors hover:bg-black/10"
          aria-label="Dismiss warning"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
