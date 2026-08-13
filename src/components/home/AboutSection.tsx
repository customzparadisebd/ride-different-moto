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
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:py-24" id="about">
      <div className="flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-16">
        <div className="w-full lg:flex-1">
          <SectionHeading eyebrow="Our Story" title="About Us" />
          <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground sm:mt-8 sm:space-y-6 sm:text-lg">
            <p>
              <span className="font-bold text-foreground">{site.name}</span> is more than just a parts shop. We are a dedicated motorcycle modification hub born from a passion for unique builds and high-performance aesthetics.
            </p>
            <p>
              Established with a clear vision to redefine the motorcycling landscape in Bangladesh, we source and develop premium modification kits that help riders express their individuality on every journey.
            </p>
            <div className="pt-2 sm:pt-4">
              <p className="font-display text-xl font-bold uppercase tracking-widest text-primary italic sm:text-2xl">
                {site.tagline}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

