export interface StudentReview {
  author: string;
  course?: string;
  year?: string;
  date: string;
  rating: number;
  text: string;
}

export interface PropertyReviewsData {
  rating: number;
  ratingFormatted: string; // e.g. "4,6"
  reviewsCount: number;
  distribution: { stars: number; percent: number }[];
  reviews: StudentReview[];
}

const SPECIFIC_REVIEWS: Record<string, Partial<PropertyReviewsData>> = {
  'braam-student-village': {
    rating: 4.6,
    reviewsCount: 128,
    reviews: [
      {
        author: 'Lerato M.',
        course: 'Engineering',
        year: '3rd Year',
        date: 'August 2026',
        rating: 5,
        text: 'The walk to campus is genuinely ten minutes and the study room stays open late during exams. Management responded to a broken geyser within a day.'
      },
      {
        author: 'Sipho K.',
        course: 'Commerce',
        year: '2nd Year',
        date: 'July 2026',
        rating: 4,
        text: 'Good value for what you get. The shared kitchen gets busy around 7pm and the lift is slow, but security is excellent and I always feel safe coming back late.'
      },
      {
        author: 'Nadia P.',
        course: 'Arts',
        year: 'Postgrad',
        date: 'September 2026',
        rating: 5,
        text: 'Super close to Wits East Campus. The high-speed Wi-Fi handled my exam submissions and research smoothly without lag.'
      },
      {
        author: 'Thabo N.',
        course: 'Science',
        year: '1st Year',
        date: 'June 2026',
        rating: 4,
        text: 'Security at the turnstiles is vigilant and biometric access feels really safe. Quiet hours are respected on our floor.'
      }
    ]
  },
  'the-loft-on-juta': {
    rating: 4.4,
    reviewsCount: 86,
    reviews: [
      {
        author: 'Nadia P.',
        course: 'Arts',
        year: 'Postgrad',
        date: 'September 2026',
        rating: 5,
        text: 'Having my own kitchen changed everything. It is a compact space on Juta Street but thoughtfully designed with great natural light.'
      },
      {
        author: 'Kagiso D.',
        course: 'Law',
        year: 'Final Year',
        date: 'August 2026',
        rating: 4,
        text: 'Location is vibrant with coffee shops right below. Can get a bit lively on Saturday nights, but the apartment soundproofing is decent.'
      },
      {
        author: 'Zandile B.',
        course: 'Economics',
        year: '2nd Year',
        date: 'July 2026',
        rating: 4,
        text: 'Clean corridors, responsive caretakers, and security presence from 6am to 10pm gives peace of mind.'
      }
    ]
  },
  'wits-edge-studios': {
    rating: 4.7,
    reviewsCount: 142,
    reviews: [
      {
        author: 'Anele Z.',
        course: 'Health Sciences',
        year: '4th Year',
        date: 'August 2026',
        rating: 5,
        text: 'The private studio setup is perfect for serious study blocks. Walk to campus takes barely 6 minutes door-to-door.'
      },
      {
        author: 'Tshepo M.',
        course: 'Computer Science',
        year: '3rd Year',
        date: 'July 2026',
        rating: 5,
        text: 'Fibre internet is rock solid and study pods in the basement are air-conditioned. Worth every rand for final-year crunch.'
      },
      {
        author: 'Bongani S.',
        course: 'Actuarial Science',
        year: '2nd Year',
        date: 'May 2026',
        rating: 4,
        text: 'High-standard building with friendly management. Backup power keeps Wi-Fi and lights running when load-shedding strikes.'
      }
    ]
  }
};

// Realistic student review templates for any property
const REVIEW_TEMPLATES: { author: string; course: string; year: string; rating: number; getText: (name: string, area: string) => string }[] = [
  {
    author: 'Lerato M.',
    course: 'Engineering',
    year: '3rd Year',
    rating: 5,
    getText: (name, area) => `The walk to campus from ${name} is genuinely ten minutes and the study room stays open late during exams. Management responded quickly when our geyser needed fixing.`
  },
  {
    author: 'Sipho K.',
    course: 'Commerce',
    year: '2nd Year',
    rating: 4,
    getText: (_name, area) => `Good value for what you get in ${area}. The shared kitchen gets busy around 7pm, but security is excellent and I always feel safe coming back late.`
  },
  {
    author: 'Kagiso D.',
    course: 'Computer Science',
    year: '2nd Year',
    rating: 5,
    getText: (name, _area) => `High-speed Wi-Fi is reliable for online lectures and coding labs. ${name} is well managed and the front desk staff are helpful.`
  },
  {
    author: 'Zandile B.',
    course: 'Law',
    year: 'Postgrad',
    rating: 4,
    getText: (_name, area) => `Very convenient location in ${area}. The biometric turnstiles and 24-hour guards make a huge difference to personal safety.`
  },
  {
    author: 'Thabo N.',
    course: 'Health Sciences',
    year: '3rd Year',
    rating: 5,
    getText: (name, _area) => `The quiet study atmosphere at ${name} helped immensely during test week. Rooms have plenty of desk space and wardrobe storage.`
  },
  {
    author: 'Anele Z.',
    course: 'Humanities',
    year: '1st Year',
    rating: 4,
    getText: (name, _area) => `First time staying off-campus and ${name} made the transition easy. Clean communal bathrooms and friendly student community.`
  }
];

function pseudoHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function getPropertyReviews(id: string, name = 'Student Accommodation', locality = 'Braamfontein'): PropertyReviewsData {
  const specific = SPECIFIC_REVIEWS[id];
  if (specific && specific.reviews && specific.rating && specific.reviewsCount) {
    const r = specific.rating;
    const rFormatted = r.toFixed(1).replace('.', ',');
    const dist = [
      { stars: 5, percent: 64 },
      { stars: 4, percent: 26 },
      { stars: 3, percent: 5 },
      { stars: 2, percent: 3 },
      { stars: 1, percent: 2 }
    ];
    return {
      rating: r,
      ratingFormatted: rFormatted,
      reviewsCount: specific.reviewsCount,
      distribution: dist,
      reviews: specific.reviews as StudentReview[]
    };
  }

  // Deterministic calculation based on ID
  const hash = pseudoHash(id || name);
  const ratingBase = 4.3 + ((hash % 6) * 0.1); // 4.3, 4.4, 4.5, 4.6, 4.7, 4.8
  const rating = Math.round(ratingBase * 10) / 10;
  const ratingFormatted = rating.toFixed(1).replace('.', ',');
  const reviewsCount = 68 + (hash % 85); // between 68 and 152

  const star5Pct = Math.min(80, Math.round(48 + (rating - 4.0) * 35));
  const star4Pct = Math.round((100 - star5Pct) * 0.7);
  const star3Pct = Math.round((100 - star5Pct - star4Pct) * 0.5);
  const star2Pct = Math.round((100 - star5Pct - star4Pct - star3Pct) * 0.6);
  const star1Pct = Math.max(1, 100 - star5Pct - star4Pct - star3Pct - star2Pct);

  const distribution = [
    { stars: 5, percent: star5Pct },
    { stars: 4, percent: star4Pct },
    { stars: 3, percent: star3Pct },
    { stars: 2, percent: star2Pct },
    { stars: 1, percent: star1Pct }
  ];

  // Pick 3-4 tailored reviews
  const areaName = locality.split(',')[0].trim() || 'Braamfontein';
  const startIdx = hash % REVIEW_TEMPLATES.length;
  const reviews: StudentReview[] = [];

  const months = ['August 2026', 'July 2026', 'September 2026', 'June 2026'];
  for (let i = 0; i < 4; i++) {
    const tmpl = REVIEW_TEMPLATES[(startIdx + i) % REVIEW_TEMPLATES.length];
    reviews.push({
      author: tmpl.author,
      course: tmpl.course,
      year: tmpl.year,
      date: months[i % months.length],
      rating: tmpl.rating,
      text: tmpl.getText(name, areaName)
    });
  }

  return {
    rating,
    ratingFormatted,
    reviewsCount,
    distribution,
    reviews
  };
}
