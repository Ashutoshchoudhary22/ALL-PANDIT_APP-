export const SAMAGRI_RATE = 0.2;
export const ADVANCE_RATE = 0.4;

export function calculateBookingPrice(basePrice: number, samagriRequired: boolean) {
  const safeBase = Math.max(0, Math.round(basePrice));
  const samagriCharge = samagriRequired ? Math.round(safeBase * SAMAGRI_RATE) : 0;
  const totalPrice = safeBase + samagriCharge;
  const advanceAmount = Math.max(1, Math.round(totalPrice * ADVANCE_RATE));
  const remainingAmount = Math.max(0, totalPrice - advanceAmount);

  return {
    basePrice: safeBase,
    samagriCharge,
    totalPrice,
    advanceAmount,
    remainingAmount,
  };
}

export function formatINR(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`;
}
