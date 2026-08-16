# Technical Audit & Migration Report
Project: CUSTOMZ PARADISE BD

## 1. Portability Audit

### Overall Assessment
The project is **fully portable**. It is built using the TanStack Start v1 framework, which is a modern, standard React/Node.js stack. It is designed to run in any environment that supports Node.js or serverless Nitro targets.

### Platform Dependencies
| Component | Dependency | Portability Notes |
| :--- | :--- | :--- |
| **Backend** | Supabase (PostgreSQL) | **Portable.** The database is standard PostgreSQL. If you keep using Supabase, you just point your new hosting to it. |
| **Auth** | Supabase Auth | **Portable.** Standard JWT/Cookie-based auth. Requires domain configuration updates in Supabase. |
| **Storage** | Supabase Storage | **Portable.** Images remain in the bucket. URLs are dynamic based on the Supabase URL. |
| **Server Logic** | TanStack Server Functions | **Portable.** Runs on Nitro (Node.js/Cloudflare/Vercel). |
| **Environment** | Env Vars | **Portable.** Standard Twelve-Factor App compliance. |

### Potential Breakage & Remedies
| Feature | Why it will break | Remedy |
| :--- | :--- | :--- |
| **MFA & Login** | Supabase rejects requests from unknown domains. | Update Site URL and Redirect URIs in Supabase settings. |
| **Social Login** | OAuth providers (Google) verify the domain. | Update authorized domains in the Google Cloud Console. |
| **Staging Banner** | Hostname detection logic. | This is intentional; the banner will disappear on your custom domain. |
| **CORS** | Security headers in `src/start.ts`. | Update the CSP/CORS headers if you have a strict policy. |

---

## 2. Migration Checklist

### Step 1: Code Export
- [ ] Export/Clone the full Git repository.
- [ ] Ensure `package.json` and `package-lock.json` are present.
- [ ] Save the current `ENV_TEMPLATE.md` values.

### Step 2: Supabase (Backend) Configuration
- [ ] Log in to your Supabase Project.
- [ ] Go to **Authentication > URL Configuration**.
- [ ] Update **Site URL** to `https://yourdomain.com`.
- [ ] Add `https://yourdomain.com/auth/callback` to **Redirect URIs**.
- [ ] If using **Google Auth**, update authorized redirect URIs in the Google Developer Console.

### Step 3: Server Preparation
- [ ] Provision a VPS (Ubuntu) or Cloud Hosting (Vercel/Railway).
- [ ] Install **Node.js v20+** and **npm**.
- [ ] (Optional) Install **PM2** for process management on VPS.
- [ ] Configure **Nginx** as a reverse proxy for port 3000 (default TanStack Start port).

### Step 4: Environment Variables
Configure the following secrets on your new host:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (Keep secure!)
- `STEADFAST_API_KEY` (If configured)
- `LOVABLE_API_KEY` (If using AI features)

### Step 5: Build & Deploy
- [ ] Run `npm install`.
- [ ] Run `npm run build`.
- [ ] Start the server (e.g., `npm run start` or `pm2 start ...`).

---

## 3. Hosting Requirements

### Absolute Minimum (Low Traffic)
- **CPU**: 1 vCPU (Shared)
- **RAM**: 1 GB
- **SSD**: 10 GB
- **OS**: Linux (Ubuntu 22.04+)
- **Software**: Node.js 20.x, Nginx

### Recommended for Production
- **CPU**: 2 vCPU (Dedicated)
- **RAM**: 4 GB
- **SSD**: 20 GB NVMe
- **Bandwidth**: 1 TB+
- **Backup**: Daily off-site backups of the database.

### Hosting Recommendation
- **Primary Choice**: **Vercel** (Best integration with TanStack Start, automatic scaling, easy deployment).
- **Secondary Choice**: **DigitalOcean VPS** (Best for cost control and custom server-side requirements like specific Node.js versions).

---

## 4. Final Confirmation
It is **realistically possible** to migrate this project today without architectural changes. The data integrity of orders, inventory, and users is guaranteed because the backend (Supabase) is independent of the hosting platform. 

**Critical Action Before Move:** Ensure you have the `SUPABASE_SERVICE_ROLE_KEY` saved, as you cannot view it again once the project is created in some managed environments.
