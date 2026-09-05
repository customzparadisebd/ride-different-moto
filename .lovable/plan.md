# Assets Audit রিপোর্ট — CUSTOMZ PARADISE BD

কোনো Code বা Design পরিবর্তন করা হয়নি। নিচে শুধু অডিটের ফল ও করণীয়।

## 1) ZIP-এর ভিতরে সত্যিই থাকছে (Local, Build-এ bundle হয়)

`public/` — favicon.png, robots.txt
`src/assets/` (আসল ছবি ফাইল হিসেবে আছে): hero-duke-250.jpg, hero-pulsar-n160.jpg, hero-r15-v4.jpg, model-mt15.jpg, model-ns200.jpg, model-pulsar-n250.jpg, product-crashguard.jpg, product-exhaust.jpg, product-foglight.jpg, product-grips.jpg, product-indicators.jpg, product-mirrors.jpg, product-tankpad.jpg

এগুলো ZIP-এ আসে এবং Netlify-তে অটোমেটিক কাজ করবে।

## 2) Lovable CDN থেকে Load হয় (ZIP-এ শুধু pointer আসে, আসল ফাইল নয়)

`src/assets/*.asset.json` — ভিতরে শুধু `/__l5e/assets-v1/...` লিংক থাকে, ছবি/ভিডিও নয়:

| Asset | কোথায় ব্যবহার |
| --- | --- |
| brand-logo-main.png, czp-logo.png, czp-logo-3d.png, logo-dark-bg.png, logo-light-bg.png | Logo (Header/Footer/Admin Sidebar/Login) |
| banner-perfect-price.png, banner-perfect-price-v2.png, hero-mobile.png, hero-mobile-v2.png | হোম ব্যানার/হিরো |
| 404-error.gif | 404 পেজ |
| login-animation.mp4, order-confirmation-anim.mp4, order-success-ref.mp4 | Admin login ও অর্ডার সাকসেস অ্যানিমেশন |
| product-*.jpg.asset.json (7টি) | ডেমো প্রোডাক্ট (এদের local jpg-ও আছে) |

এছাড়া `src/lib/hero-restore.server.ts`-এ ২টি hard-coded `/__l5e/assets-v1/...` hero URL আছে (hero-desktop.webp, hero-mobile.webp) — এদের কোনো local কপিও নেই।

ঝুঁকি: `/__l5e/...` পাথ Lovable hosting-এর সার্ভিস। নিজের Netlify ডোমেইনে এই পাথ resolve হবে না → Logo/ব্যানার/অ্যানিমেশন ভাঙবে। **এগুলো Migration করা সম্ভব** (নিচের ধাপ দেখুন)।

## 3) Database-এ রাখা External Image URL (ZIP-এর বিষয় নয়, ডেটার বিষয়)

- Lovable Cloud Storage (`pqphihorljepzfdacant.supabase.co/storage/...`): ২৩টি রেকর্ড (products, bike_models, hero_slides, product_colors)। নতুন Supabase-এ গেলে ফাইল কপি + URL rewrite লাগবে (`supabase/migration-export/05_storage.md`-এ ধাপ আছে)।
- `i.ibb.co.com` (ImgBB) হোস্টে ১৬টি ছবি এবং Unsplash-এ ২টি — এগুলো তৃতীয় পক্ষের ফ্রি হোস্ট, যেকোনো সময় হারাতে পারে।
- `site_logos` টেবিলের ৯টি সারিতে url ফাঁকা (NULL) — অর্থাৎ লোগো এখন কোড-বান্ডেল/CDN থেকেই আসছে।
- Steadfast-এর লোগো Admin UI-তে সরাসরি steadfast.com.bd থেকে লোড হয় (শুধু Admin, ঝুঁকি কম)।

## 4) Migration/Backup-এর করণীয় (আপনার অনুমোদন পেলে করব)

1. উপরের ১৮টি `.asset.json` (লোগো, ব্যানার, GIF, ৩টি ভিডিও) CDN থেকে ডাউনলোড করে `src/assets/` ও `public/` -এ আসল ফাইল হিসেবে রাখা, এবং import গুলো সাধারণ Vite import-এ বদলানো — তখন ZIP-এই সব থাকবে।
2. `hero-restore.server.ts`-এর ২টি hard-coded CDN URL local/Storage ফাইলে বদলানো।
3. ImgBB ও Unsplash-এর ১৮টি ছবি নিজের Storage বাকেটে তুলে DB URL rewrite করা (যেন তৃতীয় পক্ষের উপর নির্ভরতা না থাকে)।
4. নতুন Supabase-এ গেলে: `products`, `hero`, `hero-banners`, `bike-models` বাকেট তৈরি (Public) + `avatars`, `logos` (Private), ফাইল কপি, তারপর URL rewrite।
5. শেষে production build + Netlify preview-তে সব ছবি/অ্যানিমেশন যাচাই।

## এখনকার সরল উত্তর

শুধু ZIP → GitHub → Netlify করলে **সব Asset কাজ করবে না**: ১৮টি CDN-নির্ভর ফাইল (মূল লোগোসহ) এবং DB-তে রাখা ছবি বাদ পড়বে। ধাপ ১–২ করলেই লোগো/ব্যানার/অ্যানিমেশন ZIP-এর ভিতরেই চলে আসবে; ধাপ ৩–৪ ডেটার ছবিগুলো নিরাপদ করবে।
