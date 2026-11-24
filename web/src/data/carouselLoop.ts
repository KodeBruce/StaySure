/** Move to an equivalent copy without changing which card is under the viewport. */
export function wrapCarouselPosition(left: number, anchor: number, cycle: number): number {
  if (!Number.isFinite(cycle) || cycle <= 0) return left;
  const start = anchor - cycle / 2;
  if (left >= start && left < start + cycle) return left;
  return start + ((left - start) % cycle + cycle) % cycle;
}
