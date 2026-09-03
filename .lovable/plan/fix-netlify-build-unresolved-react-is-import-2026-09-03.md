# Fix Netlify build: unresolved `react-is` import

## Cause (verified)

`recharts@3.10.1` imports `react-is` in `recharts/es6/util/ReactUtils.js`, but does not
declare `react-is` in its own dependencies. Locally it only resolves because another
package pulled in `react-is@18.3.1` transitively. On the Netlify production build the
Rolldown bundler cannot resolve it, so the build fails.

## Change

One dependency addition, nothing else:

- Add `"react-is": "^19.2.0"` to `dependencies` in `package.json` (matches the project's
  React 19.2 line; `isFragment`, the only API recharts uses, is present).
- Install so `bun.lock` / `package-lock.json` record the direct dependency.

## Verification

- Run a production build and confirm it completes with no `Rolldown failed to resolve
  import "react-is"` error and the prerender step succeeds.

No application code, Supabase config, Netlify config, UI, or other dependency versions
are touched.
