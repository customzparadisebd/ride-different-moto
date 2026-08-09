import { SectionHeading } from "@/components/home/SectionHeading";
import { trustPoints } from "@/data/site";

export function TrustSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <SectionHeading eyebrow="Why riders choose us" title="Why Customz Paradise" />
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {trustPoints.map((point, index) => (
          <li
            key={point.title}
            className="rounded-xl border border-border bg-card p-4 shadow-card"
          >
            <span className="font-display text-sm font-bold text-primary">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-1 font-display text-lg font-bold uppercase tracking-wide">
              {point.title}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{point.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}