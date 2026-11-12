"""Poll StaySure tour jobs on a GPU host with Nerfstudio installed."""

import argparse
import json
import os
import re
import subprocess
import tempfile
import time
from pathlib import Path

import firebase_admin
from firebase_admin import credentials, firestore, storage


SAFE_ID = re.compile(r"^[A-Za-z0-9_-]+$")


def run(command: list[str], timeout: int) -> None:
    subprocess.run(command, check=True, timeout=timeout)


def process_job(database, bucket, job_id: str) -> None:
    if not SAFE_ID.fullmatch(job_id):
        raise ValueError("Invalid job ID")
    job_ref = database.collection("tour_jobs").document(job_id)
    @firestore.transactional
    def claim(transaction):
        snapshot = job_ref.get(transaction=transaction)
        payload = snapshot.to_dict()
        if not payload or payload.get("status") != "queued":
            return None
        transaction.update(job_ref, {"status": "processing", "error": firestore.DELETE_FIELD})
        return payload

    job = claim(database.transaction())
    if not job:
        return
    property_id = job.get("propertyId", "")
    owner_id = job.get("ownerId", "")
    if not SAFE_ID.fullmatch(property_id) or not SAFE_ID.fullmatch(owner_id):
        raise ValueError("Invalid property or owner ID")
    if not database.collection("properties").document(property_id).get().exists:
        raise ValueError("Property does not exist")
    mode = job.get("mode")
    paths = job.get("capturePaths", [])
    if mode == "video" and len(paths) != 1:
        raise ValueError("A video job must have one capture")
    if mode == "images" and not 20 <= len(paths) <= 80:
        raise ValueError("An image job must have 20–80 captures")
    if mode not in ("video", "images"):
        raise ValueError("Unsupported capture mode")
    for path in paths:
        if not isinstance(path, str) or not path.startswith(f"tour_captures/{owner_id}/{job_id}/"):
            raise ValueError("Capture path does not belong to this job")
        if not re.fullmatch(r"[0-9]{3}\.(mp4|mov|jpg|png)", path.rsplit("/", 1)[-1]):
            raise ValueError("Unsupported capture filename")
        suffix = Path(path).suffix.lower()
        if (mode == "video" and suffix not in (".mp4", ".mov")) or (mode == "images" and suffix not in (".jpg", ".png")):
            raise ValueError("Capture type does not match the job mode")

    with tempfile.TemporaryDirectory(prefix="staysure-tour-") as directory:
        workspace = Path(directory)
        captures = workspace / "captures"
        captures.mkdir()
        for path in paths:
            bucket.blob(path).download_to_filename(captures / Path(path).name)
        processed = workspace / "processed"
        output = workspace / "runs"
        data = next(captures.iterdir()) if mode == "video" else captures
        run(["ns-process-data", mode, "--data", str(data), "--output-dir", str(processed)], 3600)
        transforms = processed / "transforms.json"
        if not transforms.exists():
            raise RuntimeError("Camera alignment did not produce transforms.json. Recapture with more overlapping views.")
        frame_count = len(json.loads(transforms.read_text(encoding="utf-8")).get("frames", []))
        if frame_count < 20:
            raise RuntimeError(f"Only {frame_count} camera views aligned. Recapture with slower motion and more overlap.")
        run(["ns-train", "splatfacto", "--output-dir", str(output), "--data", str(processed)], 7200)
        configs = list(output.rglob("config.yml"))
        if not configs:
            raise RuntimeError("Nerfstudio did not produce a config.yml")
        config = max(configs, key=lambda file: file.stat().st_mtime)
        exported = workspace / "exported"
        run(["ns-export", "gaussian-splat", "--load-config", str(config), "--output-dir", str(exported)], 1800)
        scenes = list(exported.rglob("*.ply"))
        if not scenes:
            raise RuntimeError("Nerfstudio did not export a Gaussian splat")
        asset_path = f"tours/{property_id}/{job_id}/scene.ply"
        bucket.blob(asset_path).upload_from_filename(max(scenes, key=lambda file: file.stat().st_size), content_type="application/octet-stream")
        job_ref.update({"status": "review", "assetPath": asset_path})


def main() -> None:
    parser = argparse.ArgumentParser(description="Process queued StaySure 3D tour captures")
    parser.add_argument("--once", action="store_true", help="Process one polling cycle and exit")
    args = parser.parse_args()
    bucket_name = os.environ.get("FIREBASE_STORAGE_BUCKET")
    if not bucket_name:
        raise SystemExit("Set FIREBASE_STORAGE_BUCKET")
    firebase_admin.initialize_app(credentials.ApplicationDefault(), {"storageBucket": bucket_name})
    database = firestore.client()
    bucket = storage.bucket()
    while True:
        jobs = database.collection("tour_jobs").where("status", "==", "queued").limit(3).stream()
        for snapshot in jobs:
            try:
                process_job(database, bucket, snapshot.id)
            except Exception as error:
                database.collection("tour_jobs").document(snapshot.id).update({"status": "failed", "error": str(error)[:300]})
        if args.once:
            break
        time.sleep(15)


if __name__ == "__main__":
    main()
