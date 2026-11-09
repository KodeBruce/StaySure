/* ==========================================================================
   StaySure — demo dataset, match scoring, filtering and formatting
   All property data, reviews, verification dates and match scores are
   fictional demo data. Replace with real, verified provider data.
   ========================================================================== */

(function () {
  "use strict";

  const FACILITIES = [
    { key: "wifi", label: "Wi-Fi", icon: "wifi" },
    { key: "security", label: "Security", icon: "shield" },
    { key: "laundry", label: "Laundry", icon: "laundry" },
    { key: "study", label: "Study area", icon: "book" },
    { key: "transport", label: "Transport", icon: "bus" },
    { key: "furnished", label: "Furnished", icon: "sofa" },
    { key: "meals", label: "Meals", icon: "utensils" }
  ];

  const TYPES = ["Residence", "Apartment", "Shared room", "Private room"];

  const AREAS = [
    "Braamfontein",
    "Parktown",
    "Milpark",
    "Auckland Park",
    "Melville",
    "Berea",
    "Rosebank",
    "Westdene"
  ];

  const BUDGET_BANDS = [
    { id: "b1", label: "Under R2,000", value: 2000, sub: "Shared rooms and budget rooms" },
    { id: "b2", label: "R2,000 – R3,000", value: 3000, sub: "Most shared and small private rooms" },
    { id: "b3", label: "R3,000 – R4,000", value: 3500, sub: "Private rooms and small apartments" },
    { id: "b4", label: "R4,000 – R5,000", value: 4500, sub: "En-suite rooms and studios" },
    { id: "b5", label: "R5,000+", value: 6000, sub: "Premium studios near campus" }
  ];

  const FUNDING = [
    { id: "nsfas", label: "NSFAS", sub: "National Student Financial Aid Scheme" },
    { id: "university", label: "University funding", sub: "Institutional bursary or residence funding" },
    { id: "self", label: "Self-funded", sub: "Family, savings or part-time work" },
    { id: "other", label: "Other", sub: "Bursary, sponsor or employer" }
  ];

  const PRIORITIES = [
    { key: "affordability", label: "Affordability" },
    { key: "safety", label: "Safety" },
    { key: "campus", label: "Close to campus" },
    { key: "transport", label: "Transport" },
    { key: "wifi", label: "Wi-Fi" },
    { key: "furnished", label: "Furnished" },
    { key: "private", label: "Private room" },
    { key: "meals", label: "Meals included" }
  ];

  const DISTANCE_OPTIONS = [
    { id: "u1", label: "Under 1 km" },
    { id: "d12", label: "1 – 2 km" },
    { id: "d25", label: "2 – 5 km" },
    { id: "d5", label: "5 km+" }
  ];

  const distract = function (km) {
    if (km <= 1) return "u1";
    if (km <= 2) return "d12";
    if (km <= 5) return "d25";
    return "d5";
  };

  const CHECK_DEFS = [
    { key: "identity", title: "Provider identity verified", note: "Company registration, owner ID and proof of address checked against official records." },
    { key: "property", title: "Property information verified", note: "Room count, rent, included costs and facilities confirmed with the provider." },
    { key: "location", title: "Location verified", note: "Physical address confirmed on site and distance to Wits measured." },
    { key: "accreditation", title: "Accreditation / funding status displayed", note: "Accreditation and funding compatibility recorded as reported, shown as indicative." },
    { key: "availability", title: "Availability recently confirmed", note: "Provider confirmed available beds within the last 30 days." },
    { key: "images", title: "Images and property information reviewed", note: "Listing photos reviewed by the StaySure team for accuracy and recency." }
  ];

  const baseChecks = function (verified, dates) {
    return CHECK_DEFS.map(function (c, i) {
      const passed = verified === "verified" ? true : verified === "pending" ? i < 4 : false;
      return {
        key: c.key,
        title: c.title,
        note: c.note,
        passed: passed,
        date: passed ? dates[i] : null
      };
    });
  };

  const PROPERTIES = [
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
      verified: "verified",
      accredited: true,
      nsfas: true,
      lastVerified: "2026-09-12",
      facilities: ["wifi", "security", "laundry", "study", "transport", "furnished"],
      about: "A purpose-built student residence two blocks from Wits' East Campus gate. Rooms are furnished with a bed, desk and wardrobe, and the building runs a 24-hour front desk with biometric access. Rent includes water, electricity up to a monthly cap and Wi-Fi.",
      security: ["24-hour security presence", "Biometric controlled access", "CCTV at entrance and lifts", "Emergency contact on site"],
      reviews: [
        { name: "Lerato M.", stars: 5, date: "August 2026", text: "The walk to campus is genuinely ten minutes and the study room stays open late during exams. Management responded to a broken geyser within a day." },
        { name: "Sipho K.", stars: 4, date: "July 2026", text: "Good value for what you get. The shared kitchen gets busy around 7pm and the lift is slow, but security is excellent and I always feel safe coming back late." }
      ],
      images: ["images/p1.jpg", "images/p8.jpg", "images/p10.jpg", "images/p9.jpg"]
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
      verified: "verified",
      accredited: true,
      nsfas: false,
      lastVerified: "2026-09-08",
      facilities: ["wifi", "security", "laundry", "study", "furnished"],
      about: "Loft-style studio apartments in a converted warehouse on Juta Street. Each unit has a kitchenette, en-suite bathroom and a sleeping mezzanine. The building is on the Rea Vaya bus route and a short walk from the Neighbourgoods Market.",
      security: ["Concierge from 06:00 to 22:00", "Access-controlled entrance", "CCTV in common areas", "After-hours emergency line"],
      reviews: [
        { name: "Nadia P.", stars: 5, date: "September 2026", text: "Having my own kitchen changed everything. It is a small space but very well designed, and the brick walls keep it cool in summer." },
        { name: "Tumelo R.", stars: 4, date: "June 2026", text: "Lovely building and great location. Noise from the street on weekends is the only downside, and parking is not included." }
      ],
      images: ["images/p10.jpg", "images/p8.jpg", "images/p9.jpg", "images/p1.jpg"]
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
      verified: "verified",
      accredited: true,
      nsfas: false,
      lastVerified: "2026-09-20",
      facilities: ["wifi", "security", "laundry", "study", "transport", "furnished", "meals"],
      about: "Premium en-suite studios a six-minute level walk from the Wits Great Hall. Rent includes a meal plan at the ground-floor dining room, weekly cleaning and all utilities. Built for students who want the shortest possible commute.",
      security: ["24-hour security and front desk", "Fingerprint access to floors", "CCTV throughout", "On-site management office"],
      reviews: [
        { name: "Kearabetswe D.", stars: 5, date: "September 2026", text: "Expensive, but I save on transport and food. I walk to my 8am lecture in six minutes and the meal plan means I never cook during test week." },
        { name: "Jason V.", stars: 4, date: "August 2026", text: "Very well maintained and quiet enough to study. The dining hall closes at 7pm, which is early if you have late labs." }
      ],
      images: ["images/p9.jpg", "images/p6.jpg", "images/p7.jpg", "images/p3.jpg"]
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
      verified: "pending",
      accredited: false,
      nsfas: true,
      lastVerified: "2026-08-26",
      facilities: ["wifi", "security", "laundry", "transport", "furnished"],
      about: "A converted Parktown house offering two-person shared rooms with a shared kitchen and lounge. Popular with first-year students on NSFAS because the rent is inclusive and the lease can be paid per semester.",
      security: ["Daytime house manager", "Locked perimeter gate", "Outdoor lighting", "Emergency contact listed"],
      reviews: [
        { name: "Bongani S.", stars: 4, date: "July 2026", text: "Cheap and close enough to walk on good days. Sharing a room takes adjusting, and the house is old, but the manager is fair and repairs get done." },
        { name: "Anele N.", stars: 4, date: "May 2026", text: "Good for a first year on a tight budget. The Wi-Fi struggles in the back rooms during peak hours." }
      ],
      images: ["images/p4.jpg", "images/p5.jpg", "images/p2.jpg", "images/p8.jpg"]
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
      verified: "verified",
      accredited: true,
      nsfas: true,
      lastVerified: "2026-09-15",
      facilities: ["wifi", "security", "laundry", "study", "transport", "furnished"],
      about: "Two-bedroom apartments in Milpark let per bed, with a shared kitchen and lounge. Located next to the Milpark taxi rank with a direct route to Wits. Water and Wi-Fi included, electricity metered per unit.",
      security: ["24-hour guarding", "Electric fence and gate", "CCTV at parking and entrance", "Security patrol route"],
      reviews: [
        { name: "Refilwe T.", stars: 5, date: "August 2026", text: "The apartment setup is great, you get a proper kitchen. The taxi into campus costs about R14 each way and takes under ten minutes." },
        { name: "Kyle B.", stars: 4, date: "June 2026", text: "Clean and secure. Electricity is metered so you have to budget a bit extra in winter for heating." }
      ],
      images: ["images/p5.jpg", "images/p2.jpg", "images/p6.jpg", "images/p10.jpg"]
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
      verified: "verified",
      accredited: true,
      nsfas: true,
      lastVerified: "2026-09-02",
      facilities: ["wifi", "security", "laundry", "study", "transport", "furnished"],
      about: "A large residence on the Rea Vaya corridor with single furnished rooms and shared bathrooms per floor. Rent is below R2,500 and includes utilities, which makes it one of the most affordable verified options near Wits.",
      security: ["24-hour security at gate", "Tag access to floors", "CCTV at entrance", "Residence committee on site"],
      reviews: [
        { name: "Thandiwe M.", stars: 4, date: "July 2026", text: "Unbeatable price for a verified place. The communal bathrooms are kept clean, though you learn to shower before 7am." },
        { name: "Musa L.", stars: 4, date: "April 2026", text: "The bus is right outside and runs often. It is far to walk but I have never had a problem with transport." }
      ],
      images: ["images/p3.jpg", "images/p4.jpg", "images/p7.jpg", "images/p1.jpg"]
    },
    {
      id: "rosebank-student-suites",
      name: "Rosebank Student Suites",
      area: "Rosebank",
      distanceKm: 4.6,
      walkMin: 55,
      taxiMin: 14,
      price: 4900,
      type: "Apartment",
      beds: 40,
      available: 7,
      rating: 4.8,
      reviewsCount: 51,
      verified: "verified",
      accredited: true,
      nsfas: false,
      lastVerified: "2026-09-18",
      facilities: ["wifi", "security", "laundry", "study", "transport", "furnished"],
      about: "Modern studio suites next to the Rosebank Gautrain station, with a gym, communal study floor and 24-hour concierge. The Gautrain and Metrobus make the campus commute quick, but the rent excludes parking.",
      security: ["24-hour concierge", "Card access to lifts and floors", "CCTV in all common areas", "Secure basement access"],
      reviews: [
        { name: "Fatima H.", stars: 5, date: "September 2026", text: "The building feels like a hotel and the study floor is silent. I take the bus and it is about 25 minutes door to door." },
        { name: "Daniel O.", stars: 5, date: "August 2026", text: "Best maintained place I viewed. Expensive and far from campus, but the trade-off worked for me." }
      ],
      images: ["images/p7.jpg", "images/p6.jpg", "images/p9.jpg", "images/p3.jpg"]
    },
    {
      id: "westdene-rooms",
      name: "Westdene Rooms",
      area: "Westdene",
      distanceKm: 5.2,
      walkMin: 62,
      taxiMin: 16,
      price: 1950,
      type: "Shared room",
      beds: 18,
      available: 3,
      rating: 3.8,
      reviewsCount: 44,
      verified: "none",
      accredited: false,
      nsfas: true,
      lastVerified: null,
      facilities: ["wifi", "laundry", "furnished"],
      about: "Budget shared rooms in a family home in Westdene, with a shared kitchen and bathroom. The listing has not completed StaySure verification, so details have not been independently checked yet.",
      security: ["Locked gate", "Owner lives on the property"],
      reviews: [
        { name: "Lucky M.", stars: 4, date: "March 2026", text: "Very cheap and the owner is friendly. You must take a taxi to campus, and the room is small for two people." }
      ],
      images: ["images/p2.jpg", "images/p4.jpg", "images/p8.jpg", "images/p5.jpg"]
    },
    {
      id: "melville-manor",
      name: "Melville Manor",
      area: "Melville",
      distanceKm: 3.8,
      walkMin: 44,
      taxiMin: 12,
      price: 3400,
      type: "Apartment",
      beds: 22,
      available: 5,
      rating: 4.5,
      reviewsCount: 67,
      verified: "verified",
      accredited: false,
      nsfas: false,
      lastVerified: "2026-09-05",
      facilities: ["wifi", "security", "laundry", "study", "furnished"],
      about: "A quiet house conversion on a tree-lined Melville street with six studio units, a shared braai area and a small study room. Popular with postgraduate students who want a calmer street than Braamfontein.",
      security: ["Electric fence", "Remote gate access", "Outdoor CCTV", "Landlord on call"],
      reviews: [
        { name: "Naledi K.", stars: 5, date: "August 2026", text: "Peaceful and safe, with good coffee shops down the road. The walls are thin but my neighbours are also postgrads." },
        { name: "Peter A.", stars: 4, date: "July 2026", text: "Good value for a studio. Not accredited for NSFAS, which is why I had to fund it myself." }
      ],
      images: ["images/p6.jpg", "images/p1.jpg", "images/p9.jpg", "images/p4.jpg"]
    },
    {
      id: "berea-budget-lodge",
      name: "Berea Budget Lodge",
      area: "Berea",
      distanceKm: 2.1,
      walkMin: 26,
      taxiMin: 8,
      price: 1650,
      type: "Shared room",
      beds: 45,
      available: 15,
      rating: 3.6,
      reviewsCount: 39,
      verified: "pending",
      accredited: false,
      nsfas: true,
      lastVerified: "2026-08-19",
      facilities: ["wifi", "security", "laundry", "transport", "meals"],
      about: "The lowest-priced listing near Wits: four-person rooms with two meals a day and a shared dining room. Verification is in progress, which means some details are still being confirmed with the provider.",
      security: ["Gate security at night", "Locked room doors"],
      reviews: [
        { name: "Sanele Z.", stars: 4, date: "June 2026", text: "You get what you pay for and the meals help a lot. Four people in a room is tight if you need quiet to study." },
        { name: "Grace M.", stars: 3, date: "May 2026", text: "Cheap and central, but maintenance takes a while and the showers are shared by many people." }
      ],
      images: ["images/p4.jpg", "images/p3.jpg", "images/p2.jpg", "images/p8.jpg"]
    }
  ];

  /* Verification check dates keyed per property ------------------------- */
  const VERIFY_DATES = {
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

  PROPERTIES.forEach(function (p) {
    p.checks = baseChecks(p.verified, VERIFY_DATES[p.id] || []);
    p.passedChecks = p.checks.filter(function (c) { return c.passed; }).length;
    p.distanceBand = distract(p.distanceKm);
  });

  /* ======================================================================
     Formatting
     ====================================================================== */

  function rand(n) {
    const v = Math.round(Number(n) || 0);
    return "R" + v.toLocaleString("en-ZA").replace(/\u00a0/g, ",").replace(/\s/g, ",");
  }

  function num(n) {
    return (Number(n) || 0).toLocaleString("en-ZA").replace(/\u00a0/g, ",").replace(/\s/g, ",");
  }

  function km(v) {
    return String(v).replace(".", ",") + " km";
  }

  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  function longDate(iso) {
    if (!iso) return "Not yet verified";
    const parts = iso.split("-");
    if (parts.length !== 3) return iso;
    return Number(parts[2]) + " " + MONTHS[Number(parts[1]) - 1] + " " + parts[0];
  }

  function getProperty(id) {
    return PROPERTIES.filter(function (p) { return p.id === id; })[0] || null;
  }

  function facilityLabels(p, limit) {
    const list = FACILITIES.filter(function (f) { return p.facilities.indexOf(f.key) > -1; });
    return limit ? list.slice(0, limit) : list;
  }

  /* ======================================================================
     Match score — placeholder decision-support algorithm.
     Always presented as a "StaySure match score", never official.
     ====================================================================== */

  function matchScore(p, profile) {
    const pr = profile || {};
    const pri = pr.priorities || [];
    const budget = Number(pr.budget) || 3500;
    const has = function (k) { return pri.indexOf(k) > -1; };

    let score = 0;
    const reasons = [];

    /* Budget fit — 22 points, 30 if Affordability is a priority */
    const budgetWeight = has("affordability") ? 30 : 22;
    if (p.price <= budget) {
      score += budgetWeight;
      reasons.push({ ok: true, text: "Within your budget" });
    } else if (p.price <= budget * 1.1) {
      score += Math.round(budgetWeight * 0.55);
      reasons.push({ ok: false, text: rand(p.price - budget) + " over your budget" });
    } else {
      reasons.push({ ok: false, text: rand(p.price - budget) + " over your budget" });
    }

    /* Distance — 15 points, 22 if Close to campus is a priority */
    const distWeight = has("campus") ? 22 : 15;
    const distFactor = p.distanceKm <= 1 ? 1 : p.distanceKm <= 2 ? 0.8 : p.distanceKm <= 5 ? 0.5 : 0.2;
    score += distWeight * distFactor;
    if (p.distanceKm <= 2) reasons.push({ ok: true, text: "Close to Wits (" + km(p.distanceKm) + ")" });
    else reasons.push({ ok: false, text: km(p.distanceKm) + " from Wits" });

    /* Funding compatibility — 16 points, always indicative */
    const funded = pr.funding === "nsfas" || pr.funding === "university";
    const fundOk = funded ? p.nsfas : true;
    score += fundOk ? 16 : 0;
    reasons.push({
      ok: fundOk,
      text: funded
        ? fundOk ? "Compatible with " + (pr.funding === "nsfas" ? "NSFAS" : "university") + " funding" : "Not listed as funding compatible"
        : "No funding restriction"
    });

    /* Verification — 14 points, 18 if Safety is a priority; pending earns 35% */
    const verWeight = has("safety") ? 18 : 14;
    const verFactor = p.verified === "verified" ? 1 : p.verified === "pending" ? 0.35 : 0;
    score += verWeight * verFactor;
    if (p.verified === "verified") reasons.push({ ok: true, text: "StaySure verified listing" });

    /* Preferred-facility coverage — 18 points */
    const wantedFacilities = pri.filter(function (k) {
      return ["wifi", "furnished", "meals", "transport"].indexOf(k) > -1;
    });
    let wantedType = has("private") ? "Private room" : null;
    const facTotal = wantedFacilities.length + (wantedType ? 1 : 0);
    let facHit = 0;
    wantedFacilities.forEach(function (f) {
      if (p.facilities.indexOf(f) > -1) facHit++;
    });
    if (wantedType && p.type === wantedType) facHit++;
    if (facTotal > 0) {
      score += 18 * (facHit / facTotal);
      if (facHit === facTotal) reasons.push({ ok: true, text: "Matches your preferred facilities" });
      else if (facHit > 0) reasons.push({ ok: false, text: "Covers some of your preferences" });
    } else {
      score += 12;
    }

    /* Rating adjustment — up to ±4 */
    score += (p.rating - 4) * 4;

    const final = Math.max(28, Math.min(96, Math.round(score * 0.88)));
    const okCount = reasons.filter(function (r) { return r.ok; }).length;
    return {
      score: final,
      reasons: reasons.slice(0, 4),
      okCount: okCount
    };
  }

  /* ======================================================================
     Filtering
     ====================================================================== */

  function defaultFilters(profile) {
    const pr = profile || {};
    return {
      min: 1500,
      max: 6000,
      dist: [],
      verified: false,
      accredited: false,
      nsfas: false,
      self: false,
      facilities: [],
      types: [],
      location: "",
      sort: "match"
    };
  }

  function countActiveFilters(f) {
    let n = 0;
    if (f.min > 1500 || f.max < 6000) n++;
    if (f.dist.length) n++;
    if (f.verified) n++;
    if (f.accredited) n++;
    if (f.nsfas || f.self) n++;
    if (f.facilities.length) n++;
    if (f.types.length) n++;
    return n;
  }

  function applyFilters(f, profile) {
    const list = PROPERTIES.filter(function (p) {
      if (p.price < f.min || p.price > f.max) return false;
      if (f.dist.length && f.dist.indexOf(p.distanceBand) === -1) return false;
      if (f.verified && p.verified !== "verified") return false;
      if (f.accredited && !p.accredited) return false;
      if (f.nsfas && f.self) { /* either */ }
      else if (f.nsfas && !p.nsfas) return false;
      else if (f.self && p.nsfas) return false;
      if (f.facilities.length) {
        const hasAll = f.facilities.every(function (k) { return p.facilities.indexOf(k) > -1; });
        if (!hasAll) return false;
      }
      if (f.types.length && f.types.indexOf(p.type) === -1) return false;
      if (f.location && p.area !== f.location) return false;
      return true;
    });

    const scored = list.map(function (p) {
      const m = matchScore(p, profile);
      return { p: p, score: m.score, reasons: m.reasons };
    });

    scored.sort(function (a, b) {
      switch (f.sort) {
        case "price": return a.p.price - b.p.price;
        case "distance": return a.p.distanceKm - b.p.distanceKm;
        case "rating": return b.p.rating - a.p.rating;
        default: return b.score - a.score;
      }
    });
    return scored;
  }

  function recommended(profile, limit) {
    return applyFilters(defaultFilters(profile), profile).slice(0, limit || 3);
  }

  /* Cheapest / closest / best — decision support tiles for Compare */
  function decisionTiles(props, profile) {
    if (!props.length) return [];
    const scored = props.map(function (p) {
      return { p: p, m: matchScore(p, profile) };
    });
    const best = scored.slice().sort(function (a, b) { return b.m.score - a.m.score; })[0];
    const cheap = scored.slice().sort(function (a, b) { return a.p.price - b.p.price; })[0];
    const close = scored.slice().sort(function (a, b) { return a.p.distanceKm - b.p.distanceKm; })[0];
    return [
      { label: "Best overall match", p: best.p, detail: best.m.score + "% StaySure match score", tone: "green" },
      { label: "Best match for your budget", p: cheap.p, detail: rand(cheap.p.price) + "/month", tone: "navy" },
      { label: "Closest to campus", p: close.p, detail: km(close.p.distanceKm) + " from Wits", tone: "navy" }
    ];
  }

  /* Demo application reference */
  function makeRef() {
    const n = String(Math.floor(Math.random() * 899) + 100);
    return "STY-2026-00" + n;
  }

  window.SSData = {
    FACILITIES: FACILITIES,
    TYPES: TYPES,
    AREAS: AREAS,
    BUDGET_BANDS: BUDGET_BANDS,
    FUNDING: FUNDING,
    PRIORITIES: PRIORITIES,
    DISTANCE_OPTIONS: DISTANCE_OPTIONS,
    CHECK_DEFS: CHECK_DEFS,
    PROPERTIES: PROPERTIES,
    rand: rand,
    num: num,
    km: km,
    longDate: longDate,
    getProperty: getProperty,
    facilityLabels: facilityLabels,
    matchScore: matchScore,
    defaultFilters: defaultFilters,
    countActiveFilters: countActiveFilters,
    applyFilters: applyFilters,
    recommended: recommended,
    decisionTiles: decisionTiles,
    makeRef: makeRef
  };
})();
