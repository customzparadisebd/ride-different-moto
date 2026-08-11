import { MapPin } from "lucide-react";

import { site } from "@/data/site";

export function StoreComingSoon() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="overflow-hidden rounded-2xl bg-gradient-onyx p-6 text-onyx-foreground sm:p-10">
        <p className="eyebrow text-primary">Opening Soon</p>
        <h2 className="mt-2 font-display text-2xl font-bold uppercase leading-tight tracking-tight sm:text-4xl">
          Our Physical Store is Coming Soon
        </h2>
        <p className="mt-3 flex items-start gap-2 text-sm opacity-85">
          <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <span>{site.address}</span>
        </p>
        <p className="mt-4 max-w-xl text-sm opacity-70">
          Until then, every order is handled online with delivery support across Bangladesh.
        </p>
      </div>
    </section>
  );
}
