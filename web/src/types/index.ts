export type UserRole = 'student' | 'provider' | 'admin';

export interface CheckItem {
  id: string;
  name: string;
  desc: string;
  date: string;
  ok: boolean;
}

export interface ReviewItem {
  author: string;
  course: string;
  year: string;
  rating: number;
  text: string;
  date: string;
}

export interface PropertyTour {
  // Tours become visible to students only after a StaySure review.
  status: 'processing' | 'review' | 'published';
  capturedAt: string; // ISO date of the real property capture
  spaces: string[]; // Areas actually shown in the capture
  assetPath?: string; // Firebase Storage path of the processed Gaussian splat
}

export interface TourJob {
  id: string;
  propertyId: string;
  ownerId: string;
  mode: 'video' | 'images';
  status: 'uploading' | 'queued' | 'processing' | 'review' | 'failed' | 'published';
  capturePaths: string[];
  captureDate: string;
  spaces: string[];
  createdAt: string;
  error?: string;
  assetPath?: string;
}

export interface Property {
  id: string;
  name: string;
  area: string;
  distanceKm: number;
  walkMin: number;
  taxiMin: number;
  price: number;
  type: string;
  beds: number;
  available: number;
  rating: number;
  reviewsCount: number;
  verified: boolean;
  accredited: boolean;
  nsfas: boolean;
  lastVerified: string;
  facilities: string[];
  about: string;
  security: string[];
  reviews: ReviewItem[];
  images: string[];
  tour?: PropertyTour;
  checks: CheckItem[];
  passedChecks: number;
  distanceBand: string;
  providerId?: string;
}

export interface UserProfile {
  name: string;
  university: string;
  band: string;
  budget: number;
  funding: 'nsfas' | 'university' | 'self' | 'other' | '';
  priorities: string[];
  income?: number;
}

export interface Application {
  id: string;
  propertyId: string;
  propertyName?: string;
  studentId: string;
  studentName?: string;
  ref: string;
  date: string;
  stage: number; // 0: Submitted, 1: Under Review, 2: Document Verification, 3: Approved, 4: Confirmed
  documents?: {
    idCopy?: string;
    proofOfReg?: string;
    fundingLetter?: string;
  };
  notes?: string;
}

export interface FilterState {
  min: number;
  max: number;
  dist: string[];
  verified: boolean;
  accredited: boolean;
  nsfas: boolean;
  self: boolean;
  facilities: string[];
  types: string[];
  location: string;
  sort: 'best' | 'price-asc' | 'price-desc' | 'dist' | 'rating';
}

