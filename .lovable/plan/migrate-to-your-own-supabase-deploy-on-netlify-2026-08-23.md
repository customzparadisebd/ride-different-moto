# Migrate to Your Own Supabase + Deploy on Netlify

## First, one correction

The Netlify error is not a bug to delete — it is the app telling you a required key is missing.

This project genuinely uses a service-role key. It is present and working in the Lovable runtime, and it is used in ~30 server modules (17 places in the admin functions file alone): order intake and invoice generation, staff/RBAC and audit logs, courier booking, hero/gallery/featured management, storage signing, rate limiting.

Those tables are protected by 120 access policies that deliberately block public/anon access. If the code fell back to only the publishable key, every one of those features would start failing with permission errors instead of the current startup error. So the fix is to give the app your own service-role key, not to remove the check — which matches your answer: migrate to your own Supabase project.

## Current state of the export scripts (verified)

`supabase/exports/` is a partial draft, not a usable migration:

- `01_schema.sql` creates 12 tables; the live database has 51.
- It contains 3 grant/policy statements; the live database has 120 policies.
- `02_data.sql` is a commented skeleton — no real rows (live data: 19 products, 34 orders, 2 auth users, 1 storage file).

Importing it as-is would produce a broken copy. It has to be regenerated from the live database.

## What I will do

### 1. Generate a real, complete export

New folder `supabase/migration-export/`, generated from the live database rather than hand-written:

- `01_schema.sql` — all 51 tables, enums, sequences, functions, triggers, grants and all 120 policies, in dependency order.
- `02_data.sql` — real `INSERT` statements for every row of every table, ordered so foreign keys resolve.
- `03_auth_users.sql` — the 2 auth accounts including password hashes, so nobody has to re-register.
- `04_post_migration.sql` — invoice sequence / `invoice_settings` sync so the next invoice continues from CZP-05 rather than restarting.
- `05_storage.md` — the storage buckets to recreate (`avatars`, `logos`, both private) and the files to re-upload.

I will produce these by dumping the live schema and data directly, and verify the output by counting tables, policies and rows in the generated SQL against the live counts.

### 2. Make the app portable across Supabase projects

- Keep the service-role client, but improve the startup failure so it names exactly which variable is missing and where to set it, instead of crashing the whole app render.
- Remove hardcoded Lovable-project assumptions from committed env files/docs so the URL and keys come purely from environment variables.
- Keep test files reading the key from the environment (no change needed there).

### 3. Netlify-specific build setup

The build currently targets Cloudflare Workers by default. For Netlify I will add:

- `netlify.toml` with the correct build command, publish directory and Netlify server-target preset.
- A short note on Node version and the SSR function output.

### 4. Written guides

- `MIGRATION_GUIDE.md` rewritten as a step-by-step runbook: create the new Supabase project, run the four SQL files in order, recreate buckets, enable Google auth, set redirect URLs, set Netlify env vars, verify.
- `supabase/exports/ENV_TEMPLATE.md` updated to the actual variable list below.

## Environment variables you must set on Netlify

Required:

- `VITE_SUPABASE_URL` — your new project's API URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — anon/publishable key
- `SUPABASE_URL` — same value as `VITE_SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY` — same value as the publishable key
- `SUPABASE_SERVICE_ROLE_KEY` — from your own project's API settings (server-side only, never in a `VITE_` variable)

Optional / feature-specific:

- `STEADFAST_API_KEY`, `STEADFAST_API_SECRET` — courier booking (can also be entered in Admin Settings)
- `LOVABLE_API_KEY` — AI order extraction; the Lovable-managed key does not travel with an export, so AI features stay off until you supply your own AI gateway key
- `RATE_LIMIT_MAX` (default 100), `RATE_LIMIT_WINDOW_MS` (default 60000)

Manual steps in the new Supabase project (cannot be exported): enable Google auth, set Site URL and redirect URLs to your Netlify/custom domain, recreate the two private storage buckets, re-upload files.

## Moving the project to another Lovable account

A Lovable Cloud database cannot be transferred between accounts, so it is the same export/import path:

1. Transfer or re-create the project in the other account (project transfer for the code, or push the code to GitHub and import it there).
2. In the new account's project, enable Cloud and run the same four SQL files through the database migration tool.
3. Recreate the buckets, re-upload files, re-enable Google auth.
4. Re-enter integration secrets (Steadfast); the new account gets its own AI key automatically.
5. Nothing else to change in code — the new account injects its own Supabase URL and keys.

The generated export package works for both destinations, so this plan covers the Netlify move and the account move with the same artifacts.

## Technical notes

- Files touched: `supabase/migration-export/*` (new), `netlify.toml` (new), `src/integrations/supabase/client.server.ts` (clearer missing-env error only), `MIGRATION_GUIDE.md`, `supabase/exports/ENV_TEMPLATE.md`.
- No schema changes to your live database, and no change to how the app behaves on Lovable.
- The old partial `supabase/exports/01_schema.sql` / `02_data.sql` will be marked superseded rather than silently left as a trap.
