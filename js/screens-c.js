/* ==========================================================================
   StaySure — Apply, Tracking, Dashboard, Saved, Profile, Chat, Provider
   ========================================================================== */

(function () {
  "use strict";

  const D = window.SSData;
  const S = window.SS;

  /* ======================================================================
     11. Application
     ====================================================================== */

  const applyDraft = {};
  const applyStep = {};

  function docState(id) {
    if (!applyDraft[id]) applyDraft[id] = { docs: {}, consent: false, submitting: false, done: false, ref: null };
    return applyDraft[id];
  }

  const DOCS = [
    { key: "id", label: "Certified ID copy (or passport)", note: "PDF or photo · max 5 MB" },
    { key: "proof", label: "Proof of registration at Wits", note: "PDF or photo · max 5 MB" },
    { key: "funding", label: "Funding confirmation letter", note: "Optional for self-funded students" }
  ];

  const APPLY_STEPS = ["Personal", "Student", "Funding", "Documents", "Review", "Submit"];

  function applyField(label, fid, type, value, hint) {
    return '<div class="field"><label for="' + fid + '">' + S.esc(label) + "</label>" +
      '<input class="input" id="' + fid + '" type="' + type + '" value="' + S.esc(value || "") + '" />' +
      (hint ? '<span class="tiny muted">' + S.esc(hint) + "</span>" : "") + "</div>";
  }

  function apply(id) {
    const p = D.getProperty(id) || D.PROPERTIES[0];
    const pr = S.state.profile;
    const d = docState(p.id);
    if (!applyStep[p.id]) applyStep[p.id] = 1;
    const step = applyStep[p.id];
    const funded = pr.funding === "nsfas" || pr.funding === "university";

    /* ---- Success state ---- */
    if (d.done) {
      return {
        title: "Application submitted",
        html: '<div class="wrap wrap--narrow">' +
          '<div class="success-card card card--pad tc">' +
          '<span class="success-check">' + S.icon("check", 34) + "</span>" +
          '<h1 class="h-section mt-18">Application Submitted</h1>' +
          '<p class="sub mt-10">Your application has been sent to the accommodation provider.</p>' +
          '<div class="success-ref"><span class="tiny muted">Reference</span><b>' + S.esc(d.ref) + "</b></div>" +
          '<div class="success-meta"><div><b>' + S.esc(p.name) + '</b><span class="tiny muted">Property</span></div>' +
          '<div><b>2–3 working days</b><span class="tiny muted">Expected response</span></div></div>' +
          '<div class="row row--wrap mt-24" style="justify-content:center">' +
          '<a class="btn btn--green" href="#/tracking/' + p.id + '">Track my application</a>' +
          '<a class="btn btn--ghost" href="#/dashboard">Go to dashboard</a></div>' +
          "</div>" +
          '<div class="mt-18">' + S.note("This is a demo submission. No personal information was sent anywhere — document uploads are simulated and nothing leaves your browser.", "amber", "alert") + "</div></div>"
      };
    }

    /* ---- Stepper ---- */
    const stepper = '<div class="stepper">' + APPLY_STEPS.map(function (label, i) {
      const n = i + 1;
      const cls = n < step ? "is-done" : n === step ? "is-current" : "is-future";
      return '<button class="step ' + cls + '" type="button" ' +
        (n < step ? 'data-goto-step="' + n + '"' : 'aria-disabled="true"') + ">" +
        '<span class="step-dot">' + (n < step ? S.icon("check", 15) : n) + "</span>" +
        '<span class="step-label">' + label + "</span></button>";
    }).join("") + "</div>";

    let body = "";
    let nextLabel = "Continue";

    if (step === 1) {
      body = '<h2 class="h-card mb-14">Personal information</h2>' +
        '<div class="stack gap-14">' +
        applyField("Full name", "ap-name", "text", pr.name, "As it appears on your ID") +
        applyField("South African ID number", "ap-id", "text", "0203155800086") +
        applyField("Mobile number", "ap-phone", "tel", "072 445 8813") +
        applyField("Email address", "ap-email", "email", "thabo.nkosi@students.wits.ac.za") +
        applyField("Guardian / next of kin", "ap-guardian", "text", "Nomsa Nkosi · 082 331 7742") +
        "</div>";
    } else if (step === 2) {
      body = '<h2 class="h-card mb-14">Student information</h2>' +
        '<div class="stack gap-14">' +
        '<div class="field"><label for="ap-inst">Institution</label>' +
        '<input class="input" id="ap-inst" type="text" value="' + S.esc(pr.university) + '" readonly /></div>' +
        applyField("Student number", "ap-studentno", "text", "2458173") +
        '<div class="grid-2 gap-14">' +
        '<div class="field"><label for="ap-year">Year of study</label><select class="select" id="ap-year">' +
        ["1st year", "2nd year", "3rd year", "4th year", "Postgraduate"].map(function (y, i) {
          return "<option" + (i === 2 ? " selected" : "") + ">" + y + "</option>";
        }).join("") + "</select></div>" +
        '<div class="field"><label for="ap-fac">Faculty</label><select class="select" id="ap-fac">' +
        ["Commerce, Law & Management", "Engineering & the Built Environment", "Health Sciences", "Humanities", "Science"].map(function (y, i) {
          return "<option" + (i === 0 ? " selected" : "") + ">" + y + "</option>";
        }).join("") + "</select></div></div>" +
        '<div class="field"><label for="ap-movein">Preferred move-in date</label>' +
        '<input class="input" id="ap-movein" type="date" value="2027-01-15" /></div>' +
        "</div>";
    } else if (step === 3) {
      body = '<h2 class="h-card mb-14">Funding</h2>' +
        '<div class="stack gap-10">' + D.FUNDING.map(function (f) {
          const on = pr.funding === f.id;
          return '<button class="opt' + (on ? " is-selected" : "") + '" type="button" data-fund="' + f.id + '" aria-pressed="' + on + '">' +
            '<span class="opt-mark"></span><span class="opt-body"><span class="opt-title">' + S.esc(f.label) + "</span>" +
            '<span class="opt-sub">' + S.esc(f.sub) + "</span></span></button>";
        }).join("") + "</div>" +
        '<div class="field mt-18"><label for="ap-ref">Funding reference number</label>' +
        '<input class="input" id="ap-ref" type="text" placeholder="e.g. NSFAS 2027 reference" value="' +
        (funded ? "NSF27-448120" : "") + '" /></div>' +
        (funded && !p.nsfas
          ? '<div class="mt-18">' + S.note("<b>Heads up:</b> this property is not listed as " +
            (pr.funding === "nsfas" ? "NSFAS" : "university funding") +
            " compatible. You can still apply, but confirm with the provider before paying a deposit. Compatibility is indicative.", "amber", "alert") + "</div>"
          : '<div class="mt-18">' + S.note("Funding compatibility is indicative and is not official confirmation from NSFAS or the university.", null, "info") + "</div>");
    } else if (step === 4) {
      body = '<h2 class="h-card mb-14">Supporting documents</h2>' +
        '<div class="stack gap-10">' + DOCS.map(function (doc) {
          const file = d.docs[doc.key];
          return '<div class="doc-row' + (file ? " is-uploaded" : "") + '">' +
            '<span class="doc-ico">' + S.icon(file ? "check" : "doc", 17) + "</span>" +
            '<span class="grow"><b>' + S.esc(doc.label) + "</b>" +
            '<span class="tiny muted">' + S.esc(file || doc.note) + "</span></span>" +
            (file
              ? '<button class="btn btn--sm btn--ghost" type="button" data-undo-doc="' + doc.key + '">Remove</button>'
              : '<button class="btn btn--sm btn--soft" type="button" data-upload-doc="' + doc.key + '">' + S.icon("upload", 14) + "Upload</button>") +
            "</div>";
        }).join("") + "</div>" +
        '<div class="mt-18">' + S.note("Document upload is simulated in this prototype — nothing is uploaded or stored. In production this needs POPIA-compliant encrypted storage with strict access controls.", "amber", "alert") + "</div>";
    } else if (step === 5) {
      const missingDoc = DOCS.filter(function (doc) { return !d.docs[doc.key] && doc.key !== "funding"; });
      body = '<h2 class="h-card mb-14">Review your application</h2>' +
        '<div class="rev-group"><div class="rev-group-head"><b>Personal information</b>' +
        '<button class="btn btn--quiet" type="button" data-goto-step="1">Edit</button></div>' +
        '<dl class="rev-dl"><div><dt>Name</dt><dd>' + S.esc(pr.name) + "</dd></div>" +
        "<div><dt>ID number</dt><dd>0203155800086</dd></div>" +
        "<div><dt>Mobile</dt><dd>072 445 8813</dd></div>" +
        "<div><dt>Email</dt><dd>thabo.nkosi@students.wits.ac.za</dd></div></dl></div>" +
        '<div class="rev-group"><div class="rev-group-head"><b>Student information</b>' +
        '<button class="btn btn--quiet" type="button" data-goto-step="2">Edit</button></div>' +
        '<dl class="rev-dl"><div><dt>Institution</dt><dd>' + S.esc(pr.university) + "</dd></div>" +
        "<div><dt>Student number</dt><dd>2458173</dd></div><div><dt>Year</dt><dd>3rd year</dd></div>" +
        "<div><dt>Move-in</dt><dd>15 January 2027</dd></div></dl></div>" +
        '<div class="rev-group"><div class="rev-group-head"><b>Funding</b>' +
        '<button class="btn btn--quiet" type="button" data-goto-step="3">Edit</button></div>' +
        '<dl class="rev-dl"><div><dt>Type</dt><dd>' +
        S.esc((D.FUNDING.filter(function (f) { return f.id === pr.funding; })[0] || {}).label || "Self-funded") +
        "</dd></div><div><dt>Reference</dt><dd>" + (funded ? "NSF27-448120" : "—") + "</dd></div></dl></div>" +
        '<div class="rev-group"><div class="rev-group-head"><b>Documents</b>' +
        '<button class="btn btn--quiet" type="button" data-goto-step="4">Edit</button></div>' +
        '<dl class="rev-dl">' + DOCS.map(function (doc) {
          return "<div><dt>" + S.esc(doc.label) + "</dt><dd>" +
            (d.docs[doc.key] ? '<span class="pill pill--green">Uploaded</span>' : '<span class="pill pill--amber">Missing</span>') +
            "</dd></div>";
        }).join("") + "</dl></div>" +
        (missingDoc.length
          ? '<div class="mt-14">' + S.note("You still need to upload: " +
            missingDoc.map(function (x) { return S.esc(x.label); }).join(", ") +
            ". You can continue, but the provider may ask for these before reviewing.", "amber", "alert") + "</div>"
          : "");
    } else {
      const missingDoc = DOCS.filter(function (doc) { return !d.docs[doc.key] && doc.key !== "funding"; });
      nextLabel = d.submitting ? "Submitting…" : "Submit application";
      body = '<h2 class="h-card mb-14">Submit your application</h2>' +
        '<div class="submit-summary">' +
        '<div class="submit-row"><span>' + S.esc(p.name) + '</span><b class="num">' + D.rand(p.price) + "/month</b></div>" +
        '<div class="submit-row"><span>Application fee</span><b class="txt-green">Free on StaySure</b></div>' +
        '<div class="submit-row"><span>Documents attached</span><b>' + Object.keys(d.docs).length + " of " + DOCS.length + "</b></div>" +
        "</div>" +
        '<label class="check mt-18"><input type="checkbox" data-consent' + (d.consent ? " checked" : "") + " />" +
        "<span>I confirm the information is accurate and consent to StaySure sharing it with this provider for the purpose of my application. I understand this prototype stores nothing on a server.</span></label>" +
        (missingDoc.length
          ? '<div class="mt-14">' + S.note("Documents still missing: " +
            missingDoc.map(function (x) { return S.esc(x.label); }).join(", ") + ".", "amber", "alert") + "</div>"
          : "") +
        '<div class="mt-18">' + S.note("In production this would be protected by POPIA-compliant handling, encrypted storage and a documented retention period.", null, "info") + "</div>";
    }

    const canNext = step === 6 ? d.consent && !d.submitting : true;

    return {
      title: "Apply — " + p.name,
      html: '<div class="wrap wrap--mid apply-wrap">' +
        S.backRow("Back to property", "#/detail/" + p.id) +
        '<div class="apply-head row row--between row--wrap">' +
        '<div><h1 class="h-card">Apply to ' + S.esc(p.name) + "</h1>" +
        '<p class="small muted">' + D.rand(p.price) + "/month · " + S.esc(p.area) + " · " + D.km(p.distanceKm) + " from Wits</p></div>" +
        S.verifiedPill(p.verified) + "</div>" +
        stepper +
        '<div class="apply-body">' + body + "</div>" +
        '<div class="apply-foot">' +
        (step > 1 ? '<button class="btn btn--ghost" type="button" data-prev>Back</button>' : "") +
        '<button class="btn ' + (step === 6 ? "btn--green" : "") + ' grow" type="button" data-next' +
        (canNext ? "" : " disabled") + ">" + S.esc(nextLabel) + "</button></div>" +
        "</div>",
      mount: function (root) {
        const rerender = function () { S.renderRoute(); };

        root.querySelectorAll("[data-goto-step]").forEach(function (b) {
          b.addEventListener("click", function () {
            applyStep[p.id] = Number(b.getAttribute("data-goto-step"));
            rerender();
          });
        });

        root.querySelectorAll("[data-fund]").forEach(function (b) {
          b.addEventListener("click", function () {
            S.state.profile.funding = b.getAttribute("data-fund");
            S.save();
            rerender();
          });
        });

        root.querySelectorAll("[data-upload-doc]").forEach(function (b) {
          b.addEventListener("click", function () {
            const key = b.getAttribute("data-upload-doc");
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*,application/pdf";
            input.style.display = "none";
            input.addEventListener("change", function () {
              const f = input.files && input.files[0];
              d.docs[key] = f
                ? f.name + " · " + Math.max(1, Math.round(f.size / 1024)) + " KB"
                : "document.pdf · 240 KB";
              input.remove();
              rerender();
              S.toast("Document attached (simulated)");
            });
            document.body.appendChild(input);
            input.click();
            setTimeout(function () { if (input.parentNode) input.remove(); }, 60000);
          });
        });

        root.querySelectorAll("[data-undo-doc]").forEach(function (b) {
          b.addEventListener("click", function () {
            delete d.docs[b.getAttribute("data-undo-doc")];
            rerender();
          });
        });

        const consent = root.querySelector("[data-consent]");
        if (consent) consent.addEventListener("change", function () {
          d.consent = consent.checked;
          const nb = root.querySelector("[data-next]");
          if (nb) nb.disabled = !d.consent;
        });

        const prev = root.querySelector("[data-prev]");
        if (prev) prev.addEventListener("click", function () {
          if (step > 1) { applyStep[p.id] = step - 1; rerender(); }
        });

        const next = root.querySelector("[data-next]");
        if (next) next.addEventListener("click", function () {
          if (next.disabled) return;
          if (step < 6) {
            applyStep[p.id] = step + 1;
            rerender();
            return;
          }
          d.submitting = true;
          next.disabled = true;
          next.textContent = "Submitting…";
          setTimeout(function () {
            d.submitting = false;
            d.done = true;
            d.ref = D.makeRef();
            const app = {
              id: "app-" + p.id,
              propertyId: p.id,
              ref: d.ref,
              date: new Date().toISOString(),
              stage: 2
            };
            S.state.applications = [app].concat(S.state.applications.filter(function (a) {
              return a.propertyId !== p.id;
            }));
            S.state.unread = (S.state.unread || 0) + 1;
            S.save();
            S.renderRoute();
            S.toast("Application submitted");
          }, 1200);
        });
      }
    };
  }

  S.register("apply", apply);

  /* ======================================================================
     12. Application tracking
     ====================================================================== */

  const STAGES = [
    { title: "Application submitted", note: "The provider received your application." },
    { title: "Documents received", note: "Your uploaded documents were received and attached to the application." },
    { title: "Provider reviewing application", note: "The provider is reviewing your application. Most respond within 2–3 working days." },
    { title: "Decision", note: "The provider will accept or decline, and contact you with next steps." },
    { title: "Lease", note: "If accepted, you will receive a lease to review and sign." }
  ];

  function tracking(id) {
    const p = D.getProperty(id) || D.PROPERTIES[0];
    const rec = S.state.applications.filter(function (a) { return a.propertyId === p.id; })[0];
    const stage = rec ? rec.stage : 2;
    const ref = rec ? rec.ref : "STY-2026-00124";

    return {
      title: "Track application",
      html: '<div class="wrap wrap--mid">' +
        S.backRow("Back to dashboard", "#/dashboard") +
        '<div class="track-head card card--pad">' +
        '<img src="' + p.images[0] + '" alt="" class="track-img" />' +
        '<div class="grow"><div class="row row--wrap row--between">' +
        '<div><h1 class="h-card">' + S.esc(p.name) + "</h1>" +
        '<p class="tiny muted">' + S.esc(p.area) + " · Ref " + S.esc(ref) + "</p></div>" +
        '<span class="pill pill--amber">' + S.icon("clock", 13) + "Under Review</span></div>" +
        '<p class="small mt-10"><b class="num">' + D.rand(p.price) + "/month</b> · Applied recently</p>" +
        "</div></div>" +

        '<section class="card card--pad mt-18">' +
        '<h2 class="h-card mb-18">Progress</h2>' +
        '<div class="timeline">' + STAGES.map(function (s, i) {
          const cls = i < stage ? "is-done" : i === stage ? "is-current" : "is-future";
          return '<div class="tl-item ' + cls + '">' +
            '<span class="tl-mark">' + (i < stage ? S.icon("check", 16) : "") + "</span>" +
            '<div><div class="tl-title">' + S.esc(s.title) + "</div>" +
            (i === stage ? '<div class="tl-note">' + S.esc(s.note) + "</div>" : "") + "</div></div>";
        }).join("") + "</div></section>" +

        '<div class="grid-2 mt-18">' +
        '<section class="card card--pad"><h3 class="h-card mb-10">Next steps</h3>' +
        '<ul class="check-list">' +
        "<li>" + S.icon("check", 14) + "Keep your phone reachable for the provider</li>" +
        "<li>" + S.icon("check", 14) + "Have your ID and proof of registration ready</li>" +
        "<li>" + S.icon("check", 14) + "Do not pay a deposit before viewing the property and reading the lease</li>" +
        "</ul></section>" +
        '<section class="card card--pad"><h3 class="h-card mb-10">Need help?</h3>' +
        '<p class="small muted">Ask the provider a question about your application.</p>' +
        '<div class="stack gap-8 mt-14">' +
        '<button class="btn btn--ghost btn--sm" type="button" data-chat="' + p.id + '">' + S.icon("message", 14) + "Message provider</button>" +
        '<a class="btn btn--ghost btn--sm" href="#/detail/' + p.id + '">View property</a></div></section></div>' +

        '<section class="card card--pad mt-18"><div class="row row--between row--wrap">' +
        '<div><h3 class="h-card">Demo control</h3><p class="tiny muted mt-6">In production, status changes come from the provider. Use this to preview each stage.</p></div>' +
        '<div class="row">' +
        '<button class="icon-btn" type="button" data-stage="-1" aria-label="Previous stage">' + S.icon("chevronLeft", 16) + "</button>" +
        '<button class="icon-btn" type="button" data-stage="1" aria-label="Next stage">' + S.icon("chevronRight", 16) + "</button>" +
        "</div></div></section>" +
        "</div>",
      mount: function (root) {
        root.querySelectorAll("[data-stage]").forEach(function (b) {
          b.addEventListener("click", function () {
            const delta = Number(b.getAttribute("data-stage"));
            let app = S.state.applications.filter(function (a) { return a.propertyId === p.id; })[0];
            if (!app) {
              app = { id: "app-" + p.id, propertyId: p.id, ref: ref, date: new Date().toISOString(), stage: 2 };
              S.state.applications.unshift(app);
            }
            app.stage = Math.max(0, Math.min(4, app.stage + delta));
            S.save();
            S.renderRoute();
          });
        });
        const ch = root.querySelector("[data-chat]");
        if (ch) ch.addEventListener("click", function () { S.openChat(p); });
      }
    };
  }

  S.register("tracking", tracking);

  /* ======================================================================
     13. Student dashboard
     ====================================================================== */

  function greeting() {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }

  function dashboard() {
    const st = S.state;
    const pr = st.profile;
    const firstName = pr.name.split(" ")[0];
    const app = st.applications[0];
    const appProp = app ? D.getProperty(app.propertyId) : D.PROPERTIES[0];
    const savedProps = st.saved.map(function (sid) { return D.getProperty(sid); }).filter(Boolean);
    const viewedProps = st.viewed.map(function (sid) { return D.getProperty(sid); }).filter(Boolean);
    const recs = D.recommended(pr, 3);
    const completion = [pr.name, pr.university, pr.band, pr.funding, pr.priorities.length].filter(Boolean).length * 20;

    return {
      title: "Dashboard",
      html: '<div class="wrap">' +
        '<section class="dash-hero">' +
        '<div class="row row--between row--wrap">' +
        '<div><p class="dash-hello">Welcome back</p>' +
        '<h1 class="dash-h1">' + greeting() + ", " + S.esc(firstName) + "</h1>" +
        '<p class="small dash-sub">Your applications, saved places and recommendations in one place.</p></div>' +
        '<div class="row row--wrap">' +
        '<a class="btn btn--white btn--sm" href="#/search">' + S.icon("search", 15) + "New search</a>" +
        '<a class="btn btn--onnavy btn--sm" href="#/afford/' + appProp.id + '">' + S.icon("wallet", 15) + "Budget check</a>" +
        "</div></div></section>" +

        '<div class="dash-grid">' +

        '<section class="card card--pad dash-card dash-card--wide">' +
        '<div class="row row--between mb-14"><h2 class="h-card">Applications</h2>' +
        '<a class="btn btn--quiet" href="#/tracking/' + appProp.id + '">Track</a></div>' +
        (app
          ? '<div class="app-summary">' +
          '<div class="row row--between row--wrap"><b>' + S.esc(appProp.name) + "</b>" +
          '<span class="pill pill--amber">' + S.icon("clock", 12) +
          S.esc(STAGES[app.stage] ? STAGES[app.stage].title : "Under review") + "</span></div>" +
          '<p class="tiny muted mt-6">Ref ' + S.esc(app.ref) + " · " + D.rand(appProp.price) + "/month</p>" +
          '<div class="progress mt-14"><span style="width:' + ((app.stage + 1) / 5 * 100) + '%"></span></div>' +
          '<p class="tiny muted mt-6">Step ' + (app.stage + 1) + " of 5</p></div>"
          : '<div class="dash-empty"><p class="small muted">You have no applications yet.</p>' +
          '<a class="btn btn--sm mt-10" href="#/results">Find a place</a></div>') +
        "</section>" +

        '<section class="card card--pad dash-card">' +
        '<div class="row row--between mb-14"><h2 class="h-card">Messages</h2>' +
        (st.unread ? '<span class="badge-count">' + st.unread + "</span>" : "") + "</div>" +
        '<p class="small muted">' + (st.unread
          ? "You have " + st.unread + " unread message" + (st.unread === 1 ? "" : "s") + " from " + S.esc(appProp.name) + "."
          : "No unread messages.") + "</p>" +
        '<button class="btn btn--ghost btn--sm mt-14" type="button" data-chat="' + appProp.id + '">' +
        S.icon("message", 14) + "Open messages</button></section>" +

        '<section class="card card--pad dash-card">' +
        '<div class="row row--between mb-14"><h2 class="h-card">Saved properties</h2>' +
        '<span class="badge-count badge-count--grey">' + savedProps.length + "</span></div>" +
        (savedProps.length
          ? '<div class="stack gap-8">' + savedProps.slice(0, 3).map(function (sp) {
            return '<a class="mini-row" href="#/detail/' + sp.id + '"><img src="' + sp.images[0] + '" alt="" loading="lazy" />' +
              '<span class="grow"><b>' + S.esc(sp.name) + '</b><span class="tiny muted">' + D.rand(sp.price) + "/month</span></span></a>";
          }).join("") + '<a class="btn btn--quiet" href="#/saved">View all saved</a></div>'
          : '<p class="small muted">Nothing saved yet. Tap the heart on any listing to keep it here.</p>' +
          '<a class="btn btn--sm btn--ghost mt-10" href="#/results">Browse places</a>') +
        "</section>" +

        '<section class="card card--pad dash-card">' +
        '<div class="row row--between mb-14"><h2 class="h-card">Recently viewed</h2></div>' +
        (viewedProps.length
          ? '<div class="stack gap-8">' + viewedProps.slice(0, 3).map(function (vp) {
            return '<a class="mini-row" href="#/detail/' + vp.id + '"><img src="' + vp.images[0] + '" alt="" loading="lazy" />' +
              '<span class="grow"><b>' + S.esc(vp.name) + '</b><span class="tiny muted">' + D.km(vp.distanceKm) + " from Wits</span></span></a>";
          }).join("") + "</div>"
          : '<p class="small muted">Places you view will appear here.</p>' +
          '<a class="btn btn--sm btn--ghost mt-10" href="#/results">Start browsing</a>') +
        "</section>" +

        '<section class="card card--pad dash-card dash-card--wide">' +
        '<div class="row row--between mb-14"><h2 class="h-card">Recommended for you</h2>' +
        '<a class="btn btn--quiet" href="#/recs">See all</a></div>' +
        '<div class="stack gap-8">' + recs.map(function (r) {
          return '<a class="mini-row" href="#/detail/' + r.p.id + '"><img src="' + r.p.images[0] + '" alt="" loading="lazy" />' +
            '<span class="grow"><b>' + S.esc(r.p.name) + '</b><span class="tiny muted">' +
            D.rand(r.p.price) + "/month · " + D.km(r.p.distanceKm) + " from Wits</span></span>" +
            '<span class="pill pill--green">' + r.score + "%</span></a>";
        }).join("") + "</div></section>" +

        '<section class="card card--pad dash-card">' +
        '<div class="row row--between mb-14"><h2 class="h-card">Profile</h2>' +
        '<a class="btn btn--quiet" href="#/profile">Edit</a></div>' +
        '<div class="row" style="gap:12px"><span class="avatar avatar--lg">' + S.esc(S.initials(pr.name)) + "</span>" +
        '<div class="grow"><b>' + S.esc(pr.name) + '</b><p class="tiny muted">' + S.esc(pr.university) + "</p></div></div>" +
        '<div class="progress mt-14"><span style="width:' + completion + '%"></span></div>' +
        '<p class="tiny muted mt-6">Profile ' + completion + "% complete</p></section>" +

        "</div></div>",
      mount: function (root) {
        const ch = root.querySelector("[data-chat]");
        if (ch) ch.addEventListener("click", function () { S.openChat(appProp); });
      }
    };
  }

  S.register("dashboard", dashboard);

  /* ======================================================================
     Saved
     ====================================================================== */

  function saved() {
    const pr = S.state.profile;
    const items = S.state.saved.map(function (sid) {
      const p = D.getProperty(sid);
      return p ? { p: p, score: D.matchScore(p, pr).score } : null;
    }).filter(Boolean);

    return {
      title: "Saved",
      html: '<div class="wrap">' +
        '<div class="screen-head row row--between row--wrap">' +
        '<div><h1 class="h-page">Saved properties</h1>' +
        '<p class="sub mt-6">' + items.length + " place" + (items.length === 1 ? "" : "s") + " you are keeping an eye on.</p></div>" +
        (items.length > 1 ? '<button class="btn btn--ghost btn--sm" type="button" data-compare-saved>Compare saved</button>' : "") +
        "</div>" +
        (items.length
          ? '<div class="pgrid">' + items.map(function (it) { return S.propertyCard(it, pr); }).join("") + "</div>"
          : '<div class="empty-state card card--pad"><span class="empty-ico">' + S.icon("heart", 26) + "</span>" +
          '<h2 class="h-card">No saved properties yet</h2>' +
          '<p class="sub mt-6">Tap the heart on a listing and it will be waiting for you here.</p>' +
          '<a class="btn mt-18" href="#/results">Browse places</a></div>') +
        "</div>",
      mount: function (root) {
        const b = root.querySelector("[data-compare-saved]");
        if (b) b.addEventListener("click", function () {
          S.state.compare = items.slice(0, 3).map(function (it) { return it.p.id; });
          S.save();
          S.go("/compare");
        });
      }
    };
  }

  S.register("saved", saved);

  /* ======================================================================
     Profile
     ====================================================================== */

  function accountRow(iconName, title, sub) {
    return '<button class="row-row" type="button" data-acct>' +
      '<span class="rr-ico">' + S.icon(iconName, 17) + "</span>" +
      '<span class="grow"><b>' + S.esc(title) + '</b><span class="tiny muted">' + S.esc(sub) + "</span></span>" +
      S.icon("chevronRight", 15) + "</button>";
  }

  function profile() {
    const pr = S.state.profile;
    const band = D.BUDGET_BANDS.filter(function (b) { return b.id === pr.band; })[0] || D.BUDGET_BANDS[2];
    const fundingLabel = (D.FUNDING.filter(function (f) { return f.id === pr.funding; })[0] || {}).label || "Self-funded";
    const priLabels = pr.priorities.map(function (k) {
      const f = D.PRIORITIES.filter(function (x) { return x.key === k; })[0];
      return f ? f.label : k;
    });

    return {
      title: "Profile",
      html: '<div class="wrap wrap--narrow">' +
        '<div class="row profile-head">' +
        '<span class="avatar avatar--lg">' + S.esc(S.initials(pr.name)) + "</span>" +
        '<div class="grow"><h1 class="h-card">' + S.esc(pr.name) + "</h1>" +
        '<p class="small muted">' + S.esc(pr.university) + "</p></div></div>" +

        '<section class="card card--pad">' +
        '<div class="row row--between mb-10"><h2 class="h-card">Preferences</h2>' +
        '<a class="btn btn--quiet" href="#/onboarding">Edit</a></div>' +
        '<dl class="profile-dl">' +
        "<div><dt>Budget</dt><dd>" + S.esc(band.label) + "</dd></div>" +
        "<div><dt>Funding</dt><dd>" + S.esc(fundingLabel) + "</dd></div>" +
        "<div><dt>Priorities</dt><dd>" + (priLabels.length ? S.esc(priLabels.join(", ")) : "None selected") + "</dd></div>" +
        '<div><dt>Monthly income / funding</dt><dd class="num">' + D.rand(pr.income) + "</dd></div>" +
        "</dl></section>" +

        '<section class="card card--pad mt-18">' +
        '<h2 class="h-card mb-10">Account</h2>' +
        '<div class="stack gap-2">' +
        accountRow("user", "Personal details", "Name, mobile and email") +
        accountRow("doc", "Documents", "ID and proof of registration") +
        accountRow("lock", "Privacy and consent", "POPIA preferences and data requests") +
        accountRow("bell", "Notifications", "SMS and email alerts") +
        "</div></section>" +

        '<section class="card card--pad mt-18">' +
        '<h2 class="h-card mb-10">Switch view</h2>' +
        '<a class="btn btn--ghost btn--full" href="#/provider">' + S.icon("building", 16) + "Switch to Provider view</a>" +
        "</section>" +

        '<div class="mt-18">' + S.note("<b>Demo build.</b> This prototype stores your preferences, saved listings and applications in this browser only. No account is created and nothing is shared.", "amber", "alert") + "</div>" +

        '<button class="btn btn--danger btn--full mt-18" type="button" data-reset-demo>' + S.icon("refresh", 16) + "Reset demo data</button>" +
        '<p class="tiny muted tc mt-10">Clears saved properties, applications and preferences on this device.</p>' +
        "</div>",
      mount: function (root) {
        root.querySelectorAll("[data-acct]").forEach(function (b) {
          b.addEventListener("click", function () { S.toast("Account settings are not part of this prototype."); });
        });

        const reset = root.querySelector("[data-reset-demo]");
        if (reset) reset.addEventListener("click", function () {
          const sheet = S.openSheet({
            title: "Reset demo data?",
            sub: "This clears your saved properties, applications and preferences on this device.",
            body: S.note("This is a demo control. Reset only affects data this prototype stored in your browser for StaySure.", "amber", "alert"),
            foot: '<button class="btn btn--ghost" type="button" data-sheet-close>Cancel</button>' +
              '<button class="btn btn--danger grow" type="button" data-confirm-reset>Reset demo</button>'
          });
          sheet.overlay.querySelectorAll("[data-sheet-close]").forEach(function (b) {
            b.addEventListener("click", S.closeSheet);
          });
          sheet.overlay.querySelector("[data-confirm-reset]").addEventListener("click", function () {
            S.resetDemo();
            S.closeSheet();
            S.go("/landing");
            S.toast("Demo data reset");
          });
        });
      }
    };
  }

  S.register("profile", profile);

  /* ======================================================================
     Chat sheet
     ====================================================================== */

  const chatLog = {};

  function chatReply(p, text) {
    const t = text.toLowerCase();
    if (t.indexOf("available") > -1 || t.indexOf("room") > -1) {
      return "Yes — we currently have " + p.available + " of " + p.beds + " rooms available for next year. Applications are open now.";
    }
    if (t.indexOf("includ") > -1 || t.indexOf("rent") > -1) {
      return "The " + D.rand(p.price) + " monthly rent includes " +
        (p.facilities.indexOf("wifi") > -1 ? "Wi-Fi, " : "") +
        (p.facilities.indexOf("furnished") > -1 ? "furniture, " : "") +
        "water and electricity up to a monthly cap. Transport and data are for your own account.";
    }
    if (t.indexOf("view") > -1) {
      return "You are welcome to view the property. Weekday afternoons between 14:00 and 17:00 work best — reply with a date and we will confirm.";
    }
    return "Thanks for the message. A member of our team will get back to you with details — usually within one working day.";
  }

  function openChat(p) {
    const pid = p.id;
    if (!chatLog[pid]) {
      chatLog[pid] = [
        { own: false, text: "Hi Thabo, thanks for your interest in " + p.name + ". How can we help?" }
      ];
    }
    const thread = chatLog[pid];

    const renderThread = function () {
      return thread.map(function (m) {
        return '<div class="bubble-wrap ' + (m.own ? "is-own" : "") + '"><div class="bubble">' + S.esc(m.text) + "</div></div>";
      }).join("");
    };

    const quick = ["Is there a room available?", "What is included in the rent?", "Can I view the property this week?"];

    const sheet = S.openSheet({
      title: p.name,
      sub: "Usually replies within a day · demo conversation",
      body: '<div class="chat-body" data-chat-body>' + renderThread() + "</div>" +
        '<div class="chips-wrap mt-14">' + quick.map(function (q) {
          return '<button class="chip chip--sm" type="button" data-quick-msg="' + S.esc(q) + '">' + S.esc(q) + "</button>";
        }).join("") + "</div>",
      foot: '<div class="chat-input-wrap"><input class="input" type="text" placeholder="Write a message…" data-chat-input aria-label="Message" />' +
        '<button class="icon-btn icon-btn--send" type="button" data-chat-send aria-label="Send message">' + S.icon("send", 17) + "</button></div>"
    });

    const body = sheet.overlay.querySelector("[data-chat-body]");
    const input = sheet.overlay.querySelector("[data-chat-input]");
    const scrollDown = function () { body.scrollTop = body.scrollHeight; };
    scrollDown();

    const send = function (text) {
      if (!text) return;
      thread.push({ own: true, text: text });
      body.innerHTML = renderThread();
      scrollDown();
      input.value = "";
      setTimeout(function () {
        thread.push({ own: false, text: chatReply(p, text) });
        body.innerHTML = renderThread();
        scrollDown();
      }, 1100);
    };

    sheet.overlay.querySelectorAll("[data-quick-msg]").forEach(function (b) {
      b.addEventListener("click", function () { send(b.getAttribute("data-quick-msg")); });
    });
    sheet.overlay.querySelector("[data-chat-send]").addEventListener("click", function () { send(input.value.trim()); });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); send(input.value.trim()); }
    });
    setTimeout(function () { if (input) input.focus(); }, 220);
  }

  S.openChat = openChat;

  /* ======================================================================
     Provider dashboard
     ====================================================================== */

  const providerProps = window._ssProviderProps || (window._ssProviderProps = [
    { name: "Braam Student Village", beds: 120, occupied: 108, status: "verified", price: 3200 },
    { name: "Wits Edge Studios", beds: 60, occupied: 51, status: "pending", price: 5400 }
  ]);

  function statCard(iconName, label, value, sub, tone) {
    return '<div class="card stat-card"><span class="stat-ico' + (tone ? " is-" + tone : "") + '">' + S.icon(iconName, 18) + "</span>" +
      '<span class="stat-label">' + S.esc(label) + "</span>" +
      '<b class="stat-value">' + S.esc(value) + "</b>" +
      '<span class="tiny muted">' + S.esc(sub) + "</span></div>";
  }

  function appRow(name, propName, status, tone) {
    return '<div class="app-row"><span class="avatar avatar--sm">' + S.esc(S.initials(name)) + "</span>" +
      '<span class="grow"><b>' + S.esc(name) + '</b><span class="tiny muted">' + S.esc(propName) + "</span></span>" +
      '<span class="pill pill--' + tone + '">' + S.esc(status) + "</span></div>";
  }

  function provider() {
    const st = S.state;
    const apps = st.applications;
    const totalBeds = providerProps.reduce(function (a, p) { return a + p.beds; }, 0);
    const totalOcc = providerProps.reduce(function (a, p) { return a + p.occupied; }, 0);
    const occupancy = Math.round((totalOcc / totalBeds) * 100);

    return {
      title: "Provider dashboard",
      html: '<div class="provider-bar"><div class="wrap provider-bar-inner">' +
        '<span class="pill pill--solid">StaySure Provider</span>' +
        '<span class="small provider-acct">Braam Student Living (Pty) Ltd</span>' +
        '<a class="btn btn--quiet provider-switch" href="#/dashboard">' + S.icon("user", 14) + "Student view</a>" +
        "</div></div>" +

        '<div class="wrap">' +
        '<div class="row row--between row--wrap provider-head">' +
        '<div><h1 class="h-page">StaySure Provider</h1>' +
        '<p class="sub mt-6">Manage listings, verification and applications for your properties.</p></div>' +
        '<div class="row row--wrap">' +
        '<button class="btn btn--ghost btn--sm" type="button" data-manage-apps>' + S.icon("file", 15) + "Manage Applications</button>" +
        '<button class="btn btn--green btn--sm" type="button" data-add-prop>' + S.icon("plus", 15) + "Add Property</button>" +
        "</div></div>" +

        '<div class="stat-grid">' +
        statCard("building", "Properties", String(providerProps.length), "2 active listings") +
        statCard("file", "Applications", String(7 + apps.length), apps.length ? "+1 new this week" : "Awaiting review") +
        statCard("chart", "Occupancy", occupancy + "%", totalOcc + " of " + totalBeds + " beds filled") +
        statCard("message", "Messages", String((st.unread || 0) + 3), "2 need a reply") +
        statCard("shield", "Verification", "1 of 2", "One listing pending", "amber") +
        "</div>" +

        '<h2 class="h-card mt-32 mb-14">Your properties</h2>' +
        '<div class="stack gap-14">' + providerProps.map(function (pp) {
          const pct = Math.round((pp.occupied / pp.beds) * 100);
          return '<article class="card card--pad prov-card">' +
            '<div class="row row--between row--wrap">' +
            '<div><h3 class="h-card">' + S.esc(pp.name) + "</h3>" +
            '<p class="small muted mt-6">' + pp.beds + " beds · " + pp.occupied + " occupied · " + (pp.beds - pp.occupied) + " available</p></div>" +
            (pp.status === "verified"
              ? '<span class="pill pill--green">' + S.icon("shield", 12) + "Verified</span>"
              : '<a class="btn btn--sm btn--ghost" href="#/providerVerify">Complete verification</a>') +
            "</div>" +
            '<div class="progress progress--navy mt-14"><span style="width:' + pct + '%"></span></div>' +
            '<div class="row row--between mt-6"><span class="tiny muted">' + pct + "% occupancy</span>" +
            '<span class="tiny muted num">' + D.rand(pp.price) + "/month</span></div>" +
            "</article>";
        }).join("") + "</div>" +

        '<div class="prov-bottom">' +
        '<section class="card card--pad">' +
        '<div class="row row--between mb-10"><h2 class="h-card">Recent applications</h2>' +
        '<button class="btn btn--quiet" type="button" data-manage-apps>Manage</button></div>' +
        '<div class="stack gap-2">' +
        appRow("Thabo Nkosi", providerProps[0].name, "Under review", "amber") +
        appRow("Lerato Mahlangu", providerProps[0].name, "Documents received", "navy") +
        appRow("Sipho Khumalo", providerProps[0].name, "Approved", "green") +
        appRow("Zanele Dube", providerProps[1].name, "Awaiting documents", "grey") +
        "</div></section>" +

        '<aside class="promo-card">' +
        '<span class="promo-ico">' + S.icon("sparkle", 22) + "</span>" +
        "<h3>Verified listings get 3× more applications</h3>" +
        '<p class="small">Complete your remaining verification checks so students can see exactly what has been confirmed — and apply with confidence.</p>' +
        '<a class="btn btn--green btn--sm mt-14" href="#/providerVerify">Finish verification</a></aside>' +
        "</div></div>",

      mount: function (root) {
        root.querySelectorAll("[data-manage-apps]").forEach(function (b) {
          b.addEventListener("click", openManageApps);
        });
        const add = root.querySelector("[data-add-prop]");
        if (add) add.addEventListener("click", openAddProperty);
      }
    };
  }

  function openManageApps() {
    let filterProp = "";
    let filterStatus = "";

    const allRows = [
      { name: "Thabo Nkosi", ref: "STY-2026-00124", prop: "Braam Student Village", status: "Under review" },
      { name: "Lerato Mahlangu", ref: "STY-2026-00121", prop: "Braam Student Village", status: "Documents received" },
      { name: "Sipho Khumalo", ref: "STY-2026-00118", prop: "Braam Student Village", status: "Approved" },
      { name: "Zanele Dube", ref: "STY-2026-00115", prop: "Wits Edge Studios", status: "Awaiting documents" }
    ];

    const setStage = function (i, stage) {
      if (allRows[i].name.indexOf("Thabo") === -1) return;
      const app = S.state.applications.filter(function (a) { return a.propertyId === "braam-student-village"; })[0];
      if (app) { app.stage = stage; } else {
        S.state.applications.unshift({
          id: "app-braam-student-village",
          propertyId: "braam-student-village",
          ref: allRows[i].ref,
          date: new Date().toISOString(),
          stage: stage
        });
      }
      S.save();
    };

    const sheet = S.openSheet({
      title: "Manage applications",
      sub: "Filter and manage student applications across your properties",
      wide: true,
      body: ""
    });

    const render = function () {
      if (S.closeSelectMenu) S.closeSelectMenu();
      const filtered = allRows.filter(function (r) {
        if (filterProp && r.prop !== filterProp) return false;
        if (filterStatus && r.status !== filterStatus) return false;
        return true;
      });

      const propOptions = ['<option value="">All properties (' + providerProps.length + ')</option>'].concat(
        providerProps.map(function (p) {
          return '<option value="' + S.esc(p.name) + '"' + (filterProp === p.name ? " selected" : "") + '>' + S.esc(p.name) + '</option>';
        })
      ).join("");

      const statuses = ["Under review", "Documents received", "Approved", "Awaiting documents"];
      const statusOptions = ['<option value="">All statuses</option>'].concat(
        statuses.map(function (st) {
          return '<option value="' + S.esc(st) + '"' + (filterStatus === st ? " selected" : "") + '>' + S.esc(st) + '</option>';
        })
      ).join("");

      sheet.body.innerHTML =
        '<div class="grid-2 gap-10 mb-16">' +
        '<div class="field"><label for="ma-filter-prop">Filter by property</label><select class="select select--sm" id="ma-filter-prop">' + propOptions + '</select></div>' +
        '<div class="field"><label for="ma-filter-status">Filter by status</label><select class="select select--sm" id="ma-filter-status">' + statusOptions + '</select></div>' +
        '</div>' +
        '<div class="stack gap-10">' +
        (filtered.length === 0 ? '<div class="tc muted p-18">No applications match your filter.</div>' :
        filtered.map(function (r) {
          const originalIdx = allRows.indexOf(r);
          return '<div class="manage-row">' +
            '<span class="avatar avatar--sm">' + S.esc(S.initials(r.name)) + "</span>" +
            '<span class="grow"><b>' + S.esc(r.name) + '</b><span class="tiny muted">' + S.esc(r.ref) + " · " + S.esc(r.prop) + "</span>" +
            '<span class="pill pill--sm mt-4 ' + (r.status === "Approved" ? "pill--green" : r.status === "Under review" ? "pill--amber" : "pill--navy") + '">' + S.esc(r.status) + '</span></span>' +
            '<span class="mrow-actions">' +
            '<button class="btn btn--sm btn--ghost" type="button" data-review="' + originalIdx + '">Review</button>' +
            '<button class="btn btn--sm btn--green" type="button" data-approve="' + originalIdx + '">Approve</button>' +
            '<button class="btn btn--sm btn--danger" type="button" data-decline="' + originalIdx + '">Decline</button>' +
            "</span></div>";
        }).join("")) + "</div>";

      S.enhanceSelects(sheet.body);

      const propSelect = sheet.body.querySelector("#ma-filter-prop");
      if (propSelect) propSelect.addEventListener("change", function () {
        filterProp = propSelect.value;
        render();
      });

      const statusSelect = sheet.body.querySelector("#ma-filter-status");
      if (statusSelect) statusSelect.addEventListener("change", function () {
        filterStatus = statusSelect.value;
        render();
      });

      sheet.body.querySelectorAll("[data-approve]").forEach(function (b) {
        b.addEventListener("click", function () {
          const idx = Number(b.getAttribute("data-approve"));
          allRows[idx].status = "Approved";
          setStage(idx, 4);
          S.toast("Approved " + allRows[idx].name + " — student tracking view updated");
          render();
        });
      });
      sheet.body.querySelectorAll("[data-review]").forEach(function (b) {
        b.addEventListener("click", function () {
          const idx = Number(b.getAttribute("data-review"));
          allRows[idx].status = "Under review";
          setStage(idx, 2);
          S.toast("Marked " + allRows[idx].name + " as under review");
          render();
        });
      });
      sheet.body.querySelectorAll("[data-decline]").forEach(function (b) {
        b.addEventListener("click", function () {
          const idx = Number(b.getAttribute("data-decline"));
          allRows[idx].status = "Declined";
          setStage(idx, 3);
          S.toast("Declined " + allRows[idx].name + " — student tracking view updated");
          render();
        });
      });
    };

    render();
  }

  function openAddProperty() {
    let step = 1;
    const draft = {
      name: "",
      area: D.AREAS[0],
      type: D.TYPES[0],
      funding: "nsfas",
      price: "3400",
      beds: "120",
      avail: "12",
      roomType: "Mix of single and sharing"
    };

    const sheet = S.openSheet({
      title: "Add a property",
      sub: "Three quick steps to list your accommodation on StaySure",
      body: "",
      foot: '<button class="btn btn--ghost" type="button" data-add-prev>Back</button>' +
        '<button class="btn btn--green grow" type="button" data-add-next>Continue</button>'
    });

    const draw = function () {
      if (S.closeSelectMenu) S.closeSelectMenu();
      let b = "";
      if (step === 1) {
        b = '<h3 class="h-card mb-10">Property & Location</h3>' +
          '<div class="stack gap-14">' +
          '<div class="field"><label for="np-name">Property name</label>' +
          '<input class="input" id="np-name" type="text" placeholder="e.g. Braam Student Heights" value="' + S.esc(draft.name) + '" /></div>' +
          '<div class="field"><label for="np-area">Area</label><select class="select" id="np-area">' +
          D.AREAS.map(function (a) { return '<option value="' + S.esc(a) + '"' + (draft.area === a ? " selected" : "") + ">" + S.esc(a) + "</option>"; }).join("") +
          "</select></div>" +
          '<div class="field"><label for="np-type">Accommodation type</label><select class="select" id="np-type">' +
          D.TYPES.map(function (t) { return '<option value="' + S.esc(t) + '"' + (draft.type === t ? " selected" : "") + ">" + S.esc(t) + "</option>"; }).join("") +
          "</select></div>" +
          '<div class="field"><label for="np-funding">Funding accreditation</label><select class="select" id="np-funding">' +
          D.FUNDING.map(function (f) { return '<option value="' + S.esc(f.id) + '"' + (draft.funding === f.id ? " selected" : "") + ">" + S.esc(f.label) + " (" + S.esc(f.sub) + ")</option>"; }).join("") +
          "</select></div>" +
          "</div>";
      } else if (step === 2) {
        b = '<h3 class="h-card mb-10">Pricing & Capacity</h3>' +
          '<div class="stack gap-14">' +
          '<div class="field"><label for="np-price">Monthly rent per student</label><div class="input-money"><span class="cur">R</span>' +
          '<input class="input" id="np-price" type="number" inputmode="numeric" placeholder="3400" value="' + S.esc(draft.price) + '" /></div></div>' +
          '<div class="grid-2 gap-14">' +
          '<div class="field"><label for="np-beds">Total beds</label><input class="input" id="np-beds" type="number" value="' + S.esc(draft.beds) + '" /></div>' +
          '<div class="field"><label for="np-avail">Available now</label><input class="input" id="np-avail" type="number" value="' + S.esc(draft.avail) + '" /></div>' +
          "</div>" +
          '<div class="field"><label for="np-room">Room layout</label><select class="select" id="np-room">' +
          ["Single rooms only", "Mix of single and sharing", "2-sharing rooms", "4-sharing rooms"].map(function (r) {
            return '<option value="' + S.esc(r) + '"' + (draft.roomType === r ? " selected" : "") + ">" + S.esc(r) + "</option>";
          }).join("") +
          "</select></div>" +
          "</div>";
      } else {
        const fundObj = D.FUNDING.filter(function (f) { return f.id === draft.funding; })[0];
        const fundLabel = fundObj ? fundObj.label : "Self-funded";
        b = '<h3 class="h-card mb-10">Review & Submit for Verification</h3>' +
          '<p class="small muted">Listings must be verified before going live to students. We verify provider identity, title deed/lease, location and pricing.</p>' +
          '<div class="card card--pad mt-14" style="background:var(--navy-tint);border-color:var(--line);">' +
          '<div class="stack gap-8">' +
          '<div class="row row--between"><b>Property name</b><span>' + S.esc(draft.name || "Untitled property") + '</span></div>' +
          '<div class="row row--between"><b>Area & Type</b><span>' + S.esc(draft.area) + " · " + S.esc(draft.type) + '</span></div>' +
          '<div class="row row--between"><b>Monthly rent</b><span class="num font-bold">R ' + S.esc(draft.price) + '</span></div>' +
          '<div class="row row--between"><b>Beds & Availability</b><span>' + S.esc(draft.avail) + " available of " + S.esc(draft.beds) + '</span></div>' +
          '<div class="row row--between"><b>Funding</b><span>' + S.esc(fundLabel) + '</span></div>' +
          '</div></div>' +
          '<div class="mt-14">' + S.note("After submitting, you will be taken to the verification checklist to upload documents. Students cannot apply until verification is complete.", "amber", "alert") + "</div>";
      }
      sheet.body.innerHTML = b;
      S.enhanceSelects(sheet.body);
      sheet.overlay.querySelector("[data-add-next]").textContent = step === 3 ? "Submit for verification" : "Continue";
      sheet.overlay.querySelector("[data-add-prev]").style.display = step === 1 ? "none" : "";
    };

    draw();

    sheet.overlay.querySelector("[data-add-next]").addEventListener("click", function () {
      if (step === 1) {
        draft.name = (sheet.overlay.querySelector("#np-name") ? sheet.overlay.querySelector("#np-name").value.trim() : "") || "Untitled property";
        if (sheet.overlay.querySelector("#np-area")) draft.area = sheet.overlay.querySelector("#np-area").value;
        if (sheet.overlay.querySelector("#np-type")) draft.type = sheet.overlay.querySelector("#np-type").value;
        if (sheet.overlay.querySelector("#np-funding")) draft.funding = sheet.overlay.querySelector("#np-funding").value;
      }
      if (step === 2) {
        if (sheet.overlay.querySelector("#np-price")) draft.price = sheet.overlay.querySelector("#np-price").value || "3400";
        if (sheet.overlay.querySelector("#np-beds")) draft.beds = sheet.overlay.querySelector("#np-beds").value || "100";
        if (sheet.overlay.querySelector("#np-avail")) draft.avail = sheet.overlay.querySelector("#np-avail").value || "10";
        if (sheet.overlay.querySelector("#np-room")) draft.roomType = sheet.overlay.querySelector("#np-room").value;
      }
      if (step < 3) {
        step++;
        draw();
        return;
      }

      // Add to providerProps and D.PROPERTIES
      const propId = "prop-" + Date.now();
      const newProp = {
        id: propId,
        name: draft.name,
        beds: Number(draft.beds) || 100,
        occupied: 0,
        status: "pending",
        price: Number(draft.price) || 3400,
        area: draft.area,
        type: draft.type,
        funding: draft.funding
      };
      providerProps.unshift(newProp);

      D.PROPERTIES.unshift({
        id: propId,
        name: draft.name,
        area: draft.area,
        type: draft.type,
        price: Number(draft.price) || 3400,
        distanceKm: 1.2,
        distanceText: "1.2 km from Wits",
        verified: false,
        funding: draft.funding,
        rating: 4.8,
        reviewsCount: 0,
        image: "images/p1.jpg",
        description: "Modern student accommodation located in " + draft.area + ". Listed by Braam Student Living (Pty) Ltd.",
        facilities: ["wifi", "security", "study", "laundry"],
        trust: {
          verifiedDate: "Verification in progress",
          checks: [
            { label: "Provider identity", ok: true },
            { label: "Address & lease", ok: true },
            { label: "Accreditation", ok: false }
          ]
        },
        reviews: []
      });

      S.closeSheet();
      window._ssProvActiveProp = draft.name;
      window._ssProvSubmitted = false;
      S.go("/providerVerify");
      S.toast("Property '" + draft.name + "' added & submitted for verification!");
    });

    sheet.overlay.querySelector("[data-add-prev]").addEventListener("click", function () {
      if (step === 2) {
        if (sheet.overlay.querySelector("#np-price")) draft.price = sheet.overlay.querySelector("#np-price").value;
        if (sheet.overlay.querySelector("#np-beds")) draft.beds = sheet.overlay.querySelector("#np-beds").value;
        if (sheet.overlay.querySelector("#np-avail")) draft.avail = sheet.overlay.querySelector("#np-avail").value;
      }
      if (step > 1) { step--; draw(); }
    });
  }

  S.register("provider", provider);

  /* ======================================================================
     Provider verification
     ====================================================================== */

  function providerVerify() {
    const activePropName = window._ssProvActiveProp || (providerProps.filter(function (p) { return p.status !== "verified"; })[0] || providerProps[0]).name;
    const propOptions = providerProps.map(function (p) {
      return '<option value="' + S.esc(p.name) + '"' + (p.name === activePropName ? " selected" : "") + '>' + S.esc(p.name) + (p.status === "verified" ? " (Verified)" : " (Pending)") + '</option>';
    }).join("");

    const rows = [
      { title: "Property information", done: true, date: "2 September 2026" },
      { title: "Provider identity", done: true, date: "2 September 2026" },
      { title: "Documents", done: true, date: "3 September 2026" },
      { title: "Location", done: true, date: "5 September 2026" },
      { title: "Accreditation / funding information", done: false, date: null }
    ];
    const doneCount = rows.filter(function (r) { return r.done; }).length;
    const pct = Math.round((doneCount / rows.length) * 100);
    const submitted = window._ssProvSubmitted === true;

    return {
      title: "Property verification",
      html: '<div class="provider-bar"><div class="wrap provider-bar-inner">' +
        '<span class="pill pill--solid">StaySure Provider</span>' +
        '<span class="small provider-acct">Braam Student Living (Pty) Ltd</span>' +
        '<a class="btn btn--quiet provider-switch" href="#/dashboard">' + S.icon("user", 14) + "Student view</a>" +
        "</div></div>" +
        '<div class="wrap wrap--mid">' +
        S.backRow("Back to dashboard", "#/provider") +
        '<h1 class="h-page">Property Verification</h1>' +
        '<p class="sub mt-6">Complete the verification checks to unlock student applications.</p>' +

        (providerProps.length > 1 ?
          '<div class="field mt-18 mb-14" style="max-width:340px;"><label for="pv-prop-select">Select listing to review</label><select class="select select--sm" id="pv-prop-select">' + propOptions + '</select></div>' : '') +

        (submitted
          ? '<div class="card card--pad mt-24 success-card tc">' +
          '<span class="success-check">' + S.icon("check", 32) + "</span>" +
          '<h2 class="h-section mt-18">Submitted for verification</h2>' +
          '<p class="sub mt-10">Our verification team will review your documents for <b>' + S.esc(activePropName) + '</b>. Most checks complete within 3 working days.</p>' +
          '<div class="mt-18">' + S.note("Next steps: we may contact you for an accreditation letter, and we will confirm availability before the listing goes live.", null, "info") + "</div>" +
          '<a class="btn mt-18" href="#/provider">Back to dashboard</a></div>'
          : '<div class="card card--pad mt-24">' +
          '<div class="row row--between mb-10"><b>Verification progress · ' + S.esc(activePropName) + '</b><span class="small muted num">' + pct + "%</span></div>" +
          '<div class="progress"><span style="width:' + pct + '%"></span></div>' +
          '<div class="stack gap-8 mt-18">' + rows.map(function (r) {
            return '<div class="vrow vrow--prov' + (r.done ? "" : " is-pending") + '">' +
              '<span class="v-ico ' + (r.done ? "is-ok" : "is-pending") + '">' + S.icon(r.done ? "check" : "clock", 16) + "</span>" +
              '<span class="grow"><b>' + S.esc(r.title) + "</b>" +
              '<span class="tiny muted">' + (r.done ? "Verified " + S.esc(r.date) : "Pending verification") + "</span></span>" +
              (r.done ? "" : '<button class="btn btn--sm btn--soft" type="button" data-upload-prov>' + S.icon("upload", 14) + "Upload document</button>") +
              "</div>";
          }).join("") + "</div></div>" +

          '<button class="btn btn--green btn--full btn--lg mt-18" type="button" data-submit-prov>Submit for Verification</button>' +
          '<p class="tiny muted tc mt-10">You can submit with the accreditation item pending — it will be marked on your public listing.</p>') +
        "</div>",
      mount: function (root) {
        const propSelect = root.querySelector("#pv-prop-select");
        if (propSelect) {
          propSelect.addEventListener("change", function () {
            window._ssProvActiveProp = propSelect.value;
            window._ssProvSubmitted = false;
            S.renderRoute();
          });
        }
        const up = root.querySelector("[data-upload-prov]");
        if (up) up.addEventListener("click", function () {
          S.toast("Accreditation letter attached (simulated)");
        });
        const sub = root.querySelector("[data-submit-prov]");
        if (sub) sub.addEventListener("click", function () {
          window._ssProvSubmitted = true;
          S.renderRoute();
          S.toast("Submitted for verification");
        });
      }
    };
  }

  S.register("providerVerify", providerVerify);
})();
