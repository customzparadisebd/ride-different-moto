import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Star, Quote } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { useEffect, useState } from "react";

import { SectionHeading } from "@/components/home/SectionHeading";
import { getReviews } from "@/lib/reviews.functions";
import { cn } from "@/lib/utils";

export function ReviewSection() {
  const fetchReviews = useServerFn(getReviews);
  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", "public"],
    queryFn: () => fetchReviews({ data: { admin: false } }),
  });

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: true,
    dragFree: true,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  if (!reviews.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
      <SectionHeading eyebrow="What riders say" title="Customer Reviews" />

      <div className="relative mt-10">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-6">
            {reviews.map((review: any) => (
              <div
                key={review.id}
                className="min-w-0 flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_33.333%]"
              >
                <div className="flex h-full flex-col rounded-3xl border border-border bg-card p-8 shadow-card transition-colors hover:border-primary/40">
                  <div className="mb-4 flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "size-4 fill-current",
                          i < review.rating ? "text-yellow-500" : "text-muted",
                        )}
                      />
                    ))}
                  </div>

                  <Quote className="mb-4 size-8 text-primary/20" />

                  <p className="mb-6 flex-grow text-lg leading-relaxed text-foreground/90 italic">
                    "{review.comment}"
                  </p>

                  <div className="mt-auto">
                    <p className="font-display text-lg font-bold uppercase tracking-tight">
                      {review.customer_name}
                    </p>
                    {review.bike_model && (
                      <p className="text-sm text-muted-foreground">{review.bike_model}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {reviews.length > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            {reviews.map((_, i) => (
              <button
                key={i}
                onClick={() => emblaApi?.scrollTo(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  selectedIndex === i
                    ? "w-8 bg-primary"
                    : "w-2 bg-border hover:bg-muted-foreground",
                )}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
