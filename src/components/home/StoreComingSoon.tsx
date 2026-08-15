import { MapPin } from "lucide-react";

import { site } from "@/data/site";
import { useLanguage } from "@/lib/i18n";

export function StoreComingSoon() {
  const { t } = useLanguage();
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-onyx to-black p-6 text-onyx-foreground shadow-2xl sm:rounded-3xl sm:p-10 lg:p-12">
        <div className="pointer-events-none absolute top-0 right-0 p-4 opacity-5 sm:p-8 lg:p-12">
          <MapPin className="size-24 sm:size-48 lg:size-64" />
        </div>

        <div className="relative z-10">
          <p className="eyebrow text-primary">{t("section.store.eyebrow")}</p>
          <h2 className="mt-2 max-w-2xl font-display text-2xl font-bold uppercase leading-tight tracking-tight sm:text-4xl lg:text-6xl">
            {t("section.store.title")}
          </h2>

          <div className="mt-6 flex flex-col gap-6 sm:mt-8 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                <MapPin className="size-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary sm:text-xs">
                  {t("section.store.location")}
                </p>
                <p className="text-sm font-medium break-words sm:text-base lg:text-lg overflow-hidden text-ellipsis">
                  {site.address}
                </p>
              </div>
            </div>
          </div>

          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:mt-8 sm:text-base lg:text-lg">
            {t("section.store.p1")}
          </p>
        </div>
      </div>
    </section>
  );
}
