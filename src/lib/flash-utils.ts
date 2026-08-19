import { FlashSale } from "./flash.shared";

export function getActiveSaleForProduct(productId: string, sales: FlashSale[]): FlashSale | null {
  const now = new Date();
  const nowUTC = now.getTime() + now.getTimezoneOffset() * 60000;
  const nowDhaka = new Date(nowUTC + 3600000 * 6);

  const activeSales = sales.filter(sale => {
    if (!sale.isActive) return false;
    if (!sale.productIds.includes(productId)) return false;

    // Schedule check
    if (sale.startDate || sale.endDate || sale.startTime || sale.endTime) {
      let start = new Date(0);
      let end = new Date(8640000000000000);

      if (sale.startDate) {
        const timePart = sale.startTime || "00:00:00";
        start = new Date(`${sale.startDate}T${timePart}`);
      } else if (sale.startTime) {
        const today = nowDhaka.toISOString().split("T")[0];
        start = new Date(`${today}T${sale.startTime}`);
      }

      if (sale.endDate) {
        const timePart = sale.endTime || "23:59:59";
        end = new Date(`${sale.endDate}T${timePart}`);
      } else if (sale.endTime) {
        const today = nowDhaka.toISOString().split("T")[0];
        end = new Date(`${today}T${sale.endTime}`);
      }

      if (nowDhaka < start || nowDhaka > end) return false;
    }

    return true;
  });

  if (activeSales.length === 0) return null;

  // Highest priority, then newest
  return activeSales.sort((a, b) => b.priority - a.priority || b.id.localeCompare(a.id))[0];
}

export function calculateFlashPrice(originalPrice: number, sale: FlashSale): number {
  if (sale.discountType === "percentage") {
    return Math.round(originalPrice * (1 - sale.discountValue / 100));
  }
  return sale.discountValue;
}
