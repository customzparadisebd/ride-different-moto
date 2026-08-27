# Store Settings submenu + Logo size guidance

## 1. Why the Store Settings submenu is missing on the direct URL

The submenu is not broken, and it is not a permission problem.

- The Lovable preview always serves the **latest code**, which does have the left submenu (General, Invoice, Logos, Delivery Zones, SteadFast, Homepage, Bike Models, Product Order, Gallery, AI Tools).
- Opening the site in a normal tab at the published address serves the **last published build**, which is older.

Evidence: your screenshot's page text is "Identity, delivery charges, payment methods and support contact used across the store." That sentence does not exist anywhere in the current code — the current General tab says "General Settings / Store identity, contact information, and core operational thresholds." So the tab you opened is running an older deployment.

Fix: **publish again**. After the new deploy, the direct URL will show the same submenu as the preview. No code change is needed for this.

Optional small hardening I can add while publishing:
- Keep the submenu visible even while the access/settings queries are still loading (it currently renders fine, but the panels below flash "Loading settings…").

## 2. Logo Management: missing KB guidance

Currently each logo card shows recommended pixel dimensions and formats, but the file-size line only exists for two categories (Invoice, OG image) and is not rendered at all in the panel.

Planned change:
- Add a recommended max KB for every logo category:
  - Main brand logo: 150 KB
  - Header / Footer: 80 KB
  - Mobile nav: 60 KB
  - Admin login: 200 KB
  - Admin sidebar: 60 KB
  - Invoice: 200 KB
  - Favicon: 20 KB
  - OG / social image: 300 KB
- Show a clear line on each card: "Recommended size: under X KB (max 2 MB)" next to the existing dimensions/format guidance.
- After a file is selected, show its actual size and a soft amber warning when it exceeds the recommended KB (upload still allowed), plus a hard block above the existing 2 MB limit.
- Suggest WebP/PNG in the same line so uploads stay light and pages load fast.

## Technical details

- `src/lib/logos.shared.ts`: add `recommended_size_kb` to every entry in `LOGO_RECOMMENDATIONS`.
- `src/components/admin/settings/LogoSettingsPanel.tsx`: render the KB guidance row, compute `file.size / 1024` on selection, and show the over-recommendation warning badge.
- No database or server-function changes; existing `uploadLogoFile` flow stays as-is.
