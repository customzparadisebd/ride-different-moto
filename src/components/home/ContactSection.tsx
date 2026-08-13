import { Store } from "lucide-react";

import { WhatsAppIcon, FacebookIcon } from "@/components/BrandIcons";
import { SectionHeading } from "@/components/home/SectionHeading";
import { site } from "@/data/site";

export function ContactSection() {
  const getWhatsAppHref = () => {
    const text = encodeURIComponent("Hello Customz Paradise BD, I'm interested in modifying my bike. Can you help me?");
    return `https://wa.me/${site.whatsappNumber}?text=${text}`;
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24" id="contact">
      <div className="w-full">
        <SectionHeading
          eyebrow="Get in touch"
          title="Contact Us"
        />
        <div className="mb-8" />
        
        <p className="mb-10 text-base sm:text-lg text-muted-foreground max-w-2xl">
          Have questions about our modification kits or need advice for your build? 
          Reach out to our experts directly or visit our office.
        </p>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <a
            href={getWhatsAppHref()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center text-center gap-4 rounded-xl border border-border bg-card p-6 sm:p-8 shadow-card transition-colors hover:border-primary/60"
          >
            <div className="grid size-12 place-items-center rounded-xl bg-brand-whatsapp/10 text-brand-whatsapp">
              <WhatsAppIcon className="size-6" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold uppercase tracking-tight">WhatsApp</h3>
              <p className="text-sm text-muted-foreground">{site.phoneDisplay}</p>
            </div>
          </a>

          <a
            href="https://m.me/customzparadisebd"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center text-center gap-4 rounded-xl border border-border bg-card p-6 sm:p-8 shadow-card transition-colors hover:border-primary/60"
          >
            <div className="grid size-12 place-items-center rounded-xl bg-brand-facebook/10 text-brand-facebook">
              <FacebookIcon className="size-6" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold uppercase tracking-tight">Messenger</h3>
              <p className="text-sm text-muted-foreground">Customz Paradise BD</p>
            </div>
          </a>

          <div className="flex flex-col items-center text-center gap-4 rounded-xl border border-border bg-card p-6 sm:p-8 shadow-card sm:col-span-2 lg:col-span-1">
            <div className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
              <Store className="size-6" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold uppercase tracking-tight">Office</h3>
              <p className="text-sm text-muted-foreground">{site.address}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
