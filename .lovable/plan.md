# Invoice Reset That Starts From the Exact Requested Number

## Confirmed cause

The reset value is being saved, but two protections immediately override its intended effect:

- The server resolves the requested number against every historical order and advances to the first unused number.
- The database generator repeats the same conflict scan, and `orders.invoice_no` also has unique indexes that reject a reused number.

The live state confirms this: the counter was reset below the historical range, but because `CZP-01` through the later serials already exist, the next displayed/generated number advanced to the first unused serial. This is why entering `01` or `02` reports success but the next invoice remains around `CZP-67`.

## Implementation

### 1. Make reset/manual start authoritative

- Change invoice settings save so `nextNumber` is stored exactly as entered: `start_number = requested`, `current_number = requested - 1`.
- Remove historical-order scanning from the settings read/save path.
- Return the exact requested next invoice immediately so the Current Active Invoice card updates without refresh.

### 2. Allow a new sequence to reuse an old display number

- Add a database migration that removes uniqueness enforcement from `orders.invoice_no` while keeping each order's UUID as its true unique identity.
- Update the atomic database generator to use only the locked settings counter and stop skipping invoice numbers found in history.
- Keep row locking so simultaneous new orders still receive consecutive values within the current sequence.
- Preserve every existing order and invoice number unchanged.

### 3. Keep every order path aligned

- Ensure storefront checkout and Admin Manual Order both continue to request `AUTO`, allowing the database trigger to issue the current configured number.
- Remove obsolete duplicate-invoice collision recovery that would otherwise treat an intentional reused display number as an error.
- Keep order details, confirmation, search, invoice preview, print, export, audit, and courier payloads tied to the order UUID internally while displaying the assigned invoice number.
- Where an exact invoice-number lookup can now match multiple historical orders, return/show all matches or disambiguate by order UUID/date rather than selecting an arbitrary row.

### 4. Clarify the Admin UI

- Make Reset to 01 and Set Starting Number confirmations accurately state that historical invoice labels may repeat and history will not be changed.
- Show the saved next number immediately after success and keep Last Issued Invoice as a separate historical value.

### 5. Regression verification

Test the full sequence:

1. Reset to `CZP-01` while an old `CZP-01` exists.
2. Confirm the panel immediately shows `CZP-01`.
3. Create a storefront order and confirm it receives `CZP-01`.
4. Create a Manual Order and confirm it receives `CZP-02`.
5. Confirm the panel advances to `CZP-03`.
6. Verify both old and new `CZP-01` orders remain independently accessible by UUID and print the correct order contents.
7. Verify concurrent creation still allocates consecutive numbers without two new orders racing onto the same counter value.

## Related runtime stability

- Correct the confirmed customer-list request that sends `pageSize: 500` to a validator capped at `100`, preventing its Zod runtime failure without changing invoice behavior.
- Re-check abort handling during invoice save/navigation so a cancelled browser request does not produce a blank screen.

## Documentation

- Update developer notes with the intentional rule: invoice numbers are reusable display references after an explicit reset; order UUIDs remain the permanent unique identity.
