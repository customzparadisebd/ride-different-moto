import { SectionHeading } from "@/components/home/SectionHeading";
import { site, trustPoints } from "@/data/site";
import { ShieldCheck, Zap, Palette, Headphones } from "lucide-react";

export function AboutSection() {
  const iconMap: Record<string, any> = {
    "Premium Quality": ShieldCheck,
    "Unique Designs": Palette,
    "Fast Delivery": Zap,
    "Customer Support": Headphones,
    "Authentic Products": ShieldCheck,
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
      <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
        <div>
          <SectionHeading eyebrow="Our Story" title="About Us" />
          <div className="mt-8 space-y-6 text-lg leading-relaxed text-muted-foreground">
            <p>
              <span className="font-bold text-foreground">{site.name}</span> is more than just a parts shop. We are a dedicated motorcycle modification hub born from a passion for unique builds and high-performance aesthetics.
            </p>
            <p>
              Established with a clear vision to redefine the motorcycling landscape in Bangladesh, we source and develop premium modification kits that help riders express their individuality on every journey.
            </p>
            <div className="pt-4">
              <p className="font-display text-2xl font-bold uppercase tracking-widest text-primary italic">
                {site.tagline}
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

