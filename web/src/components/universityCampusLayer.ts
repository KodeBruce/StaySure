import L from 'leaflet';
import data from '../data/universityCampuses.json';
import type { Coordinates } from '../data/mapLocations';

/** Sourced university grounds stay below residence pins and never intercept taps. */
export function addUniversityCampusLayer(map: L.Map) {
  map.createPane('universityCampusGrounds').style.zIndex = '390';
  const group = L.layerGroup().addTo(map);
  for (const campus of data.campuses) {
    L.polygon(campus.outlines.map(outline => [outline]) as Coordinates[][][], {
      pane: 'universityCampusGrounds', color: campus.color, weight: 2,
      fillColor: campus.color, fillOpacity: .14, smoothFactor: .5,
      interactive: false,
      attribution: `&copy; <a href="${data.source.licenseUrl}">OpenStreetMap</a> contributors`
    }).addTo(group);
  }
  return { remove() { group.remove(); } };
}
