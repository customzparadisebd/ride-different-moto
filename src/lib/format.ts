export const formatBDT = (amount: number) =>
  `৳ ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount)}`;

export const discountPercent = (price: number, offerPrice?: number) => {
  if (!offerPrice || offerPrice >= price) return null;
  return Math.round(((price - offerPrice) / price) * 100);
};
