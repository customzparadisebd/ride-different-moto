import { Link } from "@tanstack/react-router";
import type { ComponentType } from "react";
import { Mail, Phone, Store } from "lucide-react";

import {
  FacebookIcon,
  InstagramIcon,
  WhatsAppIcon,
  YouTubeIcon,
} from "@/components/BrandIcons";
import { Logo } from "@/components/Logo";
import { StoreMap } from "@/components/StoreMap";
import { useLanguage } from "@/lib/i18n";
import { legalLinks, navLinks, site } from "@/data/site";

const socialIcons: Record<string, { Icon: ComponentType<{ className?: string }>; color: string }> = {
  Facebook: { Icon: FacebookIcon, color: "text-brand-facebook" },
  Instagram: { Icon: InstagramIcon, color: "text-brand-instagram" },
  YouTube: { Icon: YouTubeIcon, color: "text-brand-youtube" },
};

export function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="mt-16 bg-gradient-onyx text-onyx-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="min-w-0">
            <Logo on="dark" className="h-11 w-auto" />
            <p className="mt-4 font-display text-sm uppercase tracking-[0.25em] text-primary">
              Ride Different. Be Different.
            </p>
            <p className="mt-3 max-w-xs text-sm opacity-75">{site.description}</p>
          </div>

          <div>
            <h2 className="eyebrow text-primary">Quick Links</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {navLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="opacity-80 hover:text-primary hover:opacity-100">
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
                  href={site.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 opacity-80 hover:text-primary hover:opacity-100"
                >
                  <WhatsAppIcon className="size-4 shrink-0 text-brand-whatsapp" />
                  <span>WhatsApp</span>
                </a>
              </li>
              <li>
                <a
                  href={site.phoneHref}
                  className="flex items-center gap-2 opacity-80 hover:text-primary hover:opacity-100"
                >
                  <Phone className="size-4 shrink-0 text-primary" aria-hidden="true" />
                  <span>{site.phoneDisplay}</span>
                </a>
              </li>
              <li>
                <a
                  href={site.emailHref}
                  className="flex items-start gap-2 opacity-80 hover:text-primary hover:opacity-100"
                >
                  <Mail className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  <span className="break-all">{site.email}</span>
                </a>
              </li>
            </ul>

            <h2 className="eyebrow mt-6 text-primary">Store</h2>
            <p className="mt-3 flex items-start gap-2 text-sm opacity-80">
              <Store className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <span>{site.address}</span>
            </p>
            <p className="text-sm text-primary">Physical Store Coming Soon</p>
          </div>

          <div>
            <h2 className="eyebrow text-primary">Social</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {site.socials.map((social) => {
                const entry = socialIcons[social.name];
                const Icon = entry?.Icon;
                return (
                  <li key={social.name}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 opacity-80 hover:text-primary hover:opacity-100"
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
                  <Link to={link.to} className="opacity-80 hover:text-primary hover:opacity-100">
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
          © {new Date().getFullYear()} {site.name}. {t('footer.rights')} Developed by <a href="#" className="hover:text-primary transition-colors">Rafi Gazi (Rabbee) Apps</a>
        </p>
      </div>
    </footer>
  );
}
