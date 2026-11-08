import fs from 'fs';
import path from 'path';

const distDir = path.resolve(process.cwd(), 'dist');
const apkWebAssetsDir = path.resolve(process.cwd(), 'app/src/main/assets/web');

console.log('[Sync APK Assets] Starting asset synchronization...');

if (!fs.existsSync(distDir)) {
  console.error('[Sync APK Assets] ERROR: dist/ does not exist. Run "vite build" first.');
  process.exit(1);
}

// Ensure target directory exists
fs.mkdirSync(apkWebAssetsDir, { recursive: true });

// Copy all files recursively from dist/ to app/src/main/assets/web/
function copyDirRecursive(src: string, dest: string) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDirRecursive(distDir, apkWebAssetsDir);

// Verify and patch index.html in APK assets for Android WebView
const targetIndexHtml = path.join(apkWebAssetsDir, 'index.html');
if (fs.existsSync(targetIndexHtml)) {
  let content = fs.readFileSync(targetIndexHtml, 'utf8');
  
  // Ensure relative paths for file:///android_asset/
  content = content
    .replace(/src="\/assets\//g, 'src="./assets/')
    .replace(/href="\/assets\//g, 'href="./assets/')
    .replace(/href="\/manifest\.json"/g, 'href="./manifest.json"')
    .replace(/href="\/apple-touch-icon\.png"/g, 'href="./apple-touch-icon.png"')
    .replace(/href="\/icon\.svg"/g, 'href="./icon.svg"');

  // Strip type="module" and crossorigin to prevent WebView file:// CORS white-screen lockouts
  content = content
    .replace(/<script type="module" crossorigin src=/g, '<script defer src=')
    .replace(/<script type="module" src=/g, '<script defer src=')
    .replace(/ crossorigin/g, '');

  fs.writeFileSync(targetIndexHtml, content, 'utf8');
  console.log('[Sync APK Assets] index.html successfully sanitized for WebView (relative paths, no module CORS restrictions).');
}

const copiedFiles = fs.readdirSync(apkWebAssetsDir);
console.log(`[Sync APK Assets] Synchronization complete. ${copiedFiles.length} top-level items in app/src/main/assets/web/:`, copiedFiles);
