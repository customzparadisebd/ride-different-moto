import type { ComponentType } from "react";

import { FacebookIcon, InstagramIcon, YouTubeIcon } from "@/components/BrandIcons";
import { SectionHeading } from "@/components/home/SectionHeading";
import { site } from "@/data/site";

const icons: Record<string, { Icon: ComponentType<{ className?: string }>; color: string }> = {
  Facebook: { Icon: FacebookIcon, color: "text-brand-facebook" },
  Instagram: { Icon: InstagramIcon, color: "text-brand-instagram" },
  YouTube: { Icon: YouTubeIcon, color: "text-brand-youtube" },
};

export function SocialSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16">
      <SectionHeading eyebrow="Follow the builds" title="Social Media" />
      <div className="mt-6 grid grid-cols-1 gap-3 sm:mt-8 sm:grid-cols-2 lg:grid-cols-3">
        {site.socials.map((social) => {
          const entry = icons[social.name];
          const Icon = entry?.Icon;
          return (
            <a
              key={social.name}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-card transition-colors hover:border-primary/60 sm:p-5"
            >
              {Icon && <Icon className={`size-6 shrink-0 ${entry?.color ?? "text-primary"}`} />}
              <span className="min-w-0">
                <span className="block font-display text-sm font-bold uppercase tracking-wide sm:text-base">
                  {social.name}
                </span>
                <span className="block truncate text-[11px] text-muted-foreground sm:text-xs">
                  @customzparadisebd
                </span>
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}
