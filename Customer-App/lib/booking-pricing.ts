export const SAMAGRI_RATE = 0.2;

export function calculateBookingPrice(basePrice: number, samagriRequired: boolean) {
  const safeBase = Math.max(0, Math.round(basePrice));
  const samagriCharge = samagriRequired ? Math.round(safeBase * SAMAGRI_RATE) : 0;
  return {
    basePrice: safeBase,
    samagriCharge,
    totalPrice: safeBase + samagriCharge,
  };
}

export function formatINR(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`;
}
