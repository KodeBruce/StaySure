import L from 'leaflet';
import { WITS_CAMPUSES, WITS_MAP_SOURCE, type WitsCampus } from '../data/witsCampuses';

function campusPopup(campus: WitsCampus): HTMLElement {
  const content = document.createElement('div');
  content.className = 'wits-campus-popup';
  const title = document.createElement('strong');
  title.textContent = `Wits · ${campus.name}`;
  const area = document.createElement('span');
  area.textContent = campus.area;
  const streets = document.createElement('p');
  streets.textContent = `Surrounding streets: ${campus.streets.join(' · ')}`;
  const note = document.createElement('p');
  note.className = 'wits-campus-source-note';
  note.textContent = `Approximate campus grounds. ${campus.note}`;
  content.append(title, area, streets, note);
  for (const [text, url] of [['Official campus map', campus.officialMapUrl], ['OpenStreetMap boundary', campus.sourceUrl]]) {
    const link = document.createElement('a');
    link.href = url;
    link.textContent = `${text} ↗`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    content.append(link);
  }
  return content;
}

/** Dedicated layers keep campus outlines visible when accommodation filters change. */
export function addWitsCampusLayer(map: L.Map) {
  map.createPane('witsCampusGrounds').style.zIndex = '390';
  map.createPane('witsCampusNames').style.zIndex = '450';
  const group = L.layerGroup().addTo(map);
  const labels: L.Marker[] = [];
  let labelsEnabled = false;
  const labelAnchors: Record<string, [number, number]> = {
    east: [5, 18], west: [145, 18], education: [145, 46],
    health: [0, 42], management: [145, -12]
  };
  for (const campus of WITS_CAMPUSES) {
    const polygon = L.polygon(campus.outline, {
      pane: 'witsCampusGrounds', color: campus.color, weight: 1.75,
      fillColor: campus.color, fillOpacity: .14, smoothFactor: .5,
      interactive: false,
      attribution: `&copy; <a href="${WITS_MAP_SOURCE.licenseUrl}">OpenStreetMap</a> contributors`
    });
    group.addLayer(polygon);
    const label = document.createElement('span');
    label.className = `wits-campus-label wits-campus-label--${campus.id}`;
    label.style.setProperty('--campus-color', campus.color);
    const name = document.createElement('b');
    name.textContent = `Wits · ${campus.name}`;
    const area = document.createElement('small');
    area.textContent = campus.area;
    label.append(name, area);
    const marker = L.marker(campus.position, {
      pane: 'witsCampusNames', title: `Wits ${campus.name}, ${campus.area}`,
      alt: `Wits ${campus.name}`, keyboard: true,
      icon: L.divIcon({ className: 'wits-campus-label-shell', html: label, iconSize: [150, 36], iconAnchor: labelAnchors[campus.id] })
    }).bindPopup(campusPopup(campus), { maxWidth: 280 });
    labels.push(marker);
  }
  // Outside a Wits location search, show only the campus grounds at every zoom.
  const syncLabels = () => {
    const visible = labelsEnabled && map.getZoom() >= 12;
    labels.forEach(label => { if (visible) group.addLayer(label); else group.removeLayer(label); });
  };
  syncLabels();
  map.on('zoomend', syncLabels);
  return {
    setLabelsVisible(visible: boolean) {
      labelsEnabled = visible;
      syncLabels();
      if (!visible) labels.forEach(label => label.closePopup());
    },
    remove() { map.off('zoomend', syncLabels); group.remove(); }
  };
}
