import { mkdir, writeFile } from 'node:fs/promises';

try {
  const { css, js, renderViewerHtml } = await import('@playcanvas/supersplat-viewer');
  const { defaultSettings } = await import('@playcanvas/supersplat-viewer/settings');

  const directory = new URL('../public/tour-viewer/', import.meta.url);
  await mkdir(directory, { recursive: true });
  await Promise.all([
    writeFile(new URL('index.html', directory), renderViewerHtml({
      bootstrap: { settings: defaultSettings() }
    })),
    writeFile(new URL('index.css', directory), css),
    writeFile(new URL('index.js', directory), js)
  ]);
  console.log('✅ Tour viewer built successfully.');
} catch (err) {
  console.warn('⚠️  Skipping tour viewer build:', err.message);
  // Not a fatal error — the rest of the build continues normally.
  process.exit(0);
}
