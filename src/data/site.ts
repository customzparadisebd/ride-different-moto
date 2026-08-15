export const site = {
  url: "https://customzparadisebd.com",

  name: "Customz Paradise BD",
  shortName: "CZP",
  tagline: "Ride Different. Be Different.",
  description:
    "Premium motorcycle modification parts and accessories in Bangladesh. Unique designs, quality-focused products and nationwide delivery.",
  phoneDisplay: "+880 1890-722202",
  phoneHref: "tel:+8801890722202",
  whatsappNumber: "8801890722202",
  whatsappHref: "https://wa.me/8801890722202",
  email: "customzparadisebd@gmail.com",
  emailHref: "mailto:customzparadisebd@gmail.com",
  address: "Uttara-1230, Dhaka, Bangladesh",
  mainBranch: "India",
  storeStatus: "Physical store coming soon in Uttara, Dhaka",
  socials: [
    { name: "Facebook", href: "https://www.facebook.com/customzparadisebd" },
    { name: "Instagram", href: "https://www.instagram.com/customz_paradise_bd" },
    { name: "YouTube", href: "https://www.youtube.com/@CustomzParadiseBD" },
  ],
} as const;

export const navLinks = [
  { label: "Home", to: "/", translationKey: "nav.home" },
  { label: "Shop", to: "/shop", translationKey: "nav.shop" },
  { label: "Bike Models", to: "/bike-models", translationKey: "nav.bikeModels" },
  { label: "New Arrivals", to: "/new-arrivals", translationKey: "nav.newArrivals" },
  { label: "Gallery", to: "/gallery", translationKey: "nav.gallery" },
  { label: "About Us", to: "/about", translationKey: "nav.about" },
  { label: "Contact", to: "/contact", translationKey: "nav.contact" },
] as const;

export const legalLinks = [
  { label: "Privacy Policy", to: "/privacy-policy" },
  { label: "Terms & Conditions", to: "/terms" },
  { label: "Return & Refund Policy", to: "/returns" },
  { label: "Shipping Policy", to: "/shipping" },
] as const;

export const trustPoints = [
  {
    title: "Premium Quality",
    body: "High-quality motorcycle modification products, checked before dispatch.",
  },
  {
    title: "Unique Designs",
    body: "Distinctive parts and finishes made to help your bike stand out.",
  },
  {
    title: "Fast Delivery",
    body: "Delivery support across Bangladesh with order tracking.",
  },
  {
    title: "Customer Support",
    body: "Dedicated support from riders who understand modification.",
  },
] as const;
