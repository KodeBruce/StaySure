# StaySure in-app 3D walkthrough pilot

This is the provider-to-student workflow implemented in this repository:

1. A signed-in provider opens `/provider/tours`, follows the capture guide, selects an assigned property, and uploads a video or photo set.
2. The React app checks file count, format, size and resolution, uploads the capture to Firebase Storage, and queues a `tour_jobs` Firestore record.
3. The GPU worker in `../tour-worker/worker.py` polls queued jobs, runs Nerfstudio processing and Splatfacto training, exports a Gaussian splat, and uploads `scene.ply` to Storage.
4. A StaySure reviewer opens the generated scene at `/review/tour/<job-id>`, checks the result, and publishes it.
5. Students see a **3D tour available** badge and open the interactive viewer from the property detail page. The photo gallery remains available.

The browser does not run Nerfstudio. Generation starts from the platform, but the GPU worker must be running for queued jobs to complete. No sample room or Firebase project is included in this repository.

## Sample image demo

Open `/provider/tours/demo` to inspect the four listing images currently in the repository. They include an exterior and interior photos of different room layouts. The demo therefore stops at the capture check, shows the actual source files in a photo viewer, and leaves the student listing without a 3D tour badge. It does not simulate a successful 3D reconstruction. To demonstrate a real generated scene, supply a continuous overlapping capture of one room, configure Firebase, and run the GPU worker described below.

## Capture instructions shown to providers

- Prepare the actual advertised unit. Keep lighting and furniture consistent. Remove people and private papers.
- Move slowly around each room, overlap views through doorways, and cover bed, desk, storage, windows, bathroom, kitchen and entrance where applicable.
- Avoid blur, abrupt turns, digital zoom, heavy reflections and dark corners.
- Recommended: a 1080p MP4/MOV video of roughly 1–3 minutes, or 40–80 overlapping photos.
- Pilot upload limits: one video of at least 720p and 30 seconds, or 20–80 JPEG/PNG photos at least 1280 × 720; total upload below 500 MB. These checks reject clearly inadequate captures but do not guarantee reconstruction quality. COLMAP alignment and reviewer inspection determine whether the output is useful.

Nerfstudio capture guidance: https://docs.nerf.studio/quickstart/custom_dataset.html

## Configure Firebase

1. Configure the web app's `.env` as described in `README.md`, enable Auth, Firestore and Storage, and deploy `firestore.rules` and `storage.rules` after review.
2. Create a provider account. An admin must assign a listing's `providerId` to that provider's Firebase Auth UID. The capture screen only offers assigned listings. For the first pilot, a StaySure admin may choose any listing.
3. Assign StaySure reviewers an **admin custom claim** (`role: admin`) using a trusted server or Firebase Admin SDK. The visible role in a `users` document is only a UI hint and does not grant rule-level admin rights.
4. The viewer fetches a generated splat from Firebase Storage in the browser. Configure the bucket's CORS policy to allow `GET` from the StaySure site origin and local development origin. Verify this with a published test scene.

The included rules limit capture uploads to the job owner and reserve tour publication for admin claims. They are prototype rules and require review before broad deployment, especially the pre-existing rules for applications, users and conversations.

## Run the generator

On a GPU host, install Nerfstudio, COLMAP and FFmpeg following the current upstream instructions. Nerfstudio is more reliably installed on Linux; Splatfacto's documented default uses about 6 GB of GPU memory. Install `tour-worker/requirements.txt` and provide Application Default Credentials for the same Firebase project. Set `FIREBASE_STORAGE_BUCKET` to the project's bucket name, then run:

```bash
python tour-worker/worker.py
```

Use `--once` for one polling cycle. The worker checks for queued jobs every 15 seconds, downloads the private capture, runs `ns-process-data`, `ns-train splatfacto`, and `ns-export gaussian-splat`, then marks the job `review` or `failed`. Run one worker process for the pilot; production scaling needs a managed task queue, job timeout policy, retries and GPU cost controls.

Nerfstudio export: https://docs.nerf.studio/nerfology/methods/splat.html

## Test the complete journey

1. Seed or create a real listing, set its `providerId`, and sign in as that provider.
2. Open **Create 3D tour**, follow the guide, upload a capture and confirm the job changes from `uploading` to `queued`.
3. With the worker running, confirm the job advances to `processing` and then `review`.
4. Sign in as a reviewer with an admin claim. Inspect the whole scene, verify it shows the listed unit and has no private information, and publish.
5. Open the listing on a normal phone and computer. Confirm the badge, tour button, 3D navigation, loading and photo fallback. Record capture quality and download size before accepting more providers.

The PlayCanvas viewer is packaged into `public/tour-viewer/` by `npm run dev` and `npm run build`; those generated files are not committed. It loads the exported `.ply` from Firebase Storage when a student opens a published tour.
