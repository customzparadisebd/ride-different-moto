import { Link } from "@tanstack/react-router";
import { Languages, Menu, Moon, ShoppingBag, Sun } from "lucide-react";
import { useState } from "react";

import { CartSheet } from "@/components/CartSheet";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { navLinks, site } from "@/data/site";
import { useCart } from "@/lib/cart";
import { useTheme } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n";

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const { count } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] border-b border-border bg-background/95 pt-safe backdrop-blur-md supports-[backdrop-filter]:bg-background/80 shadow-sm">
      <div className="relative mx-auto flex h-14 max-w-7xl items-center px-3 sm:h-16 sm:px-6">
        {/* LEFT: Logo */}
        <div className="flex flex-1 items-center justify-start">
          <Link to="/" className="min-w-0" aria-label={`${site.name} home`}>
            <Logo priority className="h-8 w-auto sm:h-10" />
          </Link>
        </div>

        {/* CENTER: Main navigation (Perfectly centered to the viewport) */}
        <nav 
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1.5 lg:flex" 
          aria-label="Main"
        >
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              activeOptions={{ exact: link.to === "/" }}
              activeProps={{ className: "text-primary" }}
              inactiveProps={{ className: "text-foreground/80" }}
              className="whitespace-nowrap rounded-md px-2.5 py-2 font-display text-sm font-semibold uppercase tracking-wide transition-colors hover:text-primary"
            >
              {t(link.translationKey)}
            </Link>
          ))}
        </nav>

        {/* RIGHT: Theme/Dark Mode + Language + Cart */}
        <div className="flex flex-1 items-center justify-end gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-2 w-auto"
            aria-label={`Switch to ${language === 'en' ? 'Bangla' : 'English'}`}
          >
            <Languages className="size-4.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">{t('nav.language')}</span>
          </Button>

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
            <SheetContent side="right" className="flex w-[86vw] max-w-sm flex-col p-0">
              <div className="border-b border-border p-4">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <Logo className="h-8 w-auto" />
              </div>
              <nav className="flex flex-1 flex-col items-center justify-center p-2" aria-label="Mobile">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMenuOpen(false)}
                    activeOptions={{ exact: link.to === "/" }}
                    activeProps={{ className: "text-primary" }}
                    className="w-full rounded-md px-3 py-3.5 text-center font-display text-lg font-semibold uppercase tracking-wide hover:bg-secondary"
                  >
                    {t(link.translationKey)}
                  </Link>
                ))}
              </nav>
              <div className="p-4 pb-safe space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-center gap-2"
                  onClick={() => {
                    toggleLanguage();
                    setMenuOpen(false);
                  }}
                >
                  <Languages className="size-4" />
                  <span>Switch to {language === 'en' ? 'Bangla' : 'English'}</span>
                </Button>
                <Button variant="red" size="touch" className="w-full" asChild>
                  <a href={site.whatsappHref} target="_blank" rel="noopener noreferrer">
                    {t('common.whatsapp')}
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
