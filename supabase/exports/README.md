# CUSTOMZ PARADISE BD Migration Package

## Files Created

1. `01_schema.sql`: Full DDL (Types, Tables, Functions, RLS, Grants).
2. `02_data.sql`: Seed data for existing records.
3. `03_post_migration.sql`: Sequence synchronization logic.

## Execution Order

1. Run `01_schema.sql` in the new Supabase SQL Editor.
2. Run `02_data.sql` to import records.
3. Run `03_post_migration.sql` to sync invoice sequences.

## Manual Steps

1. **Auth Users**: Export users from the current project via `supabase auth export` (CLI) and import into the new one.
2. **Storage**: Re-upload files to the `products` and `assets` buckets.
3. **Env Vars**: Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `STEADFAST_API_KEY` in your new host.

## Risks

- **Foreign Keys**: Ensure Auth Users are imported _before_ Profile data to avoid reference errors.
- **invoice_seq**: Check `last_value` in `03_post_migration.sql` matches the highest current invoice number.
