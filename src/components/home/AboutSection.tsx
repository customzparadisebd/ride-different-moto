import { SectionHeading } from "@/components/home/SectionHeading";
import { site } from "@/data/site";

export function AboutSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <SectionHeading eyebrow="Who we are" title="About Us" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
          <p>
            {site.name} is a premium motorcycle modification accessories brand dedicated to helping
            riders transform the look and personality of their bikes.
          </p>
          <p>
            We bring carefully selected, high-quality modification products and unique designs to
            motorcycle enthusiasts in Bangladesh.
          </p>
          <p className="font-display text-lg uppercase tracking-[0.18em] text-primary">
            Ride Different. Be Different.
          </p>
        </div>
        <ul className="space-y-3 text-sm">
          <li className="rounded-lg border border-border bg-card p-4">
            <p className="eyebrow text-muted-foreground">Operating in</p>
            <p className="mt-1 font-semibold">Bangladesh</p>
          </li>
          <li className="rounded-lg border border-border bg-card p-4">
            <p className="eyebrow text-muted-foreground">Main branch</p>
            <p className="mt-1 font-semibold">{site.mainBranch}</p>
          </li>
          <li className="rounded-lg border border-border bg-card p-4">
            <p className="eyebrow text-muted-foreground">Bangladesh store</p>
            <p className="mt-1 font-semibold">Coming soon — Uttara, Dhaka</p>
          </li>
        </ul>
      </div>
    </section>
  );
}