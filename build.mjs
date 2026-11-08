import { build } from 'esbuild';
import { execSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

mkdirSync('dist', { recursive: true });

const js = await build({
  entryPoints: ['src/main.tsx'],
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['es2020'],
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"production"' },
  write: false,
  legalComments: 'none',
});
let script = js.outputFiles[0].text.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');

execSync('npx tailwindcss -c tailwind.config.js -i src/styles.css -o dist/styles.css --minify', { stdio: 'inherit' });
const css = readFileSync('dist/styles.css', 'utf8').replace(/<\/style/gi, '<\\/style');

const head = `<title>Dim’s Challenge — Social Courage RPG</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@600;700;800&display=swap">
<style>${css}</style>`;
const body = `<div id="root"></div>
<script>${script}</script>`;

// Fragment for the Artifact tool (it supplies doctype/head/body).
writeFileSync('dist/artifact.html', `${head}\n${body}\n`);
// Standalone page for local testing.
writeFileSync('dist/index.html', `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n${head}\n</head><body>\n${body}\n</body></html>\n`);

// ── PWA bundle: dist/pwa is the folder to host ──
const buildId = createHash('sha1').update(script + css).digest('hex').slice(0, 10);
mkdirSync('dist/pwa/icons', { recursive: true });
cpSync('public/icons', 'dist/pwa/icons', { recursive: true });
cpSync('public/manifest.webmanifest', 'dist/pwa/manifest.webmanifest');
writeFileSync('dist/pwa/sw.js', readFileSync('public/sw.js', 'utf8').replace('__BUILD__', buildId));
const pwaHead = `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Dim’s Challenge</title>
<meta name="description" content="Get uncomfortable. Become unstoppable. Daily real-world social courage missions.">
<meta name="theme-color" content="#0E0E1E" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="#F9F7F4" media="(prefers-color-scheme: light)">
<meta name="application-name" content="Dim’s Challenge">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Dim’s">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" sizes="192x192" href="icons/icon-192.png">
<link rel="apple-touch-icon" sizes="180x180" href="icons/icon-180.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@600;700;800&display=swap">
<style>html{padding-top:env(safe-area-inset-top,0px)}</style>
<style>${css}</style>`;
const pwaBody = `<div id="root"></div>
<script>${script}</script>
<script>
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').then((reg) => {
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) sw.postMessage('SKIP_WAITING');
        });
      });
    }).catch(() => {});
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (!reloaded) { reloaded = true; location.reload(); } });
  });
}
</script>`;
writeFileSync('dist/pwa/index.html', `<!doctype html>\n<html lang="en"><head>\n${pwaHead}\n</head><body>\n${pwaBody}\n</body></html>\n`);
console.log(`pwa build ${buildId} → dist/pwa/`);

const kb = (s) => `${(Buffer.byteLength(s) / 1024).toFixed(0)} KB`;
console.log(`js ${kb(script)} · css ${kb(css)} · artifact ${kb(head + body)}`);
