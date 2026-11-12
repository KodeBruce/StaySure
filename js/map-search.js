(function () {
  'use strict';

  const centres = {
    Braamfontein: [-26.1917, 28.0322], Parktown: [-26.1816, 28.0401],
    Milpark: [-26.1808, 28.0143], 'Auckland Park': [-26.1817, 28.0045],
    Melville: [-26.1763, 28.0091], Berea: [-26.1900, 28.0527],
    Rosebank: [-26.1466, 28.0418], Westdene: [-26.1759, 27.9941]
  };
  const universities = [
    { id: 'wits', name: 'University of the Witwatersrand', province: 'Gauteng', position: [-26.1929, 28.0305] },
    { id: 'uj', name: 'University of Johannesburg', province: 'Gauteng', position: [-26.1826, 28.0005] }
  ];
  const provinces = ['Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape'];
  const provinceCentres = {
    'Eastern Cape': [-32.849, 27.442], 'Free State': [-29.085, 26.159], Gauteng: [-26.193, 28.031],
    'KwaZulu-Natal': [-29.858, 31.022], Limpopo: [-23.904, 29.469], Mpumalanga: [-25.474, 30.970],
    'North West': [-25.865, 25.644], 'Northern Cape': [-28.728, 24.749], 'Western Cape': [-33.925, 18.424]
  };
  const state = { province: 'Gauteng', university: 'wits', nearby: false, position: null, accuracy: 0, radius: 5, bounds: null, pendingBounds: null, message: '' };

  function position(property) {
    return Number.isFinite(property.latitude) && Number.isFinite(property.longitude)
      ? [property.latitude, property.longitude]
      : centres[property.area] || null;
  }

  function distance(a, b) {
    const rad = function (v) { return v * Math.PI / 180; };
    const lat = rad(b[0] - a[0]);
    const lng = rad(b[1] - a[1]);
    const term = Math.sin(lat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(lng / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(term), Math.sqrt(1 - term));
  }

  function distanceBand(km) {
    return km <= 1 ? 'u1' : km <= 2 ? 'd12' : km <= 5 ? 'd25' : 'd5';
  }

  function matches(property) {
    const point = position(property);
    if (state.bounds && (!point || point[0] < state.bounds.south || point[0] > state.bounds.north || point[1] < state.bounds.west || point[1] > state.bounds.east)) return false;
    if (state.province && (property.province || (centres[property.area] ? 'Gauteng' : '')) !== state.province) return false;
    const campus = universities.find(function (item) { return item.id === state.university; });
    if (campus && point && distance(point, campus.position) > 12) return false;
    if (state.nearby && state.position && (!point || distance(point, state.position) > state.radius)) return false;
    return true;
  }

  function locate(done) {
    if (!navigator.geolocation) {
      state.message = 'Location is unavailable. Choose a province or area instead.';
      done(false);
      return;
    }
    state.message = 'Finding your location…';
    navigator.geolocation.getCurrentPosition(function (result) {
      state.position = [result.coords.latitude, result.coords.longitude];
      state.accuracy = result.coords.accuracy;
      state.province = '';
      state.university = '';
      state.nearby = true;
      state.bounds = null;
      state.pendingBounds = null;
      state.message = 'Showing approximate straight-line distances from your location.';
      done(true);
    }, function () {
      state.message = 'Location unavailable. You can still search by province, university or area.';
      done(false);
    }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
  }

  function mount(element, items, onSelect) {
    if (!element || !window.L) return;
    if (window._ssMapInstance) window._ssMapInstance.remove();
    const campus = universities.find(function (item) { return item.id === state.university; });
    const center = state.nearby && state.position ? state.position : campus ? campus.position : provinceCentres[state.province] || centres.Braamfontein;
    const map = L.map(element, { scrollWheelZoom: false }).setView(center, state.nearby ? 13 : 12);
    if (state.bounds) map.fitBounds([[state.bounds.south, state.bounds.west], [state.bounds.north, state.bounds.east]]);
    window._ssMapInstance = map;
    const markers = {};
    map.on('dragend zoomend', function () {
      const bounds = map.getBounds();
      state.pendingBounds = { south: bounds.getSouth(), west: bounds.getWest(), north: bounds.getNorth(), east: bounds.getEast() };
      const button = element.parentElement.querySelector('[data-search-map-area]');
      if (button) button.hidden = false;
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    items.forEach(function (item) {
      const property = item.p;
      const point = position(property);
      if (!point) return;
      const icon = L.divIcon({ className: 'accom-map-pin-shell', html: '<span class="accom-map-pin"><span aria-hidden="true">⌂</span> ' + window.SSData.rand(property.price) + '</span>', iconSize: [106, 38], iconAnchor: [53, 38] });
      const marker = L.marker(point, { icon: icon, title: property.name }).addTo(map);
      markers[property.id] = marker;
      const popup = document.createElement('div');
      popup.className = 'accom-map-popup';
      const title = document.createElement('strong');
      title.textContent = property.name;
      const detail = document.createElement('span');
      detail.textContent = property.area + ' · ' + window.SSData.rand(property.price) + '/month';
      const note = document.createElement('small');
      note.textContent = Number.isFinite(property.latitude) ? 'Listing location' : 'Approximate area location';
      popup.append(title, detail, note);
      marker.bindPopup(popup);
      marker.on('click', function () {
        focus(property.id, false, true);
        if (onSelect) { onSelect(property.id); }
      });
    });

    if (state.nearby && state.position) {
      L.circle(state.position, { radius: state.radius * 1000, color: '#1f9d5c', fillColor: '#1f9d5c', fillOpacity: 0.08, weight: 2 }).addTo(map);
      L.circle(state.position, { radius: state.accuracy, color: '#1f9d5c', fillColor: '#1f9d5c', fillOpacity: 0.14, weight: 1.5 }).addTo(map);
      L.circleMarker(state.position, { radius: 8, color: '#fff', weight: 3, fillColor: '#1f9d5c', fillOpacity: 1 }).bindTooltip('Your location').addTo(map);
    }
    window.setTimeout(function () { map.invalidateSize(); }, 0);
    window._ssMapMarkers = markers;
    return map;
  }

  function focus(id, scroll, showPopup) {
    const marker = window._ssMapMarkers && window._ssMapMarkers[id];
    if (!marker || !window._ssMapInstance) return;

    // Toggle green selected glow on all pins
    if (window._ssMapMarkers) {
      Object.keys(window._ssMapMarkers).forEach(function (k) {
        const m = window._ssMapMarkers[k];
        const el = m && m.getElement && m.getElement();
        if (el) {
          const pin = el.querySelector('.accom-map-pin');
          if (pin) pin.classList.toggle('is-selected', k === id);
          if (k === id) {
            m.setZIndexOffset(1000);
          } else {
            m.setZIndexOffset(0);
          }
        }
      });
    }

    // Toggle green selected border/glow on all carousel cards
    const cards = document.querySelectorAll('[data-map-card]');
    cards.forEach(function (c) {
      c.classList.toggle('is-selected', c.getAttribute('data-map-card') === id);
    });

    window._ssMapInstance.panTo(marker.getLatLng());
    if (showPopup !== false) marker.openPopup();
    const element = document.getElementById('accommodation-map');
    if (scroll !== false && element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  window.SSMap = { centres: centres, universities: universities, provinces: provinces, state: state, position: position, distance: distance, distanceBand: distanceBand, matches: matches, locate: locate, mount: mount, focus: focus };
})();
