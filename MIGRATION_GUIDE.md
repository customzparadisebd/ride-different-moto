# CUSTOMZ PARADISE BD — Migration Guide (Lovable Cloud → External Hosting)

Author: Rafi Gazi (Rabbee) Apps
Status: Reference document. No application code or UI is changed by this guide.

---

## 0. What you are moving

| Layer                            | Today                                                       | After migration                                                            |
| -------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------- |
| Frontend + backend (one app)     | TanStack Start (React 19, Vite 8, Nitro) on Lovable hosting | Cloudflare Workers/Pages, Vercel, Netlify, or Node 22 (Docker/VPS)         |
| Database                         | Managed Postgres (Supabase) in Lovable Cloud                | Your own Supabase project (recommended) or any Postgres + PostgREST/GoTrue |
| Auth (admin + staff logins, MFA) | Supabase Auth (GoTrue)                                      | Supabase Auth on your own project                                          |
| Storage                          | Bucket `avatars` (public)                                   | Same bucket name on the new project                                        |
| Courier API                      | SteadFast credentials stored in the `couriers` table        | Moves automatically with the database dump                                 |

Important: keeping Supabase as the backend on your own account is by far the
lowest-risk route. The app talks to Supabase through the standard
`@supabase/supabase-js` client, RLS, and `security definer` SQL functions — all
portable. Replacing Supabase with a hand-rolled Postgres + custom auth would
require rewriting auth, MFA, RLS, and every server function.

---

## 1. Pre-migration checklist (do this first)

1. Create a new Supabase project in **your own** Supabase account. Choose the
   region closest to Bangladesh (Singapore `ap-southeast-1`).
2. Save from the new project: Project URL, `anon`/publishable key,
   `service_role` key, and the **database password** (only shown once).
3. Export the code: GitHub → the repo connected to this project, or download
   the project ZIP. This includes `supabase/migrations/` — your schema history.
4. Install locally: Node 22+, `bun` or `npm`, `psql`, and the Supabase CLI.
5. Freeze order intake for the migration window (30–60 minutes) so no new rows
   are written to the old database after the dump.

---

## 1b. The generated migration package

Everything you need was generated from the live database and lives in
`supabase/migration-export/`:

| File                    | Purpose                                                                | Run order |
| ----------------------- | ---------------------------------------------------------------------- | --------- |
| `01_schema.sql`         | Enums, sequences, 51 tables, 13 functions, triggers, 159 GRANTs, 120 RLS policies | 1 |
| `02_data.sql`           | 532 rows across 32 tables, FK-safe order, `ON CONFLICT DO NOTHING`     | 2         |
| `03_auth_users.sql`     | Links newly created auth accounts to imported profiles/roles           | 3         |
| `04_post_migration.sql` | Invoice sequence re-alignment, session cleanup, verification queries   | 4         |
| `05_storage.md`         | Bucket recreation (`avatars`, `logos`), object copy, URL rewrite       | manual    |
| `ENV_TEMPLATE.md`       | Every environment variable, with which are secret                      | manual    |

Also at the repo root: `netlify.toml` (build command, publish dir, security and
cache headers, `no-store` + `noindex` on the admin panel).

---

## 2. Database migration (schema + data, zero data loss)

Open the new project's **SQL editor** and run, in this exact order:

```
supabase/migration-export/01_schema.sql
supabase/migration-export/02_data.sql
supabase/migration-export/03_auth_users.sql     (after creating the auth users)
supabase/migration-export/04_post_migration.sql
```

Notes:

- Create the auth users (section 3) **before** `03_auth_users.sql` — it
  needs their real UUIDs pasted into the placeholders.
- `04_post_migration.sql` is the step that prevents duplicate invoice numbers.
  Do not skip it, and read its verification output.

### Alternative — replay the repo migrations

```bash
supabase login
supabase link --project-ref <YOUR_NEW_PROJECT_REF>
supabase db push          # replays supabase/migrations in order
psql "$NEW_DB_URL" -f supabase/migration-export/02_data.sql
psql "$NEW_DB_URL" -f supabase/migration-export/04_post_migration.sql
```

### Verify

Row-count every table on both sides and compare (query 3c in
`04_post_migration.sql` prints the main ones). Do not go live until the counts
match, including `admin_audit_log` (append-only history).


---

## 3. Auth users (admins, staff, MFA)

Supabase Auth lives in the `auth` schema, which you must **not** hand-edit.

- **Preferred:** `pg_dump --schema=auth` from the old project and restore into
  the new one. This preserves user IDs, bcrypt password hashes, and enrolled
  TOTP factors — everyone keeps their existing password and authenticator.
- **If the `auth` dump is not available:** recreate accounts with the Admin API
  and send password resets. Because `public.profiles.id` and
  `public.user_roles.user_id` reference the auth user id, you must then remap
  those ids:
  ```sql
  -- run per user after re-creating them in the new project
  UPDATE public.profiles   SET id      = '<new_uuid>' WHERE email = 'staff@example.com';
  UPDATE public.user_roles SET user_id = '<new_uuid>' WHERE user_id = '<old_uuid>';
  UPDATE public.user_permissions SET user_id = '<new_uuid>' WHERE user_id = '<old_uuid>';
  ```
  MFA must be re-enrolled, and each admin should regenerate backup codes
  (Admin → Security). `mfa_backup_codes` hashes are salted with the user id, so
  old codes stop working once the id changes.
- The Super Admin bootstrap is automatic: `customzparadisebd@gmail.com` is
  promoted to `super_admin` and auto-approved on first sign-in
  (`OWNER_EMAIL` in `src/lib/admin.server.ts`). Every other account starts
  `pending` and needs approval — expected behaviour, not a bug.

### Auth settings to re-apply in the new project

- Site URL: `https://customzparadisebd.com`
- Redirect URLs: `https://customzparadisebd.com/**`, plus staging domains
- Email confirmations: keep as configured; do **not** enable anonymous sign-ups
- Google provider: enable it and add the new domain's callback
  `https://<new-project-ref>.supabase.co/auth/v1/callback` in Google Cloud
  Console → OAuth client → Authorized redirect URIs
- JWT expiry / refresh rotation: match the old settings

---

## 4. Storage files

Full instructions live in `supabase/migration-export/05_storage.md` — bucket
creation, RLS policies on `storage.objects`, object copy and URL rewrite.

Short version: recreate the **private** buckets `avatars` and `logos`, then copy
the objects:

```bash
supabase storage cp -r ss:///avatars ./avatars-backup --project-ref <OLD_REF>
supabase storage cp -r ./avatars-backup ss:///avatars  --project-ref <NEW_REF>
```

Then rewrite stored URLs, because they embed the old project ref:

```sql
UPDATE public.profiles
SET avatar_url = replace(avatar_url, '<OLD_REF>.supabase.co', '<NEW_REF>.supabase.co')
WHERE avatar_url LIKE '%supabase.co%';
```

Run the same `replace()` on any product/hero image column that stores an
absolute Supabase URL (`products.image_url`, `product_colors.image_url`,
`hero_slides.image_url`). Bundled images imported from `src/assets` need no
action — they are fingerprinted into the build.

---

## 5. RLS policies and grants

Both are part of the migration files, so `supabase db push` restores them. After
the push, confirm nothing is left open:

```sql
-- every public table must have RLS on
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname='public' AND rowsecurity = false;

-- policy inventory
SELECT tablename, policyname, roles, cmd FROM pg_policies
WHERE schemaname='public' ORDER BY tablename;

-- grants must exist, or the app gets permission errors
SELECT table_name, grantee, privilege_type FROM information_schema.role_table_grants
WHERE table_schema='public' AND grantee IN ('anon','authenticated','service_role')
ORDER BY table_name;
```

Rules this project relies on: public storefront tables (`products`,
`product_colors`, `brands`, `categories`, `cities`, `delivery_zones`,
`hero_slides`, `store_settings`, `reviews`) allow `anon` reads only;
`admin_audit_log`, `security_events`, `login_attempts`, `admin_sessions` and
`mfa_backup_codes` are `service_role` only (append-only audit trail); everything
else is gated behind `is_staff()` / `has_permission()`.

---

## 6. Environment variables

The authoritative list, with which values are secret, is
`supabase/migration-export/ENV_TEMPLATE.md`. Set them in your host's dashboard
(Netlify → Site configuration → Environment variables). Never commit them.

**Server-only (secret)**

```
SUPABASE_URL=https://<new-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<new anon/publishable key>
SUPABASE_SERVICE_ROLE_KEY=<new service_role key>
SUPABASE_ANON_KEY=<same as publishable — legacy fallback used by some helpers>
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000
LOVABLE_API_KEY=<only if you keep using Lovable AI; otherwise drop it>
```

**Client-visible (build-time, safe to expose)**

```
VITE_SUPABASE_URL=https://<new-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<new anon/publishable key>
VITE_SUPABASE_PROJECT_ID=<new-ref>
```

Notes:

- `VITE_*` values are inlined at build time — after changing them you **must
  rebuild**, not just restart.
- Server variables are read inside handlers, so they are picked up on restart.
- If any variable is missing, the app throws a clear
  "Missing Supabase environment variable(s)" error on first request — that is
  the fastest way to spot a typo.

---

## 7. SteadFast courier API

Nothing to re-key by hand: the base URL, API key and API secret live encrypted
in the `couriers` table (`slug = 'steadfast'`) and travel with the database
dump. After migration:

1. Sign in to the admin panel → **Settings → Couriers → SteadFast**.
2. Press **Test connection**. A green result confirms the credentials survived.
3. If SteadFast has your old callback URL on file, update it with them to
   `https://customzparadisebd.com/api/public/...` (this project currently pulls
   status by polling, so this step is only needed if you later add a webhook).
4. `steadfast_stats` carries the success counter, last success timestamp and
   last invoice reference — restore that single row so the dashboard counter
   does not reset to zero.
5. Verify outbound egress is allowed on the new host; some providers block
   arbitrary outbound HTTPS on the free tier, which would surface as
   "SteadFast request failed".

---

## 8. Build and deploy

```bash
bun install          # or npm ci
bun run build        # vite build → Nitro server bundle
```

Runtime requirements:

- **Node 22+** if you self-host (`node .output/server/index.mjs`).
- The build targets an **edge/Worker** runtime by default. Cloudflare
  Workers/Pages, Vercel and Netlify all work with no config change.
- Avoid Node-only native modules; the server bundle is fully bundled at build
  time and there is no runtime module resolution.
- `vite.config.ts` uses `@lovable.dev/vite-tanstack-config`. Keep it — it wires
  TanStack Start, Tailwind v4, path aliases, and the Nitro target. If you want
  to remove the Lovable dev dependency entirely, replace it with the equivalent
  plugin list (`tanstackStart`, `viteReact`, `tailwindcss`, `tsConfigPaths`,
  `nitro`) rather than deleting it.
- Routing needs no `_redirects`/`vercel.json` rewrites — the Nitro server
  handles every route, including `/order-confirmed/$id` and the admin panel at
  `/czp-ops-9f2c`.

### Netlify

`netlify.toml` at the repo root is already configured:

- build `npm run build`, publish `dist/client`, Node 22
- security headers (HSTS, nosniff, frame options, referrer + permissions policy)
- `Cache-Control: no-store` and `X-Robots-Tag: noindex, nofollow` on
  `/czp-ops-9f2c/*` and `/ad/*`, `no-store` on `/api/*`
- immutable long cache on `/assets/*`

Steps: connect the repo in Netlify → add the environment variables from
`ENV_TEMPLATE.md` → deploy. Never enable Netlify's asset CDN caching for the
admin paths.

---

## 9. Domain, SSL, CORS, cookies

1. Point your domain's DNS at the new host and let it issue the certificate
   (Let's Encrypt / Cloudflare Universal SSL). Force HTTPS — the app sends HSTS.
2. Add the domain to Supabase → Authentication → URL Configuration
   (Site URL + Redirect URLs). Missing this is the #1 cause of "login works
   then bounces back" after a migration.
3. CORS: the browser only calls your own origin and
   `https://<new-ref>.supabase.co`. Supabase allows the Data API from any
   origin by default, so no CORS work is needed. If you put Cloudflare in front,
   do not cache `/ad/*` or `/api/*`.
4. Sessions: Supabase Auth stores the session in `localStorage`, not cookies,
   and admin server functions authenticate with a bearer token. Because the
   project ref changes, the storage key changes too — **every signed-in user is
   logged out once** after cutover. That is expected; no action needed.
5. `admin_sessions` rows from the old project reference old session ids and are
   simply ignored. Optionally clear them:
   `UPDATE public.admin_sessions SET revoked_at = now() WHERE revoked_at IS NULL;`

---

## 10. Cutover sequence (recommended order)

1. Freeze order intake / put the storefront in maintenance mode.
2. Take the final database export and the Storage copy.
3. Push schema → load data → reset sequences → verify row counts.
4. Restore auth users, re-apply auth settings, enable Google.
5. Deploy the build to the new host with a temporary hostname; smoke-test.
6. Repoint DNS, wait for SSL, then re-test on the real domain.
7. Unfreeze. Keep the old deployment read-only for 7 days as a rollback path.

### Post-migration smoke test

- [ ] Storefront home, product detail, colour selection, cart
- [ ] Checkout → order saved → `/order-confirmed/$id` loads on refresh
- [ ] Invoice number continues the old sequence (no duplicates, no reset)
- [ ] Super Admin sign-in + MFA + audit log entry written
- [ ] Staff sign-in creates a pending approval request, admin can approve
- [ ] Admin dashboard metrics, SteadFast counter and last-success details
- [ ] SteadFast test connection + one real booking
- [ ] Customer list, soft delete, Recycle Bin restore
- [ ] Avatar upload to the `avatars` bucket
- [ ] Bangla/English switch, dark/light theme, mobile layout

---

## 11. Risk register

| Risk                                  | Likelihood      | Prevention                                             |
| ------------------------------------- | --------------- | ------------------------------------------------------ |
| Duplicate/reset invoice numbers       | High if skipped | `setval()` step in section 2                           |
| Broken image URLs                     | Medium          | `replace()` update in section 4                        |
| Login loop after cutover              | Medium          | Site URL + Redirect URLs in section 9                  |
| Google sign-in "Unsupported provider" | Medium          | Enable the provider and add the new callback           |
| Permission errors on every query      | Medium          | Verify GRANTs in section 5                             |
| Staff locked out                      | Medium          | Owner email auto-bootstraps; approve staff after       |
| MFA lost                              | Medium          | Dump the `auth` schema, or re-enrol + regenerate codes |
| SteadFast failures                    | Low             | Test connection; confirm outbound HTTPS allowed        |
| Stale `VITE_*` values                 | Low             | Rebuild after changing them                            |
| Data loss                             | Low             | Freeze writes, verify row counts before DNS change     |

---

## 12. Verdict

Yes — the whole system (frontend, backend server functions, database, auth,
storage, RLS, courier integration, admin panel) can move to external hosting
with your own domain without breaking functionality. There is no Lovable-only
runtime dependency in the application logic. The three steps that actually
cause outages if skipped are: **invoice sequence reset**, **Supabase auth URL
configuration**, and **environment variables + rebuild**. Everything else is a
straight copy.
