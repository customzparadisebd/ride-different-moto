import { Store } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { WhatsAppIcon, FacebookIcon } from "@/components/BrandIcons";
import { SectionHeading } from "@/components/home/SectionHeading";
import { site } from "@/data/site";
import { useLanguage } from "@/lib/i18n";
import { getSiteSettings } from "@/lib/site-settings.functions";
import { type SiteSettings } from "@/lib/settings.shared";

export function ContactSection() {
  const { t } = useLanguage();
  const { data: siteSettings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: () => getSiteSettings({ data: undefined }),
  });

  const settings = (siteSettings as SiteSettings) || site;
  const businessName = (settings as SiteSettings).businessName || (settings as any).name || site.name;
  const businessPhone = (settings as SiteSettings).phone || (settings as any).phoneDisplay || site.phoneDisplay;
  const businessAddress = (settings as SiteSettings).address || site.address;
  const whatsappNumber = (settings as SiteSettings).whatsapp || (settings as any).whatsapp || site.whatsappNumber;

  const getWhatsAppHref = () => {
    const text = encodeURIComponent(
      `Hello ${businessName}, I'm interested in modifying my bike. Can you help me?`,
    );
    return `https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${text}`;
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:py-24" id="contact">
      <div className="w-full">
        <SectionHeading eyebrow={t("section.contact.eyebrow")} title={t("section.contact.title")} />
        <div className="mb-6 sm:mb-8" />

        <p className="mb-8 max-w-2xl text-sm text-muted-foreground sm:mb-10 sm:text-base lg:text-lg">
          {t("section.contact.p1")}
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <a
            href={getWhatsAppHref()}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-6 text-center shadow-card transition-colors hover:border-brand-whatsapp/60 sm:p-8"
          >
            <div className="grid size-12 place-items-center rounded-xl bg-brand-whatsapp/10 text-brand-whatsapp transition-transform group-hover:scale-110">
              <WhatsAppIcon className="size-6" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-sm font-bold uppercase tracking-tight sm:text-base">
                WhatsApp
              </h3>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{businessPhone}</p>
            </div>
          </a>

          <a
            href="https://m.me/customzparadisebd"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-6 text-center shadow-card transition-colors hover:border-brand-facebook/60 sm:p-8"
          >
            <div className="grid size-12 place-items-center rounded-xl bg-brand-facebook/10 text-brand-facebook transition-transform group-hover:scale-110">
              <FacebookIcon className="size-6" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-sm font-bold uppercase tracking-tight sm:text-base">
                {t("section.contact.messenger")}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{businessName}</p>
            </div>
          </a>

          <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-6 text-center shadow-card sm:col-span-2 sm:p-8 lg:col-span-1">
            <div className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
              <Store className="size-6" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-sm font-bold uppercase tracking-tight sm:text-base">
                {t("section.contact.office")}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{businessAddress}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
