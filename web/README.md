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

