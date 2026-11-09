import { Property, CheckItem } from '../types';

export const CHECK_DEFS = [
  { key: "identity", title: "Provider identity verified", note: "Company registration, owner ID and proof of address checked against official records." },
  { key: "property", title: "Property information verified", note: "Room count, rent, included costs and facilities confirmed with the provider." },
  { key: "location", title: "Location verified", note: "Physical address confirmed on site and distance to Wits measured." },
  { key: "accreditation", title: "Accreditation / funding status displayed", note: "Accreditation and funding compatibility recorded as reported, shown as indicative." },
  { key: "availability", title: "Availability recently confirmed", note: "Provider confirmed available beds within the last 30 days." },
  { key: "images", title: "Images and property information reviewed", note: "Listing photos reviewed by the StaySure team for accuracy and recency." }
];

export const FACILITIES = [
  { key: "wifi", label: "Wi-Fi", icon: "wifi" },
  { key: "security", label: "Security", icon: "shield" },
  { key: "laundry", label: "Laundry", icon: "laundry" },
  { key: "study", label: "Study area", icon: "book" },
  { key: "transport", label: "Transport", icon: "bus" },
  { key: "furnished", label: "Furnished", icon: "sofa" },
  { key: "meals", label: "Meals", icon: "utensils" }
];

export const TYPES = ["Residence", "Apartment", "Shared room", "Private room"];

export const AREAS = [
  "Braamfontein",
  "Parktown",
  "Milpark",
  "Auckland Park",
  "Melville",
  "Berea",
  "Rosebank",
  "Westdene"
];

export const BUDGET_BANDS = [
  { id: "b1", label: "Under R2,000", value: 2000, sub: "Shared rooms and budget rooms" },
  { id: "b2", label: "R2,000 – R3,000", value: 3000, sub: "Most shared and small private rooms" },
  { id: "b3", label: "R3,000 – R4,000", value: 3500, sub: "Private rooms and small apartments" },
  { id: "b4", label: "R4,000 – R5,000", value: 4500, sub: "En-suite rooms and studios" },
  { id: "b5", label: "R5,000+", value: 6000, sub: "Premium studios near campus" }
];

export const FUNDING = [
  { id: "nsfas", label: "NSFAS", sub: "National Student Financial Aid Scheme" },
  { id: "university", label: "University funding", sub: "Institutional bursary or residence funding" },
  { id: "self", label: "Self-funded", sub: "Family, savings or part-time work" },
  { id: "other", label: "Other", sub: "Bursary, sponsor or employer" }
];

export const PRIORITIES = [
  { key: "affordability", label: "Affordability" },
  { key: "safety", label: "Safety" },
  { key: "campus", label: "Close to campus" },
  { key: "transport", label: "Transport" },
  { key: "wifi", label: "Wi-Fi" },
  { key: "furnished", label: "Furnished" },
  { key: "private", label: "Private room" },
  { key: "meals", label: "Meals included" }
];

const VERIFY_DATES: Record<string, (string | null)[]> = {
  "braam-student-village": ["2026-09-12", "2026-09-12", "2026-09-12", "2026-09-12", "2026-09-12", "2026-09-12"],
  "the-loft-on-juta": ["2026-09-08", "2026-09-08", "2026-09-08", "2026-09-08", "2026-09-08", "2026-09-08"],
  "wits-edge-studios": ["2026-09-20", "2026-09-20", "2026-09-20", "2026-09-20", "2026-09-20", "2026-09-20"],
  "parkview-house": ["2026-08-26", "2026-08-26", "2026-08-26", "2026-08-26", null, null],
  "milpark-gardens": ["2026-09-15", "2026-09-15", "2026-09-15", "2026-09-15", "2026-09-15", "2026-09-15"],
  "auckland-park-res": ["2026-09-02", "2026-09-02", "2026-09-02", "2026-09-02", "2026-09-02", "2026-09-02"],
  "rosebank-student-suites": ["2026-09-18", "2026-09-18", "2026-09-18", "2026-09-18", "2026-09-18", "2026-09-18"],
  "westdene-rooms": [null, null, null, null, null, null],
  "melville-manor": ["2026-09-05", "2026-09-05", "2026-09-05", "2026-09-05", "2026-09-05", "2026-09-05"],
  "berea-budget-lodge": ["2026-08-19", "2026-08-19", "2026-08-19", "2026-08-19", null, null]
};

function distract(km: number): string {
  if (km <= 1) return "u1";
  if (km <= 2) return "d12";
  if (km <= 5) return "d25";
  return "d5";
}

function baseChecks(verified: string, dates: (string | null)[]): CheckItem[] {
  return CHECK_DEFS.map((c, i) => {
    const passed = verified === "verified" ? true : verified === "pending" ? i < 4 : false;
    return {
      id: c.key,
      name: c.title,
      desc: c.note,
      date: passed && dates[i] ? dates[i]! : "Pending",
      ok: passed
    };
  });
}

export const INITIAL_PROPERTIES: Property[] = [
  {
    id: "braam-student-village",
    name: "Braam Student Village",
    area: "Braamfontein",
    distanceKm: 0.8,
    walkMin: 10,
    taxiMin: 4,
    price: 3200,
    type: "Residence",
    beds: 120,
    available: 12,
    rating: 4.6,
    reviewsCount: 128,
    verified: true,
    accredited: true,
    nsfas: true,
    lastVerified: "2026-09-12",
    facilities: ["wifi", "security", "laundry", "study", "transport", "furnished"],
    about: "A purpose-built student residence two blocks from Wits' East Campus gate. Rooms are furnished with a bed, desk and wardrobe, and the building runs a 24-hour front desk with biometric access.",
    security: ["24-hour security presence", "Biometric controlled access", "CCTV at entrance and lifts", "Emergency contact on site"],
    reviews: [
      { author: "Lerato M.", course: "Engineering", year: "3rd Year", rating: 5, date: "August 2026", text: "The walk to campus is genuinely ten minutes and the study room stays open late during exams." },
      { author: "Sipho K.", course: "Commerce", year: "2nd Year", rating: 4, date: "July 2026", text: "Good value for what you get. Security is excellent and I always feel safe coming back late." }
    ],
    images: ["/images/p1.jpg", "/images/p8.jpg", "/images/p10.jpg", "/images/p9.jpg"],
    checks: [],
    passedChecks: 6,
    distanceBand: "u1"
  },
  {
    id: "the-loft-on-juta",
    name: "The Loft on Juta",
    area: "Braamfontein",
    distanceKm: 1.2,
    walkMin: 15,
    taxiMin: 5,
    price: 3950,
    type: "Apartment",
    beds: 24,
    available: 6,
    rating: 4.4,
    reviewsCount: 86,
    verified: true,
    accredited: true,
    nsfas: false,
    lastVerified: "2026-09-08",
    facilities: ["wifi", "security", "laundry", "study", "furnished"],
    about: "Loft-style studio apartments in a converted warehouse on Juta Street. Each unit has a kitchenette, en-suite bathroom and a sleeping mezzanine.",
    security: ["Concierge from 06:00 to 22:00", "Access-controlled entrance", "CCTV in common areas", "After-hours emergency line"],
    reviews: [
      { author: "Nadia P.", course: "Arts", year: "Postgrad", rating: 5, date: "September 2026", text: "Having my own kitchen changed everything. It is a small space but very well designed." }
    ],
    images: ["/images/p10.jpg", "/images/p8.jpg", "/images/p9.jpg", "/images/p1.jpg"],
    checks: [],
    passedChecks: 6,
    distanceBand: "d12"
  },
  {
    id: "wits-edge-studios",
    name: "Wits Edge Studios",
    area: "Braamfontein",
    distanceKm: 0.5,
    walkMin: 6,
    taxiMin: 3,
    price: 5400,
    type: "Private room",
    beds: 60,
    available: 9,
    rating: 4.7,
    reviewsCount: 142,
    verified: true,
    accredited: true,
    nsfas: false,
    lastVerified: "2026-09-20",
    facilities: ["wifi", "security", "laundry", "study", "transport", "furnished", "meals"],
    about: "Premium en-suite studios a six-minute level walk from the Wits Great Hall. Rent includes a meal plan at the ground-floor dining room.",
    security: ["24-hour security and front desk", "Fingerprint access to floors", "CCTV throughout", "On-site management office"],
    reviews: [
      { author: "Kearabetswe D.", course: "Health Sciences", year: "4th Year", rating: 5, date: "September 2026", text: "Expensive, but I save on transport and food. I walk to my 8am lecture in six minutes." }
    ],
    images: ["/images/p9.jpg", "/images/p6.jpg", "/images/p7.jpg", "/images/p3.jpg"],
    checks: [],
    passedChecks: 6,
    distanceBand: "u1"
  },
  {
    id: "parkview-house",
    name: "Parkview House",
    area: "Parktown",
    distanceKm: 1.8,
    walkMin: 22,
    taxiMin: 7,
    price: 2850,
    type: "Shared room",
    beds: 32,
    available: 4,
    rating: 4.1,
    reviewsCount: 63,
    verified: false,
    accredited: false,
    nsfas: true,
    lastVerified: "2026-08-26",
    facilities: ["wifi", "security", "laundry", "transport", "furnished"],
    about: "A converted Parktown house offering two-person shared rooms with a shared kitchen and lounge.",
    security: ["Daytime house manager", "Locked perimeter gate", "Outdoor lighting", "Emergency contact listed"],
    reviews: [
      { author: "Bongani S.", course: "Science", year: "1st Year", rating: 4, date: "July 2026", text: "Cheap and close enough to walk on good days." }
    ],
    images: ["/images/p4.jpg", "/images/p5.jpg", "/images/p2.jpg", "/images/p8.jpg"],
    checks: [],
    passedChecks: 4,
    distanceBand: "d12"
  },
  {
    id: "milpark-gardens",
    name: "Milpark Gardens",
    area: "Milpark",
    distanceKm: 2.4,
    walkMin: 28,
    taxiMin: 9,
    price: 3650,
    type: "Apartment",
    beds: 48,
    available: 11,
    rating: 4.3,
    reviewsCount: 74,
    verified: true,
    accredited: true,
    nsfas: true,
    lastVerified: "2026-09-15",
    facilities: ["wifi", "security", "laundry", "study", "transport", "furnished"],
    about: "Two-bedroom apartments in Milpark let per bed, with a shared kitchen and lounge. Direct route to Wits.",
    security: ["24-hour guarding", "Electric fence and gate", "CCTV at parking and entrance", "Security patrol route"],
    reviews: [],
    images: ["/images/p5.jpg", "/images/p2.jpg", "/images/p6.jpg", "/images/p10.jpg"],
    checks: [],
    passedChecks: 6,
    distanceBand: "d25"
  },
  {
    id: "auckland-park-res",
    name: "Auckland Park Residence",
    area: "Auckland Park",
    distanceKm: 3.1,
    walkMin: 36,
    taxiMin: 11,
    price: 2450,
    type: "Residence",
    beds: 90,
    available: 20,
    rating: 4.0,
    reviewsCount: 95,
    verified: true,
    accredited: true,
    nsfas: true,
    lastVerified: "2026-09-02",
    facilities: ["wifi", "security", "laundry", "study", "transport", "furnished"],
    about: "A large residence on the Rea Vaya corridor with single furnished rooms and shared bathrooms per floor.",
    security: ["24-hour security at gate", "Tag access to floors", "CCTV at entrance"],
    reviews: [],
    images: ["/images/p3.jpg", "/images/p4.jpg", "/images/p7.jpg", "/images/p1.jpg"],
    checks: [],
    passedChecks: 6,
    distanceBand: "d25"
  }
];

// Populate checks and passed checks
INITIAL_PROPERTIES.forEach(p => {
  const verStatus = p.verified ? "verified" : (p.passedChecks > 0 ? "pending" : "none");
  p.checks = baseChecks(verStatus, VERIFY_DATES[p.id] || []);
  p.passedChecks = p.checks.filter(c => c.ok).length;
  p.distanceBand = distract(p.distanceKm);
});

