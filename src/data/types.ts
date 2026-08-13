/**
 * Structured content models consumed by the landing page.
 * The UI must never hard-code content — it renders whatever the data layer returns,
 * so a future admin panel can supply the same shapes from the database.
 */

export type HeroSlide = {
  id: string;
  bikeName: string;
  label?: string | null;
  image: string;
  mobileImage?: string;
  alt: string;
  /** Destination bike model slug — the whole slide links to /bike-models/$slug. */
  bikeSlug: string;
  order: number;
  active: boolean;
  isFullBanner?: boolean;
};

export type BikeModel = {
  id: string;
  slug: string;
  name: string;
  label: string;
  image: string;
  alt: string;
  order: number;
  active: boolean;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  image: string;
  alt: string;
  price: number;
  offerPrice?: number;
  currency: "BDT";
  universal: boolean;
  bikeSlugs?: string[];
  category: string;
  bestDeal?: boolean;
  featured?: boolean;
  newArrival?: boolean;
  inStock: boolean;
  order: number;
  active: boolean;
};

export type Review = {
  id: string;
  name: string;
  rating: number;
  text: string;
  bikeModel?: string;
  avatar?: string;
  active: boolean;
  order: number;
};

export type PolicyPage = {
  slug: string;
  title: string;
  summary: string;
  sections: { heading: string; body: string[] }[];
};