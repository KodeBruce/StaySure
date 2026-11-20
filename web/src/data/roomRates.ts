import workbookRates from './johannesburgWorkbookRates.json';

export type RoomCategory = 'sharing' | 'single' | 'studio' | 'apartment';

export interface RoomRate {
  category: RoomCategory;
  name: string;
  monthly: string;
  basis: 'per person' | 'per bed' | 'basis unconfirmed';
  period?: 'period unconfirmed';
  note?: string;
}

// Transcribed from researchProperties.json. Keep the room name and billing caveat
// attached to each amount; an overall rent range cannot establish either one.
const rates: Record<string, RoomRate[]> = {
  'GSA-P0001': [
    { category: 'single', name: 'Single room in shared apartment', monthly: 'R6,100', basis: 'basis unconfirmed', note: 'From' },
    { category: 'sharing', name: 'Two-sharing apartment', monthly: 'R5,600', basis: 'per person' }
  ],
  'GSA-P0002': [
    { category: 'sharing', name: 'Two-sharing room', monthly: 'R5,600', basis: 'per person', note: 'From' },
    { category: 'single', name: 'Single room', monthly: 'R6,300–R6,900', basis: 'basis unconfirmed', note: 'Varies by room size' }
  ],
  'GSA-P0003': [
    { category: 'sharing', name: 'Two-sharing apartment', monthly: 'R5,600', basis: 'per person' },
    { category: 'single', name: 'Single room', monthly: 'R6,100–R8,000', basis: 'basis unconfirmed', note: 'Varies by configuration' }
  ],
  'GSA-P0004': [
    { category: 'sharing', name: 'Sharing room', monthly: 'R5,600–R6,300', basis: 'per person' },
    { category: 'single', name: 'Single room', monthly: 'R5,950–R6,500', basis: 'basis unconfirmed' }
  ],
  'GSA-P0005': [
    { category: 'sharing', name: 'Cluster two-sharing', monthly: 'R5,650', basis: 'basis unconfirmed' },
    { category: 'single', name: 'Cluster single', monthly: 'R6,280', basis: 'basis unconfirmed' },
    { category: 'sharing', name: 'Studio two-sharing', monthly: 'R8,090', basis: 'basis unconfirmed' },
    { category: 'studio', name: 'Studio single', monthly: 'R8,300', basis: 'basis unconfirmed' }
  ],
  'GSA-P0006': [
    { category: 'single', name: 'Single room', monthly: 'R6,105', basis: 'basis unconfirmed' },
    { category: 'sharing', name: 'Double room', monthly: 'R5,650', basis: 'basis unconfirmed' }
  ],
  'GSA-P0007': [
    { category: 'single', name: 'Single room', monthly: 'R5,760', basis: 'basis unconfirmed' },
    { category: 'sharing', name: 'Double room', monthly: 'R5,470', basis: 'basis unconfirmed' }
  ],
  'GSA-P0008': [
    { category: 'sharing', name: 'Sharing bedroom', monthly: 'R5,800', basis: 'basis unconfirmed', note: 'From · 2027 annual stay' },
    { category: 'single', name: 'Single bedroom', monthly: 'R7,350', basis: 'basis unconfirmed', note: 'From · 2027 annual stay' }
  ],
  'GSA-P0010': [
    { category: 'sharing', name: 'Shared cluster room', monthly: 'R4,860', basis: 'basis unconfirmed', note: 'From · 12-month agreement' },
    { category: 'single', name: 'Private single room', monthly: 'R6,820', basis: 'basis unconfirmed', note: 'From · 12-month agreement' },
    { category: 'studio', name: 'Studio', monthly: 'R8,130', basis: 'basis unconfirmed', note: 'From · 12-month agreement' }
  ],
  'GSA-P0011': [
    { category: 'sharing', name: 'Shared room in 3-bedroom apartment', monthly: 'R4,860', basis: 'basis unconfirmed', note: '12-month agreement' },
    { category: 'single', name: 'Private single in 3-bedroom apartment', monthly: 'R6,140', basis: 'basis unconfirmed', note: '12-month agreement' }
  ],
  'GSA-P0012': [
    { category: 'sharing', name: 'Shared studio', monthly: 'R5,200', basis: 'basis unconfirmed', note: '2026 price list' },
    { category: 'single', name: 'Single in 5-bed apartment', monthly: 'R6,900–R8,300', basis: 'basis unconfirmed', note: 'Internal / external view' },
    { category: 'single', name: 'Single in 4-bed apartment', monthly: 'R7,800–R8,600', basis: 'basis unconfirmed', note: 'Internal / external view' },
    { category: 'studio', name: '1-bed studio', monthly: 'R8,300–R8,650', basis: 'basis unconfirmed', note: 'Standard / balcony' }
  ],
  'GSA-P0013': [
    { category: 'single', name: 'Single room', monthly: 'R6,990', basis: 'basis unconfirmed', note: 'From · standard rate' },
    { category: 'sharing', name: 'Shared room', monthly: 'R5,750', basis: 'basis unconfirmed', note: 'From · standard rate' },
    { category: 'single', name: 'Single room early bird', monthly: 'R6,550', basis: 'basis unconfirmed', note: '11-month lease' },
    { category: 'sharing', name: 'Sharing early bird', monthly: 'R5,650', basis: 'basis unconfirmed', note: '11-month lease' }
  ],
  'GSA-P0016': [
    { category: 'single', name: 'Package 2 single, shared bathroom', monthly: 'R6,000', basis: 'per person' },
    { category: 'single', name: 'Package 3 single, ensuite', monthly: 'R7,000', basis: 'per person' }
  ],
  'GSA-P0017': [{ category: 'sharing', name: 'Standard shared room', monthly: 'R5,760', basis: 'basis unconfirmed', note: 'From' }],
  'GSA-P0020': [
    { category: 'sharing', name: 'Sharing bedroom apartment', monthly: 'R5,250', basis: 'basis unconfirmed', note: '2026 · 4-bed apartment' },
    { category: 'single', name: 'Single saver', monthly: 'R5,700', basis: 'basis unconfirmed', note: '2026 · 9-bed apartment' },
    { category: 'single', name: 'Single standard', monthly: 'R6,200', basis: 'basis unconfirmed', note: '2026 · 3-bed apartment' }
  ],
  'GSA-P0021': [
    { category: 'sharing', name: 'Shared dorm', monthly: 'R2,900', basis: 'per person' },
    { category: 'single', name: 'Private single dorm', monthly: 'R3,200–R3,650', basis: 'basis unconfirmed' }
  ],
  'GSA-P0022': [
    { category: 'sharing', name: 'Shared mini-dorm, private bathroom', monthly: 'R3,850', basis: 'per person', note: 'Current room card' },
    { category: 'single', name: 'Private single, private bathroom', monthly: 'R5,200', basis: 'basis unconfirmed', note: 'Current room card' }
  ],
  'GSA-P0023': [{ category: 'sharing', name: 'Shared room', monthly: 'R4,300', basis: 'per person' }],
  'GSA-P0024': [
    { category: 'single', name: 'Private bedroom, shared bathroom', monthly: 'R4,100', basis: 'basis unconfirmed', note: 'Current room card' },
    { category: 'sharing', name: 'Sharing option', monthly: 'R3,700', basis: 'per person', note: 'Listing description · availability unverified' }
  ],
  'GSA-P0025': [{ category: 'sharing', name: 'Shared room', monthly: 'R4,400', basis: 'per person', note: 'Current room card' }],
  'GSA-P0026': [{ category: 'single', name: 'Private single, private bathroom', monthly: 'R4,300', basis: 'basis unconfirmed', note: 'Current room card' }],
  'GSA-P0028': [
    { category: 'sharing', name: 'Sharing bedroom', monthly: 'R5,800', basis: 'basis unconfirmed', note: 'From · 2027 annual stay' },
    { category: 'sharing', name: 'Sharing ensuite', monthly: 'R6,460', basis: 'basis unconfirmed', note: 'From · 2027 annual stay' },
    { category: 'single', name: 'Single bedroom', monthly: 'R7,300', basis: 'basis unconfirmed', note: 'From · 2027 annual stay' },
    { category: 'studio', name: 'Studio', monthly: 'R7,990', basis: 'basis unconfirmed', note: 'From · 2027 annual stay' }
  ],
  'GSA-P0029': [
    { category: 'sharing', name: 'Bunked bedroom in apartment', monthly: 'R5,800', basis: 'basis unconfirmed', note: 'From · 2027 annual stay' },
    { category: 'single', name: 'Single in apartment', monthly: 'R6,150', basis: 'basis unconfirmed', note: 'From · 2027 annual stay' },
    { category: 'single', name: 'Single premium bedroom', monthly: 'R6,500', basis: 'basis unconfirmed', note: 'From · 2027 annual stay' }
  ],
  'GSA-P0030': [
    { category: 'sharing', name: '3- or 4-sharing studio', monthly: 'R5,800', basis: 'basis unconfirmed', note: 'From · 2027 annual stay' },
    { category: 'sharing', name: '2-sharing studio', monthly: 'R6,060', basis: 'basis unconfirmed', note: 'From · 2027 annual stay' },
    { category: 'studio', name: 'Private studio', monthly: 'R7,750', basis: 'basis unconfirmed', note: 'From · sold out when checked' }
  ],
  'GSA-P0031': [
    { category: 'apartment', name: 'Two-bed unit', monthly: 'R7,100', basis: 'per bed', note: '12-month schedule; R7,300 × 11 or R7,600 × 10' },
    { category: 'single', name: 'Private unit', monthly: 'R7,800', basis: 'per bed', note: '12-month schedule; R8,000 × 11 or R8,200 × 10' }
  ],
  'GSA-P0032': [{ category: 'single', name: 'Single non-sharing rooms', monthly: 'R7,950–R8,950', basis: 'basis unconfirmed', note: '12-payment schedule; varies by category' }],
  'GSA-P0033': [
    { category: 'sharing', name: 'Shared-room bed', monthly: 'R4,604', basis: 'basis unconfirmed', note: '12-month agreement' },
    { category: 'single', name: 'Single in shared cluster', monthly: 'R5,770', basis: 'basis unconfirmed', note: '12-month agreement' },
    { category: 'single', name: 'Single in 3-bed apartment', monthly: 'R6,050', basis: 'basis unconfirmed', note: '12-month agreement' }
  ],
  'GSA-P0034': [
    { category: 'single', name: 'Single room options', monthly: 'R8,670', basis: 'basis unconfirmed', note: 'Some options · 12-month agreement' },
    { category: 'studio', name: 'Studio apartment', monthly: 'R10,050', basis: 'basis unconfirmed', note: '12-month agreement' }
  ],
  'GSA-P0035': [
    { category: 'studio', name: 'Standard studio', monthly: 'R8,950', basis: 'basis unconfirmed', note: '12-month agreement' },
    { category: 'studio', name: 'Premium studio', monthly: 'R9,320', basis: 'basis unconfirmed', note: '12-month agreement' }
  ],
  'GSA-P0036': [
    { category: 'apartment', name: '4-bed apartment entry', monthly: 'R7,495–R8,495', basis: 'basis unconfirmed', note: '2027 monthly-payment option' },
    { category: 'apartment', name: '3-bed apartment entry', monthly: 'R9,295–R9,595', basis: 'basis unconfirmed', note: '2027 monthly-payment option' },
    { category: 'apartment', name: '2-bed apartment entry', monthly: 'R9,295–R12,695', basis: 'basis unconfirmed', note: '2027 monthly-payment option' },
    { category: 'single', name: '1-bed apartment entry', monthly: 'R10,793.50–R12,645', basis: 'basis unconfirmed', note: '2027 monthly-payment option' }
  ],
  'GSA-P0043': [
    { category: 'single', name: 'The Nook · 1 bed / 1 bath', monthly: 'R6,250', basis: 'basis unconfirmed' },
    { category: 'apartment', name: 'The Studio · 2 bed / 1 bath', monthly: 'R5,690', basis: 'per person', period: 'period unconfirmed' },
    { category: 'single', name: 'The Quarter · 1 bed / 1 bath', monthly: 'R9,590', basis: 'basis unconfirmed' },
    { category: 'single', name: 'The Loft · 1 bed / 1 bath', monthly: 'R9,990', basis: 'basis unconfirmed' }
  ]
};

export function getRoomRates(id: string): RoomRate[] {
  // Provider-transcribed rates take precedence over workbook estimates.
  return rates[id] ?? (workbookRates as Record<string, RoomRate[]>)[id] ?? [];
}

export function roomCategoryRates(id: string, category: RoomCategory): RoomRate[] {
  return getRoomRates(id).filter(rate => rate.category === category);
}
