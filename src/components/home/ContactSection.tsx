import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { SectionHeading } from "@/components/home/SectionHeading";
import { site } from "@/data/site";

export function ContactSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <SectionHeading eyebrow="Talk to us" title="Contact Us" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <a
          href={site.whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="group rounded-xl border border-border bg-card p-4 shadow-card transition-colors hover:border-primary/60"
        >
          <MessageCircle className="size-5 text-primary" aria-hidden="true" />
          <p className="mt-2 font-display text-base font-bold uppercase tracking-wide">WhatsApp</p>
          <p className="truncate text-sm text-muted-foreground">{site.phoneDisplay}</p>
        </a>
        <a
          href={site.phoneHref}
          className="group rounded-xl border border-border bg-card p-4 shadow-card transition-colors hover:border-primary/60"
        >
          <Phone className="size-5 text-primary" aria-hidden="true" />
          <p className="mt-2 font-display text-base font-bold uppercase tracking-wide">Call</p>
          <p className="truncate text-sm text-muted-foreground">{site.phoneDisplay}</p>
        </a>
        <a
          href={site.emailHref}
          className="group rounded-xl border border-border bg-card p-4 shadow-card transition-colors hover:border-primary/60"
        >
          <Mail className="size-5 text-primary" aria-hidden="true" />
          <p className="mt-2 font-display text-base font-bold uppercase tracking-wide">Email</p>
          <p className="truncate text-sm text-muted-foreground">{site.email}</p>
        </a>
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <MapPin className="size-5 text-primary" aria-hidden="true" />
          <p className="mt-2 font-display text-base font-bold uppercase tracking-wide">Location</p>
          <p className="text-sm text-muted-foreground">{site.address}</p>
        </div>
      </div>
    </section>
  );
}
