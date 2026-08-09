import type { PolicyPage as PolicyPageData } from "@/data/types";

export function PolicyArticle({ policy }: { policy: PolicyPageData }) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">
        {policy.title}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{policy.summary}</p>

      <div className="mt-8 space-y-7">
        {policy.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide">
              {section.heading}
            </h2>
            {section.body.map((paragraph) => (
              <p key={paragraph} className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>
    </article>
  );
}