// OFFICE MAP — COMPACT FOOTER MAP — COMPLETED
// Small near-square map card rendered inside the footer's right column.
// Uses the keyless `output=embed` map URL, so no API key is exposed client-side.
import { MapPin } from "lucide-react";

import { site } from "@/data/site";

// MAP PIN & BUSINESS LABEL — COMPLETED
// `q` = exact listing coordinates + business name so Google renders the red pin
// with the full "Customz Paradise BD" label. A slightly lower zoom keeps the
// label from being clipped by the narrow square card.
const MAP_EMBED_SRC =
  "https://www.google.com/maps?q=Customz+Paradise+BD,+Uttara,+Dhaka&ll=23.8881991,90.378464&z=15&hl=en&output=embed";
const MAP_LINK =
  "https://www.google.com/maps/place/Customz+Paradise+BD/@23.888204,90.3758891,17z/data=!3m1!4b1!4m6!3m5!1s0x3755c535b6f04f4d:0xb630cb91d8164d05!8m2!3d23.8881991!4d90.378464!16s%2Fg%2F11nr3dq38y";

export function StoreMap() {
  return (
    <div
      aria-label="Store location map"
      className="overflow-hidden rounded-xl border border-white/10 bg-black/30 shadow-card"
    >
      {/* Wider iframe inside a square viewport: gives the business-name label
          horizontal room while the pin stays visually centered in the card. */}
      <div className="relative aspect-square w-full overflow-hidden">
        <iframe
          title={`${site.name} location on Google Maps`}
          src={MAP_EMBED_SRC}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute left-1/2 top-1/2 h-full w-[160%] -translate-x-[58%] -translate-y-1/2 border-0"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 bg-black/40 px-3 py-2.5">
        <p className="flex items-start gap-1.5 text-[11px] opacity-80">
          <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
          <span>{site.address}</span>
        </p>
        <a
          href={MAP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-9 items-center rounded-md bg-primary px-3 text-[11px] font-semibold uppercase tracking-widest text-primary-foreground hover:bg-primary/90"
        >
          Open in Maps
        </a>
      </div>
    </div>
  );
}