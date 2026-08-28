# Final Production-Readiness Audit — CUSTOMZ PARADISE BD

## What I already verified (read-only)

| Area | Result |
| --- | --- |
| Netlify config | `netlify.toml` correct: `DEPLOY_PRESET=netlify`, `publish = dist`, Node 22, security headers, `no-store` + `noindex` on `/ad/*`, `/czp-ops-9f2c/*`, `/api/*`, immutable `/assets/*` |
| Build config | `vite.config.ts` uses the Lovable TanStack preset, sourcemaps off, terser minify, nitro preset switch via env — portable |
| Env / secrets | No secrets in the repo. `.env` holds only URL + publishable keys. `client.server.ts` reads `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` inside the handler and fails with a clear "missing variable" message. `ENV_TEMPLATE.md` documents every variable |
| Auth | Server functions use `requireSupabaseAuth`; admin panel sits under `_authenticated/ad`; roles/permissions resolved server-side |
| Migration package | `supabase/migration-export/` exists with schema, data, auth-link, post-migration, storage and env docs |
| Latest code fix | Customers bulk permanent delete now allows Admin + Super Admin (matches products/orders); typecheck passes |

## Confirmed blockers to fix

1. **The migration export is older than the database.** `01_schema.sql` still contains
   `CREATE POLICY "Admins can update invoice settings" ... has_role(auth.uid(),'admin')`
   only — the exact policy that caused the "invoice serial won't reset" bug, replaced on
   27 Aug by a policy that also allows Super Admin. The export also predates:
   - dropping the `orders.invoice_no` unique constraint and adding the plain index,
   - the updated `generate_next_invoice_no()` / `generate_next_invoice_no(boolean)` bodies,
   - the `REVOKE EXECUTE ... FROM anon, authenticated` hardening on those functions.

   A fresh Supabase built from this export would reproduce the invoice bug and be less
   secure than the live project.

2. **Over-permissive grant in the export.** `01_schema.sql` grants
   `SELECT, INSERT, UPDATE, DELETE ON public.invoice_settings TO anon`. The live project's
   latest migration only grants `authenticated` + `service_role`.

3. **Hardcoded old project URL.** `src/lib/hero-restore.server.ts` embeds
   `https://pqphihorljepzfdacant.supabase.co/storage/v1/object/public/hero-banners/...`
   in four seed rows. On your own Supabase these images resolve to the old project (or
   404), so the helper is not portable.

## Fix plan (minimal, no feature changes)

1. Bring `supabase/migration-export/01_schema.sql` in sync with the live database:
   replace the invoice-settings policy with the Admin-or-Super-Admin version, update the
   two invoice generator functions, add the function `REVOKE`/`GRANT` lines, replace the
   unique constraint on `orders.invoice_no` with the non-unique index, and drop the `anon`
   grant on `invoice_settings`.
2. Make `hero-restore.server.ts` build its image URLs from `process.env['SUPABASE_URL']`
   instead of the hardcoded project ref (same paths, same behaviour).
3. Note the two export folders clearly: `supabase/migration-export/` is authoritative;
   `supabase/exports/` stays marked superseded.
4. Re-run typecheck and the invoice/concurrency test suite, then update
   `DEVELOPER_NOTES.md` with the audit result and next steps.

No database migration is required — the live database is already correct; only the
portable export files and the seed helper are behind.

## Final verdict (delivered after the fixes)

After steps 1–4 the project is deployable on your own Supabase + GitHub + Netlify with no
blockers, provided you set on Netlify: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`,
`VITE_SUPABASE_PROJECT_ID`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`,
`SUPABASE_SERVICE_ROLE_KEY` (mandatory), and run the four export files plus the six storage
buckets from `05_storage.md`.
