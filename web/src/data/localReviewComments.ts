export interface LocalReviewComment {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
}

const storageKey = (propertyId: string) => `staysure.reviewComments.${propertyId}`;

export function readLocalReviewComments(propertyId: string): LocalReviewComment[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(storageKey(propertyId)) || '[]');
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is LocalReviewComment =>
      item !== null && typeof item === 'object' &&
      typeof item.id === 'string' && typeof item.author === 'string' &&
      typeof item.text === 'string' && typeof item.date === 'string' &&
      typeof item.rating === 'number' && item.rating >= 1 && item.rating <= 5
    );
  } catch {
    return [];
  }
}

export function saveLocalReviewComments(propertyId: string, comments: LocalReviewComment[]): boolean {
  try {
    localStorage.setItem(storageKey(propertyId), JSON.stringify(comments));
    return true;
  } catch {
    return false;
  }
}
