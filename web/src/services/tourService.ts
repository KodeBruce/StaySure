import { addDoc, collection, doc, getDoc, getDocs, query, updateDoc, where, writeBatch } from 'firebase/firestore';
import { ref, uploadBytesResumable } from 'firebase/storage';
import { db, isFirebaseConfigured, storage } from '../firebase/config';
import { TourJob } from '../types';

export async function getMyTourJobs(ownerId: string): Promise<TourJob[]> {
  if (!isFirebaseConfigured) return [];
  const snap = await getDocs(query(collection(db, 'tour_jobs'), where('ownerId', '==', ownerId)));
  return snap.docs.map(item => ({ id: item.id, ...item.data() } as TourJob))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getReviewTourJobs(): Promise<TourJob[]> {
  if (!isFirebaseConfigured) return [];
  const snap = await getDocs(query(collection(db, 'tour_jobs'), where('status', '==', 'review')));
  return snap.docs.map(item => ({ id: item.id, ...item.data() } as TourJob));
}

export async function getTourJob(jobId: string): Promise<TourJob | null> {
  if (!isFirebaseConfigured) return null;
  const snap = await getDoc(doc(db, 'tour_jobs', jobId));
  return snap.exists() ? { id: snap.id, ...snap.data() } as TourJob : null;
}

export async function publishTourJob(jobId: string): Promise<void> {
  const jobRef = doc(db, 'tour_jobs', jobId);
  const snap = await getDoc(jobRef);
  const job = snap.data() as TourJob | undefined;
  if (!job || job.status !== 'review' || !job.assetPath) throw new Error('This tour is not ready for review.');
  const batch = writeBatch(db);
  batch.update(doc(db, 'properties', job.propertyId), {
    tour: { status: 'published', capturedAt: job.captureDate, spaces: job.spaces, assetPath: job.assetPath }
  });
  batch.update(jobRef, { status: 'published' });
  await batch.commit();
}

export async function rejectTourJob(jobId: string, reason: string): Promise<void> {
  if (!reason.trim()) throw new Error('Give the provider a reason to recapture.');
  await updateDoc(doc(db, 'tour_jobs', jobId), { status: 'failed', error: reason.trim().slice(0, 300) });
}

export async function submitTourCapture(
  input: Pick<TourJob, 'propertyId' | 'ownerId' | 'mode' | 'captureDate' | 'spaces'>,
  files: File[],
  onProgress: (percent: number) => void
): Promise<string> {
  if (!isFirebaseConfigured) throw new Error('Configure Firebase before uploading a capture.');

  const jobRef = await addDoc(collection(db, 'tour_jobs'), {
    ...input,
    status: 'uploading',
    capturePaths: [],
    createdAt: new Date().toISOString()
  });
  const paths: string[] = [];
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  let completedBytes = 0;

  try {
    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      const extension = input.mode === 'video'
        ? (file.type === 'video/quicktime' ? 'mov' : 'mp4')
        : (file.type === 'image/png' ? 'png' : 'jpg');
      const path = `tour_captures/${input.ownerId}/${jobRef.id}/${String(index + 1).padStart(3, '0')}.${extension}`;
      const upload = uploadBytesResumable(ref(storage, path), file, { contentType: file.type });
      await new Promise<void>((resolve, reject) => {
        upload.on('state_changed', snapshot => {
          onProgress(Math.round(((completedBytes + snapshot.bytesTransferred) / totalBytes) * 100));
        }, reject, () => resolve());
      });
      paths.push(path);
      completedBytes += file.size;
    }
    await updateDoc(doc(db, 'tour_jobs', jobRef.id), { capturePaths: paths, status: 'queued' });
    onProgress(100);
    return jobRef.id;
  } catch (error) {
    await updateDoc(doc(db, 'tour_jobs', jobRef.id), { status: 'failed', error: 'Capture upload did not complete.' });
    throw error;
  }
}
