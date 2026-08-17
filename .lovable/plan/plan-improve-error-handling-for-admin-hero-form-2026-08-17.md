# Plan - Improve Error Handling for Admin Hero Form

The goal is to prevent the admin hero slider management page from crashing or showing a blank screen when a `bike_model_id` validation fails (specifically when it's not a valid UUID). Although I've previously added preprocessing to handle empty strings, I'll ensure the UI provides clear feedback for any remaining validation errors.

## Proposed Changes

### 1. Robust Server-Side Validation
- Review `src/lib/hero.functions.ts` to ensure that all inputs, including `bike_model_id`, have clear error messages defined in their Zod schema.
- Ensure the server functions throw descriptive errors that the frontend can catch and display.

### 2. UI Error Feedback
- Update the mutation error handlers in `src/routes/_authenticated/ad/hero.tsx` to more intelligently handle Zod errors.
- Instead of a generic "Failed to add slide" toast, I'll attempt to parse and display specific field errors from the server response.

### 3. Form Validation Polish
- Add client-side validation logic or error state displays directly next to form fields (like `bike_model_id`) if the submission fails.
- Ensure that the "Create Slide" and "Update Slide" buttons provide visual feedback during the pending state.

## Technical Details

### Mutation Error Handling
I will modify the `onError` callbacks in `addMutation` and `updateMutation` within `src/routes/_authenticated/ad/hero.tsx`:

```typescript
onError: (e: any) => {
  // Check if error contains specific validation messages
  const message = e.message || "An unexpected error occurred";
  toast.error(message);
}
```

### Zod Schema Enhancement
In `src/lib/hero.functions.ts`, I'll refine the `bike_model_id` validation to provide a custom error message if it's invalid:

```typescript
bike_model_id: z
  .preprocess(...)
  .pipe(z.string().uuid({ message: "Please select a valid bike model" }).nullable())
```

## Verification Plan
- **Manual Test**: Intentionally bypass client-side guards to submit an invalid UUID for `bike_model_id` and verify that a clear toast notification appears instead of a blank screen.
- **Build Verification**: Run `npm run build:dev` to ensure no regressions in type safety.
