# Plan - Dynamic Homepage Product Sections

Allow admin control over which product categories appear on the homepage by extending the `section_settings` table to include a `product_category` filter.

## User Review Required

> [!IMPORTANT]
> This change will allow you to replace the current "Featured & Deals" or "All Products" sections with specific categories (e.g., "Exhausts" or "Lighting") directly from the Admin Panel.

- We will add a "Product Category" dropdown to each section's settings in the Admin Panel.
- If a category is selected, that section will only show products from that category.
- If no category is selected, the section will follow its current default logic (Featured/Best Deals or All Products).

## Proposed Changes

### Database & Schema
- Add `product_category` column to `public.section_settings` table.
- Update `SectionSetting` Zod schema and row parser in `src/lib/sections.shared.ts`.

### Admin Panel
- Modify `SectionSettingsPanel.tsx` to include a Category selector using the existing `PRODUCT_CATEGORIES` list.
- Update `saveSectionSetting` server function to handle the new field.

### Storefront
- Refactor `src/routes/index.tsx` to fetch products filtered by the configured category if one is set for the section.
- Ensure only active products are shown, respecting the display limits and "See All" button settings.

## Technical Details
- **Table Migration**: `ALTER TABLE section_settings ADD COLUMN product_category TEXT;`
- **Logic**: In `src/routes/index.tsx`, when rendering a section, check if `sectionSetting.product_category` is present. If so, filter the `products` array by that category before slicing for display.
