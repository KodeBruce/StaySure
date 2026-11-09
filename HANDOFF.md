# Handoff: StaySure — Student Accommodation Decision Platform (MVP)

## Overview
StaySure is a student accommodation marketplace and decision-support platform, launching for students at the University of the Witwatersrand (Wits), Johannesburg. The core journey is **Search → Compare → Verify → Decide → Apply**. Key differentiators: affordability intelligence (total monthly cost, not just rent), verified listings, side-by-side comparison, personalised match scoring and an end-to-end application + tracking flow. A provider (supply-side) dashboard and verification workflow are included.

Positioning line: **"Search. Compare. Verify. Secure."** — *Find accommodation that fits your budget, your needs and your confidence.*

## About the Design Files
The files in this bundle are **design references created in HTML/React (in-browser Babel)** — a working prototype showing intended look, content and behaviour. They are **not production code to ship directly**. The task is to **recreate these designs in the target codebase's environment** using its established patterns. If no codebase exists yet, a sensible choice is **Next.js (React) + TypeScript + Tailwind or CSS Modules**, with a real backend (e.g. Postgres + an auth provider) replacing the prototype's `localStorage` state.

Open `StaySure Prototype.html` in a browser (served over http, e.g. `npx serve .`) to click through. A dark "Investor demo journey" panel (bottom-right) jumps through the 10-step pitch flow, toggles a 390px **Phone view**, opens the **Provider** side and **Resets** demo state. That panel is a demo tool only — do not build it into production.

## Fidelity
**High-fidelity.** Final colours, typography, spacing, copy, component states and interactions. Recreate pixel-accurately. All property data, reviews, verification dates and match scores are **fictional demo data** and must be replaced by real data sources.

---

## Global Layout & Navigation
- **Responsive via container queries** on `.app-root` (`container-name: app`). Breakpoints: **≤760px = mobile**, ≤960px tablet adjustments, ≤520px / ≤480px small-phone tweaks.
- **Content width**: `.wrap` max-width 1160px, horizontal padding 28px (18px mobile). Narrow pages use max-width 600–820px.
- **Top nav (desktop)**: sticky, 66px tall (58px mobile), white @ 86% opacity + `backdrop-filter: blur(14px)`, 1px bottom border `--line`. Left: logo. Then pill links: Home, Search, Compare (green count badge), Applications, Saved (grey count badge). Right: bell icon button (unread badge) + avatar circle (38px). Active link: bg `--navy-soft`, text `--navy`. Links: 14.5px/600, padding 9×14, radius 999.
- **Bottom nav (mobile only)**: sticky bottom, 5 equal columns — Home, Search, Compare, Applications, Profile. Icon 22px over 11px/700 label, min-height 48px. Active: `--navy` text + 28×3px navy indicator bar at top. Badges on Compare/Applications.
- "Home" routes to Landing if not onboarded, else Dashboard.
- **Routing**: hash routes `#/name/id`. Browser back works (pushState). Every screen has a back affordance (`BackRow`: chevron + label, 14px/700, `--ink-2`).
- Screen change: scroll to top + 0.3s `fadeup` (opacity 0→1, translateY 6px→0).

## Screens / Views

### 1. Landing (`#/landing`)
- Hero: 2-col grid (1.05fr / 1fr, gap 48, padding 64/72), bg gradient `--navy-tint` → `--bg`. Collapses to 1 col ≤960px.
- Location pill (green): "Now live for Wits students · Johannesburg".
- H1 "Find accommodation you can **trust.**" — Bricolage Grotesque 800, 60px (40px mobile), line-height 1.02, letter-spacing −0.035em, colour `--navy`; "trust." in `--green-ink`.
- Sub: "Search, compare and verify student accommodation around Wits, based on your budget, location and needs." 18px, `--ink-2`, max-width 500.
- CTAs: **Find My Accommodation →** (primary, 56px tall) → Onboarding; **Explore Accommodation** (ghost) → Results. Full-width on mobile.
- Trust row (3-col, top border, 1-col mobile): icon tile 38px white w/ shadow + title/sub — "Verified Listings / Checked by the StaySure team", "Budget-Friendly Options / Total monthly cost, not just rent", "Student-Focused Search / Built around how students decide".
- Visual: 3 overlapping property cards (270px wide, radius 20, shadow-lg, rotated −4°, 3°, −1°; hover → rotate 0 + lift 6px) + floating "92% Great match for you" chip with score ring. Cards click through to Detail.
- "How StaySure works": eyebrow + H2 "From search to signed, with confidence." + 4 cards (Search, Compare, Verify, Apply) with icon tile 46px, large faint step number "01–04". 4-col → 2-col → 1-col.
- Navy band CTA: "Find accommodation that fits your budget, your needs and your confidence." + "Get started — it's free" (green) + "I'm a provider" → Provider dashboard.
- Footer disclaimer: prototype/fictional data, not affiliated with Wits or NSFAS.

### 2. Onboarding (`#/onboarding`)
- Narrow (620px). Back row + "Step N of 4" + green progress bar (8px).
- Step 1 "Where do you study?" — radio options, default **University of the Witwatersrand** (others marked "coming soon").
- Step 2 budget: Under R2,000 / R2,000–R3,000 / **R3,000–R4,000** (default) / R4,000–R5,000 / R5,000+. Each shows count of matching properties. Budget value used for logic: 2000 / 3000 / 3500 / 4500 / 6000.
- Step 3 funding: NSFAS / University funding / Self-funded / Other (with sub-lines).
- Step 4 priorities (multi-select, 2-col grid): Affordability, Safety, Close to campus, Transport, Wi-Fi, Furnished, Private room, Meals included.
- Option component `.opt`: min-height 56, radius 14, inset 1.5px `--line` border; selected → inset 2px `--navy` + bg `--navy-tint`. Radio 22px (selected = 7px navy inset ring); checkbox 22px radius 7 (selected = navy fill + white check).
- Continue disabled until answered. Final CTA **Show My Options** (green) → saves profile, sets filters (max = budget+500, NSFAS filter on if NSFAS), routes to Results (replace) + toast "Showing options personalised for you".

### 3. Search (`#/search`)
- Navy header band: H1 "Find your student home", sub "Near the University of the Witwatersrand, Johannesburg".
- White search panel (radius 22, padding 20, shadow-lg): 6-col grid → Location (select of areas), Max budget (R-prefixed numeric input), Distance from Wits, Accommodation type, Funding, **Search** (green). 2-col ≤1000px, 1-col ≤520px.
- "Recommended for you" — top 3 by match score with explanation line ("Based on your R3,500 budget, NSFAS funding and 4 priorities"), link "See why" → Recommendations.

### 4. Search Results (`#/results`) + 5. Filters
- Header: "{n} places near Wits" + personalisation line. Sort select: Best match / Lowest price / Closest to Wits / Highest rated. Desktop map toggle (illustrative map with price pins).
- Horizontal chip row: **Filters · n** (opens sheet), quick toggles Verified / NSFAS compatible / Under 1 km / Under R{budget}, "Clear all".
- Desktop: 300px sticky filter sidebar + card grid (`auto-fill minmax(280px,1fr)`, gap 20). Mobile: filters in a bottom sheet with footer "Reset" + **Show {n} places** (live count from draft filters).
- **Filter groups**: Price (dual-thumb range R1,500–R6,000, step 100), Distance (Under 1 km, 1–2, 2–5, 5 km+ — multi), Verification (Verified, Accreditation confirmed), Funding (NSFAS compatible, Self-funded), Facilities (Wi-Fi, Security, Laundry, Study area, Transport, Furnished, Meals — must have ALL selected), Accommodation type (Residence, Apartment, Shared room, Private room — ANY). Results update instantly.
- Empty state card with "Clear filters".
- **Property card** (`PropertyCard`): image 16:10 (hover zoom 1.03 over .5s), top-left badge "✦ Good match · NN%" (navy solid, when score ≥78) or "Within your budget" (white), top-right heart save button (38px circle; saved = red fill). Body: name (Bricolage 700 18px) + rating "★ 4.6 (128)"; price (Bricolage 800 22px navy) "/month" + room type; meta "1.2 km from Wits", "N available"; pills Verified (green) / Verification pending (amber) / Not verified (grey) + "NSFAS compatible" (navy) or "Self-funded only"; facility tags (Wi-Fi, Security, Laundry, Study area, Transport); buttons **View Details** (primary) + **Compare** (ghost → green "✓ Comparing" when selected).
- **Compare tray**: sticky bottom (above bottom nav on mobile), navy, radius 18: 3 thumb slots, "N of 3 selected" + sub, Clear, **Compare** (disabled until 2). On ≤520px: subtitle hidden, Clear becomes icon-only, thumbs 30px.

### 6. Accommodation Detail (`#/detail/:id`)
- Back row ("Back to results") + share + save icon buttons.
- Gallery: main image + 3 thumbnails column (200px), height 440px, radius 22; active thumb has 3px navy ring. Mobile: main 4:3 + thumb strip (64px).
- Layout 1fr / 360px sticky side card (side card hidden ≤960px; replaced on mobile by sticky bottom CTA bar: price + budget status + compare icon + **Apply Now**).
- Header: "StaySure Verified ✓" pill (clickable → verification sheet), type pills, H1 name (34px), meta (area · distance, rating, beds).
- **Affordability card**: 3 cells — Your budget R3,500 / Property price R3,200 / Status "Within your budget ✓" (green cell) or "R{x} over budget" (amber). If NSFAS/University funded: row "Funding compatibility: Compatible ✓" + amber "Indicative" pill. Disclaimer note: indicative only, not official NSFAS approval. Button "Check the full monthly cost" → Affordability.
- **"Why this property is trusted"** card (gradient green-soft → white): 2-col checklist — Provider identity verified, Property information verified, Location verified, Accreditation/funding status displayed, Availability recently confirmed, Images/property information reviewed. "Last verified: 12 September 2026" + **View verification details** → Verification page. "Demo data" tag.
- About the property; Facilities grid (3-col; missing facilities at 40% opacity + strikethrough); Location (illustrative map + 3 stat tiles: 1.2 km from Wits / 15 min walk / 5 min by taxi, labelled "Illustrative"); Safety (Security presence, Controlled access, CCTV, Emergency contact + note that StaySure does not rate crime levels); Student reviews (rating summary, 2 example reviews, "Read all reviews" → sheet; "Example reviews" tag).
- Side card: price 30px, match ring (54px), budget/NSFAS pills, "NN% StaySure prototype match score", **Apply Now** (green, disabled for unverified listings), Add to compare, Message provider (opens chat sheet).

### 7. Verification (`#/verify/:id`) + verification sheet
- Hero card navy (verified) or amber-soft (pending): shield tile 64px, "StaySure Verified ✓", "Last verified: …", "6/6 checks passed".
- "What we checked" list — each row: 40px icon tile, title, explanation, date pill (or "Pending"). Then 3 explainer cards: Who verifies? / How often? / Something wrong? Disclaimer note. Buttons: Back to property, Report a concern (toast).

### 8. Compare (`#/compare`)
- Empty state with "Browse places" + "Try a demo comparison".
- **"Which option fits you best?"** card — 3 tiles: Best overall match (green, highest match score), Best match for your budget (cheapest), Closest to campus. Each clickable → detail. Footnote: decision support based on priorities, not financial advice.
- Table (horizontal scroll on mobile, min-width 520–620px, sticky first column): header with image, name, best-badge, remove ×; "+ Add a property" slot opens a picker sheet when <3. Rows: Monthly price (green if within budget, amber if over), Distance, Verification, Funding compatibility, Wi-Fi, Security, Laundry, Study area, Furnished, Meals, Rating, Match score, actions (View / Check cost).
- **Difference highlighting**: rows whose values differ get light navy tint + navy dot after label; the strongest cell in that row gets `--green-soft` background.
- Max 3 — adding a 4th shows toast "You can compare up to 3 properties. Remove one first."

### 9. Affordability (`#/afford/:id`)
- 2-col (inputs / results), 1-col ≤860px.
- Inputs (R-prefixed numeric): Property select, Monthly income/funding (default **R4,500**), Accommodation cost (= property rent, e.g. **R3,200**), Estimated transport (**R500** if ≤1.5 km, R750 ≤3 km, else R1,000), Estimated utilities (**R300**).
- Results: **Estimated monthly housing cost** = rent + transport + utilities (R4,000); **Estimated remaining amount** = income − total (R500; red with "−" if negative). Bricolage 800 40px.
- Stacked bar (rent navy / transport mid-blue / utilities light-blue / leftover grey) + legend.
- Status: remaining ≥10% of income → **"Fits your current budget"** (green); 0–10% → **"May stretch your budget"** (amber); negative → "Exceeds your current budget" (red). Sub: "Housing uses N% of your monthly income/funding".
- If not "fits": suggests up to 2 verified, funding-compatible alternatives that leave more room.
- Disclaimer (amber): "This is an indicative budgeting tool and is not financial advice or an official NSFAS calculation."

### 10. Recommendations (`#/recs`)
- "Based on" chips (budget band, distance pref, funding, other priorities) + "Edit preferences" → Onboarding.
- 3 cards (320px image / body; stacks on mobile): name, price/distance/rating, 68px score ring "NN% Match", **Why?** checklist (up to 4 reasons e.g. ✓ Within your budget, ✓ Close to Wits, ✓ Matches your preferred facilities, ✓ Verified listing; unmet = amber), buttons Apply Now / View Details / Compare. "Top pick" badge on #1.
- Note: "The percentage is a StaySure prototype match score — … not an objective or official rating."

### 11. Application (`#/apply/:id`)
- Stepper: 6 numbered dots (34px) joined by lines — done = green + check, current = navy + 4px navy-soft ring; labels Personal, Student, Funding, Documents, Review, Submit (labels hidden ≤520px). Completed dots clickable.
- Steps: 1 Personal information (pre-filled name, SA ID, mobile, email, guardian); 2 Student information (institution read-only, student no., year, faculty, move-in); 3 Funding (radio + reference number; warning if NSFAS but property not compatible); 4 Supporting documents (3 rows with Upload/Remove — simulated); 5 Review (grouped summaries with Edit links; warning if a doc missing); 6 Submit (rent + "Application fee: Free on StaySure", consent checkbox).
- Submit → 1.2s "Submitting…" → success: animated green check (pop), **"Application Submitted"**, "Your application has been sent to the accommodation provider.", reference **STY-2026-00124**, expected response, buttons Track my application / Go to dashboard.

### 12. Application Tracking (`#/tracking/:id`)
- Header card: image, name, ref, price, status pill **"Under Review"** (amber with clock).
- Vertical timeline (34px markers, 2px connector; done = green check, current = navy with pulsing dot, future = outline): ✓ Application submitted, ✓ Documents received, ● Provider reviewing application, ○ Decision, ○ Lease. Contextual message under current step.
- Side: Next steps checklist + Message provider + View property; "Demo control" card to step status back/forward (prototype only — production status comes from provider actions).

### 13. Student Dashboard (`#/dashboard`)
- Navy hero: "Welcome back" / **"Good afternoon, Thabo"** (time-based greeting) + New search / Budget check.
- 3-col grid (2-col tablet, 1-col mobile): Applications (span 2; progress bar + status pill), Messages (unread count; opens chat sheet), Saved properties, Recently viewed, Recommended for you (with % pills), Profile (completion bar).

### Supporting screens
- **Saved** (`#/saved`): saved cards grid + "Compare saved".
- **Profile** (`#/profile`): preferences rows (edit → onboarding), account rows, "Switch to Provider view", "Reset demo".
- **Chat sheet**: bubbles (own = navy, right), quick-question chips, input + send; simulated provider reply after ~1.1s.

### Provider Dashboard (`#/provider`)
- Dark provider bar: "StaySure Provider" pill, account name, "Student view".
- H1 **StaySure Provider**, buttons **Manage Applications** (sheet: Start review / Approve / Decline per applicant — approving Thabo's updates the student's tracking) and **Add Property** (3-step sheet → routes to verification).
- 5 stat cards: Properties, Applications, Occupancy, Messages, Verification status.
- Property cards: **Braam Student Village — 120 beds / 108 occupied / 12 available** + occupancy bar; second property "Pending verification" → Complete verification.
- Recent applications list + green promo card "Verified listings get 3× more applications".

### Provider Verification (`#/providerVerify`)
- H1 **Property Verification**, progress bar (80% → 100%). Rows: Property information ✓, Provider identity ✓, Documents ✓, Location ✓, Accreditation/funding information **Pending verification** (amber row with Upload document).
- **Submit for Verification** (green) → success card "Submitted for verification" with next steps.

---

## Interactions & Behavior
- Toasts: dark pill, bottom-centre (96px from bottom), auto-hide 2.6s. Used for save/unsave, compare add, simulated actions.
- Sheets/modals: overlay `oklch(0.15 0.03 262 / .45)`, centred card max-width 560 (720 wide) radius 24; on mobile becomes a bottom sheet (top radius 24, max-height 92%). Sticky header/footer. Esc and overlay click close. Animations: fade .18s, rise .22s `cubic-bezier(.2,.8,.2,1)`.
- Buttons: `:active` scale .98; transitions .12–.15s. Heights 48 (default), 38 (sm), 56 (lg). Radius 999.
- Inputs: 50px, radius 12, 1.5px `--line-2` border; focus → navy border + 4px `--navy-soft` ring.
- Score ring: SVG stroke-dashoffset animates .6s.
- Unverified listings cannot be applied to (button disabled + note).
- All tap targets ≥44px on mobile.

## State Management
Prototype keeps everything in React state persisted to `localStorage` (`staysure_v1`). Production equivalents:
- `profile` { name, university, band, budget, funding, priorities[], income } — user profile/preferences (server).
- `onboarded` boolean.
- `filters` { min, max, dist[], verified, accredited, nsfas, self, facilities[], types[], location, sort } — URL query params recommended.
- `saved[]`, `viewed[]` (max 6, most-recent first), `compare[]` (max 3, can be session-local).
- `applications[]` { id, ref, date, stage 0–4 } — server; stage changes driven by provider actions; notify via SMS/email.
- `messages[]` threads — server/realtime.
- **Match score** (`matchScore` in `src/data.jsx`): weighted sum — budget fit (22, or 30 if Affordability priority; partial if ≤10% over), distance (15, or 22 if Close-to-campus; scaled by band), funding compatibility (16), verification (14, or 18 if Safety; pending = 35%), preferred-facility coverage (18), rating adjustment; then ×0.88, clamped 28–96. Returns reasons used in "Why?". Treat as a placeholder algorithm to be refined — must always be labelled a "StaySure match score", never official.
- Funding compatibility: self/other funded → always compatible; NSFAS/University → property.nsfas flag. Always shown as **indicative**.

## Design Tokens
Source of truth is OKLCH (in `src/styles.css`); hex values are close approximations.

| Token | OKLCH | ≈ Hex | Use |
|---|---|---|---|
| `--navy` | 0.27 0.09 262 | #13234F | Primary brand, primary buttons, headings |
| `--navy-2` | 0.36 0.12 262 | #1F3A7A | Primary hover |
| `--navy-soft` | 0.95 0.02 262 | #E8EEFA | Active nav, soft buttons, navy pills |
| `--navy-tint` | 0.975 0.01 262 | #F3F6FC | Subtle fills, hovers |
| `--green` | 0.6 0.15 155 | #1F9D5C | Verified/affordable, success CTAs |
| `--green-ink` | 0.42 0.11 155 | #0F6A3A | Green text |
| `--green-soft` | 0.955 0.04 155 | #E1F6E8 | Green pill/cell bg |
| `--amber` | 0.72 0.14 70 | #D79A2B | Stars base |
| `--amber-ink` | 0.48 0.11 60 | #8A5A12 | Warning text, demo tags |
| `--amber-soft` | 0.96 0.04 80 | #FBF0DC | Warning bg |
| `--red-ink` | 0.5 0.15 25 | #B23A3A | Over budget |
| `--red-soft` | 0.96 0.03 25 | #FCEBEA | Error bg |
| `--ink` | 0.2 0.02 262 | #161A24 | Body text |
| `--ink-2` | 0.42 0.02 262 | #4D5361 | Secondary text |
| `--ink-3` | 0.58 0.015 262 | #7A7F8A | Tertiary text/icons |
| `--line` | 0.91 0.008 262 | #E3E5EA | Borders |
| `--line-2` | 0.86 0.01 262 | #D3D6DD | Input borders, strong borders |
| `--bg` | 0.985 0.004 262 | #F9FAFC | Page background |
| card | — | #FFFFFF | Cards |
| star | 0.75 0.15 75 | #E3A626 | Star icons |

**Typography**
- Display: **Bricolage Grotesque** (Google Fonts) 500–800, letter-spacing −0.02em (headings), `text-wrap: balance`.
- Body: **Manrope** 400–800.
- Scale: H1 hero 60/40 mobile; page H1 34/26 mobile; H2 22–32; H3 17–21; body 15–16; small 13; tiny 12; eyebrow 12.5/800 uppercase +0.08em `--green-ink`; prices Bricolage 800 (22 card, 30 side card, 40 affordability).
- Numbers: `font-variant-numeric: tabular-nums`. Currency format **R3,200** (comma thousands).

**Radius**: 10 (sm), 12 (inputs), 14 (options), 16, 18 (tray), 22 (cards `--r-lg`), 24 (sheets, dashboard hero), 999 (buttons, pills, chips).
**Shadows**: `--shadow`: 0 1px 2px rgba(navy,.06), 0 6px 20px rgba(navy,.06). `--shadow-lg`: 0 2px 6px rgba(navy,.08), 0 20px 50px rgba(navy,.14).
**Spacing**: 4 / 6 / 8 / 10 / 12 / 16 / 20 / 24 / 28 px; card padding 24 (18 mobile); grid gaps 16–24.

**Pills**: 12.5px/700, padding 4×10, radius 999 — variants green, navy, amber, grey, red, solid navy, white. **Chips** (filters): 42px (36 in sidebar), 1.5px inset border; on = navy fill white text. **Demo tag**: 11px/700 uppercase amber, radius 6 — use for any demo/indicative labelling.

**Logo**: 32px navy rounded square (radius 9) with white house roofline stroke and green checkmark beneath; wordmark "Stay" navy + "Sure" green, Bricolage 800 21px, −0.03em. See `LogoMark` in `src/ui.jsx` (simple SVG; a designer should finalise).

**Icons**: custom 24×24 line set, stroke 2, round caps/joins (`ICONS` in `src/ui.jsx`). In production, swap for **Lucide** equivalents (wifi, shield-check, map-pin, bus, sofa, utensils, etc.).

## Assets
- `img/*.jpg` — placeholder property photos sourced via licence-filtered (Creative Commons / public-domain) image search. **Not Johannesburg properties.** Replace with real provider photography (reviewed during verification).
- Map is an illustrative SVG, not geographic — replace with a real map (e.g. Mapbox/Google Maps) centred on Wits Main Campus.
- Fonts: Google Fonts (Bricolage Grotesque, Manrope).

## Content / Compliance Rules (must carry into production)
- Never present funding compatibility as official NSFAS approval unless verified; label "indicative".
- Match score always labelled "StaySure match score"; affordability tool always carries the "not financial advice / not an official NSFAS calculation" disclaimer.
- No claims about neighbourhood crime levels; safety = provider-reported features checked during verification.
- Verified badge only when all checks pass; show "Last verified" date.
- Not affiliated with Wits University or NSFAS unless formal partnerships exist.
- POPIA compliance for documents and personal data.

## Files
- `StaySure Prototype.html` — entry point (loads React 18 + Babel + the files below).
- `src/styles.css` — tokens, base components (buttons, pills, chips, cards, forms, sheets, toast, stepper, timeline, nav).
- `src/screens.css` — per-screen layout and responsive rules.
- `src/data.jsx` — fictional property dataset (10 properties), reviews, budget bands, funding options, priorities, `matchScore`, `applyFilters`, formatting.
- `src/ui.jsx` — app context, icon set, logo, `PropertyCard`, `VerifiedPill`, `ScoreRing`, `Sheet`, `MiniMap`, `Check`, `Note`, `BackRow`.
- `src/screens-a.jsx` — Landing, Onboarding, Search, Results, FilterPanel, CompareTray.
- `src/screens-b.jsx` — Detail, Verification (page + sheet), Compare, Affordability, Recommendations.
- `src/screens-c.jsx` — Apply, Tracking, Dashboard, Saved, Profile, ChatSheet, Provider, ProviderVerify.
- `src/app.jsx` — state, hash router, top/bottom nav, toasts, investor demo guide (demo-only).
