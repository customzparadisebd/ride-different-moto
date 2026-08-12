// OFFICE MAP — COMPLETED
// Compact embedded Google Maps strip shown below the footer.
// Uses the keyless `output=embed` map URL, so no API key is exposed client-side.
import { MapPin } from "lucide-react";

import { site } from "@/data/site";

const MAP_QUERY = "Customz+Paradise+BD";
const MAP_EMBED_SRC = `https://www.google.com/maps?q=${MAP_QUERY}@23.8881991,90.378464&z=16&output=embed`;
const MAP_LINK =
  "https://www.google.com/maps/place/Customz+Paradise+BD/@23.888204,90.3758891,17z/data=!3m1!4b1!4m6!3m5!1s0x3755c535b6f04f4d:0xb630cb91d8164d05!8m2!3d23.8881991!4d90.378464!16s%2Fg%2F11nr3dq38y";

export function StoreMap() {
  return (
    <section aria-label="Store location map" className="bg-gradient-onyx text-onyx-foreground">
      <div className="mx-auto max-w-7xl px-4 pb-8 sm:px-6">
        <div className="overflow-hidden rounded-xl border border-white/10">
          <iframe
            title={`${site.name} location on Google Maps`}
            src={MAP_EMBED_SRC}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="block h-44 w-full border-0 sm:h-56"
          />
          <div className="flex flex-wrap items-center justify-between gap-3 bg-black/40 px-4 py-3">
            <p className="flex items-start gap-2 text-xs opacity-80">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <span>{site.address}</span>
            </p>
            <a
              href={MAP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-xs font-semibold uppercase tracking-widest text-primary-foreground hover:bg-primary/90"
            >
              Open in Maps
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}