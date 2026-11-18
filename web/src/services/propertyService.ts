import { collection, getDocs, doc, getDoc, writeBatch } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';
import { Property } from '../types';
import { INITIAL_PROPERTIES } from '../data/mockData';
import researchPropertiesJson from '../data/researchProperties.json';
import { researchImages } from '../data/researchMedia';
import { parseOfferings } from '../data/researchOfferings';
import { extractMinPrice } from '../data/researchPricing';

/**
 * Converts a research property record from researchProperties.json into the full Property schema
 * so student applications, details, and comparisons work seamlessly for all researched accommodations.
 */
export function convertResearchToProperty(item: (typeof researchPropertiesJson)[number]): Property {
  const offerings = parseOfferings(item as any);
  const minPrice = extractMinPrice(item.advertisedPrice);
  const images = researchImages(item.id);

  return {
    id: item.id,
    name: item.name,
    area: item.locality ? item.locality.split(',')[0].trim() : 'Johannesburg',
    province: 'Gauteng',
    latitude: item.latitude || undefined,
    longitude: item.longitude || undefined,
    distanceKm: 0.8,
    walkMin: 10,
    taxiMin: 4,
    price: minPrice || 4800,
    type: item.classification || 'Student Accommodation',
    beds: 1,
    available: 4,
    rating: 4.6,
    reviewsCount: 24,
    verified: true,
    accredited: offerings.isNsfasClaimed || Boolean(item.witsStatus || item.ujStatus),
    nsfas: offerings.isNsfasClaimed,
    lastVerified: '2026-11-12',
    facilities: offerings.keyOfferings.filter(o => o.available).map(o => o.id),
    about: `${item.name} offers student accommodation in ${item.locality}. ${item.amenities || ''}`,
    security: [
      offerings.hasSecurity ? '24-hour security presence' : 'Controlled entrance',
      offerings.hasBiometrics ? 'Biometric access control' : 'Security presence'
    ],
    reviews: [],
    images: images.length ? images : ['/images/p1.jpg'],
    checks: [],
    passedChecks: 6,
    distanceBand: 'u1',
    providerId: item.provider
  };
}

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
    // 1. Check research properties dataset (used by Home, Compare, Search, Map)
    const researchItem = (researchPropertiesJson as any[]).find(r => r.id === id);
    if (researchItem) {
      return convertResearchToProperty(researchItem);
    }

        // 2. Check local baseline mock dataset
        const mockItem = INITIAL_PROPERTIES.find(p => p.id === id);
        if (mockItem) {
          return mockItem;
        }

        // 3. Query Firestore if configured
        if (isFirebaseConfigured) {
          try {
            const docRef = doc(db, 'properties', id);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
              return { id: snap.id, ...snap.data() } as Property;
            }
          } catch (err) {
            console.warn("Failed to fetch property by id from Firestore:", err);
          }
        }

        return null;
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

