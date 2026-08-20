import { SectionHeading } from "@/components/home/SectionHeading";
import { site, trustPoints } from "@/data/site";
import { ShieldCheck, Zap, Palette, Headphones } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";
import { getSiteSettings } from "@/lib/site-settings.functions";
import { type SiteSettings } from "@/lib/settings.shared";

export function AboutSection() {
  const { t } = useLanguage();
  const { data: siteSettings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: () => getSiteSettings({ data: undefined }),
  });

  const settings = siteSettings || site;
  const businessName = (settings as SiteSettings).businessName || (settings as any).name || site.name;
  const businessTagline = (settings as SiteSettings).tagline || (settings as any).tagline || site.tagline;
  const businessDescription = (settings as SiteSettings).businessDescription || (settings as any).description || site.description;
  const branchRelationship = (settings as SiteSettings).branchRelationship;

  const iconMap: Record<string, any> = {
    "Premium Quality": ShieldCheck,
    "Unique Designs": Palette,
    "Fast Delivery": Zap,
    "Customer Support": Headphones,
    "Authentic Products": ShieldCheck,
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:py-24" id="about">
      <div className="flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-16">
        <div className="w-full lg:flex-1">
          <SectionHeading eyebrow={t("section.about.eyebrow")} title={t("section.about.title")} />
          <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground sm:mt-8 sm:space-y-6 sm:text-lg">
            <p>
              <span className="font-bold text-foreground">{businessName}</span> {businessDescription}
            </p>
            {branchRelationship && (
              <p className="border-l-4 border-primary pl-4 py-1 text-sm italic">
                {branchRelationship}
              </p>
            )}
            <p>{t("section.about.p2")}</p>
            <div className="pt-2 sm:pt-4">
              <p className="font-display text-xl font-bold uppercase tracking-widest text-primary italic sm:text-2xl">
                {businessTagline}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
