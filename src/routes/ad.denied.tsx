import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/ad/denied")({
  head: () => ({
    meta: [
      { title: "Access denied" },
      { name: "description", content: "This area is restricted to authorised staff accounts." },
      { property: "og:title", content: "Access denied" },
      { property: "og:description", content: "Restricted area." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AccessDenied,
});

function AccessDenied() {
  return (
    <section className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide">Access denied</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Your identity was verified, but your account is currently <strong>Pending</strong> approval.
        Access is restricted until a Super Admin approves your staff status. If you just finished
        MFA, please wait for the administrative review to complete.
      </p>
      <div className="mt-6 flex flex-col gap-2">
        <Link to="/ad/log" className="text-sm uppercase tracking-wider text-primary underline">
          Use a different account
        </Link>
        <Link to="/" className="text-xs uppercase tracking-wider text-muted-foreground underline">
          Back to store
        </Link>
      </div>
    </section>
  );
}
