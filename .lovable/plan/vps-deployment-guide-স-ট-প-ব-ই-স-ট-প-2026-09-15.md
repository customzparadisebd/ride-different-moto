# VPS Deployment Guide — স্টেপ-বাই-স্টেপ

লক্ষ্য: Netlify ছাড়া নিজের VPS-এ (Ubuntu/Debian) সাইট চালানোর জন্য পরিষ্কার নির্দেশনা, একটি রেডি স্টার্ট স্ক্রিপ্ট, এবং env সেট করার বিস্তারিত ধাপ। কোনো ফিচার, ডিজাইন বা ব্যাকএন্ড লজিক বদলাবে না — শুধু ডকুমেন্ট + ডিপ্লয় হেল্পার ফাইল যোগ হবে।

## যা তৈরি হবে

1. `VPS_DEPLOYMENT.md` — বাংলায় সম্পূর্ণ গাইড:
   - সার্ভার প্রস্তুতি (Node 22 ইনস্টল, ইউজার, ফোল্ডার)
   - কোড আনা (GitHub clone / ZIP আপলোড)
   - `.env` ফাইল তৈরি ও প্রতিটি ভ্যারিয়েবলের মান কোথা থেকে পাওয়া যাবে
   - বিল্ড: `npm ci` → `npm run build:node`
   - চালানো: `npm run start:node` (পোর্ট ৩০০০)
   - systemd দিয়ে ২৪/৭ চালু রাখা + রিবুটে অটো-স্টার্ট
   - nginx রিভার্স প্রক্সি + HTTPS (Certbot), `X-Forwarded-For`/`X-Forwarded-Proto` ফরওয়ার্ড
   - আপডেট/রিডিপ্লয়ের ধাপ, লগ দেখা, রোলব্যাক
   - সমস্যা সমাধান (৫০২, পেজ 404, ছবি না দেখা, env ভুল)

2. `deploy/start.sh` — এক কমান্ডে ডিপ্লয় স্ক্রিপ্ট: `.env` লোড, প্রয়োজনীয় ভ্যারিয়েবল আছে কিনা যাচাই (না থাকলে কোনটি নেই তা নাম ধরে বলবে), `npm ci`, `npm run build:node`, তারপর সার্ভার চালু।

3. `deploy/czp.service` — কপি-পেস্ট করার মতো systemd ইউনিট ফাইল (পাথ/ইউজার প্লেসহোল্ডারসহ, `EnvironmentFile=` দিয়ে `.env` পড়বে)।

4. `deploy/nginx.conf.example` — ডোমেইনের জন্য রিভার্স প্রক্সি স্যাম্পল।

5. `.env.example` — সব ভ্যারিয়েবলের নাম ও কমেন্ট, কোনো আসল মান ছাড়া।

6. `DEVELOPER_NOTES.md`-এ ছোট একটি এন্ট্রি (নতুন গাইড যোগ হয়েছে)।

## env ভ্যারিয়েবল যা গাইডে থাকবে

- ক্লায়েন্ট (বিল্ড টাইমে ইনলাইন হয়, বদলালে আবার বিল্ড লাগবে): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`
- সার্ভার: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (গোপন, বাধ্যতামূলক — এটি ছাড়া অ্যাডমিন প্যানেলের অনেক কাজ চলবে না)
- ঐচ্ছিক: `LOVABLE_API_KEY`, `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS`, `PORT`
- বিল্ড টার্গেট: `DEPLOY_PRESET=node-server` (`build:node` স্ক্রিপ্টেই সেট আছে)

`.env` ফাইলের পারমিশন `chmod 600`, এবং git-এ কমিট না করার নির্দেশ থাকবে।

## টেকনিক্যাল নোট

- `npm run build:node` নাইট্রোর `node-server` প্রিসেটে `.output/server/index.mjs` তৈরি করে; `npm run start:node` সেটাই চালায়। কোনো স্ক্রিপ্ট পরিবর্তন লাগবে না।
- আপলোড করা ছবি `/api/public/media/...` দিয়ে অ্যাপ নিজেই সার্ভ করে, তাই CDN বা পাবলিক বাকেট সেটিং দরকার নেই।
- এই স্যান্ডবক্স সবসময় Cloudflare প্রিসেট ফোর্স করে, তাই node বিল্ড শুধু আসল VPS/CI-তেই যাচাই করা যায়; স্ক্রিপ্ট ও কনফিগ পাথ যাচাই করা হবে (shell syntax check + typecheck)।
- ভেরিফিকেশন: `bash -n deploy/start.sh` এবং `npm run typecheck`। অ্যাপ কোডে কোনো পরিবর্তন নেই।
