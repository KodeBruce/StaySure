import { collection, getDocs, doc, getDoc, writeBatch } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';
import { Property } from '../types';
import { INITIAL_PROPERTIES } from '../data/mockData';

export async function getProperties(): Promise<Property[]> {
  if (!isFirebaseConfigured) {
    return INITIAL_PROPERTIES;
  }

  try {
    const colRef = collection(db, 'properties');
    const snap = await getDocs(colRef);
    if (snap.empty) {
      return INITIAL_PROPERTIES;
    }
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Property));
  } catch (err) {
    console.warn("Failed to load from Firestore, falling back to local dataset:", err);
    return INITIAL_PROPERTIES;
  }
}

export async function getPropertyById(id: string): Promise<Property | null> {
  if (!isFirebaseConfigured) {
    return INITIAL_PROPERTIES.find(p => p.id === id) || null;
  }

  try {
    const docRef = doc(db, 'properties', id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Property;
    }
    return INITIAL_PROPERTIES.find(p => p.id === id) || null;
  } catch (err) {
    console.warn("Failed to fetch property by id from Firestore:", err);
    return INITIAL_PROPERTIES.find(p => p.id === id) || null;
  }
}

/**
 * Seeds the 6-10 baseline Wits student properties into Firestore.
 */
export async function seedPropertiesToFirestore(): Promise<{ count: number; error?: string }> {
  if (!isFirebaseConfigured) {
    return { count: 0, error: "Firebase is not configured with valid API keys." };
  }

  try {
    const batch = writeBatch(db);
    for (const p of INITIAL_PROPERTIES) {
      const ref = doc(db, 'properties', p.id);
      // Preserve reviewed tour metadata when baseline listing data is refreshed.
      batch.set(ref, p, { merge: true });
    }
    await batch.commit();
    return { count: INITIAL_PROPERTIES.length };
  } catch (err: any) {
    console.error("Error seeding properties:", err);
    return { count: 0, error: err.message };
  }
}

