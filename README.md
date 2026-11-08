# Dim’s Challenge

Gamified social-courage trainer. React + TypeScript + Tailwind, bundled with esbuild into a single page. No backend: progress lives in the browser (LocalStorage, versioned schema).

## Commands

```sh
npm install
npm run build       # → dist/pwa/ (host this), dist/artifact.html, dist/index.html
npm run typecheck
npm run serve       # local test at http://localhost:8766
```

## Host the PWA (free)

`dist/pwa/` is a static folder. Any static host works; the service worker needs HTTPS, which all of these provide.

- **Netlify Drop** (no CLI): https://app.netlify.com/drop → drag the `dist/pwa` folder (or `dist/dims-challenge-pwa.zip`). You get a URL immediately; free account needed to keep it.
- **Vercel**: `npx vercel dist/pwa --prod`
- **GitHub Pages**: push `dist/pwa` contents to a `gh-pages` branch.

Then on your phone open the URL and install:

- **iPhone (Safari)**: Share → *Add to Home Screen*.
- **Android (Chrome)**: tap *Install app* in the Profile tab, or ⋮ → *Install app*.

Redeploying replaces the old version automatically: the service worker is versioned per build and reloads once the new one is active.

## Keeping progress safe

Progress is stored on the device. Profile → *Backup & restore* exports a JSON copy to the clipboard (and a download where allowed); *Restore* pastes one back. Do this before clearing browser data or switching phones.

## Layout

- `src/data/` challenges, quotes, achievements
- `src/lib/` date, storage (schema + migrations), progress (XP, levels, streaks, achievements), daily pick, backup
- `src/store.tsx` state, persistence, actions
- `src/screens/`, `src/components/` UI
- `public/` manifest, service worker, icons
- `build.mjs` bundles and writes `dist/`
