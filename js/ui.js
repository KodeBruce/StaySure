/* ==========================================================================
   StaySure — shared UI kit, app state and hash router
   ========================================================================== */

(function () {
  "use strict";

  const D = window.SSData;

  /* ======================================================================
     Small helpers
     ====================================================================== */

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function el(html) {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function delegate(root, selector, type, fn) {
    root.addEventListener(type, function (e) {
      const target = e.target.closest(selector);
      if (target && root.contains(target)) fn(e, target);
    });
  }

  /* Styled selects keep the native value and change events used by each screen. */
  let activeSelectMenu = null;

  function closeSelectMenu() {
    if (!activeSelectMenu) return;
    activeSelectMenu.trigger.setAttribute("aria-expanded", "false");
    activeSelectMenu.menu.remove();
    activeSelectMenu = null;
  }

  function enhanceSelects(root) {
    root.querySelectorAll("select.select:not(.select-native)").forEach(function (select) {
      const shell = document.createElement("div");
      shell.className = "select-shell";
      select.parentNode.insertBefore(shell, select);
      shell.appendChild(select);
      select.classList.add("select-native");

      const label = select.id ? root.querySelector('label[for="' + select.id + '"]') : null;
      const name = (label && label.textContent.trim()) || select.getAttribute("aria-label") || "Choose an option";
      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "select-trigger" + (select.classList.contains("select--sm") ? " select-trigger--sm" : "");
      trigger.setAttribute("aria-label", name);
      trigger.setAttribute("aria-haspopup", "listbox");
      trigger.setAttribute("aria-expanded", "false");
      trigger.innerHTML = '<span class="select-trigger-text"></span>' + icon("chevronDown", 17);
      shell.appendChild(trigger);

      function sync() {
        const option = select.options[select.selectedIndex];
        trigger.querySelector(".select-trigger-text").textContent = option ? option.textContent : "Choose an option";
        trigger.setAttribute("aria-label", name + ": " + (option ? option.textContent : "Choose an option"));
      }

      function open() {
        closeSelectMenu();
        const menu = document.createElement("div");
        menu.className = "select-menu";
        menu.setAttribute("role", "listbox");
        menu.setAttribute("aria-label", name);
        Array.from(select.options).forEach(function (option, index) {
          const item = document.createElement("button");
          item.type = "button";
          item.className = "select-option" + (index === select.selectedIndex ? " is-selected" : "");
          item.setAttribute("role", "option");
          item.setAttribute("aria-selected", String(index === select.selectedIndex));
          item.innerHTML = '<span></span>' + icon("check", 16);
          item.querySelector("span").textContent = option.textContent;
          item.addEventListener("click", function () {
            select.selectedIndex = index;
            sync();
            closeSelectMenu();
            trigger.focus();
            select.dispatchEvent(new Event("change", { bubbles: true }));
          });
          menu.appendChild(item);
        });
        menu.addEventListener("keydown", function (event) {
          const options = Array.from(menu.querySelectorAll(".select-option"));
          const index = options.indexOf(document.activeElement);
          if (event.key === "Escape") {
            event.preventDefault();
            closeSelectMenu();
            trigger.focus();
          } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            options[(index + (event.key === "ArrowDown" ? 1 : options.length - 1)) % options.length].focus();
          } else if (event.key === "Home" || event.key === "End") {
            event.preventDefault();
            options[event.key === "Home" ? 0 : options.length - 1].focus();
          }
        });
        document.body.appendChild(menu);
        const rect = trigger.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom - 12;
        const spaceAbove = rect.top - 12;
        const above = spaceBelow < 180 && spaceAbove > spaceBelow;
        const available = Math.max(100, above ? spaceAbove : spaceBelow);
        const height = Math.min(240, available, menu.scrollHeight);
        menu.style.width = Math.min(rect.width, window.innerWidth - 16) + "px";
        menu.style.left = Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8)) + "px";
        menu.style.maxHeight = height + "px";
        menu.style.top = (above ? rect.top - height - 6 : rect.bottom + 6) + "px";
        trigger.setAttribute("aria-expanded", "true");
        activeSelectMenu = { trigger: trigger, menu: menu };
        const selected = menu.querySelector(".is-selected");
        if (selected) selected.scrollIntoView({ block: "nearest" });
      }

      trigger.addEventListener("click", function () {
        if (activeSelectMenu && activeSelectMenu.trigger === trigger) closeSelectMenu();
        else open();
      });
      trigger.addEventListener("keydown", function (event) {
        if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === " " || event.key === "Enter") {
          event.preventDefault();
          if (!activeSelectMenu || activeSelectMenu.trigger !== trigger) open();
          const options = activeSelectMenu && activeSelectMenu.menu.querySelectorAll(".select-option");
          if (options && options.length) options[event.key === "ArrowUp" ? options.length - 1 : select.selectedIndex].focus();
        }
      });
      if (label) label.addEventListener("click", function (event) { event.preventDefault(); trigger.focus(); open(); });
      select.addEventListener("change", sync);
      sync();
    });
  }

  document.addEventListener("pointerdown", function (event) {
    if (activeSelectMenu && !activeSelectMenu.menu.contains(event.target) && !activeSelectMenu.trigger.contains(event.target)) closeSelectMenu();
  });
  document.addEventListener("scroll", function (event) {
    if (activeSelectMenu && event.target !== activeSelectMenu.menu && !activeSelectMenu.menu.contains(event.target)) closeSelectMenu();
  }, true);
  window.addEventListener("resize", closeSelectMenu);

  /* ======================================================================
     Icon set — custom 24×24 line icons, stroke 2, round caps/joins
     ====================================================================== */

  const PATHS = {
    home: '<path d="M3.5 10.5 12 3.6l8.5 6.9"/><path d="M5.8 9.6v9.2a1.2 1.2 0 0 0 1.2 1.2h10a1.2 1.2 0 0 0 1.2-1.2V9.6"/>',
    search: '<circle cx="10.8" cy="10.8" r="6.6"/><path d="M15.7 15.7 20.5 20.5"/>',
    compare: '<rect x="3" y="4.5" width="7.2" height="15" rx="1.6"/><rect x="13.8" y="4.5" width="7.2" height="15" rx="1.6"/><path d="M10.2 9.6h3.6"/>',
    file: '<path d="M14 3.2H7.4A1.4 1.4 0 0 0 6 4.6v14.8a1.4 1.4 0 0 0 1.4 1.4h9.2a1.4 1.4 0 0 0 1.4-1.4V7.2z"/><path d="M14 3.2v4h4"/><path d="M9.2 12.4h5.6M9.2 16h4"/>',
    heart: '<path d="M12 20.1s-7.6-4.5-7.6-9.5A4.2 4.2 0 0 1 12 7.7a4.2 4.2 0 0 1 7.6 2.9c0 5-7.6 9.5-7.6 9.5z"/>',
    bell: '<path d="M18 15.5V10a6 6 0 1 0-12 0v5.5L4.4 18h15.2z"/><path d="M9.6 21a2.5 2.5 0 0 0 4.8 0"/>',
    user: '<circle cx="12" cy="8.4" r="3.7"/><path d="M4.8 20.4a7.4 7.4 0 0 1 14.4 0"/>',
    arrowRight: '<path d="M4.5 12h15"/><path d="m13.4 5.9 6.1 6.1-6.1 6.1"/>',
    arrowLeft: '<path d="M19.5 12h-15"/><path d="m10.6 5.9-6.1 6.1 6.1 6.1"/>',
    chevronLeft: '<path d="m14.5 5.5-6.5 6.5 6.5 6.5"/>',
    chevronRight: '<path d="m9.5 5.5 6.5 6.5-6.5 6.5"/>',
    chevronDown: '<path d="m5.5 9.5 6.5 6.5 6.5-6.5"/>',
    check: '<path d="m4.8 12.6 4.6 4.6 9.8-10.4"/>',
    x: '<path d="M5.8 5.8 18.2 18.2M18.2 5.8 5.8 18.2"/>',
    plus: '<path d="M12 4.8v14.4M4.8 12h14.4"/>',
    minus: '<path d="M4.8 12h14.4"/>',
    wifi: '<path d="M2.6 9.1a14.4 14.4 0 0 1 18.8 0"/><path d="M5.9 12.6a9.6 9.6 0 0 1 12.2 0"/><path d="M9.2 16.1a4.8 4.8 0 0 1 5.6 0"/><circle cx="12" cy="19.2" r="1.1" fill="currentColor" stroke="none"/>',
    shield: '<path d="M12 3.4 5.3 6v5.6c0 4.3 2.8 7.3 6.7 8.9 3.9-1.6 6.7-4.6 6.7-8.9V6z"/><path d="m9.3 11.7 2 2 3.5-3.6"/>',
    laundry: '<rect x="4.4" y="3.4" width="15.2" height="17.2" rx="2.2"/><circle cx="12" cy="14" r="4"/><path d="M8 7.2h.01M11.4 7.2h.01"/>',
    book: '<path d="M4 5.2A2.2 2.2 0 0 1 6.2 3H19v18H6.2A2.2 2.2 0 0 1 4 18.8z"/><path d="M8 3v18"/>',
    bus: '<rect x="4" y="3.6" width="16" height="13" rx="2.4"/><path d="M4 12h16"/><path d="M7.6 20.4v-3.8M16.4 20.4v-3.8"/><path d="M8 7.4h8"/>',
    sofa: '<path d="M4.4 12.6V9.2a2 2 0 0 1 2-2h11.2a2 2 0 0 1 2 2v3.4"/><path d="M3 13.6a1.8 1.8 0 0 1 3.6 0v2.8h10.8v-2.8a1.8 1.8 0 0 1 3.6 0v4.2H3z"/>',
    utensils: '<path d="M7 3.2v7.2a2.2 2.2 0 0 0 4.4 0V3.2"/><path d="M9.2 10.4V20.8"/><path d="M16.4 3.2c1.7 1 2.4 2.6 2.4 4.6s-.7 3.4-2.4 4.2v8.8"/>',
    star: '<path d="m12 3.6 2.6 5.6 6.1.8-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 10l6.1-.8z"/>',
    mapPin: '<path d="M19 10.4c0 5.3-7 11-7 11s-7-5.7-7-11a7 7 0 0 1 14 0z"/><circle cx="12" cy="10.2" r="2.6"/>',
    info: '<circle cx="12" cy="12" r="8.6"/><path d="M12 11v5.4"/><path d="M12 7.9h.01"/>',
    alert: '<path d="M12 3.6 21 19.6H3z"/><path d="M12 9.4v4.4"/><path d="M12 16.9h.01"/>',
    clock: '<circle cx="12" cy="12" r="8.6"/><path d="M12 7.4V12l3 1.9"/>',
    upload: '<path d="M12 16.4V4.6"/><path d="m7.4 9.2 4.6-4.6 4.6 4.6"/><path d="M4.4 15v3.4a1.6 1.6 0 0 0 1.6 1.6h12a1.6 1.6 0 0 0 1.6-1.6V15"/>',
    filter: '<path d="M4.2 6.4h15.6"/><path d="M7.2 12h9.6"/><path d="M10.2 17.6h3.6"/>',
    share: '<path d="M15.6 8.4a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2z"/><path d="M6.4 14.6a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2z"/><path d="M18.2 20.8a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2z"/><path d="m8.7 10.6 5 2.9M13.7 8l-5 2.9" opacity="0"/><path d="m8.8 10.7 4.8-2.4M8.8 12.5l4.8 2.9"/>',
    message: '<path d="M20.4 12.4a7.6 7.6 0 0 1-8.2 7.6c-.8 0-1.6-.1-2.3-.4L4.2 21l1.3-4.5a7.6 7.6 0 1 1 14.9-4.1z"/><path d="M8.8 11.4h6.4M8.8 14.6h3.6"/>',
    lock: '<rect x="4.8" y="10.4" width="14.4" height="10.2" rx="2.2"/><path d="M8.2 10.4V7.6a3.8 3.8 0 0 1 7.6 0v2.8"/>',
    eye: '<path d="M2.8 12S6 6.4 12 6.4 21.2 12 21.2 12 18 17.6 12 17.6 2.8 12 2.8 12z"/><circle cx="12" cy="12" r="2.8"/>',
    edit: '<path d="M16.2 4.2 19.8 7.8 9.4 18.2l-4.6 1 1-4.6z"/><path d="m14.4 6 3.6 3.6"/>',
    trash: '<path d="M4.6 7.2h14.8"/><path d="M9.4 7.2V5.4a1.4 1.4 0 0 1 1.4-1.4h2.4a1.4 1.4 0 0 1 1.4 1.4v1.8"/><path d="M6.6 7.2l.9 12a1.6 1.6 0 0 0 1.6 1.4h5.8a1.6 1.6 0 0 0 1.6-1.4l.9-12"/>',
    refresh: '<path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 4.4V10h-5.6"/>',
    building: '<rect x="4.2" y="3.4" width="15.6" height="17.4" rx="1.8"/><path d="M8.4 7.4h2M13.6 7.4h2M8.4 11h2M13.6 11h2"/><path d="M10 20.8v-4h4v4"/>',
    users: '<circle cx="9" cy="8.4" r="3.4"/><path d="M2.8 20a6.4 6.4 0 0 1 12.4 0"/><path d="M16.4 5.4a3.4 3.4 0 0 1 0 6.6M17.8 14.4a6.4 6.4 0 0 1 3.4 5.6"/>',
    chart: '<path d="M4.2 20V4.4"/><path d="M4.2 20h15.6"/><rect x="7.4" y="12.4" width="3.2" height="4.6" rx="1"/><rect x="12.6" y="8.4" width="3.2" height="8.6" rx="1"/><rect x="17.4" y="14.4" width="0" height="0" opacity="0"/>',
    mail: '<rect x="3.2" y="5.4" width="17.6" height="13.2" rx="2"/><path d="m4 7 8 5.6 8-5.6"/>',
    phone: '<path d="M8.4 3.6H5.6a2 2 0 0 0-2 2.2 17.4 17.4 0 0 0 14.6 14.6 2 2 0 0 0 2.2-2v-2.8l-4-1.4-1.8 2a14 14 0 0 1-5.4-5.4l2-1.8z"/>',
    doc: '<path d="M13.6 3.4H7.2A1.6 1.6 0 0 0 5.6 5v14a1.6 1.6 0 0 0 1.6 1.6h9.6a1.6 1.6 0 0 0 1.6-1.6V7z"/><path d="M13.6 3.4V7h4"/>',
    sparkle: '<path d="m12 3.6 2 5.4 5.4 2-5.4 2-2 5.4-2-5.4-5.4-2 5.4-2z"/>',
    wallet: '<rect x="3.2" y="6.4" width="17.6" height="12.4" rx="2.4"/><path d="M3.2 10.6h17.6"/><circle cx="16.4" cy="14.8" r="1.2" fill="currentColor" stroke="none"/>',
    logout: '<path d="M14.4 4.6H6.4a1.8 1.8 0 0 0-1.8 1.8v11.2a1.8 1.8 0 0 0 1.8 1.8h8"/><path d="M15.4 12h6M18.6 8.8 21.8 12l-3.2 3.2"/>',
    grid: '<rect x="3.6" y="3.6" width="7" height="7" rx="1.6"/><rect x="13.4" y="3.6" width="7" height="7" rx="1.6"/><rect x="3.6" y="13.4" width="7" height="7" rx="1.6"/><rect x="13.4" y="13.4" width="7" height="7" rx="1.6"/>',
    pin: '<circle cx="12" cy="12" r="8.6"/><path d="M12 3.4v3M12 17.6v3M3.4 12h3M17.6 12h3"/>',
    send: '<path d="M21 3.6 10.6 14"/><path d="M21 3.6 14.6 21l-4-7-7-4z"/>',
    camera: '<rect x="3.2" y="7" width="17.6" height="12.6" rx="2.4"/><circle cx="12" cy="13.2" r="3.4"/><path d="m8.6 7 1.4-2.6h4l1.4 2.6"/>',
    card: '<rect x="3.2" y="5.4" width="17.6" height="13.2" rx="2.4"/><path d="M3.2 9.8h17.6"/>'
  };

  function icon(name, size, extra) {
    const path = PATHS[name] || PATHS.info;
    return '<svg class="ico' + (extra ? " " + extra : "") + '" width="' + (size || 18) + '" height="' + (size || 18) +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      path + "</svg>";
  }

  /* ======================================================================
     Logo
     ====================================================================== */

  function logoMark(size) {
    const s = size || 32;
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 32 32" aria-hidden="true" focusable="false" style="flex:0 0 auto">' +
      '<rect width="32" height="32" rx="9" fill="var(--navy)"/>' +
      '<path d="M8.5 15.2 16 8.6l7.5 6.6" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M11.2 14.6v7.2h9.6v-7.2" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M12.4 22.4l3 2.6 5.4-5" fill="none" stroke="#1F9D5C" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  function brandLink(route) {
    return '<a class="brand" href="#' + (route || "/landing") + '" aria-label="StaySure home">' +
      logoMark(32) + '<span class="brand-word">Stay<em>Sure</em></span></a>';
  }

  /* ======================================================================
     Score ring
     ====================================================================== */

  function scoreRing(score, size, stroke, labelSize) {
    const s = size || 54;
    const w = stroke || 4;
    const r = (s - w) / 2;
    const c = 2 * Math.PI * r;
    const off = c * (1 - Math.max(0, Math.min(100, score)) / 100);
    return '<span class="ring" style="width:' + s + "px;height:" + s + 'px">' +
      '<svg width="' + s + '" height="' + s + '" viewBox="0 0 ' + s + " " + s + '" aria-hidden="true">' +
      '<circle class="ring-bg" cx="' + s / 2 + '" cy="' + s / 2 + '" r="' + r + '" stroke-width="' + w + '"/>' +
      '<circle class="ring-fg" cx="' + s / 2 + '" cy="' + s / 2 + '" r="' + r + '" stroke-width="' + w +
      '" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + c.toFixed(1) + '" data-ring="' + off.toFixed(1) + '"/>' +
      "</svg>" +
      '<span class="ring-label" style="font-size:' + (labelSize || Math.round(s * 0.28)) + 'px">' + score + "%</span></span>";
  }

  function animateRings(root) {
    const scope = root || document;
    scope.querySelectorAll("[data-ring]").forEach(function (node) {
      const target = node.getAttribute("data-ring");
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { node.style.strokeDashoffset = target; });
      });
    });
  }

  /* ======================================================================
     Pills / misc atoms
     ====================================================================== */

  function verifiedPill(status, small) {
    if (status === "verified") return '<span class="pill pill--green' + (small ? " pill--xs" : "") + '">' + icon("shield", 13) + "Verified</span>";
    if (status === "pending") return '<span class="pill pill--amber">' + icon("clock", 13) + "Verification pending</span>";
    return '<span class="pill pill--grey">Not verified</span>';
  }

  function fundingPill(p) {
    return p.nsfas
      ? '<span class="pill pill--navy">NSFAS compatible</span>'
      : '<span class="pill pill--grey">Self-funded only</span>';
  }

  function stars(rating, count) {
    return '<span class="stars"><span class="star-ico">' + icon("star", 14) + "</span>" +
      '<b>' + String(rating).replace(".", ",") + "</b>" +
      (count != null ? ' <span class="muted">(' + count + ")</span>" : "") + "</span>";
  }

  function note(text, tone, iconName) {
    return '<div class="note' + (tone ? " note--" + tone : "") + '">' +
      icon(iconName || "info", 16) + "<span>" + text + "</span></div>";
  }

  function backRow(label, route) {
    return '<button class="backrow" type="button" data-go="' + esc(route || "/results") + '">' +
      icon("chevronLeft", 16) + "<span>" + esc(label) + "</span></button>";
  }

  function demoTag(text) {
    return '<span class="demo-tag">' + esc(text || "Demo data") + "</span>";
  }

  function initials(name) {
    return String(name || "Thabo Nkosi").split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0).toUpperCase(); }).join("");
  }

  /* ======================================================================
     Illustrative map
     ====================================================================== */

  function miniMap(pins, tall) {
    const h = tall || 190;
    const pinMarkup = (pins || []).map(function (pin) {
      return '<span class="map-pin' + (pin.tone === "green" ? " map-pin--green" : "") +
        '" style="left:' + pin.x + "%;top:" + pin.y + '%">' + esc(pin.label) + "</span>";
    }).join("");
    return '<div class="minimap" style="height:' + h + 'px" role="img" aria-label="Illustrative map of the area around Wits Main Campus. Not geographically accurate.">' +
      '<svg class="minimap-svg" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<rect width="400" height="200" fill="#EDF0F6"/>' +
      '<path d="M0 58h400M0 118h400M0 168h400M64 0v200M142 0v200M232 0v200M318 0v200" stroke="#FFFFFF" stroke-width="9"/>' +
      '<path d="M0 58h400M0 118h400M0 168h400M64 0v200M142 0v200M232 0v200M318 0v200" stroke="#E2E7F0" stroke-width="1"/>' +
      '<path d="M-10 12 96 96 96 210" stroke="#F7D9AE" stroke-width="6" fill="none"/>' +
      '<path d="M232 0v58h120" stroke="#F7D9AE" stroke-width="5" fill="none"/>' +
      '<rect x="150" y="122" width="62" height="34" rx="6" fill="#DDEBD8"/>' +
      '<rect x="248" y="66" width="52" height="40" rx="6" fill="#DDEBD8"/>' +
      '<rect x="12" y="126" width="40" height="32" rx="4" fill="#E4E8F0"/>' +
      '<rect x="74" y="70" width="52" height="38" rx="4" fill="#E4E8F0"/>' +
      '<rect x="332" y="126" width="56" height="32" rx="4" fill="#E4E8F0"/>' +
      '<rect x="248" y="126" width="42" height="32" rx="4" fill="#E4E8F0"/>' +
      '<circle cx="176" cy="88" r="26" fill="#1F9D5C" opacity=".1"/>' +
      '<circle cx="176" cy="88" r="8" fill="#1F9D5C"/>' +
      '<circle cx="176" cy="88" r="4" fill="#fff"/>' +
      "</svg>" +
      '<span class="map-pin map-pin--wits" style="left:44%;top:44%">' + icon("pin", 12) + " Wits</span>" +
      pinMarkup +
      '<span class="map-illus">Illustrative map · not to scale</span>' +
      "</div>";
  }

  /* ======================================================================
     Property card
     ====================================================================== */

  function propertyCard(item, profile, opts) {
    const p = item.p || item;
    const score = item.score != null ? item.score : D.matchScore(p, profile).score;
    const o = opts || {};
    const saved = SS.state.saved.indexOf(p.id) > -1;
    const comparing = SS.state.compare.indexOf(p.id) > -1;
    const badge = score >= 78
      ? '<span class="pcard-badge pcard-badge--navy">' + icon("sparkle", 12) + " Good match · " + score + "%</span>"
      : p.price <= (profile.budget || 3500)
        ? '<span class="pcard-badge pcard-badge--white">Within your budget</span>'
        : "";

    return '<article class="pcard' + (o.compact ? " pcard--compact" : "") + '">' +
      '<div class="pcard-media">' +
      '<a class="pcard-imglink" href="#/detail/' + p.id + '" aria-label="View ' + esc(p.name) + '">' +
      '<img src="' + p.images[0] + '" alt="' + esc(p.name + " in " + p.area) + '" loading="lazy" width="480" height="300" /></a>' +
      badge +
      '<button class="pcard-heart' + (saved ? " is-on" : "") + '" type="button" data-save="' + p.id + '" aria-pressed="' + saved + '" aria-label="' + (saved ? "Remove from saved" : "Save") + " " + esc(p.name) + '">' +
      icon("heart", 18) + "</button>" +
      "</div>" +
      '<div class="pcard-body">' +
      '<div class="pcard-top">' +
      '<h3 class="pcard-name"><a href="#/detail/' + p.id + '">' + esc(p.name) + "</a></h3>" +
      stars(p.rating, p.reviewsCount) +
      "</div>" +
      '<div class="pcard-price"><span class="price">' + D.rand(p.price) + '</span><span class="per">/month</span></div>' +
      '<div class="pcard-sub">' + esc(p.type) + " · " + esc(p.area) + "</div>" +
      '<div class="pcard-meta"><span>' + icon("mapPin", 13) + D.km(p.distanceKm) + " from Wits</span><span>" + p.available + " available</span></div>" +
      '<div class="pcard-pills">' + verifiedPill(p.verified) + fundingPill(p) + "</div>" +
      '<div class="pcard-facs">' +
      D.facilityLabels(p, 5).map(function (f) { return '<span class="fac-tag">' + esc(f.label) + "</span>"; }).join("") +
      "</div>" +
      '<div class="pcard-actions">' +
      '<a class="btn btn--sm" href="#/detail/' + p.id + '">View Details</a>' +
      '<button class="btn btn--sm ' + (comparing ? "btn--green" : "btn--ghost") + '" type="button" data-compare="' + p.id + '" aria-pressed="' + comparing + '">' +
      (comparing ? icon("check", 14) + " Comparing" : "Compare") + "</button>" +
      "</div></div></article>";
  }

  /* ======================================================================
     App state + persistence
     ====================================================================== */

  const STORAGE_KEY = "staysure_v1";

  function defaultState() {
    return {
      profile: {
        name: "Thabo Nkosi",
        university: "University of the Witwatersrand",
        band: "b3",
        budget: 3500,
        funding: "nsfas",
        priorities: ["affordability", "campus", "wifi", "safety"],
        income: 4500
      },
      onboarded: false,
      filters: D.defaultFilters(),
      saved: [],
      viewed: [],
      compare: [],
      applications: [],
      messages: [],
      unread: 2,
      providerApps: {},
      tick: 0
    };
  }

  const state = defaultState();

  function load() {
    let raw = null;
    try { raw = window.localStorage.getItem(STORAGE_KEY); } catch (e) { raw = null; }
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return;
      if (parsed.profile) Object.assign(state.profile, parsed.profile);
      ["onboarded", "unread", "tick"].forEach(function (k) {
        if (typeof parsed[k] === "number" || typeof parsed[k] === "boolean") state[k] = parsed[k];
      });
      ["saved", "viewed", "compare", "applications", "messages"].forEach(function (k) {
        if (Array.isArray(parsed[k])) state[k] = parsed[k];
      });
      if (parsed.filters && typeof parsed.filters === "object") Object.assign(state.filters, parsed.filters);
      if (parsed.providerApps && typeof parsed.providerApps === "object") state.providerApps = parsed.providerApps;
    } catch (e) {
      /* Keep in-memory defaults; never discard unreadable stored records. */
      console.warn("StaySure: could not parse saved state, continuing with defaults.");
    }
  }

  function save() {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* private mode */ }
  }

  /* ======================================================================
     Toast
     ====================================================================== */

  let toastTimer = null;
  function toast(msg) {
    const host = document.getElementById("toasthost");
    if (!host) return;
    host.innerHTML = "";
    const node = el('<div class="toast">' + icon("check", 15) + "<span>" + esc(msg) + "</span></div>");
    host.appendChild(node);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      node.classList.add("is-out");
      setTimeout(function () { if (node.parentNode) node.remove(); }, 250);
    }, 2600);
  }

  /* ======================================================================
     Sheets
     ====================================================================== */

  let activeSheet = null;
  let sheetCloseTimer = null;

  function closeSheet() {
    closeSelectMenu();
    if (!activeSheet) return;
    const panel = activeSheet;
    activeSheet = null;
    panel.overlay.style.animation = "fade .16s ease reverse both";
    sheetCloseTimer = setTimeout(function () {
      if (panel.overlay.parentNode) panel.overlay.remove();
      if (!activeSheet) document.body.style.overflow = "";
      sheetCloseTimer = null;
    }, 150);
  }

  function openSheet(opts) {
    closeSheet();
    if (sheetCloseTimer) {
      clearTimeout(sheetCloseTimer);
      sheetCloseTimer = null;
      document.querySelectorAll('#sheetroot .sheet-overlay').forEach(function (node) { node.remove(); });
    }
    const root = document.getElementById("sheetroot");
    const overlay = el(
      '<div class="sheet-overlay">' +
      '<div class="sheet' + (opts.wide ? " sheet--wide" : "") + '" role="dialog" aria-modal="true" aria-label="' + esc(opts.title || "Dialog") + '">' +
      '<div class="sheet-head">' +
      '<div class="grow"><h2 class="sheet-title">' + esc(opts.title || "") + "</h2>" +
      (opts.sub ? '<p class="sheet-sub">' + esc(opts.sub) + "</p>" : "") + "</div>" +
      '<button class="icon-btn icon-btn--plain sheet-x" type="button" data-sheet-close aria-label="Close">' + icon("x", 18) + "</button>" +
      "</div>" +
      '<div class="sheet-body">' + (opts.body || "") + "</div>" +
      (opts.foot ? '<div class="sheet-foot">' + opts.foot + "</div>" : "") +
      "</div></div>"
    );
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeSheet();
    });
    overlay.querySelectorAll("[data-sheet-close]").forEach(function (b) {
      b.addEventListener("click", closeSheet);
    });
    root.appendChild(overlay);
    enhanceSelects(overlay);
    document.body.style.overflow = "hidden";
    activeSheet = { overlay: overlay };
    const focusTarget = overlay.querySelector("[data-sheet-close]");
    if (focusTarget) focusTarget.focus();
    return {
      overlay: overlay,
      body: overlay.querySelector(".sheet-body"),
      foot: overlay.querySelector(".sheet-foot"),
      close: closeSheet,
      enhance: function () { enhanceSelects(overlay); }
    };
  }

  /* ======================================================================
     Router
     ====================================================================== */

  const routes = {};
  let current = { name: "", id: "" };

  function register(name, render) { routes[name] = render; }

  function parseHash() {
    let h = window.location.hash.replace(/^#/, "");
    if (!h || h === "/") return { name: "landing", id: "" };
    h = h.replace(/^\//, "");
    const parts = h.split("/");
    return { name: parts[0] || "landing", id: parts[1] || "" };
  }

  function go(path, replace) {
    const target = "#" + (path.charAt(0) === "/" ? path : "/" + path);
    if (replace) {
      window.location.replace(target);
    } else if (window.location.hash === target) {
      renderRoute();
    } else {
      window.location.hash = target;
    }
  }

  function renderRoute() {
    closeSelectMenu();
    const r = parseHash();
    current = r;
    document.body.classList.toggle('is-map-route', r.name === 'search' || r.name === 'results');
    document.body.classList.remove('drawer-open');
    closeSheet();
    const screen = routes[r.name] || routes.landing;
    const root = document.getElementById("view");
    const out = screen ? screen(r.id) : null;
    if (!out) { root.innerHTML = ""; return; }
    document.title = (out.title ? out.title + " · " : "") + "StaySure";
    root.innerHTML = '<div class="screen">' + out.html + "</div>";
    window.scrollTo(0, 0);
    // Keep navigation available even if an optional screen widget fails to mount.
    SS.renderChrome();
    if (typeof out.mount === "function") out.mount(root);
    enhanceSelects(root);
    animateRings(root);
  }

  function currentRoute() { return current; }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeSheet();
  });

  window.addEventListener("hashchange", renderRoute);

  /* ======================================================================
     Public namespace
     ====================================================================== */

  const SS = {
    esc: esc,
    el: el,
    delegate: delegate,
    icon: icon,
    logoMark: logoMark,
    brandLink: brandLink,
    scoreRing: scoreRing,
    animateRings: animateRings,
    verifiedPill: verifiedPill,
    fundingPill: fundingPill,
    stars: stars,
    note: note,
    backRow: backRow,
    demoTag: demoTag,
    initials: initials,
    miniMap: miniMap,
    propertyCard: propertyCard,
    state: state,
    load: load,
    save: save,
    toast: toast,
    openSheet: openSheet,
    closeSheet: closeSheet,
    enhanceSelects: enhanceSelects,
    closeSelectMenu: closeSelectMenu,
    register: register,
    go: go,
    renderRoute: renderRoute,
    currentRoute: currentRoute,
    renderChrome: function () {},
    rand: D.rand,
    km: D.km,
    longDate: D.longDate,
    num: D.num
  };

  window.SS = SS;
  load();
})();
