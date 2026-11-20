export type ResearchPriceSummary = {
  label: string;
  pinLabel: string;
  note: string;
};

const unavailable = /^(?:not publicly disclosed|no rand rent|rent on request|advertised price:\s*not publicly disclosed|provider-wide starting rent|private rate tba)/i;

export function isWorkbookEstimate(advertisedPrice: string): boolean {
  return /^workbook estimate:/i.test(advertisedPrice.trim());
}

function rentAmounts(advertisedPrice: string): number[] {
  if (!advertisedPrice || unavailable.test(advertisedPrice.trim())) return [];
  const firstStatement = advertisedPrice.split(/\.\s+(?=[A-Z])/)[0];
  if (!/(?:month|rate|rent|payment|price list|pricelist)/i.test(firstStatement) && !/12 payments|monthly/i.test(advertisedPrice)) return [];

  // Fees, deposits and historical prices in later sentences are not monthly rent.
  return [...firstStatement.matchAll(/R\s*([\d,]+(?:\.\d{2})?)/gi)]
    .map(match => Number(match[1].replace(/,/g, '')))
    .filter(amount => Number.isFinite(amount) && amount >= 1000 && amount <= 100000);
}

export function researchPriceSummary(advertisedPrice: string): ResearchPriceSummary | null {
  const amounts = rentAmounts(advertisedPrice);
  if (!amounts.length) return null;

  const low = Math.min(...amounts);
  const high = Math.max(...amounts);
  const money = (amount: number) => `R${amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  const estimate = isWorkbookEstimate(advertisedPrice);
  return {
    label: `${estimate ? '~' : ''}${low === high ? money(low) : `${money(low)}–${money(high)}`}`,
    pinLabel: `${estimate ? '~' : ''}${low === high ? money(low) : `${money(low)}+`}`,
    note: estimate ? '2026 workbook estimate; confirm current rent and billing basis' : low === high ? 'Advertised rent; confirm period and billing basis' : 'Advertised room or lease options; confirm each basis'
  };
}

export function extractMinPrice(advertisedPrice: string): number | null {
  const amounts = rentAmounts(advertisedPrice);
  return amounts.length ? Math.min(...amounts) : null;
}

export function extractMaxPrice(advertisedPrice: string): number | null {
  const amounts = rentAmounts(advertisedPrice);
  return amounts.length ? Math.max(...amounts) : null;
}
