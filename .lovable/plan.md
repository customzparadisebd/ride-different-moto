# Plan: Product Preview for Admin Panel

Add a "Preview" feature to the product creation and editing workflow in the Admin Panel. This will allow staff to see exactly how a product will look on the storefront before saving changes.

## User Review Required

> [!IMPORTANT]
> - The preview will use current form values (unsaved) to simulate the storefront view.
> - For existing products, the preview will also include currently saved data like Colors and 360° sequences if they exist in the database.

- **Visual Modification:** A new "Preview" button will be added next to "Save" and "Cancel" in the `ProductForm`.
- **Workflow Change:** No changes to the creation/edit flow; the preview opens in a non-destructive modal.

## Proposed Changes

### Admin UI (React)

#### [MOD] `src/components/admin/products/ProductForm.tsx`
- Add an `onPreview` callback prop to the `ProductForm` component.
- Add a "Preview" button to the action buttons group at the bottom of the form.
- The button will trigger `onPreview(value)` if the form passes basic validation.

#### [MOD] `src/routes/_authenticated/ad/products.tsx`
- Implement a state to track the product currently being previewed (`previewing: ProductFormValue | null`).
- Create a `ProductPreviewDialog` component (or use an existing dialog pattern) that renders the `ProductDetail` component from the storefront in a full-screen or large modal.
- Connect the `onPreview` hook from `ProductForm` to this new state.

### Storefront Integration

#### [MOD] `src/routes/products.$slug.tsx`
- Export the `ProductDetail` component so it can be reused in the Admin Panel.
- Ensure `ProductDetail` handles mock/partial data gracefully.

## Technical Details

- **Mocking:** Since `ProductDetail` expects a `StorefrontProduct` object, the `ProductFormValue` will be mapped to a compatible mock object.
- **Data Completeness:** 
    - For "New" products, only data from the form (name, price, etc.) will be shown.
    - For "Edit" products, we will fetch existing colors/360 images from the query cache or database to provide a complete view.
- **Styling:** The preview modal will use a dark backdrop but render the storefront component with its native styling (consistent with the site's design system).

## Deployment Plan

1. Export `ProductDetail` from storefront route.
2. Update `ProductForm` with Preview button and callback.
3. Implement `ProductPreviewDialog` and state management in Admin Products page.
4. Test with various product configurations (with/without colors, with/without offer prices).
