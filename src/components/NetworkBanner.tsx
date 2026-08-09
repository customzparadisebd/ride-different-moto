import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useNetworkStatus } from "@/lib/network";

/**
 * Non-blocking connection notice. It never navigates away or reloads the page —
 * "Retry" only re-validates the connection state.
 */
export function NetworkBanner() {
  const { online, slow } = useNetworkStatus();
  const [dismissedSlow, setDismissedSlow] = useState(false);

  useEffect(() => {
    if (!slow) setDismissedSlow(false);
  }, [slow]);

  if (!online) {
    return (
      <div
        role="status"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-onyx px-4 py-3 pb-safe text-onyx-foreground"
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold">No Internet Connection</p>
            <p className="text-xs opacity-80">Please check your internet connection and try again.</p>
          </div>
          <Button variant="red" size="sm" onClick={() => void navigator.onLine} className="shrink-0">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (slow && !dismissedSlow) {
    return (
      <div
        role="status"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-secondary px-4 py-2.5 pb-safe"
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">Connection is unstable</p>
            <p className="truncate text-xs text-muted-foreground">
              Some content may take longer to load.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0"
            onClick={() => setDismissedSlow(true)}
          >
            Dismiss
          </Button>
        </div>
      </div>
    );
  }

  return null;
}