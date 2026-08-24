# Migration package — CUSTOMZ PARADISE BD

Generated from the live database. Run against your new Supabase project in this
order:

| Step | File                    | What it does                                                                      |
| ---- | ----------------------- | --------------------------------------------------------------------------------- |
| 1    | `01_schema.sql`         | Enums, sequences, 51 tables, 13 functions, triggers, 159 GRANTs, 120 RLS policies  |
| 2    | `02_data.sql`           | 532 rows across 32 tables, FK-safe order, `ON CONFLICT DO NOTHING`                |
| 3    | `03_auth_users.sql`     | Links the auth accounts you create by hand to imported profiles/roles/permissions  |
| 4    | `04_post_migration.sql` | Invoice sequence re-alignment, stale session cleanup, verification queries         |

Manual references:

- `05_storage.md` — recreate the private `avatars` and `logos` buckets, copy the
  objects, rewrite absolute URLs.
- `ENV_TEMPLATE.md` — every environment variable and which ones are secret.

Full narrative walkthrough (cutover order, auth settings, smoke tests, risk
register): `MIGRATION_GUIDE.md` at the repo root. Netlify build/header config:
`netlify.toml` at the repo root.

## Order matters

Create the auth users **before** step 3 — it needs their real UUIDs. Never skip
step 4: it is what stops the next order from reusing an existing invoice number.
