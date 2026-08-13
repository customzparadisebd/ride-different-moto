import { MapPin } from "lucide-react";

import { site } from "@/data/site";

export function StoreComingSoon() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-onyx to-black p-6 text-onyx-foreground sm:p-10 lg:p-12 border border-border/50 shadow-2xl relative">
        <div className="absolute top-0 right-0 p-8 sm:p-12 opacity-5 pointer-events-none">
          <MapPin className="size-32 sm:size-48 lg:size-64" />
        </div>
        
        <div className="relative z-10">
          <p className="eyebrow text-primary">Uttara Branch</p>
          <h2 className="mt-2 font-display text-3xl font-bold uppercase leading-tight tracking-tight sm:text-4xl lg:text-6xl max-w-2xl">
            Physical Store Coming Soon
          </h2>
          
          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                <MapPin className="size-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold uppercase tracking-wider text-primary">Location</p>
                <p className="text-base sm:text-lg font-medium break-words">{site.address}</p>
              </div>
            </div>
          </div>
          
          <p className="mt-8 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            Until our grand opening, every order is processed through our website with express delivery support across Bangladesh. Our workshop team is already active for custom kit fittings.
          </p>
        </div>
      </div>
    </section>
  );
}

