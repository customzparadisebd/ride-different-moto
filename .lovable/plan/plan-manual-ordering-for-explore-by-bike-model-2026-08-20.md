# Plan - Manual Ordering for Explore by Bike Model

Implement a manual ordering system for bike models in the admin panel, supporting both "Move Up/Down" buttons and Drag & Drop (using `dnd-kit`), ensuring the storefront reflects the admin-defined order.

## Database Changes
- None required (the `bike_models` table already has a `sort_order` integer column).

## Server Changes (`src/lib/bike-models.functions.ts`)
- The existing `reorderBikeModels` server function will be used to persist the new order to the database.
- It accepts an array of UUIDs and updates their `sort_order` values based on their index in the array.

## Frontend Changes (`src/components/admin/settings/BikeModelsPanel.tsx`)
- Implement a sortable list using `@dnd-kit/core`, `@dnd-kit/sortable`, and `@dnd-kit/utilities`.
- Create a `SortableBikeModelItem` component to wrap each bike model card.
- Add "Move Up" and "Move Down" buttons for manual control.
- Ensure the "Save Order" button only appears when the list is "dirty" (order has changed).
- Integrate with the existing `reorderBikeModels` mutation to save changes.
- Ensure new models follow the admin-defined order (they will be appended by default or given a high sort order).

## Verification Plan
- **Manual Test**: Add several bike models and reorder them using both Drag & Drop and the Up/Down buttons.
- **Persistence Test**: Refresh the page to ensure the order is persisted and retrieved correctly.
- **Storefront Test**: Verify the "Explore by Bike Model" section on the homepage reflects the exact order set in the Admin panel.
