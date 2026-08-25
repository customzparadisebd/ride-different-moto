# Final migration-readiness audit — CUSTOMZ PARADISE BD

Scope: verify that the current source can move to a **fresh Supabase project**
and deploy on **Netlify** with no return trip to Lovable. No features, design or
behaviour were changed. Everything below was verified against the live database
and the actual source files.

---

## 1. Authoritative migration package

| Folder                        | Verdict                                                                                                                       |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `supabase/migration-export/`  | **AUTHORITATIVE.** Use only this folder.                                                                                       |
| `supabase/exports/`           | **SUPERSEDED.** Partial draft: 12 of 51 tables, 3 policy statements of 120, no real data. A `SUPERSEDED.md` marker was added.  |
| `supabase/migrations/`        | **HISTORY ONLY** (84 incremental Lovable migrations). Do not replay these on a fresh project — `01_schema.sql` is their result. |
| root `migration.sql`, `migration_site_settings.sql` | Leftover scratch files from earlier work. Not part of the migration. Ignore.                             |

---

## 2. Schema — verified and FIXED

Live database: 51 public tables, 3 enums, 2 sequences, 113 constraints, 22 app
triggers, 159 grants, 120 RLS policies, 15 functions (13 public + 2 private).

Two defects in `01_schema.sql` were found and fixed:

1. **The whole FUNCTIONS section was corrupt.** The generator had split every
   `CREATE FUNCTION` body on newlines and appended a semicolon to each line, e.g.
   `CREATE OR REPLACE FUNCTION public.alert_on_invoice_collision();` followed by
   ` RETURNS trigger;`. All 13 functions were invalid SQL, so the script would
   have failed on the first function and every trigger/policy after it. The
   section was regenerated from `pg_get_functiondef()`.
2. **113 constraint blocks had invalid PL/pgSQL.**
   `EXCEPTION WHEN duplicate_table THEN NULL WHEN duplicate_object THEN NULL …`
   is a syntax error (verified against Postgres). Rewritten as
   `EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;`.

Everything else (enums, sequences, tables, constraints, indexes, triggers,
grants, RLS enable statements, policies) was checked and is valid, in dependency
order: enums → sequences → tables → schemas/functions → constraints → indexes →
triggers → grants → RLS → policies.

---

## 3. RLS / security — architecture confirmed, private schema restored

The current production architecture uses **both** schemas, deliberately:

- `public.has_role`, `public.has_permission`, `public.is_staff`,
  `public.is_super_admin` — SQL security-definer helpers used by most policies
  and by the storage policies.
- `private.has_role`, `private.has_permission` — PL/pgSQL security-definer
  helpers, `SET search_path TO 'public','private'`, called by the `bike_models`
  policies (`private.has_role(auth.uid(), 'super_admin')`, …).

`private.*` was **not** replaced with `public.*`. Instead the missing pieces were
added to `01_schema.sql`, exactly as they exist in production:

```sql
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;
-- + private.has_role(uuid, app_role) and private.has_permission(uuid, text)
```

Without this, `01_schema.sql` failed at the `bike_models` policies with
`schema "private" does not exist`. Function order was also changed so `private.*`
is created before the policy section.

---

## 4. Data — verified and FIXED

`02_data.sql`: 532 rows across 32 tables, FK-safe order, `ON CONFLICT DO NOTHING`,
wrapped in `session_replication_role = replica/origin`.

Verified: order → order_items → payments chains intact, products → colors →
360 images intact, orders keep their original UUIDs and invoice numbers,
profiles/user_roles/user_permissions keep the old user UUIDs (needed by step 3).

**Fixed:** rows carrying old `auth.users` UUIDs in FK columns would abort the
import on a fresh project where `auth.users` is empty. Ten FK columns were
audited; two rows actually carried values (`customer_fraud_marks.marked_by`,
`customers.deleted_by`) and are now `NULL`. These are audit-attribution columns
only — the human-readable `*_label` columns are preserved, so nothing visible is
lost.

`profiles`, `user_roles` and `user_permissions` have **no** FK to `auth.users`, so
they import cleanly and are re-linked in step 3.

---

## 5. Auth — cannot be exported; manual, documented

`auth.users` is locked (`permission denied for schema auth`), so password hashes,
MFA/TOTP factors and identities **cannot** be migrated. This is a Supabase
limitation, not a code problem.

`03_auth_users.sql` already encodes the correct approach and needs no change:
create the accounts by hand in the new project, paste each UUID into the DO
block, and it re-links `profiles` + `user_roles` + `user_permissions`. It also
contains the orphan cleanup for the old UUIDs.

Manual, unavoidable:

- Recreate `customzparadisebd@gmail.com` (Super Admin) and any staff account, with
  *Auto Confirm User* on.
- Everyone sets a new password (or uses the reset flow).
- Everyone re-enrols TOTP; MFA is enforced for all admin access
  (`admin.server.ts` sets `mfaRequired: true`), so enrol immediately after first
  login.
- Old MFA backup codes are worthless — `mfa_backup_codes` rows still reference
  old UUIDs and are removed by the step-3 cleanup; generate new ones.
- The owner account self-heals: `resolveActor()` upserts `super_admin` + approved
  status on first login for that email, so even if step 3 is skipped the owner
  gets in.

---

## 6. Post-migration — safe as written

`04_post_migration.sql` was reviewed line by line: it only touches
`invoice_settings`, `stress_test_settings`, the two invoice sequences and
`admin_sessions`, then runs read-only verification queries. It is idempotent and
depends only on objects created in steps 1–3. No changes needed.

The invoice re-alignment is the critical part: it pushes `current_number` past
the highest existing `CZP-xx`, so the next order cannot reuse a number.

---

## 7. Storage — `05_storage.md` was incomplete, now rewritten

Code search found **six** buckets, not two:

| Bucket         | Public | Exists today          |
| -------------- | ------ | --------------------- |
| `avatars`      | No     | Yes (1 object)        |
| `logos`        | No     | Yes (0 objects)       |
| `products`     | Yes    | **No — missing**      |
| `hero`         | Yes    | **No — missing**      |
| `hero-banners` | Yes    | **No — missing**      |
| `bike-models`  | Yes    | **No — missing**      |

Four buckets referenced by the code and by 32 stored image URLs never existed in
the live project, so those uploads and images are broken **today**, before any
migration. `05_storage.md` now lists every bucket, its public/private status, the
exact path shapes, the real `storage.objects` policies transcribed from
production, the extra policies the media buckets need, and the URL-rewrite SQL
(including the JSONB `products.images` column, which was missing).

---

## 8. Environment / Netlify — one real blocker, FIXED

**Blocker found:** the build hard-targets Cloudflare. `@lovable.dev/vite-tanstack-config`
defaults nitro to `cloudflare-module`, so a Netlify build produced
`dist/server/wrangler.json` and no Netlify function — the site would serve static
files and 404 on SSR, `/ad/*` and every server function. `NITRO_PRESET` alone
does not fix it deterministically.

Fix: `vite.config.ts` now honours a `DEPLOY_PRESET` env var and passes it to
nitro; unset (Lovable) behaviour is unchanged. `netlify.toml` sets
`DEPLOY_PRESET = "netlify"` and the correct `publish = "dist"` (was `dist/client`,
which is wrong for the netlify preset — it writes static assets to `dist/` and the
SSR function to `.netlify/functions-internal/server`). The stale
`[functions] node_bundler = "esbuild"` was removed because the preset sets
`nodeBundler: "none"`. No `[[redirects]]` are needed: the generated function is
mounted at `/*` with `preferStatic`, which is also why SPA/deep-link routing and
`/ad/*` work.

Environment variables — client-safe vs server-only:

| Client-safe (`VITE_*`, shipped to the browser) | Server-only |
| --- | --- |
| `VITE_SUPABASE_URL` | `SUPABASE_URL` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `SUPABASE_PUBLISHABLE_KEY` |
| `VITE_SUPABASE_PROJECT_ID` | `SUPABASE_ANON_KEY` |
| | `SUPABASE_SERVICE_ROLE_KEY` (**secret**) |
| | `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS` (optional) |

`SUPABASE_SERVICE_ROLE_KEY` stays required — ~30 server modules use the admin
client for audit writes, staff approval, signed avatar URLs, invoice generation
and courier booking, all against tables whose policies deliberately block
`anon`/`authenticated`. On your own project you can read that key from the
dashboard, so this is no longer a blocker. It is read lazily inside handlers and
never reaches the browser.

---

## 9. Lovable dependencies — none blocking

| Item | Verdict |
| --- | --- |
| `@lovable.dev/vite-tanstack-config` | Build-time only; a normal npm package. Keep it — it is the whole Vite/TanStack/nitro plugin stack. Works on Netlify. |
| `@lovable.dev/cloud-auth-js` via `src/integrations/lovable/index.ts` | **Not imported anywhere** in the app. Dead code; harmless. Removing it is optional and was not done. |
| `src/lib/lovable-error-reporting.ts` | Guards on optional `window.__lovableEvents`; no-ops outside Lovable. Harmless. |
| AI order extraction (`ai-provider.server.ts`) | A mock provider — no `LOVABLE_API_KEY` is read anywhere in `src/`. No AI gateway dependency. |
| `.env` in the repo | Contains only the old project's URL/publishable key. Netlify env vars override it; delete or replace after migrating. |
| Supabase edge functions | None in the repo — all server logic is TanStack `createServerFn` / server routes. Portable. |

Nothing was removed automatically.

---

## A. BLOCKERS (were in Lovable — all fixed in this pass)

1. `01_schema.sql` FUNCTIONS section was invalid SQL — **fixed** (regenerated).
2. `01_schema.sql` was missing the `private` schema and its two helpers, which
   the `bike_models` policies require — **fixed**.
3. 113 constraint blocks used invalid `EXCEPTION` syntax — **fixed**.
4. `02_data.sql` had FK references to non-existent `auth.users` rows — **fixed**.
5. Build hard-targeted Cloudflare; Netlify would have had no SSR — **fixed**
   (`DEPLOY_PRESET`).
6. `netlify.toml` published the wrong directory — **fixed** (`dist`).
7. `05_storage.md` documented 2 of 6 buckets — **fixed**.

No remaining Lovable-side blockers.

## B. SAFE (ready as-is)

- Tables, enums, sequences, constraints, indexes, triggers, grants, RLS enable
  statements and all 120 policies in `01_schema.sql`.
- `02_data.sql` row set and ordering (532 rows / 32 tables).
- `03_auth_users.sql` linking + orphan cleanup logic.
- `04_post_migration.sql` in full, including invoice re-alignment.
- All application code: no edge functions, no Lovable runtime requirement,
  typecheck and production build both pass.
- `/ad/*` admin routing, deep links and SPA navigation on Netlify.

## C. MANUAL STEPS (after you leave Lovable)

1. Create the new Supabase project; note the ref and keys.
2. Create the auth users by hand (owner + staff), *Auto Confirm* on; put their
   UUIDs into `03_auth_users.sql`.
3. Everyone sets a new password and re-enrols TOTP; generate new backup codes.
4. Auth → Providers: enable Google, add
   `https://<new-ref>.supabase.co/auth/v1/callback` to the Google OAuth client;
   keep anonymous sign-ups disabled.
5. Auth → URL configuration: Site URL + redirect URLs for your Netlify/custom
   domain.
6. Storage: create all six buckets with the public/private flags in
   `05_storage.md`, apply the policies, copy/re-upload files, run the URL rewrite.
7. Netlify: set the env vars from `ENV_TEMPLATE.md` (including
   `SUPABASE_SERVICE_ROLE_KEY` from your own project).
8. Re-enter SteadFast credentials in Admin → Settings → Couriers and test.
9. Delete or replace the committed `.env` so it no longer names the old project.

## D. EXACT FILES CHANGED

1. `supabase/migration-export/01_schema.sql` — functions section regenerated,
   `private` schema + helpers added, 113 `EXCEPTION` blocks corrected.
2. `supabase/migration-export/02_data.sql` — two stale `auth.users` FK values set
   to `NULL`.
3. `supabase/migration-export/05_storage.md` — rewritten from the source code.
4. `supabase/migration-export/README.md` — updated to match.
5. `supabase/migration-export/ENV_TEMPLATE.md` — added `DEPLOY_PRESET`, client vs
   server split clarified.
6. `supabase/exports/SUPERSEDED.md` — new marker so the old draft can't be used
   by mistake.
7. `netlify.toml` — `publish = "dist"`, `DEPLOY_PRESET`, stale `[functions]` block
   removed.
8. `vite.config.ts` — honours `DEPLOY_PRESET` for the nitro target.
9. `MIGRATION_AUDIT.md` — this report.

No application logic, UI or database schema was modified.

## E. FINAL MIGRATION ORDER

1. Create the new Supabase project.
2. Run `supabase/migration-export/01_schema.sql`.
3. Run `supabase/migration-export/02_data.sql`.
4. Create the auth users, fill in the UUIDs, run `03_auth_users.sql` (including
   the orphan-cleanup deletes at the bottom).
5. Run `04_post_migration.sql` and read its verification output.
6. Do the storage work in `05_storage.md` (buckets → policies → files → URL rewrite).
7. Configure Auth: Google provider, Site URL, redirect URLs.
8. Push the repo to GitHub, connect it to Netlify, set the env vars, deploy.
9. Smoke test: homepage, product page, checkout → order (invoice must continue,
   not restart), `/ad` login → MFA enrol, staff list, courier test, image upload.

## F. NETLIFY READINESS

**Can this project now be migrated to your own Supabase and deployed to Netlify
without returning to Lovable? — YES.**

All seven blockers were fixed in this pass. What remains is entirely on your
side: creating the project, the auth users, the storage buckets and the Netlify
environment variables, as listed in section C.
