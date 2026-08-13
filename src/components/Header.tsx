import { Link } from "@tanstack/react-router";
import { Menu, Moon, ShoppingBag, Sun } from "lucide-react";
import { useState } from "react";

import { CartSheet } from "@/components/CartSheet";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { navLinks, site } from "@/data/site";
import { useCart } from "@/lib/cart";
import { useTheme } from "@/lib/theme";

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { count } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] border-b border-border bg-background/95 pt-safe backdrop-blur-md supports-[backdrop-filter]:bg-background/80 shadow-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-3 sm:h-16 sm:px-6">
        <Link to="/" className="min-w-0" aria-label={`${site.name} home`}>
          <Logo priority className="h-8 w-auto sm:h-10" />
        </Link>

        <div className="flex shrink-0 items-center gap-1">
          <nav className="mr-2 hidden items-center gap-1 lg:flex" aria-label="Main">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                activeOptions={{ exact: link.to === "/" }}
                activeProps={{ className: "text-primary" }}
                inactiveProps={{ className: "text-foreground/80" }}
                className="rounded-md px-2.5 py-2 font-display text-sm font-semibold uppercase tracking-wide transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>

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
            <SheetContent side="right" className="w-[86vw] max-w-sm p-0">
              <div className="border-b border-border p-4">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <Logo className="h-8 w-auto" />
              </div>
              <nav className="flex flex-col p-2" aria-label="Mobile">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMenuOpen(false)}
                    activeOptions={{ exact: link.to === "/" }}
                    activeProps={{ className: "text-primary" }}
                    className="rounded-md px-3 py-3.5 font-display text-lg font-semibold uppercase tracking-wide hover:bg-secondary"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="p-4 pb-safe">
                <Button variant="red" size="touch" className="w-full" asChild>
                  <a href={site.whatsappHref} target="_blank" rel="noopener noreferrer">
                    WhatsApp Us
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
