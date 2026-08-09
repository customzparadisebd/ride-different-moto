import { Star } from "lucide-react";

import { SectionHeading } from "@/components/home/SectionHeading";
import type { Review } from "@/data/types";

export function ReviewsSection({ reviews }: { reviews: Review[] }) {
  if (!reviews.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <SectionHeading eyebrow="Feedback" title="Customer Reviews" />
      <ul className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible">
        {reviews.map((review) => (
          <li
            key={review.id}
            className="min-w-[80%] snap-start rounded-xl border border-border bg-card p-4 shadow-card sm:min-w-0"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary font-display text-sm font-bold">
                {review.name.slice(0, 1)}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold">{review.name}</p>
                {review.bikeModel && (
                  <p className="truncate text-xs text-muted-foreground">{review.bikeModel}</p>
                )}
              </div>
            </div>
            <div
              className="mt-3 flex items-center gap-0.5"
              aria-label={`Rated ${review.rating} out of 5`}
            >
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  aria-hidden="true"
                  className={
                    index < review.rating
                      ? "size-4 fill-primary text-primary"
                      : "size-4 text-muted-foreground"
                  }
                />
              ))}
              <span className="ml-1 text-xs text-muted-foreground">{review.rating}/5</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{review.text}</p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">
        Sample placeholder reviews shown until verified customer feedback is published.
      </p>
    </section>
  );
}