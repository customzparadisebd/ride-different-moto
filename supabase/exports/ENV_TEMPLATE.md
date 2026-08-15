# Environment Configuration Template

This file lists all environment variables required for the **CUSTOMZ PARADISE BD** project.
To migrate, you must set these variables in your new hosting provider (e.g., Vercel, Cloudflare, Netlify) and your new Supabase project.

## 1. Supabase Core (Required)

These variables connect your frontend and backend to Supabase.
**Source:** New Supabase Project Settings > API.

| Key                             | Scope              | Description                                                                 | Manual Action    |
| ------------------------------- | ------------------ | --------------------------------------------------------------------------- | ---------------- |
| `VITE_SUPABASE_URL`             | Frontend & Backend | The API URL of your new Supabase project.                                   | **Set Manually** |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Frontend & Backend | The `anon` / `public` key.                                                  | **Set Manually** |
| `SUPABASE_URL`                  | Backend Only       | Identical to `VITE_SUPABASE_URL`.                                           | **Set Manually** |
| `SUPABASE_SERVICE_ROLE_KEY`     | Backend Only       | The `service_role` secret key. **CRITICAL: NEVER expose this in frontend.** | **Set Manually** |
| `SUPABASE_PUBLISHABLE_KEY`      | Backend Only       | Identical to `VITE_SUPABASE_PUBLISHABLE_KEY`.                               | **Set Manually** |

## 2. Integration: SteadFast Courier

Required for automated booking and tracking.
**Source:** SteadFast Courier Panel > API Keys.

| Key                    | Scope        | Description                                | Manual Action                         |
| ---------------------- | ------------ | ------------------------------------------ | ------------------------------------- |
| `STEADFAST_API_KEY`    | Backend Only | Your production API Key from SteadFast.    | **Set in Admin Settings UI** (or Env) |
| `STEADFAST_API_SECRET` | Backend Only | Your production API Secret from SteadFast. | **Set in Admin Settings UI** (or Env) |

## 3. Rate Limiting (Optional / Tuning)

Controls the progressive lockout and request throttling.

| Key                    | Default | Description                          |
| ---------------------- | ------- | ------------------------------------ |
| `RATE_LIMIT_MAX`       | `100`   | Max requests per window.             |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Window size in milliseconds (1 min). |

## 4. Manual Configuration (Non-Exportable)

The following MUST be configured manually in the new Supabase Project UI as they cannot be exported via SQL:

1. **Authentication Providers:**
   - Enable **Google Auth** in _Authentication > Providers_.
   - Add your new domain to the **Redirect URIs**.
   - Set the `SITE_URL` to your new production domain.

2. **Storage Buckets:**
   - Create a bucket named `products` (Public).
   - Create a bucket named `assets` (Public).
   - _Note:_ The code assumes these names for image uploads.

3. **Database Secrets (Vault):**
   - If using Supabase Vault for API keys instead of Env vars, manually insert the SteadFast credentials there.

## Example .env File

```env
# Frontend (Client + Server)
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"

# Backend (Server Only)
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_PUBLISHABLE_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-secret"

# Integrations
# Note: These can also be configured via the Admin Dashboard > Settings
STEADFAST_API_KEY="your-steadfast-key"
STEADFAST_API_SECRET="your-steadfast-secret"

# Security Tuning
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000
```
