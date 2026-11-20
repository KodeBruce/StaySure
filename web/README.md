# StaySure — Web Application (React + TypeScript + Firebase)

Production-ready frontend for **StaySure — Student Accommodation Decision Platform**, connected to **Firebase** (Auth, Firestore, Storage, Hosting).

---

## Quick Start (Development)

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Progressive Web App

Production builds include an installable web app manifest, 192 px and 512 px icons, and a service worker. The service worker precaches the app shell and bundled listing images so previously visited routes can open without a connection. Live Firebase data, sign-in, submissions, and 3D tours still require a network connection. Service worker registration is enabled in production builds; use `npm run build` and `npm run preview` to check installation and offline behavior locally.

The search page has a Leaflet map with province, university, area, and Near me filters. Near me asks for browser location permission on tap and shows a blue location dot, accuracy circle, search radius, and estimated straight-line distances. Demo listings use approximate area-centre pins until verified `latitude` and `longitude` values are stored on each property. Map tiles require a network connection.

> **Note on Demo Mode:** The app runs out of the box even before configuring Firebase keys, using an initial in-memory fallback dataset. Once you add your Firebase credentials, it seamlessly connects to live Firestore and Firebase Storage.

---

## Connecting Your Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project (e.g. `staysure-wits`).
2. Enable:
   - **Authentication**: Enable Email/Password and Google sign-in methods.
   - **Firestore Database**: Create a database (test mode or production mode).
   - **Storage**: Create a default storage bucket.
3. In Project Settings > General > **Your apps**, add a **Web app** (`</>`).
4. Copy `.env.example` to `.env` in the `web` directory:
   ```bash
   cp .env.example .env
   ```
5. Paste your Firebase credentials into `web/.env`:
   ```ini
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=staysure-wits.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=staysure-wits
   VITE_FIREBASE_STORAGE_BUCKET=staysure-wits.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=1:...:web:...
   ```

---

## Seeding Initial Wits Accommodation Listings

Home and the map default to requesting browser location and sorting residences closest first. An unavailable or denied location leaves normal browsing available. Location coordinates remain in memory; only the student's near-me/explore preference is saved for the tab session. Manual university, area and map-area selections cancel automatic location selection, including late callbacks. Budget, room and living-preference filters continue to work with nearby sorting. Explore all locations broadens the search; the location control returns to closest-first. Distances are approximate straight-line distances from recorded map points; missing coordinates sort last. Nearby mode has no distance cutoff by default, with optional radius choices in map filters.

### Johannesburg workbook research

Wits campus outlines use one clear blue colour (`#0ea5e9`) with a thin stroke and translucent fill. Campus labels and a compact campus icon appear only when Wits is selected under Nearby University; otherwise only the outlines remain. The icon slides out the campus choices and collapses after selection, outside click or Escape. The satellite icon below the location control switches between the grey OpenStreetMap view and full-colour Esri World Imagery, preserving the camera, campus grounds and property selection. Imagery provider credits appear on the map. Mouse-wheel, trackpad pinch, touch and map-focused keyboard zoom affect the map, with visible +/− controls above the carousel.

The map highlights Wits East, West, Education, Health Sciences and Management campuses. The Wits campus control zooms to one campus or all five, and each campus label opens street context and source links. Outlines are bundled locally in `src/data/witsCampuses.json`, derived from the OpenStreetMap snapshot in `Res Data/wits-campus-source.json` (20 November 2026, ODbL). Braamfontein's combined perimeter is split at its mapped M1 crossings. Parktown outlines cover the mapped Education, Medical School and Business School grounds; they are orientation aids rather than surveyed property boundaries and do not include every associated hospital or residence. Campus names and street context were checked against [Wits campus maps](https://www.wits.ac.za/maps/parktown-campus/) and the [Business School visitor information](https://www.wbs.ac.za/about-us/visit-wbs).

The public research catalogue includes the supplied `Res Data/johannesburg-student-accommodations-complete-breakdown.xlsx`: 37 source rows, 11 matches to existing buildings, 25 additional residences, and one Rennie House entry held because its address differs from the existing Rennie House Apartments record. Existing IDs and provider-read rates are preserved. Twickenham and Quintal now have clearly labelled workbook estimates where numeric rent was previously missing.

Workbook prices are 2026 estimates with no source research date, not confirmed 2027 quotes. Room rates retain billing caveats. Campus distances, coordinates, contacts and amenities from the workbook remain unverified; funding statements do not establish official accreditation. New workbook records do not receive a StaySure verification badge. The provider checks dated 20 November 2026 supersede workbook prices for 80 Jorissen, Wynton Joy, Dunvista Mansions and The Fields. `Res Data/johannesburg-import-review.csv` records every import decision; `Res Data/johannesburg-provider-checks.json` records the checked prices and source URLs.

To refresh after reviewing workbook changes, run from the repository root (Python standard library only):

```bash
python web/scripts/import-johannesburg-workbook.py
python web/scripts/import-johannesburg-workbook.py --check
```

Review changes to building identity and the dated provider checks before refreshing. The importer generates the catalogue, supplementary room rates and review CSV. These local research updates do not write to Firestore or deploy the site.

Once your `.env` is configured with Firebase:
1. Open the app home page in your browser.
2. Click the **"Seed to Firestore"** button banner.
3. This uploads all 10 baseline student residences and apartments into your live `properties/` Firestore collection.

---

## Deploying to Firebase Hosting

```bash
npm run build
npm install -g firebase-tools
firebase login
firebase deploy
```

