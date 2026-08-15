import { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet, ScrollRestoration } from "@tanstack/react-router";
import { Body, Head, Html, Meta, Scripts } from "@tanstack/react-start";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { SmoothCursor } from "@/components/SmoothCursor";
import { LanguageProvider } from "@/lib/i18n";
import { site } from "@/data/site";
import { storefrontProductsQuery } from "@/lib/storefront.queries";
import "@/styles.css";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  meta: () => [
    {
      charSet: "utf-8",
    },
    {
      name: "viewport",
      content: "width=device-width, initial-scale=1, maximum-scale=5",
    },
    {
      title: site.name,
    },
    {
      name: "description",
      content: site.description,
    },
    // Production Source Protection: Prevent simple crawlers from finding DevTools patterns easily
    {
      name: "generator",
      content: "CZP-Secure-Engine",
    },
  ],
  links: () => [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Barlow+Condensed:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Permanent+Marker&display=swap",
    },
  ],
  component: RootComponent,
  errorComponent: (props) => {
    return (
      <RootElement>
        <div className="flex min-h-[400px] flex-col items-center justify-center p-4 text-center">
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="mt-2 text-muted-foreground">Please refresh the page or contact support.</p>
        </div>
      </RootElement>
    );
  },
});

function RootComponent() {
  // Source Protection: Discourage casual inspection
  useEffect(() => {
    // Only in production
    if (typeof window !== 'undefined' && import.meta.env.PROD) {
      const handleContextMenu = (e: MouseEvent) => {
        // Allow right-click on inputs and textareas for accessibility (copy/paste)
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        e.preventDefault();
      };
      
      document.addEventListener('contextmenu', handleContextMenu);
      return () => {
        document.removeEventListener('contextmenu', handleContextMenu);
      };
    }
  }, []);

  return (
    <RootElement>
      <Outlet />
    </RootElement>
  );
}

function RootElement({ children }: { children: ReactNode }) {
  return (
    <Html lang="en">
      <Head>
        <Meta />
      </Head>
      <Body className="font-sans antialiased">
        <LanguageProvider>
          <div className="relative flex min-h-screen flex-col">
            {children}
            <SmoothCursor />
          </div>
          <Toaster position="top-center" richColors />
        </LanguageProvider>
        <ScrollRestoration />
        <Scripts />
      </Body>
    </Html>
  );
}
