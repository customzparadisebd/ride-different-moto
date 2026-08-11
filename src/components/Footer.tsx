import { Link } from "@tanstack/react-router";

import { Logo } from "@/components/Logo";
import { legalLinks, navLinks, site } from "@/data/site";

export function Footer() {
  return (
    <footer className="mt-16 bg-gradient-onyx text-onyx-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
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
                    {link.label}
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
                  className="opacity-80 hover:text-primary hover:opacity-100"
                >
                  WhatsApp
                </a>
              </li>
              <li>
                <a
                  href={site.phoneHref}
                  className="opacity-80 hover:text-primary hover:opacity-100"
                >
                  {site.phoneDisplay}
                </a>
              </li>
              <li>
                <a
                  href={site.emailHref}
                  className="break-all opacity-80 hover:text-primary hover:opacity-100"
                >
                  {site.email}
                </a>
              </li>
            </ul>

            <h2 className="eyebrow mt-6 text-primary">Store</h2>
            <p className="mt-3 text-sm opacity-80">{site.address}</p>
            <p className="text-sm text-primary">Physical Store Coming Soon</p>
          </div>

          <div>
            <h2 className="eyebrow text-primary">Social</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {site.socials.map((social) => (
                <li key={social.name}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="opacity-80 hover:text-primary hover:opacity-100"
                  >
                    {social.name}
                  </a>
                </li>
              ))}
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

        <p className="mt-10 border-t border-white/10 pt-6 text-xs opacity-60">
          © {new Date().getFullYear()} {site.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
