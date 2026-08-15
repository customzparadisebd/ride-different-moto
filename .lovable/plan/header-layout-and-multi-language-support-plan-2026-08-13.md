# Header Layout and Multi-language Support Plan

Redesign the header to ensure the main navigation is perfectly centered in the viewport, independent of the logo and side controls. Implement basic English and Bangla (bilingual) support with a language switcher.

## User Review Required

> [!IMPORTANT]
> The bilingual support will use a client-side context to manage the current language (`en` vs `bn`). I will provide translations for core navigation and common UI elements. For dynamic content (products), we'll implement a fallback mechanism where it displays English if Bangla content isn't available.

- **Should the product names and descriptions also be translated?** (Initial implementation will focus on UI/Navigation).
- **Does the user have specific Bangla translations for the navigation items?** (I will use standard translations otherwise).

## Proposed Changes

### Header Layout Refactor

- Modify `src/components/Header.tsx` to use a `grid` or `absolute` positioning strategy to keep the navigation group at exactly `left: 50%; transform: translateX(-50%)`.
- Apply `white-space: nowrap` to all navigation items to prevent text wrapping.
- Ensure the layout remains responsive, switching to a mobile menu for smaller screens.

### Bilingual Support (i18n)

- Create `src/lib/i18n.tsx` to manage language state (`en` default, `bn` option).
- Update `src/data/site.ts` to include translation objects for navigation and site metadata.
- Add a language switcher button in the `Header.tsx` next to the theme toggle.
- Wrap the root component in `src/routes/__root.tsx` with a `LanguageProvider`.

### Visual Enhancements

- Ensure consistent spacing between navigation items.
- Maintain existing fonts (Barlow Condensed/Barlow), colors, and visual styles.

## Technical Details

### Header CSS

```css
.header-container {
  display: flex;
  align-items: center;
  position: relative;
  width: 100%;
}

.logo-section {
  flex: 1;
  display: flex;
  justify-content: flex-start;
}

.nav-section {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 1.5rem;
  white-space: nowrap;
}

.controls-section {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
```

### i18n Implementation

- Use a simple `useLanguage()` hook.
- Translation dictionary stored in a central location or per-component where appropriate.
- Bangla font support (already included in Barlow/system fallbacks, but will verify).
