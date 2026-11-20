import type L from 'leaflet';

export const MAP_ZOOM_OPTIONS = {
  scrollWheelZoom: true,
  touchZoom: true,
  keyboard: true,
  zoomControl: false,
  minZoom: 3,
  maxZoom: 19,
  zoomSnap: .5,
  zoomDelta: .5,
  wheelPxPerZoomLevel: 80
} as const;

/** Keep desktop browser zoom gestures scoped to the map while it has focus. */
export function bindMapZoomGestures(map: L.Map): () => void {
  const container = map.getContainer();
  const onWheel = (event: WheelEvent) => {
    // Trackpad pinch emits Ctrl+wheel. Leaflet handles its scale change; prevent
    // the browser from also scaling the application. Ordinary wheel zoom is enabled.
    if (event.ctrlKey || event.metaKey) event.preventDefault();
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (!event.ctrlKey && !event.metaKey) return;
    if ((event.target as HTMLElement | null)?.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (!['+', '=', '-', '_'].includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.key === '+' || event.key === '=') map.zoomIn();
    else map.zoomOut();
  };
  container.addEventListener('wheel', onWheel, { passive: false, capture: true });
  container.addEventListener('keydown', onKeyDown, true);
  return () => {
    container.removeEventListener('wheel', onWheel, true);
    container.removeEventListener('keydown', onKeyDown, true);
  };
}
