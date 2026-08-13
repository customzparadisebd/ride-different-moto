import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
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
import { logNotFound } from "@/lib/analytics.functions";
import errorGif from "@/assets/404-error.gif.asset.json";

function NotFoundComponent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isPrivateArea = pathname === "/ad" || pathname.startsWith("/ad/");
  const logFn = useServerFn(logNotFound);

  useEffect(() => {
    void logFn({ data: { path: pathname, referrer: typeof document !== "undefined" ? document.referrer : null } });
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
        
        <h1 className="text-6xl font-black tracking-tighter text-foreground sm:text-8xl">
          404
        </h1>
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
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      { title: `${site.name} — ${site.tagline}` },
      { name: "description", content: site.description },
      { name: "author", content: site.name },
      { property: "og:site_name", content: site.name },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#111111" },
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
        href: "https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@500;600;700;800&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": site.name,
          "url": site.url,
          "logo": `${site.url}/logo-main.png`,
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": site.phoneDisplay,
            "contactType": "customer service",
            "areaServed": "BD",
            "availableLanguage": ["en", "bn"]
          },
          "sameAs": site.socials.map(s => s.href)
        })
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "name": site.name,
          "image": `${site.url}/logo-main.png`,
          "@id": site.url,
          "url": site.url,
          "telephone": site.phoneDisplay,
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Sector 10",
            "addressLocality": "Uttara",
            "addressRegion": "Dhaka",
            "postalCode": "1230",
            "addressCountry": "BD"
          },
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": 23.8759,
            "longitude": 90.3795
          },
          "openingHoursSpecification": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday"
            ],
            "opens": "09:00",
            "closes": "21:00"
          }
        })
      }
    ],
  }),

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
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

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <CartProvider>
          <div className="flex min-h-svh flex-col overflow-x-hidden">
            {isPrivateArea ? null : <Header />}
            <main className={`flex-1 ${isPrivateArea ? '' : 'pt-14 sm:pt-16'}`}>
              {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
              <Outlet />
            </main>
            {isPrivateArea ? null : <Footer />}
          </div>
          {isPrivateArea ? null : <FloatingWhatsApp />}
          <NetworkBanner />
          <Toaster />
        </CartProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
