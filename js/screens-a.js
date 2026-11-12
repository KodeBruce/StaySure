/* ==========================================================================
   StaySure — Landing, Onboarding, Search, Results, Filter panel
   ========================================================================== */

(function () {
  "use strict";

  const D = window.SSData;
  const S = window.SS;

  /* ======================================================================
     1. Landing
     ====================================================================== */

  function landing() {
    const hero = ["braam-student-village", "the-loft-on-juta", "wits-edge-studios"]
      .map(function (id) { return D.getProperty(id); });

    const heroCards = hero.map(function (p, i) {
      return '<a class="hero-card hero-card--' + (i + 1) + '" href="#/detail/' + p.id + '">' +
        '<img src="' + p.images[0] + '" alt="' + S.esc(p.name) + '" loading="' + (i === 0 ? "eager" : "lazy") + '" />' +
        '<span class="hero-card-body">' +
        '<span class="hero-card-name">' + S.esc(p.name) + "</span>" +
        '<span class="hero-card-meta">' + S.esc(p.area) + " · " + D.km(p.distanceKm) + "</span>" +
        '<span class="hero-card-price">' + D.rand(p.price) + '<em>/month</em></span>' +
        "</span></a>";
    }).join("");

    const steps = [
      { n: "01", icon: "search", title: "Search", text: "Filter by budget, distance, facilities and accommodation type to find places that actually fit your life." },
      { n: "02", icon: "compare", title: "Compare", text: "Put up to three options side by side and see where they genuinely differ — not just on rent." },
      { n: "03", icon: "shield", title: "Verify", text: "See what StaySure checked, when, and what is still unconfirmed before you sign anything." },
      { n: "04", icon: "file", title: "Apply", text: "Submit one application, upload your documents once, and track every status change." }
    ];

    const trust = [
      { icon: "shield", title: "Verified Listings", sub: "Checked by the StaySure team" },
      { icon: "wallet", title: "Budget-Friendly Options", sub: "Total monthly cost, not just rent" },
      { icon: "user", title: "Student-Focused Search", sub: "Built around how students decide" }
    ];

    return {
      title: "Find accommodation you can trust",
      html: '<section class="hero">' +
        '<div class="wrap hero-grid">' +
        '<div class="hero-copy">' +
        '<span class="loc-pill">' + S.icon("mapPin", 14) + "Now live for Wits students · Johannesburg</span>" +
        '<h1 class="hero-h1">Find accommodation you can <span class="green">trust.</span></h1>' +
        '<p class="hero-sub">Search, compare and verify student accommodation around Wits, based on your budget, location and needs.</p>' +
        '<div class="hero-ctas">' +
        '<a class="btn btn--lg btn--green" href="#/onboarding">Find My Accommodation ' + S.icon("arrowRight", 17) + "</a>" +
        '<a class="btn btn--lg btn--ghost" href="#/results">Explore Accommodation</a>' +
        "</div>" +
        '<div class="trust-row">' + trust.map(function (t) {
          return '<div class="trust-item"><span class="trust-ico">' + S.icon(t.icon, 19) + "</span>" +
            "<div><b>" + S.esc(t.title) + "</b><span>" + S.esc(t.sub) + "</span></div></div>";
        }).join("") + "</div>" +
        "</div>" +
        '<div class="hero-visual" aria-hidden="false">' +
        '<div class="hero-stack">' + heroCards + "</div>" +
        '<div class="match-chip">' + S.scoreRing(92, 46, 4, 13) +
        "<div><b>92%</b><span>Great match for you</span></div></div>" +
        "</div>" +
        "</div></section>" +

        '<section class="how-sec">' +
        '<div class="wrap">' +
        '<p class="eyebrow">How StaySure works</p>' +
        '<h2 class="h-section">From search to signed, with confidence.</h2>' +
        '<div class="how-grid">' + steps.map(function (s) {
          return '<article class="how-card"><span class="how-num">' + s.n + "</span>" +
            '<span class="how-ico">' + S.icon(s.icon, 22) + "</span>" +
            "<h3>" + S.esc(s.title) + "</h3><p>" + S.esc(s.text) + "</p></article>";
        }).join("") + "</div>" +
        "</div></section>" +

        '<section class="cta-band">' +
        '<div class="wrap cta-band-inner">' +
        "<div><h2>Find accommodation that fits your budget, your needs and your confidence.</h2></div>" +
        '<div class="cta-band-btns">' +
        '<a class="btn btn--green btn--lg" href="#/onboarding">Get started — it\'s free</a>' +
        '<a class="btn btn--lg btn--onnavy" href="#/provider">I\'m a provider ' + S.icon("arrowRight", 16) + "</a>" +
        "</div></div></section>" +

        '<footer class="site-foot"><div class="wrap">' +
        '<div class="foot-top">' +
        '<div class="foot-brand">' + S.brandLink() +
        "<p>Student accommodation decision support for Wits. Search, compare, verify and apply in one place.</p></div>" +
        '<div class="foot-cols">' +
        '<div><b>Students</b><a href="#/search">Search</a><a href="#/compare">Compare</a><a href="#/saved">Saved</a></div>' +
        '<div><b>Providers</b><a href="#/provider">Provider dashboard</a><a href="#/providerVerify">Verification</a></div>' +
        '<div><b>Account</b><a href="#/dashboard">Dashboard</a><a href="#/profile">Profile</a></div>' +
        "</div></div>" +
        '<div class="foot-note">' + S.note("<b>Prototype notice.</b> All property data, reviews, verification dates and match scores on this site are fictional demo data. StaySure is not affiliated with the University of the Witwatersrand or NSFAS. Funding compatibility is indicative and is not official NSFAS approval. Match scores are StaySure decision-support scores, not official ratings.", "amber", "alert") + "</div>" +
        '<p class="foot-copy">© 2026 StaySure · Johannesburg, South Africa · POPIA-aware demo build</p>' +
        "</div></footer>"
    };
  }

  S.register("landing", landing);

  /* ======================================================================
     2. Onboarding
     ====================================================================== */

  const onboardStep = { n: 1 };
  const draft = {
    university: "University of the Witwatersrand",
    band: "b3",
    budget: 3500,
    funding: "nsfas",
    priorities: ["affordability", "campus", "wifi", "safety"]
  };

  function matchingCount(budget) {
    return D.PROPERTIES.filter(function (p) { return p.price <= budget; }).length;
  }

  function onboarding() {
    const total = 4;

    function optSet(items, currentVal, multi, name) {
      return items.map(function (it) {
        const key = it.key == null ? it.id : it.key;
        const on = multi ? currentVal.indexOf(key) > -1 : currentVal === key;
        return '<button class="opt' + (on ? " is-selected" : "") + (it.disabled ? " is-disabled" : "") + '" type="button" ' +
          (it.disabled ? 'aria-disabled="true"' : "") +
          ' data-opt="' + S.esc(key) + '" data-name="' + S.esc(name) + '" aria-pressed="' + on + '">' +
          '<span class="opt-mark' + (multi ? " opt-mark--box" : "") + '">' + (multi ? S.icon("check", 13) : "") + "</span>" +
          '<span class="opt-body"><span class="opt-title">' + S.esc(it.label) + "</span>" +
          (it.sub ? '<span class="opt-sub">' + S.esc(it.sub) + "</span>" : "") + "</span>" +
          (it.right ? '<span class="opt-right">' + it.right + "</span>" : "") +
          "</button>";
      }).join("");
    }

    let body = "";

    if (onboardStep.n === 1) {
      body = '<h1 class="h-section mb-16">Where do you study?</h1>' +
        '<p class="sub mb-24">We only show accommodation near your campus. We are starting with Wits and will add more institutions.</p>' +
        '<div class="stack gap-10">' + optSet([
          { key: "University of the Witwatersrand", label: "University of the Witwatersrand", sub: "Johannesburg · Braamfontein, Parktown and surrounds" },
          { key: "UJ", label: "University of Johannesburg", sub: "Coming soon", disabled: true },
          { key: "TUT", label: "Tshwane University of Technology", sub: "Coming soon", disabled: true },
          { key: "Other", label: "Another institution", sub: "Coming soon", disabled: true }
        ], draft.university, false, "university") + "</div>";
    } else if (onboardStep.n === 2) {
      body = '<h1 class="h-section mb-16">What is your monthly budget?</h1>' +
        '<p class="sub mb-24">Include rent only — we will help you work out transport and utilities later.</p>' +
        '<div class="stack gap-10">' + D.BUDGET_BANDS.map(function (b) {
          const on = draft.band === b.id;
          const n = matchingCount(b.value);
          return '<button class="opt' + (on ? " is-selected" : "") + '" type="button" data-band="' + b.id + '" aria-pressed="' + on + '">' +
            '<span class="opt-mark"></span>' +
            '<span class="opt-body"><span class="opt-title">' + S.esc(b.label) + "</span>" +
            '<span class="opt-sub">' + S.esc(b.sub) + "</span></span>" +
            '<span class="opt-right"><span class="pill pill--navy">' + n + " places</span></span>" +
            "</button>";
        }).join("") + "</div>";
    } else if (onboardStep.n === 3) {
      body = '<h1 class="h-section mb-16">How will you fund your stay?</h1>' +
        '<p class="sub mb-24">We use this to flag listings that state funding compatibility. It is always shown as indicative.</p>' +
        '<div class="stack gap-10">' + optSet(D.FUNDING, draft.funding, false, "funding") + "</div>" +
        '<div class="mt-18">' + S.note("Funding compatibility is reported by providers and checked by StaySure, but it is <b>not</b> official NSFAS approval.", "amber", "alert") + "</div>";
    } else {
      body = '<h1 class="h-section mb-16">What matters most to you?</h1>' +
        '<p class="sub mb-24">Choose as many as you like. These priorities shape your match score and recommendations.</p>' +
        '<div class="grid-2 gap-10">' + optSet(D.PRIORITIES.map(function (p) { return { key: p.key, label: p.label }; }), draft.priorities, true, "priorities") + "</div>";
    }

    const canContinue = onboardStep.n === 1 ? !!draft.university
      : onboardStep.n === 2 ? !!draft.band
        : onboardStep.n === 3 ? !!draft.funding
          : draft.priorities.length > 0;

    return {
      title: "Tell us what you need",
      html: '<div class="wrap wrap--narrow onboard">' +
        /* No data-go here: the step handler owns this button, so it must not
           also trigger the global [data-go] navigation. */
        '<button class="backrow" type="button" data-ob-backrow>' + S.icon("chevronLeft", 16) +
        "<span>" + (onboardStep.n > 1 ? "Back" : "Back to home") + "</span></button>" +
        '<div class="onboard-head">' +
        '<div class="row row--between mb-10"><span class="small strong muted">Step ' + onboardStep.n + " of " + total + "</span>" +
        '<span class="small muted">' + (onboardStep.n === total ? "Last step" : "About a minute") + "</span></div>" +
        '<div class="progress"><span style="width:' + (onboardStep.n / total * 100) + '%"></span></div>' +
        "</div>" +
        '<div class="onboard-body">' + body + "</div>" +
        '<div class="onboard-foot">' +
        (onboardStep.n > 1 ? '<button class="btn btn--ghost" type="button" data-ob-back>Back</button>' : "") +
        '<button class="btn ' + (onboardStep.n === total ? "btn--green" : "") + ' grow" type="button" data-ob-next' +
        (canContinue ? "" : " disabled") + ">" +
        (onboardStep.n === total ? "Show My Options" : "Continue") + " " + S.icon("arrowRight", 16) + "</button>" +
        "</div></div>",
      mount: function (root) {
        root.querySelectorAll("[data-opt]").forEach(function (b) {
          b.addEventListener("click", function () {
            if (b.classList.contains("is-disabled")) return;
            const name = b.getAttribute("data-name");
            const val = b.getAttribute("data-opt");
            if (name === "priorities") {
              const i = draft.priorities.indexOf(val);
              if (i > -1) draft.priorities.splice(i, 1); else draft.priorities.push(val);
            } else if (name === "university") {
              draft.university = val;
            } else if (name === "funding") {
              draft.funding = val;
            }
            S.renderRoute();
          });
        });

        root.querySelectorAll("[data-band]").forEach(function (b) {
          b.addEventListener("click", function () {
            draft.band = b.getAttribute("data-band");
            const band = D.BUDGET_BANDS.filter(function (x) { return x.id === draft.band; })[0];
            draft.budget = band.value;
            S.renderRoute();
          });
        });

        const back = root.querySelector("[data-ob-back]");
        if (back) back.addEventListener("click", function () {
          if (onboardStep.n > 1) { onboardStep.n--; S.renderRoute(); }
        });
        const br = root.querySelector("[data-ob-backrow]");
        if (br) br.addEventListener("click", function () {
          if (onboardStep.n > 1) { onboardStep.n--; S.renderRoute(); }
          else S.go("/landing");
        });

        const next = root.querySelector("[data-ob-next]");
        if (next) next.addEventListener("click", function () {
          if (onboardStep.n < total) {
            onboardStep.n++;
            S.renderRoute();
            return;
          }
          /* Finish: save profile and set sensible starting filters */
          const st = S.state;
          st.profile.university = draft.university;
          st.profile.band = draft.band;
          st.profile.budget = draft.budget;
          st.profile.funding = draft.funding;
          st.profile.priorities = draft.priorities.slice();
          st.onboarded = true;
          st.filters = D.defaultFilters();
          st.filters.max = Math.min(6000, draft.budget + 500);
          if (draft.funding === "nsfas") st.filters.nsfas = true;
          S.save();
          onboardStep.n = 1;
          S.go("/results", true);
          setTimeout(function () { S.toast("Showing options personalised for you"); }, 240);
        });
      }
    };
  }

  S.register("onboarding", onboarding);

  /* ======================================================================
     3. Search
     ====================================================================== */

  const searchDraft = { location: "", budget: "", distance: "", type: "", funding: "" };

  function search() {
    const st = S.state;
    const recs = D.recommended(st.profile, 3);
    const pr = st.profile;
    const fundingLabel = (D.FUNDING.filter(function (f) { return f.id === pr.funding; })[0] || {}).label || "Self-funded";

    const recCards = recs.map(function (r, i) {
      return '<a class="rec-row" href="#/detail/' + r.p.id + '">' +
        '<span class="rec-thumb"><img src="' + r.p.images[0] + '" alt="' + S.esc(r.p.name) + '" loading="lazy" /></span>' +
        '<span class="grow"><span class="rec-name">' + S.esc(r.p.name) + "</span>" +
        '<span class="rec-meta">' + D.rand(r.p.price) + "/month · " + D.km(r.p.distanceKm) + " from Wits · " + S.esc(r.p.area) + "</span>" +
        '<span class="rec-pills">' + S.verifiedPill(r.p.verified) + "</span></span>" +
        '<span class="rec-score">' + S.scoreRing(r.score, 44, 4, 12) + "</span>" +
        "</a>";
      }).join("");

    return {
      title: "Search accommodation",
      html: '<section class="search-band"><div class="wrap">' +
        '<h1 class="search-h1">Find your student home</h1>' +
        '<p class="search-sub">Near the ' + S.esc(pr.university) + ", Johannesburg</p></div></section>" +
        '<div class="wrap">' +
        '<div class="search-panel">' +
        '<div class="search-grid">' +
        '<div class="field"><label for="s-loc">Location</label><select class="select" id="s-loc">' +
        '<option value="">All areas near Wits</option>' +
        D.AREAS.map(function (a) {
          return '<option value="' + S.esc(a) + '"' + (searchDraft.location === a ? " selected" : "") + ">" + S.esc(a) + "</option>";
        }).join("") + "</select></div>" +
        '<div class="field"><label for="s-budget">Max budget</label><div class="input-money"><span class="cur">R</span>' +
        '<input class="input" id="s-budget" type="number" min="1500" max="8000" step="100" inputmode="numeric" placeholder="' + pr.budget + '" value="' + S.esc(searchDraft.budget) + '" /></div></div>' +
        '<div class="field"><label for="s-dist">Distance from Wits</label><select class="select" id="s-dist">' +
        '<option value="">Any distance</option>' +
        D.DISTANCE_OPTIONS.map(function (d) {
          return '<option value="' + d.id + '"' + (searchDraft.distance === d.id ? " selected" : "") + ">" + S.esc(d.label) + "</option>";
        }).join("") + "</select></div>" +
        '<div class="field"><label for="s-type">Accommodation type</label><select class="select" id="s-type">' +
        '<option value="">Any type</option>' +
        D.TYPES.map(function (t) {
          return '<option value="' + S.esc(t) + '"' + (searchDraft.type === t ? " selected" : "") + ">" + S.esc(t) + "</option>";
        }).join("") + "</select></div>" +
        '<div class="field"><label for="s-fund">Funding</label><select class="select" id="s-fund">' +
        '<option value="">Any funding</option>' +
        D.FUNDING.map(function (f) {
          return '<option value="' + f.id + '"' + (searchDraft.funding === f.id ? " selected" : "") + ">" + S.esc(f.label) + "</option>";
        }).join("") + "</select></div>" +
        '<div class="field field--btn"><span class="field-label hide-mobile">&nbsp;</span>' +
        '<button class="btn btn--green" type="button" data-do-search>' + S.icon("search", 16) + "Search</button></div>" +
        "</div></div>" +

        '<div class="rec-block">' +
        '<div class="row row--between row--wrap mb-10">' +
        "<div><h2 class=\"h-card\">Recommended for you</h2>" +
        '<p class="small muted mt-6">Based on your ' + D.rand(pr.budget) + " budget, " + S.esc(fundingLabel) + " funding and " + pr.priorities.length + " priorities</p></div>" +
        '<a class="btn btn--quiet" href="#/recs">See why ' + S.icon("chevronRight", 14) + "</a></div>" +
        '<div class="rec-list" role="region" aria-label="Recommended accommodation">' + recCards + "</div></div>" +

        '<div class="mt-32">' + S.note("Match scores and recommendations are based on the preferences you gave us. They are decision support, not a rating of the property.", null, "info") + "</div>" +
        "</div>",
      mount: function (root) {
        const bind = function (id, key) {
          const node = root.querySelector(id);
          if (node) node.addEventListener("change", function () { searchDraft[key] = node.value; });
        };
        bind("#s-loc", "location");
        bind("#s-budget", "budget");
        bind("#s-dist", "distance");
        bind("#s-type", "type");
        bind("#s-fund", "funding");

        const btn = root.querySelector("[data-do-search]");
        if (btn) btn.addEventListener("click", function () {
          const f = D.defaultFilters();
          f.location = searchDraft.location;
          f.max = Number(searchDraft.budget) || 6000;
          if (searchDraft.distance) f.dist = [searchDraft.distance];
          if (searchDraft.type) f.types = [searchDraft.type];
          if (searchDraft.funding === "nsfas") f.nsfas = true;
          if (searchDraft.funding === "self" || searchDraft.funding === "other") f.self = true;
          S.state.filters = f;
          S.save();
          S.go("/results");
        });
      }
    };
  }

  S.register("search", search);

  /* ======================================================================
     4. Search Results
     ====================================================================== */

  let draftFilters = null;

  function filtersClone(f) {
    return JSON.parse(JSON.stringify(f));
  }

  function distanceGroup(f, onToggle) {
    return D.DISTANCE_OPTIONS.map(function (d) {
      const on = f.dist.indexOf(d.id) > -1;
      return '<button class="opt opt--sm' + (on ? " is-selected" : "") + '" type="button" data-fdist="' + d.id + '" aria-pressed="' + on + '">' +
        '<span class="opt-mark opt-mark--box">' + S.icon("check", 12) + "</span>" +
        '<span class="opt-body"><span class="opt-title">' + S.esc(d.label) + "</span></span></button>";
    }).join("");
  }

  function filterGroups(f, prefix) {
    const p = prefix || "";
    const pricePct = function (v) { return ((v - 1500) / (6000 - 1500)) * 100; };

    return '<div class="fgroup">' +
      '<div class="fgroup-head"><b>Price per month</b><span class="small muted num">' + D.rand(f.min) + " – " + D.rand(f.max) + "</span></div>" +
      '<div class="range-wrap">' +
      '<div class="range-track"><span class="range-fill" style="left:' + pricePct(f.min) + "%;right:" + (100 - pricePct(f.max)) + '%"></span></div>' +
      '<input class="range range--min" type="range" min="1500" max="6000" step="100" value="' + f.min + '" data-fprice="min" aria-label="Minimum price" />' +
      '<input class="range range--max" type="range" min="1500" max="6000" step="100" value="' + f.max + '" data-fprice="max" aria-label="Maximum price" />' +
      "</div>" +
      '<div class="range-ends small muted"><span>R1,500</span><span>R6,000</span></div>' +
      "</div>" +

      '<div class="fgroup"><div class="fgroup-head"><b>Distance from Wits</b></div>' +
      '<div class="fgrid">' + distanceGroup(f) + "</div></div>" +

      '<div class="fgroup"><div class="fgroup-head"><b>Verification</b></div>' +
      '<div class="stack gap-8">' +
      '<button class="opt opt--sm' + (f.verified ? " is-selected" : "") + '" type="button" data-ftoggle="verified" aria-pressed="' + f.verified + '">' +
      '<span class="opt-mark opt-mark--box">' + S.icon("check", 12) + '</span><span class="opt-body"><span class="opt-title">Verified only</span></span></button>' +
      '<button class="opt opt--sm' + (f.accredited ? " is-selected" : "") + '" type="button" data-ftoggle="accredited" aria-pressed="' + f.accredited + '">' +
      '<span class="opt-mark opt-mark--box">' + S.icon("check", 12) + '</span><span class="opt-body"><span class="opt-title">Accreditation confirmed</span></span></button>' +
      "</div></div>" +

      '<div class="fgroup"><div class="fgroup-head"><b>Funding</b></div>' +
      '<div class="stack gap-8">' +
      '<button class="opt opt--sm' + (f.nsfas ? " is-selected" : "") + '" type="button" data-ftoggle="nsfas" aria-pressed="' + f.nsfas + '">' +
      '<span class="opt-mark opt-mark--box">' + S.icon("check", 12) + '</span><span class="opt-body"><span class="opt-title">NSFAS compatible</span></span></button>' +
      '<button class="opt opt--sm' + (f.self ? " is-selected" : "") + '" type="button" data-ftoggle="self" aria-pressed="' + f.self + '">' +
      '<span class="opt-mark opt-mark--box">' + S.icon("check", 12) + '</span><span class="opt-body"><span class="opt-title">Self-funded</span></span></button>' +
      "</div></div>" +

      '<div class="fgroup"><div class="fgroup-head"><b>Facilities</b><span class="small muted">must have all</span></div>' +
      '<div class="chips-wrap">' + D.FACILITIES.map(function (fac) {
        const on = f.facilities.indexOf(fac.key) > -1;
        return '<button class="chip chip--sm' + (on ? " is-on" : "") + '" type="button" data-ffac="' + fac.key + '" aria-pressed="' + on + '">' + S.esc(fac.label) + "</button>";
      }).join("") + "</div></div>" +

      '<div class="fgroup"><div class="fgroup-head"><b>Accommodation type</b><span class="small muted">any of</span></div>' +
      '<div class="chips-wrap">' + D.TYPES.map(function (t) {
        const on = f.types.indexOf(t) > -1;
        return '<button class="chip chip--sm' + (on ? " is-on" : "") + '" type="button" data-ftype="' + S.esc(t) + '" aria-pressed="' + on + '">' + S.esc(t) + "</button>";
      }).join("") + "</div></div>" +

      '<div class="fgroup fgroup--last"><div class="fgroup-head"><b>Sort results</b></div>' +
      '<select class="select" data-fsort aria-label="Sort results">' +
      [["match", "Best match"], ["price", "Lowest price"], ["distance", "Closest to Wits"], ["rating", "Highest rated"]]
        .map(function (o) { return '<option value="' + o[0] + '"' + (f.sort === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") +
      "</select></div>";
  }

  function results(id) {
    const st = S.state;
    const f = st.filters;
    const pr = st.profile;
    const list = D.applyFilters(f, pr);
    const activeCount = D.countActiveFilters(f);
    const fundingLabel = (D.FUNDING.filter(function (x) { return x.id === pr.funding; })[0] || {}).label || "Self-funded";
    const showMap = window._ssShowMap !== false;

    const cards = list.map(function (item) { return S.propertyCard(item, pr); }).join("");

    const pins = list.slice(0, 5).map(function (item, i) {
      const spots = [[24, 66], [62, 52], [38, 28], [76, 72], [52, 74]];
      return { label: D.rand(item.p.price).replace("R", "R"), x: spots[i][0], y: spots[i][1], tone: i === 0 ? "green" : "" };
    });

    const empty = '<div class="empty-state card card--pad">' +
      '<span class="empty-ico">' + S.icon("search", 26) + "</span>" +
      "<h3>No places match these filters</h3>" +
      '<p class="sub mt-6">Try widening your budget or removing a facility requirement. Some facilities are only listed for verified properties.</p>' +
      '<button class="btn mt-18" type="button" data-clear-all>Clear filters</button></div>';

    return {
      title: list.length + " places near Wits",
      html: '<div class="wrap results-wrap">' +
        '<div class="results-head">' +
        '<div class="grow">' +
        '<h1 class="h-page">' + list.length + " place" + (list.length === 1 ? "" : "s") + " near Wits</h1>" +
        '<p class="sub mt-6">Personalised for a ' + D.rand(pr.budget) + " budget · " + S.esc(fundingLabel) + " funding · " + pr.priorities.length + " priorities</p>" +
        "</div>" +
        '<div class="results-tools">' +
        '<label class="sr-only" for="sort-top">Sort results</label>' +
        '<select class="select select--sm" id="sort-top" data-fsort>' +
        [["match", "Best match"], ["price", "Lowest price"], ["distance", "Closest to Wits"], ["rating", "Highest rated"]]
          .map(function (o) { return '<option value="' + o[0] + '"' + (f.sort === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") +
        "</select>" +
        '<button class="btn btn--ghost btn--sm hide-mobile" type="button" data-map-toggle aria-pressed="' + showMap + '">' +
        S.icon("mapPin", 15) + (showMap ? "Hide map" : "Show map") + "</button>" +
        "</div></div>" +

        '<div class="chips-row">' +
        '<button class="chip chip--filters" type="button" data-open-filters>' + S.icon("filter", 15) + "Filters" +
        (activeCount ? ' <span class="chip-n">' + activeCount + "</span>" : "") + "</button>" +
        '<button class="chip' + (f.verified ? " is-on" : "") + '" type="button" data-quick="verified" aria-pressed="' + f.verified + '">Verified</button>' +
        '<button class="chip' + (f.nsfas ? " is-on" : "") + '" type="button" data-quick="nsfas" aria-pressed="' + f.nsfas + '">NSFAS compatible</button>' +
        '<button class="chip' + (f.dist.length === 1 && f.dist[0] === "u1" ? " is-on" : "") + '" type="button" data-quick="u1">Under 1 km</button>' +
        '<button class="chip' + (f.max <= pr.budget ? " is-on" : "") + '" type="button" data-quick="budget">Under ' + D.rand(pr.budget) + "</button>" +
        (activeCount || f.max <= pr.budget ? '<button class="chip chip--quiet" type="button" data-clear-all>Clear all</button>' : "") +
        "</div>" +

        (showMap ? '<div class="results-map hide-mobile">' + S.miniMap(pins, 200) + "</div>" : "") +

        '<div class="results-layout">' +
        '<aside class="filters-side hide-mobile" aria-label="Filters"><div class="filters-card">' +
        '<div class="row row--between mb-10"><b>Filters</b>' + (activeCount ? '<button class="btn btn--quiet" type="button" data-clear-all>Reset</button>' : "") + "</div>" +
        filterGroups(f) +
        "</div></aside>" +
        '<div class="results-main">' + (list.length ? '<div class="pgrid">' + cards + "</div>" : empty) + "</div>" +
        "</div></div>",

      mount: function (root) {
        /* Sort (top control). The sidebar's own sort select is handled by
           bindFilterEvents below, so scope this to #sort-top to avoid double binding. */
        const topSort = root.querySelector("#sort-top");
        if (topSort) topSort.addEventListener("change", function () {
          S.state.filters.sort = topSort.value;
          S.save();
          S.renderRoute();
        });

        /* Map toggle */
        const mt = root.querySelector("[data-map-toggle]");
        if (mt) mt.addEventListener("click", function () {
          window._ssShowMap = window._ssShowMap === false;
          S.renderRoute();
        });

        /* Quick toggles */
        root.querySelectorAll("[data-quick]").forEach(function (b) {
          b.addEventListener("click", function () {
            const k = b.getAttribute("data-quick");
            const f2 = S.state.filters;
            if (k === "verified") f2.verified = !f2.verified;
            else if (k === "nsfas") f2.nsfas = !f2.nsfas;
            else if (k === "u1") f2.dist = f2.dist.length === 1 && f2.dist[0] === "u1" ? [] : ["u1"];
            else if (k === "budget") f2.max = f2.max <= pr.budget ? 6000 : pr.budget;
            S.save();
            S.renderRoute();
          });
        });

        const clearAll = function () {
          S.state.filters = D.defaultFilters();
          S.save();
          S.renderRoute();
          S.toast("Filters cleared");
        };
        root.querySelectorAll("[data-clear-all]").forEach(function (b) { b.addEventListener("click", clearAll); });

        /* Sidebar (live) filters */
        bindFilterEvents(root.querySelector(".filters-side"), function () {
          S.save();
          S.renderRoute();
        }, true);

        /* Mobile filter sheet */
        const openBtn = root.querySelector("[data-open-filters]");
        if (openBtn) openBtn.addEventListener("click", function () {
          draftFilters = filtersClone(S.state.filters);
          const needed = function () { return D.applyFilters(draftFilters, pr).length; };

          const sheet = S.openSheet({
            title: "Filters",
            sub: "Results update as you choose",
            wide: false,
            body: filterGroups(draftFilters, "m"),
            foot: '<button class="btn btn--ghost" type="button" data-sheet-reset>Reset</button>' +
              '<button class="btn btn--green grow" type="button" data-sheet-apply>Show ' + needed() + " places</button>"
          });

          const applyBtn = function () { return sheet.overlay.querySelector("[data-sheet-apply]"); };

          const paint = function () {
            /* Re-render the sheet body so pressed states reflect the draft,
               keeping the scroll position so the sheet doesn't jump. */
            const scroll = sheet.body.scrollTop;
            sheet.body.innerHTML = filterGroups(draftFilters, "m");
            sheet.body.scrollTop = scroll;
            bindFilterEvents(sheet.body, onChange, false);
            const b = applyBtn();
            if (b) b.textContent = "Show " + needed() + " places";
          };

          const onChange = function () { paint(); };

          bindFilterEvents(sheet.body, onChange, false);

          sheet.overlay.querySelector("[data-sheet-reset]").addEventListener("click", function () {
            draftFilters = D.defaultFilters();
            S.state.filters = D.defaultFilters();
            S.save();
            sheet.close();
            S.renderRoute();
            S.toast("Filters reset");
          });

          sheet.overlay.querySelector("[data-sheet-apply]").addEventListener("click", function () {
            S.state.filters = draftFilters;
            S.save();
            sheet.close();
            S.renderRoute();
          });
        });
      }
    };
  }

  /* Wire filter inputs inside a container. `live` re-renders the whole page. */
  function bindFilterEvents(container, onChange, live, sheet) {
    if (!container) return;

    const current = function () { return live ? S.state.filters : draftFilters; };

    container.querySelectorAll("[data-fprice]").forEach(function (input) {
      /* While dragging, update only the track fill and value label. A full
         re-render here would destroy the slider mid-drag, so commit on `change`. */
      input.addEventListener("input", function () {
        const f = current();
        const which = input.getAttribute("data-fprice");
        let v = Number(input.value);
        if (which === "min") {
          if (v > f.max - 100) v = f.max - 100;
          f.min = v;
        } else {
          if (v < f.min + 100) v = f.min + 100;
          f.max = v;
        }
        const group = input.closest(".fgroup");
        if (!group) return;
        const pct = function (val) { return ((val - 1500) / (6000 - 1500)) * 100; };
        const lbl = group.querySelector(".fgroup-head .num");
        if (lbl) lbl.textContent = D.rand(f.min) + " – " + D.rand(f.max);
        const fill = group.querySelector(".range-fill");
        if (fill) {
          fill.style.left = pct(f.min) + "%";
          fill.style.right = (100 - pct(f.max)) + "%";
        }
      });
      input.addEventListener("change", function () { onChange(); });
    });

    container.querySelectorAll("[data-fdist]").forEach(function (b) {
      b.addEventListener("click", function () {
        const f = current();
        const id2 = b.getAttribute("data-fdist");
        const i = f.dist.indexOf(id2);
        if (i > -1) f.dist.splice(i, 1); else f.dist.push(id2);
        onChange();
      });
    });

    container.querySelectorAll("[data-ftoggle]").forEach(function (b) {
      b.addEventListener("click", function () {
        const f = current();
        const k = b.getAttribute("data-ftoggle");
        f[k] = !f[k];
        onChange();
      });
    });

    container.querySelectorAll("[data-ffac]").forEach(function (b) {
      b.addEventListener("click", function () {
        const f = current();
        const k = b.getAttribute("data-ffac");
        const i = f.facilities.indexOf(k);
        if (i > -1) f.facilities.splice(i, 1); else f.facilities.push(k);
        onChange();
      });
    });

    container.querySelectorAll("[data-ftype]").forEach(function (b) {
      b.addEventListener("click", function () {
        const f = current();
        const k = b.getAttribute("data-ftype");
        const i = f.types.indexOf(k);
        if (i > -1) f.types.splice(i, 1); else f.types.push(k);
        onChange();
      });
    });

    container.querySelectorAll("[data-fsort]").forEach(function (sel) {
      sel.addEventListener("change", function () {
        current().sort = sel.value;
        onChange();
      });
    });
  }

  S.register("results", results);

  /* Expose for other modules */
  S.filterGroups = filterGroups;
  S.bindFilterEvents = bindFilterEvents;
  S.filtersClone = filtersClone;
  Object.defineProperty(S, "draftFilters", {
    get: function () { return draftFilters; },
    set: function (v) { draftFilters = v; }
  });
})();
