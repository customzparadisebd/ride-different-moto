# Migration package — CUSTOMZ PARADISE BD

**This folder is the authoritative migration package.** `supabase/exports/` is a
superseded draft, and `supabase/migrations/` is incremental Lovable history that
must NOT be replayed on a fresh project — `01_schema.sql` is already its result.

Run against your new Supabase project in this order:

| Step | File                    | What it does                                                                                                  |
| ---- | ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| 1    | `01_schema.sql`         | Enums, sequences, 51 tables, the `private` schema, 15 functions, triggers, 159 GRANTs, 120 RLS policies         |
| 2    | `02_data.sql`           | 532 rows across 32 tables, FK-safe order, `ON CONFLICT DO NOTHING`                                             |
| 3    | `03_auth_users.sql`     | Links the auth accounts you create by hand to imported profiles/roles/permissions, then clears orphaned rows    |
| 4    | `04_post_migration.sql` | Invoice sequence re-alignment, stale session cleanup, verification queries                                      |

Manual references:

- `05_storage.md` — all six buckets (`avatars`, `logos`, `products`, `hero`,
  `hero-banners`, `bike-models`), their public/private flags, policies, path
  shapes and the URL-rewrite SQL.
- `ENV_TEMPLATE.md` — every environment variable, client-safe vs server-only.

Full narrative walkthrough: `MIGRATION_GUIDE.md` at the repo root. Audit findings
and fixes: `MIGRATION_AUDIT.md`. Netlify build/header config: `netlify.toml`.

## Order matters

Create the auth users **before** step 3 — it needs their real UUIDs. Never skip
step 4: it is what stops the next order from reusing an existing invoice number.

## Notes

- `01_schema.sql` creates `private.has_role` / `private.has_permission`; the
  `bike_models` policies call them. Do not swap them for the `public.*` versions.
- Passwords and MFA/TOTP factors cannot be exported. Accounts are recreated by
  hand and everyone re-enrols two-factor after the first login.
