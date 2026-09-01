# Smoother Mobile & Tablet Navigation

Goal: make the mobile/tablet menu open, close and slide feel instant and fluid, with no jerk or stutter — without changing the design, layout, wording or any functionality.

## What is causing the lag today

Confirmed by reading the current code:

1. **Drawer animation is slow and animates too much.** `src/components/ui/sheet.tsx` uses a blanket `transition ease-in-out` (all properties) with `data-[state=open]:duration-500` and `data-[state=closed]:duration-300`. Half a second to open reads as sluggish, and a non-property-scoped transition lets non-composited properties animate too.
2. **Blurred fixed header repaints during the slide.** The header uses `backdrop-blur-md` on a fixed, full-width element. On mobile GPUs, blurring the whole header on every frame while the drawer translates is the main source of frame drops.
3. **A raw `resize` listener fights the drawer.** `Header.tsx` attaches both a `matchMedia` change listener and a `window.resize` listener that runs on every resize event. On phones, scroll-driven address-bar collapse and the on-screen keyboard fire `resize`, which can close the drawer mid-animation (the "jerk"/unreliable feel).
4. **Avoidable re-renders in the header.** The language switcher is built by a function called during render (new element tree each time), and the nav lists rebuild on every header render, including on cart-count and settings-query updates.
5. **No reduced-motion path**, and no compositing hints (`will-change`, `transform: translateZ(0)`) on the sliding panel.

## Changes

### 1. Sheet/drawer animation (`src/components/ui/sheet.tsx`)
- Scope the transition to `transform` and `opacity` only, using an ease-out curve (`cubic-bezier(0.32, 0.72, 0, 1)`).
- Retune durations: open ~260ms, close ~200ms (same slide-in-from-right motion, just faster and snappier).
- Add `will-change: transform` and GPU promotion on the panel; drop `will-change` after the animation via the existing data-state selectors.
- Overlay: keep the same fade, shorten to match, and keep it a plain opacity fade (no blur) so it stays composited.
- Respect `prefers-reduced-motion`: near-instant state change instead of a slide.

Visual result is the same drawer sliding from the right with the same overlay — only timing/curve change.

### 2. Header repaint cost (`src/components/Header.tsx`)
- Keep the existing translucent/blurred header look, but suspend the backdrop blur only while the mobile drawer is animating/open (the drawer overlay covers the header anyway, so the appearance is unchanged to the user) and restore it on close.
- Add `contain: paint` / `transform: translateZ(0)` to the header bar so its repaints don't invalidate the whole page during the slide.

### 3. Reliable open/close (`src/components/Header.tsx`)
- Remove the `window.resize` listener; keep only the `matchMedia("(min-width: 768px)")` `change` listener to close the drawer when leaving the mobile layout. This is the correct signal and eliminates keyboard/address-bar false triggers.

### 4. Fewer re-renders (`src/components/Header.tsx`)
- Extract the language switcher into a small memoized component instead of a render-time factory function.
- Memoize the desktop nav list and the drawer nav list (`useMemo` over `navLinks` + the icon map), so cart-count changes and the site-settings query no longer rebuild them.
- Memoize the derived `businessName` / `whatsappHref` values and the drawer link close handler (`useCallback`).
- Keep the site-settings query result identical; only add a `staleTime` so it doesn't refetch and re-render the header on focus/remount.

### 5. Nav item hover transitions
- Narrow `transition-all` on nav rows and control buttons to `transition-colors` / `transition-[background-color,color]` where only colors change, so touch feedback doesn't trigger layout work.

## Out of scope

No changes to design tokens, colors, spacing, breakpoints, link order, drawer width, icons, WhatsApp button, cart behaviour, routing, or any backend/business logic.

## Verification

- Open/close the drawer in the preview at 390px and 820px widths; confirm identical appearance and faster, smooth motion.
- Confirm nav links still hidden below 768px and visible from 768px up, drawer auto-closes when crossing 768px, and closes on link tap.
- Confirm no console errors and no visual diff on the desktop header.
