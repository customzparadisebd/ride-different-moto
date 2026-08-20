import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
  ScrollRestoration,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Footer } from "@/components/Footer";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { Header } from "@/components/Header";
import { NetworkBanner } from "@/components/NetworkBanner";
import { Toaster } from "@/components/ui/sonner";
import { site } from "@/data/site";
import { CartProvider } from "@/lib/cart";
import { ThemeProvider } from "@/lib/theme";
import { LanguageProvider } from "@/lib/i18n";
import { logNotFound } from "@/lib/analytics.functions";
import { getSiteSettings } from "@/lib/site-settings.functions";
import errorGif from "@/assets/404-error.gif.asset.json";
import { SmoothCursor } from "@/components/SmoothCursor";
import { type SiteSettings } from "@/lib/settings.shared";

function NotFoundComponent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isPrivateArea = pathname === "/ad" || pathname.startsWith("/ad/");
  const logFn = useServerFn(logNotFound);

  useEffect(() => {
    void logFn({
      data: {
        path: pathname,
        referrer: typeof document !== "undefined" ? document.referrer : null,
      },
    });
  }, [pathname, logFn]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg text-center">
        <div className="relative mx-auto mb-10 w-full max-w-[320px] overflow-hidden rounded-xl bg-muted/30 sm:max-w-[500px] lg:max-w-[600px]">
          <img
            src={errorGif.url}
            alt="Page not found"
            className="h-auto w-full object-contain transition-transform duration-500 hover:scale-105"
            loading="eager"
          />
        </div>

        <h1 className="text-6xl font-black tracking-tighter text-foreground sm:text-8xl">404</h1>
        <h2 className="mt-4 text-2xl font-bold uppercase tracking-wide text-foreground sm:text-3xl">
          Page Not Found
        </h2>
        <p className="mx-auto mt-4 max-w-sm text-base text-muted-foreground sm:text-lg">
          The page you're looking for doesn't exist or has been moved to a different path.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            to={isPrivateArea ? "/ad" : "/"}
            className="inline-flex min-w-[160px] items-center justify-center rounded-sm bg-primary px-8 py-3 text-sm font-bold uppercase tracking-widest text-primary-foreground transition-all hover:bg-primary/90 hover:ring-2 hover:ring-primary/20"
          >
            {isPrivateArea ? "Back to Dashboard" : "Back to Home"}
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex min-w-[160px] items-center justify-center rounded-sm border-2 border-input bg-transparent px-8 py-3 text-sm font-bold uppercase tracking-widest text-foreground transition-all hover:bg-accent hover:text-accent-foreground"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  loader: async ({ context }) => {
    const siteSettings = await context.queryClient.ensureQueryData({
      queryKey: ["site-settings"],
      queryFn: () => getSiteSettings(),
    });
    return { siteSettings };
  },
  head: ({ loaderData }) => {
    const settings = (loaderData?.siteSettings as SiteSettings) || site;
    const siteUrl = settings.productionDomain ? `https://${settings.productionDomain}` : site.url;
    
    // Explicitly handle fields that might be missing in one type vs another
    const businessName = (settings as SiteSettings).businessName || (settings as any).name || site.name;
    const businessTagline = (settings as SiteSettings).tagline || (settings as any).tagline || site.tagline;
    const businessDescription = (settings as SiteSettings).businessDescription || (settings as any).description || site.description;
    const businessPhone = (settings as SiteSettings).phone || (settings as any).phoneDisplay || site.phoneDisplay;
    const businessAddress = (settings as SiteSettings).address || site.address;
    const businessCity = (settings as SiteSettings).city || "Uttara";

    return {
      meta: [
        { charSet: "utf-8" },
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=5",
        },
        { title: `${businessName} — ${businessTagline}` },
        { name: "description", content: businessDescription },
        { property: "og:title", content: `${businessName} — ${businessTagline}` },
        { property: "og:description", content: businessDescription },
        { name: "author", content: "Rafi Gazi (Rabbee) Apps" },
        { name: "generator", content: "CZP-Secure-Engine" },
        { property: "og:site_name", content: businessName },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "theme-color", content: "#111111" },
        { property: "og:url", content: siteUrl },
        { rel: "canonical", href: siteUrl },
      ],
      links: [
        {
          rel: "stylesheet",
          href: appCss,
        },
        { rel: "icon", href: "/favicon.png", type: "image/png" },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@500;600;700;800&family=Permanent+Marker&display=swap",
        },
        { rel: "sitemap", type: "application/xml", href: "/api/public/sitemap/xml" },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: businessName,
            url: siteUrl,
            logo: `${siteUrl}/logo-main.png`,
            contactPoint: {
              "@type": "ContactPoint",
              telephone: businessPhone,
              contactType: "customer service",
              areaServed: "BD",
              availableLanguage: ["en", "bn"],
            },
            sameAs: site.socials.map((s) => s.href),
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: businessName,
            image: `${siteUrl}/logo-main.png`,
            "@id": siteUrl,
            url: siteUrl,
            telephone: businessPhone,
            address: {
              "@type": "PostalAddress",
              streetAddress: businessAddress,
              addressLocality: businessCity,
              addressRegion: "Dhaka",
              postalCode: "1230",
              addressCountry: "BD",
            },
            geo: {
              "@type": "GeoCoordinates",
              latitude: 23.8759,
              longitude: 90.3795,
            },
            openingHoursSpecification: {
              "@type": "OpeningHoursSpecification",
              dayOfWeek: [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
              ],
              opens: "09:00",
              closes: "21:00",
            },
          }),
        },
      ],
    };
  },

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <HeadContent />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.6/purify.min.js" integrity="sha512-H+sygDtmpGB2ssF5xpCqbmaGjXv2Tsuaf9t7944zJz1f7e0GzQ60Kv9d/hN1L1a0kZp8oU6Qd5e5p5o2Q==" crossOrigin="anonymous" referrerPolicy="no-referrer"></script>
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // Admin/staff area keeps its own bare chrome — no store header, nav or footer.
  const isPrivateArea = pathname === "/ad" || pathname.startsWith("/ad/");

  // Source Protection: Discourage casual inspection
  useEffect(() => {
    if (typeof window === "undefined" || !import.meta.env.PROD) return;

    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      e.preventDefault();
    };

    document.addEventListener("contextmenu", handleContextMenu);
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <CartProvider>
            <div className="flex min-h-svh flex-col overflow-x-hidden">
              <a
                href="#main-content"
                className="sr-only rounded-md bg-primary px-4 py-2 font-bold text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200]"
              >
                Skip to main content
              </a>
              {isPrivateArea ? null : <Header />}
              <main
                id="main-content"
                tabIndex={-1}
                className={`flex-1 focus:outline-none ${isPrivateArea ? "" : "pt-14 sm:pt-16"}`}
              >
                <Outlet />
              </main>
              {isPrivateArea ? null : <Footer />}
            </div>
            {isPrivateArea ? null : <FloatingWhatsApp />}
            <NetworkBanner />
            <Toaster position="top-center" richColors />
            <SmoothCursor />
            <ScrollRestoration />
          </CartProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
