export type StoredOrder = {
  orderNumber: string; createdAt: string; area: "PHNOM_PENH" | "PROVINCE"; method: "COD" | "QR_IMAGE";
  customer: { name: string; email: string; phone: string; address: string; notes?: string; facebook?: string; telegram?: string };
  items: { productId: string; sku: string; name: string; qty: number; unitCents: number; lineCents: number }[];
  subtotalCents: number; discountCents: number; shippingCents: number; totalCents: number; currency: "USD";
  discountCode?: string; accountEmail?: string; paymentStatus: "PENDING" | "PAID"; paidAt?: string; paidManuallyBy?: string; paymentReference: string;
  claimedPaidAt?: string; paymentProof?: string; proofAt?: string; claimEmail?: { status: "SENT" | "SKIPPED" | "FAILED"; detail?: string };
  email: { status: "NONE" | "SENT" | "SKIPPED" | "FAILED"; detail?: string; attempts: number };
};
export type Settings = { shipPhnomPenhCents: number; shipProvinceCents: number; telegramUrl: string; facebookUrl: string; logoUrl: string; banners: string[]; qrUrl: string };
export const DEFAULT_SETTINGS: Settings = { shipPhnomPenhCents: 150, shipProvinceCents: 200, telegramUrl: "", facebookUrl: "", logoUrl: "/img/logo.png", banners: [], qrUrl: "/img/qr-pay.png" };
