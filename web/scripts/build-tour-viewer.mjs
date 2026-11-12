import { mkdir, writeFile } from 'node:fs/promises';
import { css, js, renderViewerHtml } from '@playcanvas/supersplat-viewer';
import { defaultSettings } from '@playcanvas/supersplat-viewer/settings';

const directory = new URL('../public/tour-viewer/', import.meta.url);
await mkdir(directory, { recursive: true });
await Promise.all([
  writeFile(new URL('index.html', directory), renderViewerHtml({
    bootstrap: { settings: defaultSettings() }
  })),
  writeFile(new URL('index.css', directory), css),
  writeFile(new URL('index.js', directory), js)
]);
