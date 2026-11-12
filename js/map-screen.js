(function () {
  'use strict';

  const D = window.SSData;
  const S = window.SS;
  const M = window.SSMap;

  function getResults() {
    const filters = S.state.filters;
    const campus = M.universities.find(function (item) { return item.id === M.state.university; });
    const origin = M.state.nearby ? M.state.position : campus ? campus.position : null;
    const baseFilters = Object.assign({}, filters, { dist: [] });
    const list = D.applyFilters(baseFilters, S.state.profile).filter(function (item) {
      if (!M.matches(item.p)) return false;
      if (!filters.dist.length || !origin) return true;
      const point = M.position(item.p);
      return point && filters.dist.indexOf(M.distanceBand(M.distance(point, origin))) > -1;
    });
    if (origin && (M.state.nearby || filters.sort === 'distance')) list.sort(function (a, b) {
      return M.distance(M.position(a.p), origin) - M.distance(M.position(b.p), origin);
    });
    return list;
  }

  function option(value, label, selected) {
    return '<option value="' + S.esc(value) + '"' + (selected === value ? ' selected' : '') + '>' + S.esc(label) + '</option>';
  }

  function mapScreen() {
    const list = getResults();
    const filters = S.state.filters;
    const province = M.state.province;
    const university = M.state.university;
    const areas = D.AREAS.filter(function (area) { return !province || province === 'Gauteng' && M.centres[area]; });
    const cards = list.map(function (item) {
      const property = item.p;
      const point = M.position(property);
      const fromYou = M.state.nearby && M.state.position && point ? M.distance(point, M.state.position).toFixed(1) : null;
      return '<article class="map-carousel-card" id="map-card-' + S.esc(property.id) + '" data-map-card="' + S.esc(property.id) + '">' +
        '<img src="' + S.esc(property.images[0]) + '" alt="" />' +
        '<div class="map-carousel-copy"><b class="map-carousel-name">' + S.esc(property.name) + '</b>' +
        '<strong>' + D.rand(property.price) + '<small>/month</small></strong>' +
        '<span>' + S.icon('mapPin', 12) + S.esc(property.area) + (fromYou ? ' · about ' + fromYou + ' km from you' : ' · ' + S.esc(property.type)) + '</span>' +
        '<div><span class="map-carousel-verified">' + (property.verified === 'verified' ? '✓ Verified' : 'Verification pending') + '</span>' +
        '<a href="#/detail/' + S.esc(property.id) + '">View details →</a></div></div></article>';
    }).join('');

    return {
      title: 'Accommodation map',
      html: '<div class="map-fullscreen">' +
        '<div class="map-fullscreen-canvas" id="accommodation-map" role="region" aria-label="Accommodation map"></div>' +
        '<div class="map-fullscreen-top"><button class="map-float-control" type="button" data-map-near aria-label="' + (M.state.nearby ? 'Refresh my location' : 'Find accommodation near me') + '">' + S.icon('mapPin', 21) + '</button>' +
        '<span class="map-fullscreen-count">' + list.length + ' place' + (list.length === 1 ? '' : 's') + (M.state.nearby ? ' near you' : '') + '</span>' +
        '<button class="map-float-control map-filter-trigger" type="button" data-map-open-search aria-label="Search accommodation" aria-expanded="false" title="Search accommodation">' + S.icon('search', 20) + '</button></div>' +
        '<button class="btn btn--navy map-fullscreen-area" type="button" data-search-map-area hidden>Search this area</button>' +
        (M.state.bounds ? '<button class="btn btn--ghost map-fullscreen-clear" type="button" data-clear-map-area>Clear map area</button>' : '') +
        (M.state.message ? '<p class="map-fullscreen-status" role="status">' + S.esc(M.state.message) + '</p>' : '') +
        '<p class="map-fullscreen-note">Demo pins are approximate area locations · Straight-line distances</p>' +
        '<div class="map-carousel" data-map-carousel aria-label="Accommodation listings" tabindex="0">' +
        (cards || '<div class="map-carousel-empty"><b>No accommodation here yet.</b><span>Try a wider radius or change the search filters.</span></div>') + '</div>' +
        '<div class="map-drawer-backdrop" data-map-drawer-backdrop></div>' +
        '<aside class="map-filter-drawer" data-map-drawer role="dialog" aria-modal="true" aria-hidden="true" aria-label="Search accommodation">' +
        '<div class="map-filter-head"><div><span>FIND YOUR PLACE</span><h2>Search accommodation</h2></div><button type="button" data-map-close aria-label="Close search">' + S.icon('x', 20) + '</button></div>' +
        '<div class="map-filter-fields">' +
        '<label>Province<select class="select" data-map-province>' + option('', 'All provinces', province) + M.provinces.map(function (value) { return option(value, value, province); }).join('') + '</select></label>' +
        '<label>University<select class="select" data-map-university>' + option('', 'Any university', university) + M.universities.filter(function (item) { return !province || item.province === province; }).map(function (item) { return option(item.id, item.name, university); }).join('') + '</select></label>' +
        '<label>Area<select class="select" data-map-area>' + option('', 'All areas', filters.location) + areas.map(function (value) { return option(value, value, filters.location); }).join('') + '</select></label>' +
        '<label>Max monthly rent <b data-map-budget-label>' + D.rand(filters.max) + '</b><input type="range" min="1500" max="6000" step="100" value="' + filters.max + '" data-map-budget /></label>' +
        (M.state.nearby ? '<label>Within<select class="select" data-map-radius>' + [1, 3, 5, 10, 20].map(function (value) { return option(value, value + ' km', M.state.radius); }).join('') + '</select></label>' : '') +
        '<label class="map-filter-check"><input type="checkbox" data-map-verified' + (filters.verified ? ' checked' : '') + ' /> Verified only</label>' +
        '<label class="map-filter-check"><input type="checkbox" data-map-nsfas' + (filters.nsfas ? ' checked' : '') + ' /> NSFAS compatible</label>' +
        '<label>Sort by<select class="select" data-map-sort>' + [['match', 'Best match'], ['price', 'Lowest price'], ['distance', 'Closest to selected location'], ['rating', 'Highest rated']].map(function (entry) { return option(entry[0], entry[1], filters.sort); }).join('') + '</select></label>' +
        (M.state.nearby ? '<button class="btn btn--ghost" type="button" data-map-near-off>Turn off Near me</button>' : '') +
        '<p>Demo pins use approximate area centres until listing coordinates are verified.</p></div>' +
        '<div class="map-filter-actions"><button class="btn btn--ghost" type="button" data-map-reset>Reset</button><button class="btn btn--green" type="button" data-map-apply>Show places</button></div></aside></div>',
      mount: function (root) {
        const carousel = root.querySelector('[data-map-carousel]');
        try {
          M.mount(root.querySelector('#accommodation-map'), list, function (id) {
            const card = document.getElementById('map-card-' + id);
            if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          });
        } catch (error) {
          console.error('Accommodation map could not start:', error);
          root.querySelector('#accommodation-map').innerHTML = '<p class="map-fullscreen-status">Map unavailable. Use Search to filter the listings below.</p>';
        }
        let scrollFrame = 0;
        carousel.addEventListener('scroll', function () {
          if (scrollFrame) cancelAnimationFrame(scrollFrame);
          scrollFrame = requestAnimationFrame(function () {
            const center = carousel.scrollLeft + carousel.clientWidth / 2;
            const cards = Array.from(carousel.querySelectorAll('[data-map-card]'));
            const selected = cards.sort(function (a, b) {
              return Math.abs(a.offsetLeft + a.offsetWidth / 2 - center) - Math.abs(b.offsetLeft + b.offsetWidth / 2 - center);
            })[0];
            if (selected) M.focus(selected.getAttribute('data-map-card'), false, false);
          });
        });
        carousel.querySelectorAll('[data-map-card]').forEach(function (card) {
          card.addEventListener('click', function (event) {
            if (!event.target.closest('a,button')) M.focus(card.getAttribute('data-map-card'), false, false);
          });
        });

        const open = root.querySelector('[data-map-open-search]');
        const drawer = root.querySelector('[data-map-drawer]');
        const backdrop = root.querySelector('[data-map-drawer-backdrop]');
        function closeDrawer() {
          drawer.classList.remove('is-open');
          backdrop.classList.remove('is-open');
          document.body.classList.remove('drawer-open');
          drawer.setAttribute('aria-hidden', 'true');
          open.setAttribute('aria-expanded', 'false');
          open.focus();
        }
        open.addEventListener('click', function () {
          drawer.classList.add('is-open');
          backdrop.classList.add('is-open');
          document.body.classList.add('drawer-open');
          drawer.setAttribute('aria-hidden', 'false');
          open.setAttribute('aria-expanded', 'true');
          drawer.querySelector('[data-map-close]').focus();
        });
        backdrop.addEventListener('click', closeDrawer);
        drawer.querySelector('[data-map-close]').addEventListener('click', closeDrawer);
        root.addEventListener('keydown', function (event) {
          if (!drawer.classList.contains('is-open')) return;
          if (event.key === 'Escape') { closeDrawer(); return; }
          if (event.key !== 'Tab') return;
          const controls = Array.from(drawer.querySelectorAll('button:not(:disabled), select:not(:disabled), input:not(:disabled)'));
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        });

        root.querySelector('[data-map-near]').addEventListener('click', function (event) {
          const button = event.currentTarget;
          button.disabled = true;
          M.locate(function () { S.renderRoute(); });
        });
        const searchArea = root.querySelector('[data-search-map-area]');
        searchArea.addEventListener('click', function () { M.state.bounds = M.state.pendingBounds; M.state.pendingBounds = null; S.renderRoute(); });
        const clearArea = root.querySelector('[data-clear-map-area]');
        if (clearArea) clearArea.addEventListener('click', function () { M.state.bounds = null; M.state.pendingBounds = null; S.renderRoute(); });

        const draft = JSON.parse(JSON.stringify(filters));
        let draftProvince = province;
        let draftUniversity = university;
        let draftRadius = M.state.radius;
        const provinceSelect = drawer.querySelector('[data-map-province]');
        const universitySelect = drawer.querySelector('[data-map-university]');
        const areaSelect = drawer.querySelector('[data-map-area]');
        provinceSelect.addEventListener('change', function () {
          draftProvince = provinceSelect.value;
          draftUniversity = draftProvince === 'Gauteng' ? 'wits' : '';
          draft.location = '';
          universitySelect.innerHTML = option('', 'Any university', draftUniversity) + M.universities.filter(function (item) { return !draftProvince || item.province === draftProvince; }).map(function (item) { return option(item.id, item.name, draftUniversity); }).join('');
          areaSelect.innerHTML = option('', 'All areas', '') + (draftProvince && draftProvince !== 'Gauteng' ? [] : D.AREAS).map(function (area) { return option(area, area, ''); }).join('');
          universitySelect.dispatchEvent(new Event('change', { bubbles: true }));
          areaSelect.dispatchEvent(new Event('change', { bubbles: true }));
        });
        universitySelect.addEventListener('change', function () { draftUniversity = universitySelect.value; });
        areaSelect.addEventListener('change', function () { draft.location = areaSelect.value; });
        const budget = drawer.querySelector('[data-map-budget]');
        budget.addEventListener('input', function () { draft.max = Number(budget.value); drawer.querySelector('[data-map-budget-label]').textContent = D.rand(draft.max); });
        const radius = drawer.querySelector('[data-map-radius]');
        if (radius) radius.addEventListener('change', function () { draftRadius = Number(radius.value); });
        drawer.querySelector('[data-map-verified]').addEventListener('change', function (event) { draft.verified = event.target.checked; });
        drawer.querySelector('[data-map-nsfas]').addEventListener('change', function (event) { draft.nsfas = event.target.checked; });
        drawer.querySelector('[data-map-sort]').addEventListener('change', function (event) { draft.sort = event.target.value; });
        const nearOff = drawer.querySelector('[data-map-near-off]');
        if (nearOff) nearOff.addEventListener('click', function () { document.body.classList.remove('drawer-open'); M.state.nearby = false; M.state.message = ''; M.state.province = 'Gauteng'; M.state.university = 'wits'; S.renderRoute(); });
        drawer.querySelector('[data-map-reset]').addEventListener('click', function () { document.body.classList.remove('drawer-open'); S.state.filters = D.defaultFilters(); M.state.province = 'Gauteng'; M.state.university = 'wits'; M.state.nearby = false; M.state.bounds = null; M.state.pendingBounds = null; S.save(); S.renderRoute(); });
        drawer.querySelector('[data-map-apply]').addEventListener('click', function () {
          document.body.classList.remove('drawer-open');
          S.state.filters = draft;
          M.state.province = draftProvince;
          M.state.university = draftUniversity;
          M.state.radius = draftRadius;
          if (draftProvince || draftUniversity || draft.location) M.state.nearby = false;
          M.state.bounds = null; M.state.pendingBounds = null;
          S.save(); S.renderRoute();
        });
      }
    };
  }

  // Both entry paths use the current full-screen map rather than the old search/results layout.
  S.register('search', mapScreen);
  S.register('results', mapScreen);
})();
