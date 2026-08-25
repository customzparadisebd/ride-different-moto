// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Deploy target. Left unset (Lovable), the plugin keeps its Cloudflare default.
// Netlify sets DEPLOY_PRESET=netlify so nitro emits a Netlify SSR function
// instead of a Cloudflare worker. See netlify.toml.
const deployPreset = process.env["DEPLOY_PRESET"]?.trim();

export default defineConfig({
  ...(deployPreset ? { nitro: { preset: deployPreset } } : {}),
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },

  vite: {
    build: {
      sourcemap: false, // Security: Disable production sourcemaps
      minify: "terser", // Ensure deep minification
      cssMinify: true,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes("node_modules")) {
              if (id.includes("react")) return "vendor-react";
              if (id.includes("@tanstack")) return "vendor-tanstack";
              return "vendor";
            }
            return undefined;
          },
        },
      },
    },
  },
});
