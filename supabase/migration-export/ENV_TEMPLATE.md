# Environment variables — CUSTOMZ PARADISE BD

Set these in your new host (Netlify → Site configuration → Environment
variables). Never commit them to git.

## 1. Required — Supabase

Source: new Supabase project → Settings → API.

| Key                             | Scope              | Secret? | Notes                                              |
| ------------------------------- | ------------------ | ------- | -------------------------------------------------- |
| `VITE_SUPABASE_URL`             | Client + server    | No      | `https://<new-ref>.supabase.co`                    |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Client + server    | No      | anon / publishable key                             |
| `VITE_SUPABASE_PROJECT_ID`      | Client             | No      | the new project ref                                |
| `SUPABASE_URL`                  | Server only        | No      | same value as `VITE_SUPABASE_URL`                  |
| `SUPABASE_PUBLISHABLE_KEY`      | Server only        | No      | same value as `VITE_SUPABASE_PUBLISHABLE_KEY`      |
| `SUPABASE_ANON_KEY`             | Server only        | No      | legacy fallback used by some helpers               |
| `SUPABASE_SERVICE_ROLE_KEY`     | Server only        | **Yes** | required — admin/staff features bypass RLS with it |

`SUPABASE_SERVICE_ROLE_KEY` is mandatory. The admin panel (staff approval, audit
log writes, signed storage URLs, courier booking, invoice generation) cannot work
without it. It is only read inside server handlers and is never sent to the
browser.

## 2. Optional — integrations

| Key               | Scope       | Secret? | Notes                                                     |
| ----------------- | ----------- | ------- | --------------------------------------------------------- |
| `LOVABLE_API_KEY` | Server only | **Yes** | only if you keep AI order extraction; otherwise omit      |

SteadFast courier credentials are **not** environment variables — they live in
the `couriers` table and travel with `02_data.sql`. Re-check them in
Admin → Settings → Couriers → Test connection.

## 3. Optional — rate limiting

| Key                    | Default | Notes                            |
| ---------------------- | ------- | -------------------------------- |
| `RATE_LIMIT_MAX`       | `100`   | max requests per window          |
| `RATE_LIMIT_WINDOW_MS` | `60000` | window size in ms (1 minute)     |

## 4. Manual settings that are not environment variables

1. **Auth → URL configuration**: Site URL `https://customzparadisebd.com`,
   redirect URLs `https://customzparadisebd.com/**` plus any staging domain.
2. **Auth → Providers**: enable Google, add
   `https://<new-ref>.supabase.co/auth/v1/callback` to the Google Cloud OAuth
   client. Keep anonymous sign-ups **disabled**.
3. **Storage**: create the `avatars` and `logos` buckets (private) — see
   `05_storage.md`.

## Example `.env`

```env
VITE_SUPABASE_URL="https://your-ref.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
VITE_SUPABASE_PROJECT_ID="your-ref"

SUPABASE_URL="https://your-ref.supabase.co"
SUPABASE_PUBLISHABLE_KEY="your-anon-key"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-secret"

RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000
```

Reminder: `VITE_*` values are inlined at build time — after changing them you
must trigger a **rebuild**, not just a restart.
