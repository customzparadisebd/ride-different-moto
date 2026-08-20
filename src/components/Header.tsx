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
import { useQuery } from "@tanstack/react-query";

import { CartSheet } from "@/components/CartSheet";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { navLinks, site } from "@/data/site";
import { useCart } from "@/lib/cart";
import { useTheme } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n";
import { getSiteSettings } from "@/lib/site-settings.functions";
import { type SiteSettings } from "@/lib/settings.shared";

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

  const { data: siteSettings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: () => getSiteSettings({ data: undefined }),
  });

  const settings = siteSettings || site;
  const businessName = (settings as SiteSettings).businessName || (settings as any).name || site.name;
  const whatsappNumber = (settings as SiteSettings).whatsapp || (settings as any).whatsapp || "";
  const whatsappHref = whatsappNumber 
    ? `https://wa.me/${whatsappNumber.replace(/\D/g, "")}` 
    : site.whatsappHref;

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] border-b border-border bg-background/95 pt-safe backdrop-blur-md supports-[backdrop-filter]:bg-background/80 shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6 md:px-8">
        {/* LEFT: Logo */}
        <div className="flex shrink-0 items-center">
          <Link to="/" className="min-w-0" aria-label={`${businessName} home`}>
            <Logo priority category="header" className="h-9 w-auto sm:h-12" />
          </Link>
        </div>

        {/* CENTER: Navigation (Desktop/Tab) */}
        <nav className="hidden md:flex items-center gap-4 lg:gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-[11px] lg:text-[13px] font-bold uppercase tracking-widest text-foreground/80 transition-colors hover:text-primary whitespace-nowrap"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* MOBILE: Menu Button */}
        <div className="flex md:hidden shrink-0">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] bg-background border-r border-border p-0">
              <div className="flex flex-col h-full">
                <div className="p-6 border-b border-border">
                  <Logo category="header" className="h-8 w-auto" />
                </div>
                <nav className="flex-1 overflow-y-auto py-6">
                  {navLinks.map((link) => {
                    const Icon = NAV_ICONS[link.to] || Home;
                    return (
                      <Link
                        key={link.to}
                        to={link.to}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-4 px-6 py-4 text-sm font-bold uppercase tracking-[0.2em] text-foreground/70 transition-all hover:bg-primary/5 hover:text-primary active:bg-primary/10"
                      >
                        <Icon className="h-5 w-5" />
                        {link.label}
                      </Link>
                    );
                  })}
                </nav>
                <div className="p-6 border-t border-border bg-muted/20">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    © {new Date().getFullYear()} {businessName}
                  </p>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* RIGHT: Theme/Dark Mode + Language + Cart */}
        <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-4">
          <button
            onClick={toggleLanguage}
            className="group flex h-9 items-center rounded-full bg-secondary/50 px-3 font-display text-[11px] font-bold tracking-wider transition-all hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95 sm:h-11 sm:px-5 sm:text-[13px]"
            aria-label={`Switch to ${language === "en" ? "Bangla" : "English"}`}
          >
            <span className={`transition-colors ${language === "bn" ? "text-primary" : "text-foreground/40 group-hover:text-foreground/60"}`}>বাং</span>
            <span className="mx-1.5 h-3 w-px bg-border/50 sm:mx-2" />
            <span className={`transition-colors ${language === "en" ? "text-primary" : "text-foreground/40 group-hover:text-foreground/60"}`}>ENG</span>
          </button>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 sm:h-11 sm:w-11 [&_svg]:size-4.5 sm:[&_svg]:size-5.5"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          >
            {theme === "dark" ? <Sun /> : <Moon />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 sm:h-11 sm:w-11 [&_svg]:size-4.5 sm:[&_svg]:size-5.5"
            onClick={() => setCartOpen(true)}
            aria-label={`Open cart, ${count} item${count === 1 ? "" : "s"}`}
          >
            <ShoppingBag />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid size-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground sm:size-5 sm:min-w-5 sm:text-[11px]">
                {count}
              </span>
            )}
          </Button>
        </div>
      </div>

      <CartSheet open={cartOpen} onOpenChange={setCartOpen} />
    </header>
  );
}
