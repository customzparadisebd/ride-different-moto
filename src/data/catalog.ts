import heroDuke from "@/assets/hero-duke-250.jpg";
import heroN160 from "@/assets/hero-pulsar-n160.jpg";
import heroR15 from "@/assets/hero-r15-v4.jpg";
import modelMt15 from "@/assets/model-mt15.jpg";
import modelNs200 from "@/assets/model-ns200.jpg";
import prodCrashguard from "@/assets/product-crashguard.jpg";
import prodExhaust from "@/assets/product-exhaust.jpg";
import prodFoglight from "@/assets/product-foglight.jpg";
import prodGrips from "@/assets/product-grips.jpg";
import prodIndicators from "@/assets/product-indicators.jpg";
import prodMirrors from "@/assets/product-mirrors.jpg";
import prodTankpad from "@/assets/product-tankpad.jpg";

import type { BikeModel, HeroSlide, PolicyPage, Product, Review } from "./types";

const heroSlides: HeroSlide[] = [
  {
    id: "hs-1",
    bikeName: "Pulsar N160",
    label: "Modification Setup",
    image: heroN160,
    alt: "Modified Bajaj Pulsar N160 with red and black custom bodywork",
    bikeSlug: "pulsar-n160",
    order: 1,
    active: true,
  },
  {
    id: "hs-2",
    bikeName: "Yamaha R15 V4",
    label: "Silver & Carbon Build",
    image: heroR15,
    alt: "Modified Yamaha R15 V4 with silver and red fairing graphics",
    bikeSlug: "r15-v4",
    order: 2,
    active: true,
  },
  {
    id: "hs-3",
    bikeName: "Duke 250",
    label: "Blacked Out Build",
    image: heroDuke,
    alt: "Blacked out KTM Duke 250 with red frame and aftermarket exhaust",
    bikeSlug: "duke-250",
    order: 3,
    active: true,
  },
];

const bikeModels: BikeModel[] = [
  {
    id: "bm-1",
    slug: "pulsar-n160",
    name: "Pulsar N160",
    label: "Modification Parts",
    image: heroN160,
    alt: "Bajaj Pulsar N160 modification parts",
    order: 1,
    active: true,
  },
  {
    id: "bm-2",
    slug: "pulsar-ns200",
    name: "Pulsar NS200",
    label: "Modification Parts",
    image: modelNs200,
    alt: "Bajaj Pulsar NS200 modification parts",
    order: 2,
    active: true,
  },
  {
    id: "bm-3",
    slug: "r15-v4",
    name: "Yamaha R15 V4",
    label: "Modification Parts",
    image: heroR15,
    alt: "Yamaha R15 V4 modification parts",
    order: 3,
    active: true,
  },
  {
    id: "bm-4",
    slug: "mt-15",
    name: "MT-15",
    label: "Modification Parts",
    image: modelMt15,
    alt: "Yamaha MT-15 modification parts",
    order: 4,
    active: true,
  },
  {
    id: "bm-5",
    slug: "duke-250",
    name: "Duke 250",
    label: "Modification Parts",
    image: heroDuke,
    alt: "KTM Duke 250 modification parts",
    order: 5,
    active: true,
  },
];

const products: Product[] = [
  {
    id: "p-1",
    slug: "led-indicator-set",
    name: "Chrome LED Indicator Set",
    description: "Bullet-style turn signals with sequential red LED.",
    image: prodIndicators,
    alt: "Chrome bullet LED motorcycle indicator set",
    price: 2000,
    offerPrice: 1500,
    currency: "BDT",
    universal: true,
    category: "Lighting",
    bestDeal: true,
    featured: true,
    inStock: true,
    order: 1,
    active: true,
  },
  {
    id: "p-2",
    slug: "carbon-slip-on-exhaust",
    name: "Carbon Slip-On Exhaust",
    description: "Deep tone slip-on with carbon fiber tip.",
    image: prodExhaust,
    alt: "Black slip-on motorcycle exhaust with carbon tip",
    price: 8500,
    offerPrice: 7250,
    currency: "BDT",
    universal: true,
    bikeSlugs: ["pulsar-n160", "pulsar-ns200", "duke-250"],
    category: "Exhaust",
    featured: true,
    inStock: true,
    order: 2,
    active: true,
  },
  {
    id: "p-3",
    slug: "anodized-handlebar-grips",
    name: "Anodized Handlebar Grips",
    description: "CNC red anodized grips with anti-slip knurling.",
    image: prodGrips,
    alt: "Red anodized motorcycle handlebar grips",
    price: 1200,
    currency: "BDT",
    universal: true,
    category: "Handlebar",
    newArrival: true,
    inStock: true,
    order: 3,
    active: true,
  },
  {
    id: "p-4",
    slug: "engine-crash-guard",
    name: "Engine Crash Guard",
    description: "Powder coated steel guard for daily protection.",
    image: prodCrashguard,
    alt: "Black motorcycle engine crash guard",
    price: 3400,
    offerPrice: 2950,
    currency: "BDT",
    universal: false,
    bikeSlugs: ["pulsar-n160", "pulsar-ns200", "mt-15"],
    category: "Protection",
    bestDeal: true,
    inStock: true,
    order: 4,
    active: true,
  },
  {
    id: "p-5",
    slug: "bar-end-mirrors",
    name: "CNC Bar End Mirrors",
    description: "Compact aerodynamic mirrors with red accent.",
    image: prodMirrors,
    alt: "Black CNC motorcycle bar end mirrors",
    price: 2600,
    currency: "BDT",
    universal: true,
    category: "Mirrors",
    newArrival: true,
    inStock: false,
    order: 5,
    active: true,
  },
  {
    id: "p-6",
    slug: "led-projector-fog-light",
    name: "LED Projector Fog Light",
    description: "High output auxiliary lighting pair.",
    image: prodFoglight,
    alt: "Chrome LED projector motorcycle fog light",
    price: 4200,
    offerPrice: 3600,
    currency: "BDT",
    universal: true,
    category: "Lighting",
    featured: true,
    newArrival: true,
    inStock: true,
    order: 6,
    active: true,
  },
  {
    id: "p-7",
    slug: "carbon-tank-pad-set",
    name: "Carbon Tank Pad Set",
    description: "5-piece grip set with red inlay detailing.",
    image: prodTankpad,
    alt: "Carbon fiber motorcycle tank pad set with red accent",
    price: 950,
    currency: "BDT",
    universal: true,
    category: "Styling",
    inStock: true,
    order: 7,
    active: true,
  },
];

const reviews: Review[] = [
  {
    id: "r-1",
    name: "Sample Customer",
    rating: 5,
    text: "Placeholder review text. Real customer reviews will replace this once collected.",
    bikeModel: "Pulsar N160",
    active: true,
    order: 1,
  },
  {
    id: "r-2",
    name: "Sample Customer",
    rating: 5,
    text: "Placeholder review text used for layout only. No fabricated customer feedback is shown.",
    bikeModel: "Yamaha R15 V4",
    active: true,
    order: 2,
  },
  {
    id: "r-3",
    name: "Sample Customer",
    rating: 4,
    text: "Placeholder review text. This section is ready for verified reviews from the admin panel.",
    bikeModel: "Duke 250",
    active: true,
    order: 3,
  },
];

const policyBody = (title: string) => [
  {
    heading: "Overview",
    body: [
      `This ${title.toLowerCase()} is placeholder content prepared for review. Final wording will be confirmed by Customz Paradise BD before publication.`,
    ],
  },
  {
    heading: "Scope",
    body: [
      "It applies to orders placed through Customz Paradise BD channels, including this website, WhatsApp and social media enquiries.",
    ],
  },
  {
    heading: "Contact",
    body: [
      "For any question related to this document, reach us on WhatsApp at +8801890722202 or email customzparadisebd@gmail.com.",
    ],
  },
];

const policies: PolicyPage[] = [
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    summary: "How we handle the information you share when ordering or contacting us.",
    sections: policyBody("Privacy Policy"),
  },
  {
    slug: "terms",
    title: "Terms & Conditions",
    summary: "The terms that apply when you browse or order from Customz Paradise BD.",
    sections: policyBody("Terms & Conditions"),
  },
  {
    slug: "returns",
    title: "Return & Refund Policy",
    summary: "What to do if a product arrives damaged or is not as described.",
    sections: policyBody("Return & Refund Policy"),
  },
  {
    slug: "shipping",
    title: "Shipping Policy",
    summary: "Delivery coverage, timelines and charges across Bangladesh.",
    sections: policyBody("Shipping Policy"),
  },
];

const byOrder = <T extends { order: number }>(a: T, b: T) => a.order - b.order;
const isActive = <T extends { active: boolean }>(item: T) => item.active;

export const getHeroSlides = () => heroSlides.filter(isActive).sort(byOrder);
export const getBikeModels = () => bikeModels.filter(isActive).sort(byOrder);
export const getBikeModel = (slug: string) =>
  getBikeModels().find((model) => model.slug === slug);

export const getProducts = () => products.filter(isActive).sort(byOrder);
export const getUniversalProducts = () => getProducts().filter((p) => p.universal);
export const getBestDeals = () => getProducts().filter((p) => p.bestDeal || p.featured);
export const getNewArrivals = () => getProducts().filter((p) => p.newArrival);
export const getProductsForBike = (slug: string) =>
  getProducts().filter((p) => p.bikeSlugs?.includes(slug) || p.universal);

export const getReviews = () => reviews.filter(isActive).sort(byOrder);
export const getPolicy = (slug: string) => policies.find((p) => p.slug === slug);
export const getPolicies = () => policies;