import { Facebook, Instagram, Youtube } from "lucide-react";
import type { ComponentType } from "react";

import { SectionHeading } from "@/components/home/SectionHeading";
import { site } from "@/data/site";

const icons: Record<string, ComponentType<{ className?: string }>> = {
  Facebook,
  Instagram,
  YouTube: Youtube,
};

export function SocialSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <SectionHeading eyebrow="Follow the builds" title="Social Media" />
      <div className="grid gap-3 sm:grid-cols-3">
        {site.socials.map((social) => {
          const Icon = icons[social.name];
          return (
            <a
              key={social.name}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card transition-colors hover:border-primary/60"
            >
              {Icon && <Icon className="size-5 shrink-0 text-primary" />}
              <span className="min-w-0">
                <span className="block font-display text-base font-bold uppercase tracking-wide">
                  {social.name}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
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