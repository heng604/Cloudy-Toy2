export type Area = "PHNOM_PENH" | "PROVINCE";
export type Method = "COD" | "QR_IMAGE";
export const shippingFor = (a: Area, s: { shipPhnomPenhCents: number; shipProvinceCents: number }) => (a === "PHNOM_PENH" ? s.shipPhnomPenhCents : s.shipProvinceCents);
/** Pay-with-delivery (cash) is Phnom Penh only. Enforced on the server, not just in the form. */
export const methodAllowed = (m: Method, a: Area) => m === "QR_IMAGE" || (m === "COD" && a === "PHNOM_PENH");
export const methodLabel = (m: Method) => (m === "COD" ? "Pay with delivery" : "QR image payment");
