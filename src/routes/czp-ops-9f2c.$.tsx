// Legacy admin sub-paths — permanently moved under /ad.
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/czp-ops-9f2c/$")({
  beforeLoad: ({ params }) => {
    const rest = params._splat ?? "";
    if (rest === "access") throw redirect({ to: "/ad/log", replace: true });
    if (rest === "access-denied") throw redirect({ to: "/ad/denied", replace: true });
    throw redirect({ to: "/ad", replace: true });
  },
});
