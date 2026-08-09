import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { site } from "@/data/site";
import { useCart } from "@/lib/cart";
import { formatBDT } from "@/lib/format";

export function CartSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { lines, subtotal, setQty, removeItem } = useCart();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border p-4 text-left">
          <SheetTitle className="font-display text-xl uppercase tracking-wide">Your Cart</SheetTitle>
          <SheetDescription className="text-xs">
            Checkout in a minute — no account needed.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {lines.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <ShoppingBag className="size-8 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">Your cart is empty.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {lines.map((line) => (
                <li
                  key={line.id}
                  className="grid grid-cols-[64px_minmax(0,1fr)] gap-3 rounded-lg border border-border p-2"
                >
                  <img
                    src={line.image}
                    alt={line.name}
                    width={64}
                    height={64}
                    loading="lazy"
                    className="size-16 rounded-md object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{line.name}</p>
                    <p className="text-sm text-primary">{formatBDT(line.unitPrice)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        aria-label={`Decrease quantity of ${line.name}`}
                        onClick={() => setQty(line.id, line.qty - 1)}
                      >
                        <Minus />
                      </Button>
                      <span className="w-6 text-center text-sm font-semibold">{line.qty}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        aria-label={`Increase quantity of ${line.name}`}
                        onClick={() => setQty(line.id, line.qty + 1)}
                      >
                        <Plus />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-auto size-8 text-muted-foreground"
                        aria-label={`Remove ${line.name}`}
                        onClick={() => removeItem(line.id)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-border p-4 pb-safe">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-display text-lg font-bold">{formatBDT(subtotal)}</span>
          </div>
          {lines.length ? (
            <Button variant="red" size="touch" className="w-full" asChild>
              <Link to="/checkout" onClick={() => onOpenChange(false)}>
                Proceed to Checkout
              </Link>
            </Button>
          ) : (
            <Button variant="red" size="touch" className="w-full" disabled>
              Proceed to Checkout
            </Button>
          )}
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Need help? Call {site.phoneDisplay}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}