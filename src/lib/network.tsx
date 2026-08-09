import { useEffect, useState } from "react";

export type NetworkState = {
  online: boolean;
  slow: boolean;
};

type ConnectionLike = { effectiveType?: string; addEventListener?: unknown };

function readConnection(): ConnectionLike | undefined {
  return (navigator as Navigator & { connection?: ConnectionLike }).connection;
}

/** Tracks offline / unstable connection state without ever navigating the user away. */
export function useNetworkStatus(): NetworkState {
  const [state, setState] = useState<NetworkState>({ online: true, slow: false });

  useEffect(() => {
    const connection = readConnection();

    const update = () => {
      const effectiveType = readConnection()?.effectiveType;
      setState({
        online: navigator.onLine,
        slow: effectiveType === "slow-2g" || effectiveType === "2g",
      });
    };

    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    const target = connection as unknown as EventTarget | undefined;
    target?.addEventListener?.("change", update);

    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      target?.removeEventListener?.("change", update);
    };
  }, []);

  return state;
}