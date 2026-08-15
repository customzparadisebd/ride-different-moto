# Plan: Mobile Navigation Optimization

Optimize the mobile navigation menu to be more compact, space-efficient, and visually aligned with the provided reference, while maintaining existing functionality.

## Proposed Changes

### UI & Styling
- **Narrower Sidebar**: Reduce `SheetContent` width from `86vw` to a fixed max width (e.g., `300px` or `75vw`) to ensure the underlying content remains visible.
- **Vertical Density**: Decrease padding and margins between navigation items to reduce the total height of the menu.
- **Icon Integration**: Add relevant `lucide-react` icons (Home, ShoppingBag, Bike, Star, Image, User, Mail) beside each navigation label as seen in the "AFTER" mockup.
- **Modern Layout**:
  - Center-align items vertically but left-align text/icons for better readability.
  - Use a cleaner list-style layout with subtle dividers or borders.
  - Improve the "Close (X)" button visibility and placement.
  - Ensure the "WhatsApp" button and Language Switcher remain prominent at the bottom.
- **Interactive Feedback**: Add chevrons (`ChevronRight`) to the right of each menu item for a more native mobile feel.

### Component Refactoring
- Update `src/components/Header.tsx`:
  - Refactor the `SheetContent` block.
  - Map `navLinks` with corresponding icons.
  - Adjust layout containers and spacing.

## Technical Details
- Use `lucide-react` for new icons.
- Maintain `Sheet` and `SheetContent` from Shadcn UI but customize class names.
- Ensure the `activeProps` for the active route highlight the icon and text in brand red.
- Use `Barlow Condensed` for labels to match the premium brand feel.

## Verification Plan
- **Visual Inspection**: Open the mobile menu in the preview and compare it with the "AFTER" screenshot.
- **Accessibility**: Verify touch targets are still at least 44px in height.
- **Responsiveness**: Test on different device viewports (iPhone SE to iPad).
- **Functionality**: Ensure all links navigate correctly and the menu closes on link click.
