# SUPERSEDED — do not use this folder

These files were an early partial draft:

- `01_schema.sql` creates 12 of the 51 live tables and contains 3 of the 120 RLS
  policies.
- `02_data.sql` is a skeleton with no real production rows.
- `03_post_migration.sql` predates the current invoice-numbering logic.

Importing them produces a broken copy of the database.

**Use `supabase/migration-export/` instead** — it is generated from the live
database and is the authoritative package. See `MIGRATION_AUDIT.md` and
`MIGRATION_GUIDE.md` at the repo root.
