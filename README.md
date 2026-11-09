# StaySure — Student Accommodation Decision Platform

A static recreation of the **StaySure** high-fidelity prototype: a student accommodation
marketplace and decision-support platform for the University of the Witwatersrand (Wits),
Johannesburg.

Positioning: **"Search. Compare. Verify. Secure."** — *Find accommodation that fits your
budget, your needs and your confidence.*

Built from the `README.md` handoff spec as vanilla HTML, CSS and JavaScript (no build step,
no framework). The original design reference was a React/Babel prototype; this is a
standalone implementation using the same design tokens, copy, layout and behaviour.

---

## Running locally

Any static server works. The site uses relative paths throughout.

```
npx serve .
```

Then open the served root. The entry point is `index.html`, which boots the hash router.

---

## Entry paths & routes

Routing is hash-based (`#/name/id`), so the browser Back button works and every screen is
deep-linkable.

| Route | Screen | Notes |
|---|---|---|
| `#/landing` | Landing | Hero, how-it-works, navy CTA band, footer disclaimer |
| `#/onboarding` | Onboarding | 4-step preferences wizard |
| `#/search` | Search | Search panel + "Recommended for you" |
| `#/results` | Results | Filter sidebar / mobile sheet, sort, map, cards |
| `#/detail/:id` | Accommodation detail | Gallery, affordability, trust, facilities, reviews |
| `#/verify/:id` | Verification page | What we checked, explainers, report a concern |
| `#/compare` | Compare | Decision tiles + difference-highlighted table (max 3) |
| `#/afford/:id` | Affordability | Total monthly cost calculator |
| `#/recs` | Recommendations | Top 3 with "Why?" reasoning |
| `#/apply/:id` | Application | 6-step wizard → success state |
| `#/tracking/:id` | Tracking | Vertical status timeline + demo stage control |
| `#/dashboard` | Student dashboard | Applications, messages, saved, viewed, recs, profile |
| `#/saved` | Saved properties | Saved cards + "Compare saved" |
| `#/profile` | Profile | Preferences, account rows, provider switch, reset |
| `#/provider` | Provider dashboard | Stats, properties, applications, promo |
| `#/providerVerify` | Provider verification | Checklist → submitted state |
| `#/home` | — | Redirects to dashboard if onboarded, else landing |

### Example deep links

- `index.html#/detail/braam-student-village`
- `index.html#/compare`
- `index.html#/provider`

---

## File structure

```
index.html            Entry point; loads fonts, CSS and scripts in order
HANDOFF.md            Original design handoff/spec document (reference)

css/base.css          Design tokens, buttons, pills, chips, forms, sheets,
                      toast, stepper, timeline, nav, responsive base
css/screens.css       Per-screen layout and responsive rules

js/data.js            Demo dataset, match-score algorithm, filtering, formatting
js/ui.js              UI kit (icons, logo, cards, score ring, mini map, sheets,
                      toast) + app state, persistence and hash router
js/screens-a.js       Landing, Onboarding, Search, Results, filter panel
js/screens-b.js       Detail, Verification, Compare, Affordability, Recommendations
js/screens-c.js       Apply, Tracking, Dashboard, Saved, Profile, Chat, Provider
js/app.js             App shell: top/bottom nav, compare tray, global handlers, boot

images/p1..p10.jpg    Placeholder property photography (see Assets)
images/favicon.svg    Logo mark favicon
```

---

## Design system

Tokens live in `css/base.css` as CSS custom properties. OKLCH was the source of truth in the
original; this build uses the documented hex approximations.

| Token | Hex | Use |
|---|---|---|
| `--navy` | `#13234F` | Primary brand, buttons, headings |
| `--navy-2` | `#1F3A7A` | Primary hover |
| `--navy-soft` | `#E8EEFA` | Active nav, soft buttons, navy pills |
| `--navy-tint` | `#F3F6FC` | Subtle fills |
| `--green` | `#1F9D5C` | Verified / affordable / success CTAs |
| `--green-ink` | `#0F6A3A` | Green text |
| `--green-soft` | `#E1F6E8` | Green pill / cell background |
| `--amber` / `--amber-ink` | `#D79A2B` / `#8A5A12` | Warnings, demo tags |
| `--red-ink` | `#B23A3A` | Over budget |
| `--ink` / `--ink-2` / `--ink-3` | `#161A24` / `#4D5361` / `#7A7F8A` | Text scale |
| `--line` / `--line-2` | `#E3E5EA` / `#D3D6DD` | Borders |

**Typography** — Display: *Bricolage Grotesque* (500–800, −0.02em). Body: *Manrope*
(400–800). Both from Google Fonts. Currency is formatted `R3,200` with comma thousands.

**Radii** — 10 / 12 / 14 / 16 / 18 / 22 (cards) / 24 (sheets) / 999 (pills, buttons).

**Shadows** — `--shadow` for cards, `--shadow-lg` for elevated panels and the side card.

**Breakpoints** — ≤1080px, ≤960px (tablet: side card hidden, gallery shrinks),
≤760px (mobile: bottom nav, sheets become bottom sheets, single-column grids),
≤520px and ≤430px small-phone tweaks.

---

## Data model

All data is **fictional demo data**. Nothing is sent to a server.

`js/data.js` exports `window.SSData`:

- `PROPERTIES` — 10 listings with `id, name, area, distanceKm, walkMin, taxiMin, price,
  type, beds, available, rating, reviewsCount, verified, accredited, nsfas,
  lastVerified, facilities[], about, security[], reviews[], images[], checks[],
  passedChecks, distanceBand`.
- `FACILITIES`, `TYPES`, `AREAS`, `BUDGET_BANDS`, `FUNDING`, `PRIORITIES`,
  `DISTANCE_OPTIONS`, `CHECK_DEFS` — reference lists.
- `matchScore(property, profile)` — weighted placeholder algorithm.
- `applyFilters(filters, profile)` — filtering + sorting.
- `recommended(profile, limit)`, `decisionTiles(props, profile)`.
- `rand()`, `num()`, `km()`, `longDate()`, `getProperty()`, `makeRef()`.

### Match score (placeholder — label it as a StaySure score, never official)

Weighted sum, then `× 0.88` and clamped to 28–96:

- Budget fit — 22 (30 if *Affordability* is a priority); partial if ≤10% over
- Distance — 15 (22 if *Close to campus*); scaled by band (≤1 km, ≤2 km, ≤5 km, 5 km+)
- Funding compatibility — 16 (indicative; self/other funded always compatible)
- Verification — 14 (18 if *Safety*); pending counts 35%, unverified 0
- Preferred-facility coverage — 18
- Rating adjustment — up to ±4

Returns `{ score, reasons[], okCount }`; `reasons` powers the "Why?" checklist.

---

## Client state & storage

State lives in `js/ui.js` (`SS.state`) and is persisted to `localStorage` under the single
key **`staysure_v1`**.

```
profile      { name, university, band, budget, funding, priorities[], income }
onboarded    boolean
filters      { min, max, dist[], verified, accredited, nsfas, self,
               facilities[], types[], location, sort }
saved[]      property ids (most recent first)
viewed[]     property ids (max 6, most recent first)
compare[]    property ids (max 3)
applications [{ id, propertyId, ref, date, stage 0–4 }]
messages[]   reserved for threads
unread       notification count
```

`load()` merges stored values over defaults field by field. An unparseable stored value is
left untouched (a warning is logged) — the app never wipes unrelated storage. **Reset demo
data** removes only the `staysure_v1` key.

### Production equivalents

Per the handoff, these belong on a server, not in `localStorage`:

- `profile`, `onboarded` → user account records
- `filters` → URL query params (recommended)
- `compare[]` → can stay session-local
- `applications[]` → server records; `stage` driven by provider actions with SMS/email
- `messages[]` → server or realtime channel
- Documents → POPIA-compliant encrypted storage with access controls

---

## Implemented features

**Student side**

- Landing hero with overlapping property cards and animated score ring
- 4-step onboarding (institution, budget band with live match counts, funding, priorities)
  that saves the profile and seeds filters
- Search page with 6-field panel and personalised recommendations
- Results with live filter sidebar, mobile bottom-sheet filters with live "Show N places"
  count, quick chips, 4 sort modes, illustrative map, empty state
- Property cards: match badge, save heart, verified/funding pills, facility tags,
  View Details / Compare
- Compare tray (3 slots, disabled until 2) and compare page with decision tiles and
  difference-highlighted table (strongest cell shaded green)
- Detail page: 4-image gallery, affordability cells, "Why this property is trusted"
  checklist, facilities (missing shown struck through), location map + travel stats,
  safety list, reviews with rating summary, sticky side card, sticky mobile CTA bar
- Verification page and verification sheet
- Affordability calculator: rent + transport + utilities vs income, stacked cost bar,
  status thresholds (fits / may stretch / exceeds), alternative suggestions
- Recommendations page with "Why?" reasoning and Top pick badge
- 6-step application wizard with review step, consent gate, simulated uploads, success
  state with reference + animated check
- Application tracking timeline with demo stage control
- Student dashboard with time-based greeting, applications, messages, saved, viewed, recs
- Saved properties, profile, chat sheet with simulated provider replies
- Toasts, sheets/modals (Esc + overlay close), focus-visible states, skip link

**Provider side**

- Provider dashboard: dark provider bar, 5 stat cards, property cards with occupancy bars,
  recent applications, promo card
- Manage Applications sheet (start review / approve / decline — approving Thabo updates his
  student tracking stage)
- Add Property 3-step sheet → routes to verification
- Provider verification checklist (80% → submitted success state)

**Compliance copy carried through**

- Funding compatibility always marked "indicative", with an explicit note that it is not
  official NSFAS approval
- Match scores always labelled a "StaySure match score", never a rating
- Affordability tool carries the "not financial advice / not an official NSFAS calculation"
  disclaimer
- No claims about neighbourhood crime levels; safety = provider-reported, verified features
- Verified badge only when all six checks pass, with a "Last verified" date
- Footer states the site is not affiliated with Wits or NSFAS
- "Demo data" / "Example reviews" tags on fictional content

---

## Assets

- `images/p1..p10.jpg` — placeholder property photos sourced via licence-filtered image
  search (Creative Commons / public domain). **They are not Johannesburg properties** and
  must be replaced with reviewed provider photography.
- Maps are illustrative SVG (`miniMap()`), not geographic — replace with a real map
  provider (Mapbox / Google Maps) centred on Wits Main Campus.
- Icons are a custom 24×24 line set in `PATHS` inside `js/ui.js` — swap for Lucide
  equivalents in production.
- Fonts: Bricolage Grotesque + Manrope from Google Fonts.

---

## Known limitations / next steps

1. **No backend.** All state is browser-local and seeded with demo data. The next step is a
   real API (e.g. Postgres) with authentication, replacing `localStorage`.
2. **No real document handling.** Uploads are simulated; nothing is transmitted or stored.
   Production needs POPIA-compliant encrypted storage and a documented retention period.
3. **Match scoring is a placeholder.** It must be refined and validated before launch, and
   always labelled a StaySure score.
4. **Illustrative maps.** Swap for a real map provider.
5. **Property data is fictional.** Replace with verified provider data, including real
   verification dates.
6. **No notifications transport.** The bell shows a static demo notification list; production
   needs SMS/email delivery driven by provider actions.
7. **Provider actions are demo controls.** Approve/decline write to local state only.

---

## Verification performed

Checked with a headless browser at desktop (1280×800) and mobile (390×844):

- Landing, Search, Results, Detail, Compare, Affordability, Recommendations, Onboarding,
  Apply, Tracking, Dashboard, Profile, Provider, Provider verification — all render with no
  console errors and no leaked source text.
- Mobile: top nav collapses to logo + actions, bottom nav with 5 items and badges, filter
  sidebar replaced by a sheet, single-column card stacks, gallery becomes 4:3 + thumbnail
  strip, sticky CTA bar present, no horizontal overflow.
- Interactions: save/unsave, compare add/remove (max 3 with toast), filter toggles and dual
  price range, mobile sheet live count, affordability recompute while typing, application
  submit → success → tracking, provider approve → student tracking update, chat replies,
  Esc/overlay sheet close, toasts, demo reset.

---

## Data & compliance notes for the next developer

Do not present funding compatibility as official NSFAS approval. Do not describe
neighbourhood safety or crime levels. Do not ship the "demo control" affordances
(tracking stage stepper, provider approve/decline) into production — those must come from
real provider actions. Every score must remain labelled a StaySure match score.
