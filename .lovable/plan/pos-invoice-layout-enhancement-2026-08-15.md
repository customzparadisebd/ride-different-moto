# POS Invoice Layout Enhancement

Redesign the admin invoice page to match the requested POS layout with container boundaries and centered branding.

## User Review Required

> [!IMPORTANT]
> - The new layout is optimized for POS style printing (max-width 680px).
> - I will use the dark-bg logo version if available, otherwise the standard logo will be used.

## Proposed Changes

### Admin UI (Printable Invoice)

- **Layout Redesign**: Implement a container-based layout with a maximum width of 680px for the invoice.
- **Header Layout**: 
  - Left-aligned logo (`max-width: 120px`).
  - Centered company details (Name, Helpline, Website).
- **Metadata Columns**: 
  - Two equal boxes for `Invoice Details` and `Invoice To`.
- **Items Table**: 
  - Columns: Product Description, Qty, Price, Total.
  - Right-aligned summary block for Subtotal, Delivery Fee, Discount, and Grand Total.
- **Footer**: 
  - Centered "Thank you for shopping with us!" message.
- **Responsive Handling**: 
  - Ensure all price fields and text wrap correctly within the 680px boundary using CSS flex/grid and `overflow-hidden`.

## Technical Details

- **File to Modify**: `src/routes/_authenticated/ad/invoice.$id.tsx`.
- **Styling**: Tailwind CSS for responsive boundaries, centered alignment, and two-column layouts.
- **Branding Data**: Use values from `src/data/site.ts`.
- **Print Optimization**: Maintain `print:` utilities to ensure the layout looks correct on paper as well as on screen.
