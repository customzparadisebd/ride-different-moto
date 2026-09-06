# Hosting-Independent + Production-Portable Audit ও Fix (আপডেট)

কোনো নতুন feature বানানো হবে না, design/UI বদলানো হবে না। শুধু hosting-নির্ভরতা, asset ও storage নির্ভরতা ঠিক করা হবে, তারপর A–G report + typecheck/build।

## নতুন যাচাইকৃত তথ্য (আগের প্ল্যানের পর যা বেরিয়ে এল)

- `products`, `bike-models`, `hero`, `hero-banners` — চারটি bucket তৈরি করা হয়েছে, তবে **Workspace policy public bucket ব্লক করছে** (`public_buckets_blocked`), তাই আপাতত সবগুলো **private**।
- Storage-এ আসলে কোনো ফাইলই নেই (`storage.objects`-এ শুধু ১টি avatar)। database-এর ১১টি bike-model ও ১টি product ছবির URL সরাসরি যাচাই করে **HTTP 400 (object missing)** পাওয়া গেছে — অর্থাৎ এই ছবিগুলো এখনই ভাঙা, hosting বদলানোর কারণে নয়।
- Local কপি আছে মাত্র ৩টি bike model-এর (`/media/mt15.jpg`, `/media/ns200.jpg`, `/media/pulsar-n250.jpg`) — বাকি ১১টির কোনো কপি project-এ বা storage-এ নেই।
- Hero slide-এ ২টি Unsplash + ১টি ImgBB external লিংক এখনো আছে।

## সিদ্ধান্ত দরকার (একটি বেছে দিন)

**Option 1 (সুপারিশ):** আপনি Workspace Settings → Privacy & Security থেকে public bucket অনুমতি চালু করবেন। তারপর আমি চারটি bucket public করে দেব — বর্তমান কোড (`getPublicUrl`) ও Admin upload কোনো পরিবর্তন ছাড়াই কাজ করবে, VPS/Netlify যেকোনো হোস্টে একইভাবে চলবে।

**Option 2:** Public bucket চালু করা যাবে না — তখন ছবি দেখানোর জন্য signed-URL পথ লাগবে, অর্থাৎ image URL তৈরির জায়গায় (Admin upload + storefront read) কোড পরিবর্তন করতে হবে। এটি বেশি কাজ ও প্রতি ছবিতে expiry নির্ভরতা আনে।

আপনি না জানানো পর্যন্ত আমি Option 1 ধরে এগোব এবং bucket public করার ধাপটি আপনার অনুমতির অপেক্ষায় রাখব।

## যা আগে থেকেই সঠিক (verify করা হয়েছে)

- Supabase URL/key কোথাও hardcode নেই — client `VITE_SUPABASE_*` (SSR fallback `SUPABASE_*`), server `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`; client ও server config আলাদা।
- `is_new_arrival`, এবং color-এর `price_delta`, `swatch`, `image_url`, `linked_product_id` — সবই fetch column list-এ আছে, তাই badge/swatch/color-price/cart→checkout hosting বদলালেও হারাবে না।
- Storefront query error silently empty হয় না — throw করে।
- কোডে আর কোনো Lovable `/__l5e/...` লিংক নেই; logo, banner, 404 GIF, ৩টি animation video, ডেমো product ছবি project-এর ভিতরেই আছে।

## যা করব

### 1. Storage ঠিক করা
- Option 1 অনুমোদিত হলে চারটি bucket public করা।
- `storage.objects`-এ policy: এই bucket-গুলোতে read সবার জন্য, আর upload/update/delete শুধু staff (`is_staff`) — বিদ্যমান কোনো policy দুর্বল করা হবে না।
- ভাঙা ১১টি bike-model + ১টি product ছবির তালিকা report-এ দেব (ডেটা মুছব না) যাতে Admin → Bike Models / Products থেকে re-upload করা যায়; যেগুলোর local কপি আছে সেগুলোর URL local path-এ ঠিক করে দেব।

### 2. External media সরানো
- ২টি Unsplash + ১টি ImgBB hero ছবি ডাউনলোড করে project-এর `public/hero/`-এ রেখে DB URL rewrite (bucket-নির্ভরতা ছাড়াই কাজ করবে)। ডাউনলোডে 404 হলে report-এ "Admin → Hero থেকে নতুন ছবি দিন" লিখব।

### 3. Hosting-independent করা
- VPS/Node deploy-এর জন্য `DEPLOY_PRESET=node-server` build script + ডকুমেন্টেশন (কোনো logic পরিবর্তন নয়); `netlify.toml` অপরিবর্তিত থাকবে, এবং VPS-এ reverse proxy-তে কোন header দরকার তা ডকুমেন্টে থাকবে (app-level header middleware আগেই আছে)।
- `src/lib/images.functions.ts` ও `SafeImage`-এর retry পথ থেকে `lovableproject.com` hardcode ও অস্তিত্বহীন `image-cache` bucket নির্ভরতা সরানো (UI/behaviour অপরিবর্তিত)।

### 4. Asset ও data verification
- Production build করে `dist`-এ সব local asset bundle হচ্ছে কি না যাচাই।
- `supabase/migration-export/02_data.sql`-এ পুরনো Lovable/old-project URL গুলো নতুন path-এ সংশোধন।
- Product page-এ badge, swatch, price delta, cart→checkout একবার browser-এ চালিয়ে দেখা।

### 5. Report + verify
`DEVELOPER_NOTES.md`-এ এন্ট্রি এবং চ্যাটে A–G রিপোর্ট, শেষে typecheck + production build।

## Environment variables (VPS/অন্য server)

`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only), ঐচ্ছিক `LOVABLE_API_KEY`, `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS`, build-time `DEPLOY_PRESET` (`netlify` বা `node-server`)।

## Technical notes

- ফাইল: `src/lib/images.functions.ts`, `src/components/SafeImage.tsx` (retry গার্ড), `supabase/migration-export/02_data.sql` + `README.md`, `ENV_TEMPLATE.md`, `05_storage.md`, `DEVELOPER_NOTES.md`, `package.json` (build script), `public/hero/` (৩টি নতুন local ছবি)।
- Database: শুধু storage policy + hero/bike ছবির URL rewrite। schema পরিবর্তন নেই, কোনো টেবিলের RLS দুর্বল করা হবে না।
