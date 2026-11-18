export type ResearchPriceSummary = {
  label: string;
  pinLabel: string;
  note: string;
};

const unavailable = /^(?:not publicly disclosed|no rand rent|rent on request|advertised price:\s*not publicly disclosed|provider-wide starting rent|private rate tba)/i;

export function researchPriceSummary(advertisedPrice: string): ResearchPriceSummary | null {
  if (unavailable.test(advertisedPrice.trim())) return null;
  const firstStatement = advertisedPrice.split(/\.\s+(?=[A-Z])/)[0];
  if (!/(?:month|rate|rent|payment|price list|pricelist)/i.test(firstStatement) && !/12 payments|monthly/i.test(advertisedPrice)) return null;

  const amounts = [...firstStatement.matchAll(/R\s*([\d,]+(?:\.\d{2})?)/gi)]
    .map(match => Number(match[1].replace(/,/g, '')))
    .filter(amount => Number.isFinite(amount) && amount >= 1000 && amount <= 100000);
  if (!amounts.length) return null;

  const low = Math.min(...amounts);
  const high = Math.max(...amounts);
  const money = (amount: number) => `R${amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  return {
    label: low === high ? money(low) : `${money(low)}–${money(high)}`,
    pinLabel: low === high ? money(low) : `${money(low)}+`,
    note: low === high ? 'Advertised rent; confirm period and billing basis' : 'Advertised room or lease options; confirm each basis'
  };
}

export function extractMinPrice(advertisedPrice: string): number | null {
  if (!advertisedPrice || unavailable.test(advertisedPrice.trim())) return null;
  const amounts = [...advertisedPrice.matchAll(/R\s*([\d,]+(?:\.\d{2})?)/gi)]
    .map(match => Number(match[1].replace(/,/g, '')))
    .filter(amount => Number.isFinite(amount) && amount >= 1000 && amount <= 100000);
  return amounts.length ? Math.min(...amounts) : null;
}

export function extractMaxPrice(advertisedPrice: string): number | null {
  if (!advertisedPrice || unavailable.test(advertisedPrice.trim())) return null;
  const amounts = [...advertisedPrice.matchAll(/R\s*([\d,]+(?:\.\d{2})?)/gi)]
    .map(match => Number(match[1].replace(/,/g, '')))
    .filter(amount => Number.isFinite(amount) && amount >= 1000 && amount <= 100000);
  return amounts.length ? Math.max(...amounts) : null;
}
