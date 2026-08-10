// Legacy admin path — permanently moved to /ad.
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/czp-ops-9f2c/")({
  beforeLoad: () => {
    throw redirect({ to: "/ad", replace: true });
  },
});
