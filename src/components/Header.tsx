import { Link } from "@tanstack/react-router";
import { 
  Menu, 
  Moon, 
  ShoppingBag, 
  Sun, 
  Home, 
  Store, 
  Bike, 
  Star, 
  Image as ImageIcon, 
  User, 
  Mail, 
  ChevronRight 
} from "lucide-react";
import { useState } from "react";

import { CartSheet } from "@/components/CartSheet";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { navLinks, site } from "@/data/site";
import { useCart } from "@/lib/cart";
import { useTheme } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n";

const NAV_ICONS: Record<string, any> = {
  "/": Home,
  "/shop": Store,
  "/bike-models": Bike,
  "/new-arrivals": Star,
  "/gallery": ImageIcon,
  "/about": User,
  "/contact": Mail,
};

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const { count } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] border-b border-border bg-background/95 pt-safe backdrop-blur-md supports-[backdrop-filter]:bg-background/80 shadow-sm">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center px-4 sm:h-20 sm:px-6 md:px-8">
        {/* LEFT: Logo */}
        <div className="flex flex-1 items-center justify-start">
          <Link to="/" className="min-w-0" aria-label={`${site.name} home`}>
            <Logo priority className="h-9 w-auto sm:h-12" />
          </Link>
        </div>

        {/* CENTER: Main navigation (Perfectly centered to the viewport) */}
        <nav
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-2 xl:gap-3 lg:flex"
          aria-label="Main"
        >
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              activeOptions={{ exact: link.to === "/" }}
              activeProps={{ className: "text-primary" }}
              inactiveProps={{ className: "text-foreground/80" }}
              className="whitespace-nowrap rounded-md px-3 py-2.5 font-display text-[15px] font-bold uppercase tracking-wider transition-colors hover:text-primary active:scale-95"
            >
              {t(link.translationKey)}
            </Link>
          ))}
        </nav>

        {/* RIGHT: Theme/Dark Mode + Language + Cart */}
        <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3">
          <button
            onClick={toggleLanguage}
            className="flex h-9 items-center rounded-full bg-secondary/50 px-3 font-display text-[11px] font-bold tracking-wider transition-all hover:bg-secondary active:scale-95 sm:h-10 sm:px-4 sm:text-xs"
            aria-label={`Switch to ${language === "en" ? "Bangla" : "English"}`}
          >
            <span className={language === "bn" ? "text-primary" : "text-foreground/40"}>বাং</span>
            <span className="mx-1.5 h-3 w-px bg-border/50" />
            <span className={language === "en" ? "text-primary" : "text-foreground/40"}>ENG</span>
          </button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          >
            {theme === "dark" ? <Sun /> : <Moon />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => setCartOpen(true)}
            aria-label={`Open cart, ${count} item${count === 1 ? "" : "s"}`}
          >
            <ShoppingBag />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid size-4.5 min-w-4.5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {count}
              </span>
            )}
          </Button>

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex w-[75vw] max-w-[300px] flex-col overflow-hidden p-0 sm:max-w-[300px] border-l border-border/40">
              <div className="flex shrink-0 items-center justify-between border-b border-border p-4 pr-12">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <Logo className="h-7 w-auto" />
              </div>
              
              <nav
                className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain"
                aria-label="Mobile"
              >
                {navLinks.map((link) => {
                  const Icon = NAV_ICONS[link.to] || ChevronRight;
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setMenuOpen(false)}
                      activeOptions={{ exact: link.to === "/" }}
                      activeProps={{ className: "text-primary bg-primary/5" }}
                      inactiveProps={{ className: "text-foreground/70" }}
                      className="group flex items-center justify-between border-b border-border/50 px-5 py-4 transition-colors active:bg-secondary"
                    >
                      <div className="flex items-center gap-4">
                        <Icon className="size-5 transition-colors group-data-[status=active]:text-primary" />
                        <span className="font-display text-[15px] font-bold uppercase tracking-wider">
                          {t(link.translationKey)}
                        </span>
                      </div>
                      <ChevronRight className="size-4 opacity-30" />
                    </Link>
                  );
                })}
              </nav>

              <div className="shrink-0 space-y-3 border-t border-border/50 p-4 pb-safe">
                <button
                  className="flex h-11 w-full items-center justify-center rounded-xl border border-border bg-secondary/30 font-display text-xs font-bold tracking-widest uppercase transition-colors hover:bg-secondary/50"
                  onClick={() => {
                    toggleLanguage();
                    setMenuOpen(false);
                  }}
                >
                  <span className={language === "bn" ? "text-primary" : "text-foreground/40"}>
                    বাং
                  </span>
                  <span className="mx-3 h-3 w-px bg-border/50" />
                  <span className={language === "en" ? "text-primary" : "text-foreground/40"}>
                    ENG
                  </span>
                </button>
                <Button variant="red" size="touch" className="w-full shadow-lg shadow-primary/20" asChild>
                  <a href={site.whatsappHref} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                    <svg className="size-4 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.484 8.412-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.309 1.656zm6.224-3.82c1.516.903 3.136 1.379 4.79 1.38h.005c5.454 0 9.893-4.438 9.896-9.891.002-2.646-1.027-5.132-2.9-7c-1.873-1.868-4.361-2.899-7.003-2.9h-.004c-5.454 0-9.894 4.44-9.897 9.895-.001 1.742.454 3.441 1.32 4.931l-.841 3.069 3.134-.823zm9.273-5.903c.311.156.517.234.58.339.064.105.064.612-.138 1.179-.206.567-1.204 1.107-1.703 1.148-.499.041-.944.125-3.118-.742-2.174-.867-3.554-3.11-3.662-3.253-.109-.143-.883-1.173-.883-2.247 0-1.074.559-1.604.767-1.822.207-.218.452-.273.603-.273.15 0 .301.005.432.01.131.006.302-.049.474.365.172.413.584 1.422.637 1.527.053.105.088.228.019.366-.069.138-.104.225-.206.342-.102.118-.215.263-.306.353-.102.1-.208.209-.09.412.119.202.529.873 1.136 1.415.783.7 1.442.919 1.649 1.022.207.103.328.087.45-.052.122-.139.524-.608.665-.815.142-.206.284-.172.478-.101z"/>
                    </svg>
                    {t("common.whatsapp")}
                  </a>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <CartSheet open={cartOpen} onOpenChange={setCartOpen} />
    </header>
  );
}
