// The research dataset contains no licensed, property-specific image files.
// These existing prototype photos are presentation samples and must always be labelled as illustrative.
const sampleImages = Array.from({ length: 10 }, (_, index) => `/images/p${index + 1}.jpg`);

export function researchImages(id: string): string[] {
  const number = Number(id.match(/\d+$/)?.[0] || 1);
  const start = (number - 1) % sampleImages.length;
  return [0, 1, 2].map(offset => sampleImages[(start + offset) % sampleImages.length]);
}

export const researchFallbackImage = '/images/research-fallback.svg';
