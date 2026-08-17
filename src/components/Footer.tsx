import { Link, useRouteContext } from "@tanstack/react-router";
import type { ComponentType } from "react";
import { Mail, Phone, Store } from "lucide-react";

import { FacebookIcon, InstagramIcon, WhatsAppIcon, YouTubeIcon } from "@/components/BrandIcons";
import { Logo } from "@/components/Logo";
import { StoreMap } from "@/components/StoreMap";
import { useLanguage } from "@/lib/i18n";
import { legalLinks, navLinks, site } from "@/data/site";
import { type SiteSettings } from "@/lib/settings.shared";
import { useQuery } from "@tanstack/react-query";
import { getSiteSettings } from "@/lib/site-settings.functions";

const socialIcons: Record<string, { Icon: ComponentType<{ className?: string }>; color: string }> =
  {
    Facebook: { Icon: FacebookIcon, color: "text-brand-facebook" },
    Instagram: { Icon: InstagramIcon, color: "text-brand-instagram" },
    YouTube: { Icon: YouTubeIcon, color: "text-brand-youtube" },
  };

export function Footer() {
  const { t } = useLanguage();
  const { data: siteSettings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: () => getSiteSettings(),
  });

  const settings = siteSettings || site;
  const businessName = (settings as SiteSettings).businessName || (settings as any).name || site.name;
  const businessTagline = (settings as SiteSettings).tagline || (settings as any).tagline || site.tagline;
  const businessDescription = (settings as SiteSettings).businessDescription || (settings as any).description || site.description;
  const businessPhone = (settings as SiteSettings).phone || (settings as any).phoneDisplay || site.phoneDisplay;
  const businessAddress = (settings as SiteSettings).address || site.address;
  const businessEmail = (settings as SiteSettings).email || site.email;
  const businessWhatsApp = (settings as SiteSettings).whatsapp || (settings as any).whatsapp || site.whatsappNumber;
  const whatsappNumber = businessWhatsApp.replace(/\D/g, "");
  const whatsappHref = whatsappNumber ? `https://wa.me/${whatsappNumber}` : site.whatsappHref;
  const phoneHref = businessPhone ? `tel:${businessPhone.replace(/\D/g, "")}` : site.phoneHref;
  const emailHref = businessEmail ? `mailto:${businessEmail}` : site.emailHref;
  const socials = (settings as SiteSettings).socialLinks?.length 
    ? (settings as SiteSettings).socialLinks 
    : (settings as any).socials || site.socials;

  return (
    <footer className="mt-16 bg-gradient-onyx text-onyx-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="min-w-0">
              <Logo on="dark" className="h-11 w-auto" />
              <p className="mt-4 font-display text-sm uppercase tracking-[0.25em] text-primary">
                {businessTagline}
              </p>
              <p className="mt-3 max-w-xs text-sm opacity-75">{businessDescription}</p>
            </div>

            <div>
              <h2 className="eyebrow text-primary">Quick Links</h2>
              <ul className="mt-4 space-y-2.5 text-sm">
                {navLinks.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="opacity-80 hover:text-primary hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-sm">
                      {t(link.translationKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="eyebrow text-primary">Customer Support</h2>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li>
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 opacity-80 hover:text-primary hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-sm"
                  >
                    <WhatsAppIcon className="size-4 shrink-0 text-brand-whatsapp" />
                    <span>WhatsApp</span>
                  </a>
                </li>
                <li>
                  <a
                    href={phoneHref}
                    className="flex items-center gap-2 opacity-80 hover:text-primary hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-sm"
                  >
                    <Phone className="size-4 shrink-0 text-primary" aria-hidden="true" />
                    <span>{businessPhone}</span>
                  </a>
                </li>
                <li>
                  <a
                    href={emailHref}
                    className="flex items-start gap-2 opacity-80 hover:text-primary hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-sm"
                  >
                    <Mail className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    <span className="break-all">{businessEmail}</span>
                  </a>
                </li>
              </ul>

              <h2 className="eyebrow mt-6 text-primary">Store</h2>
              <p className="mt-3 flex items-start gap-2 text-sm opacity-80">
                <Store className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <span>{businessAddress}</span>
              </p>
              <p className="text-sm text-primary">Physical Store Coming Soon</p>
            </div>

            <div>
              <h2 className="eyebrow text-primary">Social</h2>
              <ul className="mt-4 space-y-2.5 text-sm">
                {socials.map((social: any) => {
                  const entry = socialIcons[social.name];
                  const Icon = entry?.Icon;
                  return (
                    <li key={social.name}>
                      <a
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 opacity-80 hover:text-primary hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-sm"
                      >
                        {Icon && <Icon className={`size-4 shrink-0 ${entry?.color}`} />}
                        <span>{social.name}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>

              <h2 className="eyebrow mt-6 text-primary">Legal</h2>
              <ul className="mt-4 space-y-2.5 text-sm">
                {legalLinks.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="opacity-80 hover:text-primary hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-sm">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {/* OFFICE MAP — COMPACT FOOTER MAP — COMPLETED */}
          <div className="w-full lg:max-w-[260px]">
            <StoreMap />
          </div>
        </div>

        <p className="mt-10 border-t border-white/10 pt-6 text-xs opacity-60">
          © {new Date().getFullYear()} {businessName}. {t("footer.rights")}
        </p>
      </div>
    </footer>
  );
}
