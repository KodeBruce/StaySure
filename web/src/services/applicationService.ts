import { collection, addDoc, getDocs, query, where, doc, updateDoc, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, isFirebaseConfigured } from '../firebase/config';
import { Application } from '../types';

export async function uploadStudentDoc(studentId: string, docType: string, file: File): Promise<string> {
  if (!isFirebaseConfigured) {
    // Return dummy object URL if in demo mode
    return URL.createObjectURL(file);
  }

  const fileExt = file.name.split('.').pop() || 'pdf';
  const storagePath = `student_documents/${studentId}/${docType}_${Date.now()}.${fileExt}`;
  const storageRef = ref(storage, storagePath);
  
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}

export async function submitApplication(
  appData: Omit<Application, 'id' | 'ref' | 'date' | 'stage'>
): Promise<Application> {
  const refCode = "SS-2026-" + Math.floor(1000 + Math.random() * 9000);
  const now = new Date().toISOString();

  const newApp: Omit<Application, 'id'> = {
    ...appData,
    ref: refCode,
    date: now,
    stage: 0
  };

  if (!isFirebaseConfigured) {
    // Local demo storage fallback
    const saved = localStorage.getItem("staysure_apps");
    const list: Application[] = saved ? JSON.parse(saved) : [];
    const created: Application = { id: "local_" + Date.now(), ...newApp };
    list.unshift(created);
    localStorage.setItem("staysure_apps", JSON.stringify(list));
    return created;
  }

  const colRef = collection(db, 'applications');
  const docRef = await addDoc(colRef, newApp);
  return { id: docRef.id, ...newApp };
}

export async function getStudentApplications(studentId: string): Promise<Application[]> {
  if (!isFirebaseConfigured) {
    const saved = localStorage.getItem("staysure_apps");
    return saved ? JSON.parse(saved) : [];
  }

  try {
    const colRef = collection(db, 'applications');
    const q = query(colRef, where('studentId', '==', studentId), orderBy('date', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Application));
  } catch (err) {
    console.warn("Failed to fetch applications from Firestore:", err);
    const saved = localStorage.getItem("staysure_apps");
    return saved ? JSON.parse(saved) : [];
  }
}

export async function updateApplicationStage(appId: string, stage: number): Promise<void> {
  if (!isFirebaseConfigured) {
    const saved = localStorage.getItem("staysure_apps");
    if (saved) {
      const list: Application[] = JSON.parse(saved);
      const target = list.find(a => a.id === appId);
      if (target) {
        target.stage = stage;
        localStorage.setItem("staysure_apps", JSON.stringify(list));
      }
    }
    return;
  }

  const docRef = doc(db, 'applications', appId);
  await updateDoc(docRef, { stage });
}

