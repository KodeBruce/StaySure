/* ==========================================================================
   StaySure — Detail, Verification, Compare, Affordability, Recommendations
   ========================================================================== */

(function () {
  "use strict";

  const D = window.SSData;
  const S = window.SS;

  const galleryIndex = {};

  function applyNowBtn(p, cls) {
    const disabled = p.verified !== "verified";
    return '<a class="btn btn--green ' + (cls || "") + '" href="' + (disabled ? "#" : "#/apply/" + p.id) + '"' +
      (disabled ? ' aria-disabled="true" tabindex="-1" data-blocked-apply="' + p.id + '"' : "") + ">Apply Now</a>";
  }

  /* ======================================================================
     6. Accommodation detail
     ====================================================================== */

  function detail(id) {
    const p = D.getProperty(id) || D.PROPERTIES[0];
    const st = S.state;
    const pr = st.profile;
    const m = D.matchScore(p, pr);
    const gi = galleryIndex[p.id] || 0;
    const saved = st.saved.indexOf(p.id) > -1;
    const comparing = st.compare.indexOf(p.id) > -1;
    const over = p.price - pr.budget;
    const funded = pr.funding === "nsfas" || pr.funding === "university";
    const fundOk = funded ? p.nsfas : true;
    const missing = D.FACILITIES.filter(function (f) { return p.facilities.indexOf(f.key) === -1; });

    /* record view */
    const idx = st.viewed.indexOf(p.id);
    if (idx > -1) st.viewed.splice(idx, 1);
    st.viewed.unshift(p.id);
    if (st.viewed.length > 6) st.viewed.length = 6;
    S.save();

    const allFacs = D.FACILITIES.map(function (f) {
      const has = p.facilities.indexOf(f.key) > -1;
      return '<div class="fac-cell' + (has ? "" : " is-missing") + '">' + S.icon(f.icon, 18) + "<span>" + S.esc(f.label) + "</span></div>";
    }).join("");

    return {
      title: p.name,
      html: '<div class="wrap">' +
        '<div class="detail-topbar">' +
        S.backRow("Back to results", "#/results") +
        '<div class="row">' +
        '<button class="icon-btn" type="button" data-share="' + p.id + '" aria-label="Share ' + S.esc(p.name) + '">' + S.icon("share", 17) + "</button>" +
        '<button class="icon-btn' + (saved ? " is-saved" : "") + '" type="button" data-save="' + p.id + '" aria-pressed="' + saved + '" aria-label="' + (saved ? "Remove from saved" : "Save property") + '">' + S.icon("heart", 17) + "</button>" +
        "</div></div>" +

        '<div class="gallery">' +
        '<div class="gallery-main"><img src="' + p.images[gi] + '" alt="' + S.esc(p.name + " — photo " + (gi + 1)) + '" /></div>' +
        '<div class="gallery-thumbs">' +
        p.images.map(function (src, i) {
          return '<button class="gallery-thumb' + (i === gi ? " is-active" : "") + '" type="button" data-gthumb="' + i + '" aria-label="Show photo ' + (i + 1) + '" aria-pressed="' + (i === gi) + '">' +
            '<img src="' + src + '" alt="" loading="lazy" /></button>';
        }).join("") +
        "</div></div>" +

        '<div class="detail-layout">' +
        '<div class="detail-main">' +

        '<div class="detail-head">' +
        '<button class="verify-pill" type="button" data-verify-sheet="' + p.id + '">' + S.icon("shield", 15) +
        (p.verified === "verified" ? "StaySure Verified" : p.verified === "pending" ? "Verification pending" : "Not yet verified") +
        S.icon("chevronRight", 13) + "</button>" +
        '<div class="detail-typepills"><span class="pill pill--navy">' + S.esc(p.type) + "</span>" +
        '<span class="pill pill--grey">' + S.esc(p.area) + "</span>" +
        (p.accredited ? '<span class="pill pill--green">Accreditation confirmed</span>' : "") + "</div>" +
        '<h1 class="detail-h1">' + S.esc(p.name) + "</h1>" +
        '<div class="detail-meta">' +
        "<span>" + S.icon("mapPin", 15) + S.esc(p.area) + " · " + D.km(p.distanceKm) + " from Wits</span>" +
        S.stars(p.rating, p.reviewsCount) +
        "<span>" + S.icon("users", 15) + p.beds + " beds · " + p.available + " available</span>" +
        "</div></div>" +

        '<section class="card card--pad afford-card" aria-labelledby="afford-h">' +
        '<h2 class="h-card mb-16" id="afford-h">Affordability</h2>' +
        '<div class="afford-cells">' +
        '<div class="afford-cell"><span class="ac-label">Your budget</span><b class="ac-val num">' + D.rand(pr.budget) + "</b></div>" +
        '<div class="afford-cell"><span class="ac-label">Property price</span><b class="ac-val num">' + D.rand(p.price) + "</b></div>" +
        '<div class="afford-cell ' + (over > 0 ? "afford-cell--amber" : "afford-cell--green") + '">' +
        '<span class="ac-label">Status</span>' +
        '<b class="ac-val">' + (over > 0 ? D.rand(over) + " over budget" : "Within your budget " + S.icon("check", 16)) + "</b></div>" +
        "</div>" +
        (funded ? '<div class="afford-fund"><span class="small strong">Funding compatibility</span>' +
          (fundOk ? '<span class="pill pill--green">Compatible ' + S.icon("check", 12) + "</span>" : '<span class="pill pill--amber">Not compatible</span>') +
          '<span class="pill pill--amber">Indicative</span></div>' +
          '<p class="tiny muted mt-10">Compatibility reflects what the provider reported and what StaySure checked. It is not official NSFAS approval.</p>' : "") +
        '<a class="btn btn--soft btn--full mt-18" href="#/afford/' + p.id + '">Check the full monthly cost ' + S.icon("arrowRight", 15) + "</a>" +
        "</section>" +

        '<section class="card card--pad trust-card" aria-labelledby="trust-h">' +
        '<div class="row row--between row--wrap mb-10">' +
        '<h2 class="h-card" id="trust-h">Why this property is trusted</h2>' + S.demoTag() + "</div>" +
        '<div class="trust-checks">' +
        p.checks.map(function (c) {
          return '<div class="trust-check"><span class="tc-ico ' + (c.passed ? "is-ok" : "is-pending") + '">' +
            S.icon(c.passed ? "check" : "clock", 13) + "</span><span>" + S.esc(c.title) + "</span></div>";
        }).join("") + "</div>" +
        '<div class="trust-foot">' +
        '<p class="small"><b>Last verified:</b> ' + S.longDate(p.lastVerified) + " · " + p.passedChecks + "/6 checks passed</p>" +
        '<a class="btn btn--ghost btn--sm" href="#/verify/' + p.id + '">View verification details</a>' +
        "</div></section>" +

        '<section class="card card--pad" aria-labelledby="about-h">' +
        '<h2 class="h-card mb-10" id="about-h">About the property</h2>' +
        '<p class="sub">' + S.esc(p.about) + "</p></section>" +

        '<section class="card card--pad" aria-labelledby="fac-h">' +
        '<div class="row row--between mb-10"><h2 class="h-card" id="fac-h">Facilities</h2>' +
        (missing.length ? '<span class="small muted">' + missing.length + " not available</span>" : "") + "</div>" +
        '<div class="fac-grid">' + allFacs + "</div></section>" +

        '<section class="card card--pad" aria-labelledby="loc-h">' +
        '<h2 class="h-card mb-14" id="loc-h">Location</h2>' +
        S.miniMap([{ label: S.esc(p.area), x: 62, y: 40, tone: "green" }], 200) +
        '<div class="loc-stats">' +
        '<div class="loc-stat"><b>' + D.km(p.distanceKm) + "</b><span>from Wits</span></div>" +
        '<div class="loc-stat"><b>' + p.walkMin + " min</b><span>walk</span></div>" +
        '<div class="loc-stat"><b>' + p.taxiMin + " min</b><span>by taxi</span></div>" +
        "</div>" +
        '<p class="tiny muted mt-10">Illustrative map and indicative travel times. Distance is measured to Wits Main Campus.</p></section>' +

        '<section class="card card--pad" aria-labelledby="safety-h">' +
        '<h2 class="h-card mb-10" id="safety-h">Safety</h2>' +
        '<ul class="safety-list">' + p.security.map(function (s2) {
          return '<li>' + S.icon("shield", 15) + S.esc(s2) + "</li>";
        }).join("") + "</ul>" +
        '<div class="mt-14">' + S.note("StaySure does not rate crime levels or neighbourhood safety. These are provider-reported features that were checked during verification.", null, "info") + "</div>" +
        "</section>" +

        '<section class="card card--pad" aria-labelledby="rev-h">' +
        '<div class="row row--between row--wrap mb-14">' +
        '<h2 class="h-card" id="rev-h">Student reviews</h2>' + S.demoTag("Example reviews") + "</div>" +
        '<div class="rev-summary">' +
        '<div class="rev-big"><b>' + String(p.rating).replace(".", ",") + "</b>" + S.stars(p.rating) +
        '<span class="small muted">' + p.reviewsCount + " reviews</span></div>" +
        '<div class="rev-bars">' + [5, 4, 3, 2, 1].map(function (n) {
          const w = n === Math.round(p.rating) ? 62 : n === Math.round(p.rating) - 1 ? 24 : n === 5 ? 10 : 4;
          return '<div class="rev-bar"><span class="small muted">' + n + "★</span><span class=\"rev-track\"><span style=\"width:" + w + '%"></span></span></div>';
        }).join("") + "</div></div>" +
        '<div class="rev-list">' + p.reviews.map(function (r) {
          return '<article class="rev"><div class="rev-head"><span class="avatar avatar--sm">' + S.esc(S.initials(r.name)) + "</span>" +
            "<div><b>" + S.esc(r.name) + "</b><span class=\"tiny muted\">" + S.esc(r.date) + "</span></div>" +
            '<span class="rev-stars">' + S.stars(r.stars) + "</span></div>" +
            '<p class="small">' + S.esc(r.text) + "</p></article>";
        }).join("") + "</div>" +
        '<button class="btn btn--ghost btn--full mt-14" type="button" data-reviews="' + p.id + '">Read all reviews</button>' +
        "</section>" +

        "</div>" +

        '<aside class="detail-side">' +
        '<div class="side-card card card--pad">' +
        '<div class="row row--between"><div>' +
        '<span class="price price--lg num">' + D.rand(p.price) + '</span><span class="per">/month</span>' +
        '<p class="tiny muted">' + S.esc(p.type) + " · " + p.available + " available</p>" +
        "</div>" + S.scoreRing(m.score, 54, 4, 15) + "</div>" +
        '<p class="tiny muted mt-6">' + m.score + "% StaySure prototype match score</p>" +
        '<div class="side-pills">' +
        '<span class="pill ' + (over > 0 ? "pill--amber" : "pill--green") + '">' + (over > 0 ? D.rand(over) + " over budget" : "Within your budget") + "</span>" +
        (p.nsfas ? '<span class="pill pill--navy">NSFAS compatible</span>' : '<span class="pill pill--grey">Self-funded only</span>') +
        "</div>" +
        applyNowBtn(p, "btn--full mt-18") +
        (p.verified !== "verified" ? '<p class="tiny muted tc mt-10">Applications open once verification is complete.</p>' : "") +
        '<button class="btn btn--ghost btn--full mt-10" type="button" data-compare="' + p.id + '" aria-pressed="' + comparing + '">' +
        (comparing ? S.icon("check", 15) + " Comparing" : "Add to compare") + "</button>" +
        '<button class="btn btn--quiet btn--full mt-6" type="button" data-chat="' + p.id + '">' + S.icon("message", 15) + " Message provider</button>" +
        "</div>" +
        "</aside>" +
        "</div>" +

        '<div class="mobile-cta">' +
        '<div class="mc-price"><b class="num">' + D.rand(p.price) + '</b><span class="tiny">' + (over > 0 ? D.rand(over) + " over budget" : "Within budget") + "</span></div>" +
        '<button class="icon-btn" type="button" data-compare="' + p.id + '" aria-label="Add to compare">' + S.icon("compare", 17) + "</button>" +
        applyNowBtn(p, "grow") +
        "</div></div>",

      mount: function (root) {
        root.querySelectorAll("[data-gthumb]").forEach(function (b) {
          b.addEventListener("click", function () {
            galleryIndex[p.id] = Number(b.getAttribute("data-gthumb"));
            S.renderRoute();
          });
        });

        const shareBtn = root.querySelector("[data-share]");
        if (shareBtn) shareBtn.addEventListener("click", function () {
          const url = window.location.href;
          if (navigator.share) {
            navigator.share({ title: p.name, text: p.name + " on StaySure", url: url }).catch(function () {});
          } else if (navigator.clipboard) {
            navigator.clipboard.writeText(url).then(function () { S.toast("Link copied to clipboard"); }, function () { S.toast("Could not copy link"); });
          } else {
            S.toast("Share this listing: " + url);
          }
        });

        const vs = root.querySelector("[data-verify-sheet]");
        if (vs) vs.addEventListener("click", function () { openVerificationSheet(p); });

        const rv = root.querySelector("[data-reviews]");
        if (rv) rv.addEventListener("click", function () { openReviewsSheet(p); });

        const ch = root.querySelector("[data-chat]");
        if (ch) ch.addEventListener("click", function () { S.openChat(p); });

        root.querySelectorAll("[data-blocked-apply]").forEach(function (b) {
          b.addEventListener("click", function (e) {
            e.preventDefault();
            S.toast("This listing is not fully verified yet, so applications are closed.");
          });
        });
      }
    };
  }

  S.register("detail", detail);

  /* ======================================================================
     Verification sheet + page
     ====================================================================== */

  function verificationBody(p) {
    return '<div class="vsheet-hero ' + (p.verified === "verified" ? "is-verified" : "is-pending") + '">' +
      '<span class="vsheet-ico">' + S.icon("shield", 28) + "</span>" +
      "<div><b>" + (p.verified === "verified" ? "StaySure Verified" : p.verified === "pending" ? "Verification pending" : "Not yet verified") + "</b>" +
      '<span class="small">Last verified: ' + S.longDate(p.lastVerified) + " · " + p.passedChecks + "/6 checks passed</span></div></div>" +
      '<ul class="vlist">' + p.checks.map(function (c) {
        return '<li class="vrow"><span class="v-ico ' + (c.passed ? "is-ok" : "is-pending") + '">' + S.icon(c.passed ? "check" : "clock", 16) + "</span>" +
          '<span class="grow"><b>' + S.esc(c.title) + "</b><span class=\"small muted\">" + S.esc(c.note) + "</span></span>" +
          (c.passed ? '<span class="pill pill--green">' + S.longDate(c.date).replace(/ \d{4}$/, "") + "</span>" : '<span class="pill pill--amber">Pending</span>') +
          "</li>";
      }).join("") + "</ul>";
  }

  function openVerificationSheet(p) {
    const sheet = S.openSheet({
      title: "Verification summary",
      sub: p.name,
      body: verificationBody(p) + '<div class="mt-18">' + S.note("StaySure verification confirms identity, listing accuracy and availability. It is not a guarantee of quality, and funding compatibility is always indicative.", null, "info") + "</div>",
      foot: '<a class="btn btn--ghost" href="#/verify/' + p.id + '">Full details</a>' +
        '<button class="btn grow" type="button" data-sheet-close>Done</button>'
    });
    sheet.overlay.querySelectorAll("[data-sheet-close]").forEach(function (b) { b.addEventListener("click", S.closeSheet); });
    return sheet;
  }

  function verification(id) {
    const p = D.getProperty(id) || D.PROPERTIES[0];
    const verified = p.verified === "verified";

    return {
      title: "Verification — " + p.name,
      html: '<div class="wrap wrap--mid">' +
        S.backRow("Back to property", "#/detail/" + p.id) +
        '<div class="vpage-hero ' + (verified ? "is-verified" : "is-pending") + '">' +
        '<span class="vp-ico">' + S.icon("shield", 30) + "</span>" +
        "<div><h1 class=\"h-page\">" + (verified ? "StaySure Verified" : p.verified === "pending" ? "Verification pending" : "Not yet verified") + "</h1>" +
        '<p class="small mt-6">' + S.esc(p.name) + " · Last verified: " + S.longDate(p.lastVerified) + "</p>" +
        '<p class="small"><b>' + p.passedChecks + "/6 checks passed</b></p></div></div>" +

        '<section class="card card--pad mt-24"><h2 class="h-card mb-14">What we checked</h2>' +
        '<ul class="vlist">' + p.checks.map(function (c) {
          return '<li class="vrow"><span class="v-ico ' + (c.passed ? "is-ok" : "is-pending") + '">' + S.icon(c.passed ? "check" : "clock", 16) + "</span>" +
            '<span class="grow"><b>' + S.esc(c.title) + "</b><span class=\"small muted\">" + S.esc(c.note) + "</span></span>" +
            (c.passed ? '<span class="pill pill--green">' + S.longDate(c.date) + "</span>" : '<span class="pill pill--amber">Pending</span>') + "</li>";
        }).join("") + "</ul></section>" +

        '<div class="explain-grid mt-24">' +
        '<div class="card card--pad"><h3 class="h-card">Who verifies?</h3><p class="small muted mt-6">A StaySure verification officer checks provider identity documents, the physical property and the listed details against the provider\'s records.</p></div>' +
        '<div class="card card--pad"><h3 class="h-card">How often?</h3><p class="small muted mt-6">Full checks are repeated annually and availability is confirmed monthly. A "last verified" date is always shown so you know how current the information is.</p></div>' +
        '<div class="card card--pad"><h3 class="h-card">Something wrong?</h3><p class="small muted mt-6">Report a concern and our team will re-check the listing. Verified status is removed while a report is investigated.</p></div>' +
        "</div>" +

        '<div class="mt-24">' + S.note("<b>What verification does not mean.</b> It is not a quality guarantee or a safety rating of the area, and it is not confirmation of NSFAS approval. Always view the property and read the lease before paying a deposit.", "amber", "alert") + "</div>" +

        '<div class="row row--wrap mt-24">' +
        '<a class="btn" href="#/detail/' + p.id + '">Back to property</a>' +
        '<button class="btn btn--ghost" type="button" data-report>Report a concern</button></div>' +
        "</div>",
      mount: function (root) {
        const r = root.querySelector("[data-report]");
        if (r) r.addEventListener("click", function () { S.toast("Thanks — our verification team will review this listing."); });
      }
    };
  }

  S.register("verify", verification);

  /* Reviews sheet (shared) */
  function openReviewsSheet(p) {
    const sheet = S.openSheet({
      title: "Student reviews",
      sub: p.name + " · " + p.reviewsCount + " reviews (example data)",
      body: '<div class="rev-list">' + p.reviews.map(function (r) {
        return '<article class="rev"><div class="rev-head"><span class="avatar avatar--sm">' + S.esc(S.initials(r.name)) + "</span>" +
          "<div><b>" + S.esc(r.name) + "</b><span class=\"tiny muted\">" + S.esc(r.date) + "</span></div>" +
          '<span class="rev-stars">' + S.stars(r.stars) + "</span></div>" +
          '<p class="small">' + S.esc(r.text) + "</p></article>";
      }).join("") + "</div>" +
        '<div class="mt-18">' + S.note("These reviews are fictional example content for the prototype. Production reviews must be from verified applicants only.", "amber", "alert") + "</div>",
      foot: '<button class="btn btn--full" type="button" data-sheet-close>Close</button>'
    });
    sheet.overlay.querySelectorAll("[data-sheet-close]").forEach(function (b) { b.addEventListener("click", S.closeSheet); });
  }

  S.openReviewsSheet = openReviewsSheet;

  /* ======================================================================
     8. Compare
     ====================================================================== */

  function compare() {
    const st = S.state;
    const pr = st.profile;
    const items = st.compare.map(function (cid) { return D.getProperty(cid); }).filter(Boolean);

    if (!items.length) {
      return {
        title: "Compare",
        html: '<div class="wrap wrap--mid">' + S.backRow("Back", "#/results") +
          '<div class="empty-state card card--pad mt-14">' +
          '<span class="empty-ico">' + S.icon("compare", 26) + "</span>" +
          "<h1 class=\"h-section\">Nothing to compare yet</h1>" +
          '<p class="sub mt-10">Add up to three properties to see them side by side — price, distance, verification, funding and facilities.</p>' +
          '<div class="row row--wrap mt-24" style="justify-content:center">' +
          '<a class="btn" href="#/results">Browse places</a>' +
          '<button class="btn btn--ghost" type="button" data-demo-compare>Try a demo comparison</button></div></div></div>',
        mount: function (root) {
          const b = root.querySelector("[data-demo-compare]");
          if (b) b.addEventListener("click", function () {
            S.state.compare = ["braam-student-village", "parkview-house", "milpark-gardens"];
            S.save();
            S.renderRoute();
            S.toast("Demo comparison loaded");
          });
        }
      };
    }

    const tiles = D.decisionTiles(items, pr);

    const rows = [
      { label: "Monthly price", get: function (p) { return { html: '<b class="num ' + (p.price <= pr.budget ? "txt-green" : "txt-amber") + '">' + D.rand(p.price) + "</b>", val: p.price }; } },
      { label: "Total monthly cost", get: function (p) {
        const t = p.price + (p.distanceKm <= 1.5 ? 500 : p.distanceKm <= 3 ? 750 : 1000) + 300;
        return { html: '<span class="num">' + D.rand(t) + "</span>", val: t };
      } },
      { label: "Distance from Wits", get: function (p) { return { html: D.km(p.distanceKm), val: p.distanceKm }; } },
      { label: "Verification", get: function (p) { return { html: S.verifiedPill(p.verified), val: p.verified }; } },
      { label: "Funding compatibility", get: function (p) { return { html: p.nsfas ? '<span class="pill pill--navy">NSFAS compatible</span>' : '<span class="pill pill--grey">Self-funded only</span>', val: p.nsfas }; } },
      { label: "Accommodation type", get: function (p) { return { html: S.esc(p.type), val: p.type }; } },
      { label: "Wi-Fi", get: function (p) { return { html: p.facilities.indexOf("wifi") > -1 ? S.icon("check", 18) : S.icon("x", 16), val: p.facilities.indexOf("wifi") > -1 }; } },
      { label: "Security", get: function (p) { return { html: p.facilities.indexOf("security") > -1 ? S.icon("check", 18) : S.icon("x", 16), val: p.facilities.indexOf("security") > -1 }; } },
      { label: "Laundry", get: function (p) { return { html: p.facilities.indexOf("laundry") > -1 ? S.icon("check", 18) : S.icon("x", 16), val: p.facilities.indexOf("laundry") > -1 }; } },
      { label: "Study area", get: function (p) { return { html: p.facilities.indexOf("study") > -1 ? S.icon("check", 18) : S.icon("x", 16), val: p.facilities.indexOf("study") > -1 }; } },
      { label: "Furnished", get: function (p) { return { html: p.facilities.indexOf("furnished") > -1 ? S.icon("check", 18) : S.icon("x", 16), val: p.facilities.indexOf("furnished") > -1 }; } },
      { label: "Meals", get: function (p) { return { html: p.facilities.indexOf("meals") > -1 ? S.icon("check", 18) : S.icon("x", 16), val: p.facilities.indexOf("meals") > -1 }; } },
      { label: "Rating", get: function (p) { return { html: String(p.rating).replace(".", ",") + " ★", val: p.rating }; } },
      { label: "Match score", get: function (p) { return { html: '<b class="num">' + D.matchScore(p, pr).score + "%</b>", val: D.matchScore(p, pr).score }; } }
    ];

    const head = '<thead><tr><th class="cmp-lbl" scope="col"><span class="small muted">Comparing ' + items.length + " of 3</span></th>" +
      items.map(function (p) {
        const best = tiles[0].p.id === p.id;
        return '<th scope="col" class="cmp-col"><div class="cmp-head">' +
          '<button class="cmp-x" type="button" data-cmp-remove="' + p.id + '" aria-label="Remove ' + S.esc(p.name) + '">' + S.icon("x", 14) + "</button>" +
          (best ? '<span class="pill pill--green cmp-best">Best overall</span>' : '<span class="cmp-best-spacer" aria-hidden="true"></span>') +
          '<img src="' + p.images[0] + '" alt="" loading="lazy" />' +
          '<a class="cmp-name" href="#/detail/' + p.id + '">' + S.esc(p.name) + "</a>" +
          '<span class="tiny muted">' + S.esc(p.area) + "</span></div></th>";
      }).join("") +
      (items.length < 3 ? '<th scope="col" class="cmp-col cmp-add-col"><button class="cmp-add" type="button" data-add-cmp>' + S.icon("plus", 20) + "<span>Add a property</span></button></th>" : "") +
      "</tr></thead>";

    const body = "<tbody>" + rows.map(function (row) {
      const cells = items.map(function (p) { return row.get(p); });
      const vals = cells.map(function (c) { return JSON.stringify(c.val); });
      const differs = vals.some(function (v) { return v !== vals[0]; });
      let bestIdx = -1;
      if (differs) {
        const numeric = typeof cells[0].val === "number";
        if (numeric) {
          const lowerBetter = row.label === "Monthly price" || row.label === "Total monthly cost" || row.label === "Distance from Wits";
          let best = cells[0].val;
          cells.forEach(function (c) {
            if (lowerBetter ? c.val < best : c.val > best) best = c.val;
          });
          bestIdx = cells.findIndex(function (c) { return c.val === best; });
        } else if (row.label === "Verification") {
          bestIdx = cells.findIndex(function (c) { return c.val === "verified"; });
        }
      }
      return '<tr class="' + (differs ? "is-diff" : "") + '"><th scope="row" class="cmp-lbl">' + S.esc(row.label) +
        (differs ? '<span class="diff-dot" aria-label="differs"></span>' : "") + "</th>" +
        cells.map(function (c, i) {
          return '<td class="' + (i === bestIdx ? "is-best" : "") + '">' + c.html + "</td>";
        }).join("") +
        (items.length < 3 ? '<td class="cmp-add-col"></td>' : "") + "</tr>";
    }).join("") + "</tbody>";

    const actions = "<tfoot><tr><th class=\"cmp-lbl\"></th>" +
      items.map(function (p) {
        return '<td><a class="btn btn--sm btn--full" href="#/detail/' + p.id + '">View</a>' +
          '<a class="btn btn--sm btn--ghost btn--full mt-6" href="#/afford/' + p.id + '">Check cost</a></td>';
      }).join("") +
      (items.length < 3 ? '<td class="cmp-add-col"></td>' : "") + "</tr></tfoot>";

    return {
      title: "Compare",
      html: '<div class="wrap">' + S.backRow("Back to results", "#/results") +
        '<div class="row row--between row--wrap mb-16">' +
        '<h1 class="h-page">Compare ' + items.length + " place" + (items.length === 1 ? "" : "s") + "</h1>" +
        '<button class="btn btn--ghost btn--sm" type="button" data-cmp-clear>Clear all</button></div>' +

        '<section class="decision-card" aria-labelledby="dec-h">' +
        '<h2 class="h-card" id="dec-h">Which option fits you best?</h2>' +
        '<div class="decision-grid">' + tiles.map(function (t) {
          return '<a class="decision-tile' + (t.tone === "green" ? " is-green" : "") + '" href="#/detail/' + t.p.id + '">' +
            '<span class="dt-label">' + S.icon(t.tone === "green" ? "sparkle" : t.label.indexOf("budget") > -1 ? "wallet" : "mapPin", 14) + S.esc(t.label) + "</span>" +
            '<span class="dt-name">' + S.esc(t.p.name) + "</span>" +
            '<span class="dt-detail">' + S.esc(t.detail) + "</span></a>";
        }).join("") + "</div>" +
        '<p class="tiny muted mt-14">Decision support based on the priorities you selected — not financial advice. Always view the property and read the lease before committing.</p>' +
        "</section>" +

        '<div class="cmp-scroll mt-24"><table class="cmp-table">' + head + body + actions + "</table></div>" +
        '<p class="tiny muted mt-14">Highlighted rows are where your options differ. The strongest cell in each row is shaded green.</p>' +
        "</div>",
      mount: function (root) {
        root.querySelectorAll("[data-cmp-remove]").forEach(function (b) {
          b.addEventListener("click", function () {
            const cid = b.getAttribute("data-cmp-remove");
            S.state.compare = S.state.compare.filter(function (x) { return x !== cid; });
            S.save();
            S.renderRoute();
            S.toast("Removed from comparison");
          });
        });
        const clr = root.querySelector("[data-cmp-clear]");
        if (clr) clr.addEventListener("click", function () {
          S.state.compare = [];
          S.save();
          S.renderRoute();
          S.toast("Comparison cleared");
        });
        const add = root.querySelector("[data-add-cmp]");
        if (add) add.addEventListener("click", function () { openComparePicker(); });
      }
    };
  }

  S.register("compare", compare);

  function openComparePicker() {
    const available = D.PROPERTIES.filter(function (p) { return S.state.compare.indexOf(p.id) === -1; });
    const sheet = S.openSheet({
      title: "Add a property",
      sub: "Compare up to three places side by side",
      body: '<div class="stack gap-8">' + available.map(function (p) {
        return '<button class="picker-row" type="button" data-pick="' + p.id + '">' +
          '<img src="' + p.images[0] + '" alt="" loading="lazy" />' +
          '<span class="grow"><b>' + S.esc(p.name) + '</b><span class="tiny muted">' + D.rand(p.price) + "/month · " + D.km(p.distanceKm) + " from Wits</span></span>" +
          S.icon("plus", 18) + "</button>";
      }).join("") + "</div>"
    });
    sheet.body.querySelectorAll("[data-pick]").forEach(function (b) {
      b.addEventListener("click", function () {
        const pid = b.getAttribute("data-pick");
        if (S.state.compare.length >= 3) {
          S.toast("You can compare up to 3 properties. Remove one first.");
          return;
        }
        S.state.compare.push(pid);
        S.save();
        S.closeSheet();
        S.renderRoute();
        S.toast("Added to comparison");
      });
    });
  }

  S.openComparePicker = openComparePicker;

  /* ======================================================================
     9. Affordability
     ====================================================================== */

  const affordDraft = {};

  function transportEstimate(kmVal) {
    if (kmVal <= 1.5) return 500;
    if (kmVal <= 3) return 750;
    return 1000;
  }

  function affordCalc(p, a) {
    const total = a.rent + a.transport + a.utilities;
    const remain = a.income - total;
    const pct = a.income ? Math.round((total / a.income) * 100) : 0;

    let status, tone, sub;
    if (remain < 0) {
      status = "Exceeds your current budget";
      tone = "red";
      sub = "Your housing costs are more than your monthly income or funding.";
    } else if (remain < a.income * 0.1) {
      status = "May stretch your budget";
      tone = "amber";
      sub = "Less than 10% of your income is left after housing.";
    } else {
      status = "Fits your current budget";
      tone = "green";
      sub = "You would have " + D.rand(remain) + " left each month after housing costs.";
    }

    const alts = tone === "green" ? [] : D.PROPERTIES.filter(function (x) {
      return x.verified === "verified" && x.nsfas &&
        x.price + transportEstimate(x.distanceKm) + 300 < total && x.id !== p.id;
    }).sort(function (x, y) { return x.price - y.price; }).slice(0, 2);

    return { total: total, remain: remain, pct: pct, status: status, tone: tone, sub: sub, alts: alts };
  }

  /* Results panel only — re-rendered in place so the inputs keep their focus. */
  function affordPanel(p, a) {
    const c = affordCalc(p, a);
    const seg = function (v) { return (v / Math.max(c.total, 1)) * 100; };

    return '<section class="card card--pad" data-af-results>' +
      '<div class="afford-result">' +
      '<span class="eyebrow">Estimated monthly housing cost</span>' +
      '<b class="afford-big num">' + D.rand(c.total) + "</b>" +
      '<div class="afford-break"><span>Rent ' + D.rand(a.rent) + "</span><span>Transport " +
      D.rand(a.transport) + "</span><span>Utilities " + D.rand(a.utilities) + "</span></div>" +
      "</div>" +
      '<hr class="divider mt-18 mb-18" />' +
      '<div class="afford-result">' +
      '<span class="eyebrow">Estimated remaining amount</span>' +
      '<b class="afford-big num ' + (c.remain < 0 ? "txt-red" : "") + '">' +
      (c.remain < 0 ? "−" : "") + D.rand(Math.abs(c.remain)) + "</b>" +
      "</div>" +
      '<div class="cost-bar mt-18">' +
      '<span style="width:' + seg(a.rent) + '%;background:var(--navy)"></span>' +
      '<span style="width:' + seg(a.transport) + '%;background:var(--blue-mid)"></span>' +
      '<span style="width:' + seg(a.utilities) + '%;background:var(--blue-light)"></span>' +
      '<span style="flex:1;background:#E7EAF0"></span>' +
      "</div>" +
      '<div class="cost-legend tiny muted">' +
      '<span><i style="background:var(--navy)"></i>Rent</span>' +
      '<span><i style="background:var(--blue-mid)"></i>Transport</span>' +
      '<span><i style="background:var(--blue-light)"></i>Utilities</span>' +
      '<span><i style="background:#E7EAF0"></i>Left over</span></div>' +
      '<div class="status-box status-box--' + c.tone + ' mt-18">' +
      '<b>' + S.icon(c.tone === "green" ? "check" : c.tone === "red" ? "alert" : "info", 16) +
      S.esc(c.status) + "</b>" +
      '<span class="small">' + S.esc(c.sub) + "</span>" +
      '<span class="small"><b>Housing uses ' + c.pct + "% of your monthly income/funding.</b></span>" +
      "</div>" +
      '<div class="mt-18">' + S.note("This is an indicative budgeting tool and is not financial advice or an official NSFAS calculation.", "amber", "alert") + "</div>" +
      "</section>" +
      (c.alts.length
        ? '<section class="card card--pad mt-24" data-af-alts><h2 class="h-card">Options that leave you more room</h2>' +
        '<p class="small muted mt-6">Verified, funding-compatible alternatives with a lower total monthly cost.</p>' +
        '<div class="stack gap-8 mt-14">' + c.alts.map(function (x) {
          const t = x.price + transportEstimate(x.distanceKm) + 300;
          return '<a class="alt-row" href="#/afford/' + x.id + '">' +
            '<img src="' + x.images[0] + '" alt="" loading="lazy" />' +
            '<span class="grow"><b>' + S.esc(x.name) + '</b><span class="tiny muted">' +
            D.rand(x.price) + "/month · " + D.km(x.distanceKm) + " from Wits</span></span>" +
            '<span class="tr"><b class="num small">' + D.rand(t) + '</b><span class="tiny muted">total</span></span></a>';
        }).join("") + "</div></section>"
        : '<div data-af-alts hidden></div>');
  }

  function afford(id) {
    const p = D.getProperty(id) || D.PROPERTIES[0];
    if (!affordDraft[p.id]) {
      affordDraft[p.id] = {
        income: S.state.profile.income || 4500,
        rent: p.price,
        transport: transportEstimate(p.distanceKm),
        utilities: 300
      };
    }
    const a = affordDraft[p.id];

    return {
      title: "Affordability — " + p.name,
      html: '<div class="wrap wrap--mid">' +
        S.backRow("Back to property", "#/detail/" + p.id) +
        '<h1 class="h-page mt-10">Check the full monthly cost</h1>' +
        '<p class="sub mt-6">Rent is only part of the picture. Add transport and utilities to see what this place really costs you each month.</p>' +

        '<div class="afford-layout mt-24">' +
        '<section class="card card--pad">' +
        '<h2 class="h-card mb-14">Your numbers</h2>' +
        '<div class="stack gap-14">' +
        '<div class="field"><label for="af-prop">Property</label><select class="select" id="af-prop" data-af="prop">' +
        D.PROPERTIES.map(function (x) {
          return '<option value="' + x.id + '"' + (x.id === p.id ? " selected" : "") + ">" +
            S.esc(x.name) + " — " + D.rand(x.price) + "</option>";
        }).join("") + "</select></div>" +
        '<div class="field"><label for="af-income">Monthly income / funding</label>' +
        '<div class="input-money"><span class="cur">R</span>' +
        '<input class="input num" id="af-income" type="number" inputmode="numeric" min="0" step="50" value="' +
        a.income + '" data-af="income" /></div></div>' +
        '<div class="field"><label for="af-rent">Accommodation cost</label>' +
        '<div class="input-money"><span class="cur">R</span>' +
        '<input class="input num" id="af-rent" type="number" inputmode="numeric" min="0" step="50" value="' +
        a.rent + '" data-af="rent" /></div></div>' +
        '<div class="field"><label for="af-trans">Estimated transport</label>' +
        '<div class="input-money"><span class="cur">R</span>' +
        '<input class="input num" id="af-trans" type="number" inputmode="numeric" min="0" step="50" value="' +
        a.transport + '" data-af="transport" /></div>' +
        '<span class="tiny muted">Based on ' + D.km(p.distanceKm) +
        " from Wits — adjust if you know your route.</span></div>" +
        '<div class="field"><label for="af-util">Estimated utilities</label>' +
        '<div class="input-money"><span class="cur">R</span>' +
        '<input class="input num" id="af-util" type="number" inputmode="numeric" min="0" step="50" value="' +
        a.utilities + '" data-af="utilities" /></div>' +
        '<span class="tiny muted">Electricity, water and data not included in rent.</span></div>' +
        "</div></section>" +
        '<div class="afford-panel" data-af-panel>' + affordPanel(p, a) + "</div>" +
        "</div></div>",

      mount: function (root) {
        const panel = root.querySelector("[data-af-panel]");

        const refresh = function () {
          /* Replace only the results panel; the form and focus stay untouched. */
          panel.innerHTML = affordPanel(p, a);
        };

        root.querySelectorAll("[data-af]").forEach(function (input) {
          const key = input.getAttribute("data-af");

          if (key === "prop") {
            input.addEventListener("change", function () { S.go("/afford/" + input.value); });
            return;
          }

          input.addEventListener("input", function () {
            const raw = input.value.trim();
            /* Let the field be empty while editing rather than snapping to 0. */
            a[key] = raw === "" ? 0 : Math.max(0, Number(raw) || 0);
            refresh();
          });

          input.addEventListener("blur", function () {
            if (input.value.trim() === "") {
              a[key] = 0;
              input.value = "0";
              refresh();
            }
          });
        });
      }
    };
  }

  S.register("afford", afford);

  /* ======================================================================
     10. Recommendations
     ====================================================================== */

  function recs() {
    const pr = S.state.profile;
    const band = D.BUDGET_BANDS.filter(function (b) { return b.id === pr.band; })[0] || D.BUDGET_BANDS[2];
    const fundingLabel = (D.FUNDING.filter(function (f) { return f.id === pr.funding; })[0] || {}).label || "Self-funded";
    const list = D.recommended(pr, 3);
    const extra = pr.priorities.filter(function (k) {
      return ["affordability", "campus", "affordability"].indexOf(k) === -1 && k !== "affordability";
    });

    const chips = [
      { label: band.label + " budget", icon: "wallet" },
      { label: "Within 2 km of Wits", icon: "mapPin" },
      { label: fundingLabel + " funding", icon: "shield" }
    ].concat(extra.slice(0, 3).map(function (k) {
      const found = D.PRIORITIES.filter(function (p) { return p.key === k; })[0];
      return { label: found ? found.label : k, icon: "check" };
    }));

    const cards = list.map(function (item, i) {
      const p = item.p;
      const m = D.matchScore(p, pr);
      const comparing = S.state.compare.indexOf(p.id) > -1;
      const reasons = m.reasons.slice(0, 4);
      return '<article class="rec-card card card--flush">' +
        '<div class="rec-card-media">' +
        (i === 0 ? '<span class="top-pick">Top pick</span>' : "") +
        '<img src="' + p.images[0] + '" alt="' + S.esc(p.name) + '" loading="lazy" />' +
        '<span class="rec-ring">' + S.scoreRing(m.score, 68, 5, 19) + '<span class="tiny">Match</span></span>' +
        "</div>" +
        '<div class="rec-card-body">' +
        '<h2 class="rec-card-name">' + S.esc(p.name) + "</h2>" +
        '<p class="small muted">' + D.rand(p.price) + "/month · " + D.km(p.distanceKm) + " from Wits · " + String(p.rating).replace(".", ",") + " ★</p>" +
        '<div class="why-list mt-14"><b class="small">Why?</b>' + reasons.map(function (r) {
          return '<span class="why ' + (r.ok ? "is-ok" : "is-warn") + '">' + (r.ok ? S.icon("check", 13) : S.icon("alert", 13)) + S.esc(r.text) + "</span>";
        }).join("") + "</div>" +
        '<div class="rec-card-actions">' +
        (p.verified === "verified"
          ? '<a class="btn btn--green btn--sm" href="#/apply/' + p.id + '">Apply Now</a>'
          : '<a class="btn btn--sm" href="#/verify/' + p.id + '">Verification status</a>') +
        '<a class="btn btn--ghost btn--sm" href="#/detail/' + p.id + '">View Details</a>' +
        '<button class="btn btn--ghost btn--sm" type="button" data-compare="' + p.id + '" aria-pressed="' + comparing + '">' +
        (comparing ? S.icon("check", 14) + " Comparing" : "Compare") + "</button>" +
        "</div></div></article>";
    }).join("");

    return {
      title: "Recommendations",
      html: '<div class="wrap">' + S.backRow("Back to search", "#/search") +
        '<h1 class="h-page">Recommended for you</h1>' +
        '<p class="sub mt-6">Based on the preferences you gave us. Every score is a StaySure match score, not an official rating.</p>' +
        '<div class="based-chips mt-18">' + chips.map(function (c) {
          return '<span class="chip chip--readonly">' + S.icon(c.icon, 14) + S.esc(c.label) + "</span>";
        }).join("") +
        '<a class="btn btn--quiet" href="#/onboarding">Edit preferences</a></div>' +
        '<div class="rec-cards mt-24">' + cards + "</div>" +
        '<div class="mt-32">' + S.note("The percentage is a StaySure prototype match score based on your budget, priorities, funding status and the listing's verification state. It is decision support — not an objective or official rating of the property.", null, "info") + "</div>" +
        "</div>"
    };
  }

  S.register("recs", recs);
})();
