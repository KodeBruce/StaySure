import { getRoomRates } from './roomRates';

export type RoomTypeFilter = 'single' | 'sharing' | 'studio';

export const ROOM_TYPE_OPTIONS: { id: RoomTypeFilter; label: string; description: string }[] = [
  { id: 'single', label: 'Single room', description: 'Your own bedroom' },
  { id: 'sharing', label: 'Sharing room', description: 'Share a bedroom' },
  { id: 'studio', label: 'Private studio', description: 'Self-contained space' }
];

export function matchesRoomType(item: { id: string; rooms: string }, type: RoomTypeFilter): boolean {
  if (getRoomRates(item.id).some(rate => rate.category === type)) return true;
  const rooms = item.rooms.toLowerCase();
  if (type === 'single') return /\bsingle(?:[- ](?:room|bedroom|dorm|unit|accommodation))?\b|\bprivate (?:room|bedroom|unit)\b|non-sharing room/.test(rooms);
  if (type === 'sharing') return /\b(?:two|three|four|[234])[- ]sharing\b|\bshar(?:ed|ing)[- ](?:room|bedroom|dorm|mini-dorm|studio)\b|\bdouble room\b|\bbunked bedroom\b|\btriple-share\b/.test(rooms);
  return /\b(?:private|single|standard|premium|1-bed)[- ]studio\b|\bstudio apartment\b/.test(rooms);
}

export function matchesSelectedRoomTypes(item: { id: string; rooms: string }, selected: RoomTypeFilter[]): boolean {
  return selected.length === 0 || selected.some(type => matchesRoomType(item, type));
}

export function parseRoomTypes(value: string | null): RoomTypeFilter[] {
  return [...new Set((value ?? '').split(',').filter((type): type is RoomTypeFilter => ROOM_TYPE_OPTIONS.some(option => option.id === type)))];
}
