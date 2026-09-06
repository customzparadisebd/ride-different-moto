# Hosting-Independent + Production-Portable Audit ও Fix

কোনো নতুন feature বানানো হবে না, design/UI বদলানো হবে না। শুধু hosting-নির্ভরতা ও asset/data নির্ভরতা সরানো হবে, তারপর পূর্ণ report + build/typecheck।

## যা যাচাই করে পাওয়া গেছে (এখনকার সত্যিকার অবস্থা)

সঠিক আছে:

- Supabase URL/key কোথাও hardcode করা নেই — client `VITE_SUPABASE_*` (SSR fallback `SUPABASE_*`), server `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`. Client ও server config আলাদা।
- Product fetch-এ `is_new_arrival` আছে এবং color fetch-এ `price_delta`, `swatch`, `image_url`, `linked_product_id` আছে — অর্থাৎ badge, swatch, color-price ও cart/checkout-এর data hosting বদলালে হারাবে না।
- Storefront query-তে error silently empty হয় না — error হলে throw হয়।
- কোডে আর কোনো Lovable `/__l5e/...` asset link নেই; logo, banner, 404 GIF, ৩টি animation video, ডেমো product ছবি সব project-এর ভিতরে (`src/assets`, `public/hero`, `public/products`)।

সমস্যা (hosting/environment-নির্ভর বা ভাঙা):

1. **Storage bucket নেই**: database-এ ১১টি bike model ছবি `bike-models` bucket-এ ও ১টি product ছবি `products` bucket-এ point করে, কিন্তু বর্তমানে শুধু `avatars` ও `logos` bucket আছে — তাই এই লিংকগুলো এখনই ভাঙা, এবং Admin থেকে product/hero/bike image upload করলেও bucket না থাকায় fail করবে।
2. **Hero slide-এ external ছবি**: ২টি Unsplash + ১টি ImgBB লিংক — তৃতীয় পক্ষের উপর নির্ভরতা।
3. **Netlify-only build target**: `DEPLOY_PRESET` শুধু `netlify.toml`-এ সেট; VPS/Node deploy-এর কোনো preset/ডকুমেন্টেশন নেই।
4. **Security header দুই জায়গায়**: `netlify.toml`-এ headers আছে, VPS-এ গেলে সেগুলো হারাবে (app-level `src/start.ts`-এ যা আছে তা থাকবে) — এটি ডকুমেন্ট করা দরকার।
5. `src/lib/images.functions.ts` ও `SafeImage` retry পথে `lovableproject.com` hardcoded এবং অস্তিত্বহীন `image-cache` bucket-এ list করে — Lovable-specific ও no-op।

## যা করব

### 1. Storage buckets ঠিক করা (data/asset কাজ করার জন্য বাধ্যতামূলক)

- Migration/bucket tool দিয়ে তৈরি: `products`, `hero`, `hero-banners`, `bike-models` (public, 2MB limit) — `avatars`/`logos` আগের মতোই private থাকবে।
- storage.objects-এর RLS: public bucket-এ শুধু anon **read**, আর write/update/delete শুধু staff (`is_staff`) — বর্তমান নিরাপত্তা কমানো হবে না, শুধু নতুন bucket-এর জন্য policy যোগ।
- যেসব ছবি bucket না থাকায় ভাঙা (১১ bike model + ১ product), সেই ফাইলগুলো পুরনো storage থেকে পাওয়া গেলে নতুন bucket-এ re-upload; না পাওয়া গেলে report-এ তালিকা দেব যাতে Admin থেকে re-upload করা যায় (ডেটা মুছব না)।

### 2. External media local/self-hosted করা

- ২টি Unsplash + ১টি ImgBB hero ছবি ডাউনলোড করে `hero` bucket-এ তোলা হবে (সম্ভব না হলে `public/hero/`), এরপর DB URL rewrite। যেগুলো 404 দেয় সেগুলো report-এ "Admin → Hero থেকে নতুন ছবি দিন" হিসেবে লিখব।

### 3. Hosting-independent করা

- `DEPLOY_PRESET` env থেকে পড়া হয়েই আছে; `node-server` preset দিয়ে VPS build-এর জন্য শুধু ডকুমেন্টেশন + npm script যোগ (কোনো logic পরিবর্তন নয়)।
- `src/start.ts`-এর security header middleware-ই একমাত্র hosting-নিরপেক্ষ source of truth — `netlify.toml` অপরিবর্তিত থাকবে, শুধু ডকুমেন্টে বলা হবে VPS-এ reverse proxy-তে কী লাগবে।
- `images.functions.ts`-এর `lovableproject.com` ও অস্তিত্বহীন `image-cache` নির্ভরতা সরিয়ে নিরাপদ no-op/Storage-only পথ রাখা হবে (UI ও retry behaviour অপরিবর্তিত)।

### 4. Asset ও data verification

- সব local asset import build-এ bundle হচ্ছে কি না যাচাই (fresh `dist` inspect)।
- `supabase/migration-export/02_data.sql`-এ যে কয়টি পুরনো Lovable/old-project URL আছে সেগুলো নতুন path-এ সংশোধন, যাতে নতুন Supabase-এ import করলেও ছবি ঠিক থাকে।
- Product page-এ badge, color swatch, price delta, cart→checkout flow browser দিয়ে একবার চালিয়ে দেখা।

### 5. Report + verification

`DEVELOPER_NOTES.md`-এ এন্ট্রি এবং চ্যাটে A–G রিপোর্ট: (A) ঠিক আছে, (B) hosting-নির্ভর ছিল, (C) local করা হয়েছে, (D) এখনো external/dynamic, (E) প্রয়োজনীয় env variable, (F) বাকি manual কাজ, (G) build ফল। শেষে typecheck + production build চালানো হবে।

## Environment variables (VPS/অন্য server)

`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only), ঐচ্ছিক `LOVABLE_API_KEY`, `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS`, এবং build-time `DEPLOY_PRESET` (`netlify` বা `node-server`)।

## Technical notes

- ফাইল: `src/lib/images.functions.ts`, `src/components/SafeImage.tsx` (retry গার্ড শুধু), `supabase/migration-export/02_data.sql` + `README.md`, `ENV_TEMPLATE.md`, `05_storage.md`, `DEVELOPER_NOTES.md`, `package.json` (একটি build script)।
- Database: শুধু নতুন bucket + storage policy, এবং hero/bike/product image_url rewrite। কোনো টেবিলের RLS দুর্বল করা হবে না, schema পরিবর্তন নেই।
