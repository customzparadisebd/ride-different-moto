# Order Confirmation Success Animation Enhancement

Implement a more premium, satisfying, and modern order success animation inspired by the user-uploaded reference, specifically tailored for the Customz Paradise BD brand (True Red, Black, White).

## User Review Required

> [!IMPORTANT]
> The animation will be pure CSS/SVG to ensure high performance and reliability on all devices (no heavy JS libraries). It will replace the current simplified checkmark with a more multi-layered, explosive, and fluid motion.

## Technical Details

### 1. Visual Components

- **Core SVG Animation**: A multi-step sequence where the central circle expands, the checkmark draws with a slight overshoot/bounce, and a set of secondary "burst" elements (lines and dots) radiate outward.
- **Dynamic Glow**: A subtle radial gradient glow behind the icon that pulses once during the reveal.
- **Particle System**: Small SVG circles that animate outward from the center with varying delays and directions to simulate a "confetti" or "sparkle" effect without using heavy libraries.

### 2. Styling (Tailwind/CSS)

- **Brand Colors**: Use `oklch` brand tokens for consistency.
- **Smoothness**: Use `cubic-bezier` timing functions for "organic" motion (e.g., `cubic-bezier(.16, .84, .44, 1)` for entry, `cubic-bezier(.34, 1.56, .64, 1)` for the bounce).
- **Responsiveness**: Use relative sizing (`rem` or `%`) to ensure the animation scales perfectly from small mobile screens to large desktop monitors.

### 3. Accessibility & Performance

- **Reduced Motion**: Automatically simplifies the animation to a static success icon if `prefers-reduced-motion` is enabled.
- **Asset Weight**: 0kb extra JS weight; the logic is entirely contained within the `OrderSuccessAnimation.tsx` component.
- **Rendering**: Uses `will-change: transform` to trigger GPU acceleration for the particles.

## Changes

### 1. Component Refactor

- Update `src/components/checkout/OrderSuccessAnimation.tsx` with the new multi-layered SVG structure and CSS keyframes.

### 2. Layout Fine-tuning

- Minor adjustments to `src/routes/checkout.tsx` delay timings to sync the text reveal with the completion of the new animation's main phase.
