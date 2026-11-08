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

// Verify index.html in APK assets
const targetIndexHtml = path.join(apkWebAssetsDir, 'index.html');
if (fs.existsSync(targetIndexHtml)) {
  const content = fs.readFileSync(targetIndexHtml, 'utf8');
  if (content.includes('src="./assets/') || content.includes('href="./assets/')) {
    console.log('[Sync APK Assets] SUCCESS: index.html has relative asset paths verified for Android WebView.');
  } else if (content.includes('src="/assets/')) {
    console.warn('[Sync APK Assets] WARNING: Converting absolute paths to relative paths in index.html...');
    const fixed = content
      .replace(/src="\/assets\//g, 'src="./assets/')
      .replace(/href="\/assets\//g, 'href="./assets/')
      .replace(/href="\/manifest\.json"/g, 'href="./manifest.json"')
      .replace(/href="\/apple-touch-icon\.png"/g, 'href="./apple-touch-icon.png"')
      .replace(/href="\/icon\.svg"/g, 'href="./icon.svg"');
    fs.writeFileSync(targetIndexHtml, fixed, 'utf8');
    console.log('[Sync APK Assets] index.html successfully patched to relative paths.');
  }
}

const copiedFiles = fs.readdirSync(apkWebAssetsDir);
console.log(`[Sync APK Assets] Synchronization complete. ${copiedFiles.length} top-level items in app/src/main/assets/web/:`, copiedFiles);
