import bannerPerfectPriceMobile from "@/assets/hero-mobile.png.asset.json";
import bannerPerfectPrice from "@/assets/banner-perfect-price.png.asset.json";
import heroDuke from "@/assets/hero-duke-250.jpg";
import heroN160 from "@/assets/hero-pulsar-n160.jpg";
import heroR15 from "@/assets/hero-r15-v4.jpg";
import modelMt15 from "@/assets/model-mt15.jpg";
import modelNs200 from "@/assets/model-ns200.jpg";
import modelN250 from "@/assets/model-pulsar-n250.jpg";
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
    id: "hs-0",
    bikeName: "We Are Perfect Price",
    label: "Quality & Value",
    image: (bannerPerfectPrice as any).url,
    mobileImage: (bannerPerfectPriceMobile as any).url,
    alt: "Modification is expensive but hand in our heart - We are perfect price banner",
    bikeSlug: "all-products",
    order: 0,
    active: true,
    isFullBanner: true,
  },
  {
    id: "hs-1",
    bikeName: "Pulsar N160",
    label: "Modification Setup",
    image: heroN160,
    alt: "Custom modified Bajaj Pulsar N160 with visual upgrades in Bangladesh",
    bikeSlug: "bajaj-pulsar-n160-parts-bd",
    order: 1,
    active: true,
  },
  {
    id: "hs-2",
    bikeName: "Yamaha R15 V4",
    label: "Silver & Carbon Build",
    image: heroR15,
    alt: "Yamaha R15 V4 carbon build modification accessories Bangladesh",
    bikeSlug: "yamaha-r15-v4-modification-parts",
    order: 2,
    active: true,
  },
  {
    id: "hs-3",
    bikeName: "Duke 250",
    label: "Blacked Out Build",
    image: heroDuke,
    alt: "KTM Duke 250 blacked out build and custom parts Customz Paradise BD",
    bikeSlug: "ktm-duke-250-accessories-bd",
    order: 3,
    active: true,
  },
];

const bikeModels: BikeModel[] = [
  {
    id: "bm-1",
    slug: "bajaj-pulsar-n160-parts-bd",
    name: "Pulsar N160",
    label: "Modification Parts",
    image: heroN160,
    alt: "Bajaj Pulsar N160 modification parts and accessories in Bangladesh",
    order: 1,
    active: true,
  },
  {
    id: "bm-2",
    slug: "pulsar-ns200-modification-bd",
    name: "Pulsar NS200",
    label: "Modification Parts",
    image: modelNs200,
    alt: "Bajaj Pulsar NS200 modification parts and stickers BD",
    order: 2,
    active: true,
  },
  {
    // Pulsar N250 shares the same universal parts line-up as the N160.
    id: "bm-6",
    slug: "pulsar-n250-parts-bangladesh",
    name: "Pulsar N250",
    label: "Modification Parts",
    image: modelN250,
    alt: "Bajaj Pulsar N250 modification kits and accessories",
    order: 3,
    active: true,
  },
  {
    id: "bm-3",
    slug: "yamaha-r15-v4-modification-parts",
    name: "Yamaha R15 V4",
    label: "Modification Parts",
    image: heroR15,
    alt: "Yamaha R15 V4 modification fairings and accessories Bangladesh",
    order: 4,
    active: true,
  },
  {
    id: "bm-4",
    slug: "yamaha-mt-15-accessories-bd",
    name: "MT-15",
    label: "Modification Parts",
    image: modelMt15,
    alt: "Yamaha MT-15 modification parts and visual upgrades",
    order: 5,
    active: true,
  },
  {
    id: "bm-5",
    slug: "ktm-duke-250-accessories-bd",
    name: "Duke 250",
    label: "Modification Parts",
    image: heroDuke,
    alt: "KTM Duke 250 modification parts and performance accessories",
    order: 6,
    active: true,
  },
];

const products: Product[] = [
  {
    id: "p-1",
    slug: "sequential-chrome-led-indicator-set",
    name: "Chrome LED Indicator Set",
    description: "Bullet-style turn signals with sequential red LED.",
    image: prodIndicators,
    alt: "Sequential chrome bullet LED motorcycle indicators for visual modification",
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
    slug: "carbon-fiber-tip-slip-on-exhaust",
    name: "Carbon Slip-On Exhaust",
    description: "Deep tone slip-on with carbon fiber tip.",
    image: prodExhaust,
    alt: "Deep tone carbon fiber tip motorcycle exhaust slip-on",
    price: 8500,
    offerPrice: 7250,
    currency: "BDT",
    universal: true,
    bikeSlugs: ["bajaj-pulsar-n160-parts-bd", "pulsar-ns200-modification-bd", "ktm-duke-250-accessories-bd"],
    category: "Exhaust",
    featured: true,
    inStock: true,
    order: 2,
    active: true,
  },
  {
    id: "p-3",
    slug: "anodized-cnc-handlebar-grips-red",
    name: "Anodized Handlebar Grips",
    description: "CNC red anodized grips with anti-slip knurling.",
    image: prodGrips,
    alt: "Red CNC anodized anti-slip motorcycle handlebar grips",
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
    slug: "heavy-duty-engine-crash-guard",
    name: "Engine Crash Guard",
    description: "Powder coated steel guard for daily protection.",
    image: prodCrashguard,
    alt: "Heavy duty steel motorcycle engine crash guard for Pulsar and MT-15",
    price: 3400,
    offerPrice: 2950,
    currency: "BDT",
    universal: false,
    bikeSlugs: ["bajaj-pulsar-n160-parts-bd", "pulsar-ns200-modification-bd", "yamaha-mt-15-accessories-bd"],
    category: "Protection",
    bestDeal: true,
    inStock: true,
    order: 4,
    active: true,
  },
  {
    id: "p-5",
    slug: "aerodynamic-cnc-bar-end-mirrors",
    name: "CNC Bar End Mirrors",
    description: "Compact aerodynamic mirrors with red accent.",
    image: prodMirrors,
    alt: "Aerodynamic CNC motorcycle bar end mirrors with red accents",
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
    slug: "dual-beam-led-projector-fog-light",
    name: "LED Projector Fog Light",
    description: "High output auxiliary lighting pair.",
    image: prodFoglight,
    alt: "High intensity LED projector fog lights for motorcycles",
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
    slug: "3d-carbon-fiber-tank-pad-set",
    name: "Carbon Tank Pad Set",
    description: "5-piece grip set with red inlay detailing.",
    image: prodTankpad,
    alt: "3D carbon fiber motorcycle tank pad set visual modification",
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
export const getBikeModel = (slug: string) => getBikeModels().find((model) => model.slug === slug);

export const getProducts = () => products.filter(isActive).sort(byOrder);
export const getUniversalProducts = () => getProducts().filter((p) => p.universal);
export const getBestDeals = () => getProducts().filter((p) => p.bestDeal || p.featured);
export const getNewArrivals = () => getProducts().filter((p) => p.newArrival);
export const getProductsForBike = (slug: string) =>
  getProducts().filter((p) => p.bikeSlugs?.includes(slug) || p.universal);

export const getReviews = () => reviews.filter(isActive).sort(byOrder);
export const getPolicy = (slug: string) => policies.find((p) => p.slug === slug);
export const getPolicies = () => policies;
