export const ADVANCE_RATE = 0.2;

export function advancePercentLabel() {
  return `${Math.round(ADVANCE_RATE * 100)}%`;
}

export function remainingPercentLabel() {
  return `${Math.round((1 - ADVANCE_RATE) * 100)}%`;
}
