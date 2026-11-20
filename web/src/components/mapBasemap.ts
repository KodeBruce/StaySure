import L from 'leaflet';

export type MapView = 'street' | 'aerial';

/** Swap only the tiles, retaining the map camera, campus grounds and price pins. */
export function addMapBasemap(map: L.Map) {
  const layers = {
    street: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }),
    aerial: L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Imagery &copy; <a href="https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9">Esri</a>, Vantor, Earthstar Geographics, and the GIS User Community',
      maxZoom: 19
    })
  };
  let current: MapView = 'street';
  layers[current].addTo(map);
  return {
    setView(view: MapView) {
      if (view === current) return;
      layers[view].addTo(map);
      layers[current].remove();
      current = view;
    },
    remove() { layers.street.remove(); layers.aerial.remove(); }
  };
}
