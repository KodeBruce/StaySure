/* ==========================================================================
   StaySure — app shell: navigation, compare tray, global interactions
   ========================================================================== */

(function () {
  "use strict";

  const D = window.SSData;
  const S = window.SS;

  /* ======================================================================
     Top navigation
     ====================================================================== */

  const NAV = [
    { key: "home", label: "Home", route: "/home", icon: "home" },
    { key: "search", label: "Search", route: "/search", icon: "search" },
    { key: "compare", label: "Compare", route: "/compare", icon: "compare" },
    { key: "applications", label: "Applications", route: "/dashboard", icon: "file" },
    { key: "saved", label: "Saved", route: "/saved", icon: "heart" }
  ];

  const ROUTE_GROUP = {
    landing: "home",
    home: "home",
    dashboard: "home",
    onboarding: "home",
    search: "search",
    results: "search",
    detail: "search",
    verify: "search",
    recs: "search",
    afford: "search",
    compare: "compare",
    apply: "applications",
    tracking: "applications",
    saved: "saved",
    profile: "profile",
    provider: "home",
    providerVerify: "home"
  };

  function currentGroup() {
    const r = S.currentRoute();
    return ROUTE_GROUP[r.name] || "";
  }

  function renderChrome() {
    const group = currentGroup();
    const st = S.state;

    /* --- top nav --- */
    const top = document.getElementById("topnav");
    if (top) {
      const links = NAV.map(function (n) {
        const badge = n.key === "compare" && st.compare.length
          ? '<span class="badge-count">' + st.compare.length + "</span>"
          : n.key === "saved" && st.saved.length
            ? '<span class="badge-count badge-count--grey">' + st.saved.length + "</span>"
            : "";
        return '<a class="navlink' + (group === n.key ? " is-active" : "") + '" href="#' + n.route + '"' +
          (group === n.key ? ' aria-current="page"' : "") + ">" + n.label + badge + "</a>";
      }).join("");

      top.innerHTML = '<div class="wrap topnav-inner">' +
        S.brandLink() +
        '<nav class="navlinks" aria-label="Main">' + links + "</nav>" +
        '<div class="nav-right">' +
        '<button class="icon-btn icon-btn--plain" type="button" data-notifications aria-label="Notifications' +
        (st.unread ? " (" + st.unread + " unread)" : "") + '">' + S.icon("bell", 19) +
        (st.unread ? '<span class="dot-badge">' + st.unread + "</span>" : "") + "</button>" +
        '<a class="avatar" href="#/profile" aria-label="Your profile">' + S.esc(S.initials(st.profile.name)) + "</a>" +
        "</div></div>";
    }

    /* --- bottom nav (mobile) --- */
    const bottom = document.getElementById("bottomnav");
    if (bottom) {
      const items = [
        { key: "home", label: "Home", route: st.onboarded ? "/dashboard" : "/landing", icon: "home" },
        { key: "search", label: "Search", route: "/search", icon: "search" },
        { key: "compare", label: "Compare", route: "/compare", icon: "compare", badge: st.compare.length, green: true },
        { key: "saved", label: "Saved", route: "/saved", icon: "heart", badge: st.saved.length },
        { key: "profile", label: "Profile", route: "/profile", icon: "user" }
      ];
      bottom.innerHTML = items.map(function (n) {
        const active = group === n.key;
        return '<a class="bn-link' + (active ? " is-active" : "") + '" href="#' + n.route + '" aria-label="' + n.label + '"' +
          (active ? ' aria-current="page"' : "") + ">" +
          S.icon(n.icon, 22) +
          (n.badge ? '<span class="bn-badge' + (n.green ? " bn-badge--green" : "") + '">' + n.badge + "</span>" : "") +
          '<span>' + n.label + "</span></a>";
      }).join("");
    }

    renderTray();
  }

  S.renderChrome = renderChrome;

  /* ======================================================================
     Compare tray
     ====================================================================== */

  function renderTray() {
    const root = document.getElementById("trayroot");
    if (!root) return;
    const ids = S.state.compare;

    /* Hide the tray on the compare screen itself */
    if (!ids.length || S.currentRoute().name === "compare") {
      root.innerHTML = "";
      document.body.classList.remove("has-tray");
      return;
    }
    document.body.classList.add("has-tray");

    const slots = [0, 1, 2].map(function (i) {
      const p = ids[i] ? D.getProperty(ids[i]) : null;
      return p
        ? '<button class="tray-thumb" type="button" data-tray-remove="' + p.id + '" aria-label="Remove ' + S.esc(p.name) + ' from comparison">' +
        '<img src="' + p.images[0] + '" alt="" />' +
        '<span class="tray-x">' + S.icon("x", 10) + "</span></button>"
        : '<span class="tray-slot" aria-hidden="true">' + S.icon("plus", 13) + "</span>";
    }).join("");

    root.innerHTML = '<div class="tray-wrap"><div class="tray">' +
      '<div class="tray-thumbs">' + slots + "</div>" +
      '<div class="tray-copy"><b>' + ids.length + " of 3 selected</b>" +
      '<span>' + (ids.length < 2 ? "Add one more to compare" : "Ready to compare") + "</span></div>" +
      '<button class="btn btn--quiet tray-clear" type="button" data-tray-clear aria-label="Clear comparison">' +
      '<span class="tray-clear-txt">Clear</span>' + S.icon("x", 15, "tray-clear-ico") + "</button>" +
      (ids.length >= 2
        ? '<a class="btn btn--green btn--sm" href="#/compare">Compare</a>'
        : '<button class="btn btn--sm" type="button" disabled>Compare</button>') +
      "</div></div>";
  }

  /* ======================================================================
     Global delegated interactions
     ====================================================================== */

  function toggleSave(id) {
    const i = S.state.saved.indexOf(id);
    const p = D.getProperty(id);
    if (i > -1) {
      S.state.saved.splice(i, 1);
      S.toast("Removed from saved");
    } else {
      S.state.saved.unshift(id);
      S.toast("Saved" + (p ? " " + p.name : ""));
    }
    S.save();
    S.renderRoute();
  }

  function toggleCompare(id) {
    const i = S.state.compare.indexOf(id);
    if (i > -1) {
      S.state.compare.splice(i, 1);
      S.save();
      S.renderRoute();
      S.toast("Removed from comparison");
      return;
    }
    if (S.state.compare.length >= 3) {
      S.toast("You can compare up to 3 properties. Remove one first.");
      return;
    }
    S.state.compare.push(id);
    S.save();
    S.renderRoute();
    S.toast("Added to comparison (" + S.state.compare.length + " of 3)");
  }

  document.addEventListener("click", function (e) {
    const saveBtn = e.target.closest("[data-save]");
    if (saveBtn) {
      e.preventDefault();
      toggleSave(saveBtn.getAttribute("data-save"));
      return;
    }

    const cmpBtn = e.target.closest("[data-compare]");
    if (cmpBtn) {
      e.preventDefault();
      toggleCompare(cmpBtn.getAttribute("data-compare"));
      return;
    }

    const trayRemove = e.target.closest("[data-tray-remove]");
    if (trayRemove) {
      const id = trayRemove.getAttribute("data-tray-remove");
      S.state.compare = S.state.compare.filter(function (x) { return x !== id; });
      S.save();
      S.renderRoute();
      S.toast("Removed from comparison");
      return;
    }

    const trayClear = e.target.closest("[data-tray-clear]");
    if (trayClear) {
      S.state.compare = [];
      S.save();
      S.renderRoute();
      S.toast("Comparison cleared");
      return;
    }

    const notify = e.target.closest("[data-notifications]");
    if (notify) {
      const sheet = S.openSheet({
        title: "Notifications",
        sub: S.state.unread ? S.state.unread + " unread" : "You are up to date",
        body: '<div class="stack gap-10">' +
          '<div class="notif"><span class="notif-ico is-green">' + S.icon("shield", 15) + "</span>" +
          '<span class="grow"><b>Verification updated</b><span class="tiny muted">Braam Student Village was re-verified on 12 September 2026.</span></span></div>' +
          '<div class="notif"><span class="notif-ico is-navy">' + S.icon("file", 15) + "</span>" +
          '<span class="grow"><b>Application under review</b><span class="tiny muted">Your application STY-2026-00124 is being reviewed by the provider.</span></span></div>' +
          '<div class="notif"><span class="notif-ico is-amber">' + S.icon("wallet", 15) + "</span>" +
          '<span class="grow"><b>Budget reminder</b><span class="tiny muted">Two saved properties are now above your monthly budget.</span></span></div>' +
          "</div>",
        foot: '<button class="btn btn--full" type="button" data-sheet-close>Done</button>'
      });
      sheet.overlay.querySelectorAll("[data-sheet-close]").forEach(function (b) {
        b.addEventListener("click", S.closeSheet);
      });
      return;
    }

    const goBtn = e.target.closest("[data-go]");
    if (goBtn) {
      e.preventDefault();
      S.go(goBtn.getAttribute("data-go"));
      return;
    }

    if (e.target.closest("[data-reset-demo-global]")) {
      S.resetDemo();
    }
  });

  /* ======================================================================
     Reset demo
     ====================================================================== */

  S.resetDemo = function () {
    /* Only clears this prototype's own demo key, never unrelated site data. */
    try { window.localStorage.removeItem("staysure_v1"); } catch (e) { /* ignore */ }
    window.location.hash = "#/landing";
    window.location.reload();
  };

  /* ======================================================================
     Boot
     ====================================================================== */

  /* "Home" route resolves to the dashboard once onboarded, else the landing page */
  S.register("home", function () {
    S.go(S.state.onboarded ? "/dashboard" : "/landing", true);
    return null;
  });

  function boot() {
    if (!window.location.hash) {
      window.location.replace("#/landing");
    }
    S.renderRoute();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
