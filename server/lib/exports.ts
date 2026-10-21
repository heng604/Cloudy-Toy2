import type { StoredOrder } from "../../shared/types";
import type { Product } from "../../shared/products";
import { methodLabel } from "../../shared/delivery";
import { stockStatus } from "../../shared/products";
import { stamp, usd } from "../../shared/stats";
import type { CsvCol } from "../../shared/csv";
import type { PdfCol } from "./pdf";
export type Dataset = { name: string; title: string; csv: CsvCol<any>[]; pdf: PdfCol[]; pdfRow: (r: any) => string[]; rows: any[] };
const area = (o: StoredOrder) => (o.area === "PHNOM_PENH" ? "Phnom Penh" : "Province");
const items = (o: StoredOrder) => o.items.map((i) => `${i.name} x${i.qty}`).join("; ");
const qty = (o: StoredOrder) => o.items.reduce((s, i) => s + i.qty, 0);

export function ordersDataset(rows: StoredOrder[]): Dataset {
  const csv: CsvCol<StoredOrder>[] = [
    { header: "Order number", get: (o) => o.orderNumber }, { header: "Date (Phnom Penh)", get: (o) => stamp(o.createdAt) },
    { header: "Customer", get: (o) => o.customer.name }, { header: "Email", get: (o) => o.customer.email }, { header: "Phone", get: (o) => o.customer.phone },
    { header: "Area", get: area }, { header: "Address", get: (o) => o.customer.address }, { header: "Payment method", get: (o) => methodLabel(o.method) },
    { header: "Payment status", get: (o) => o.paymentStatus }, { header: "Items", get: items }, { header: "Item count", get: qty },
    { header: "Subtotal USD", get: (o) => (o.subtotalCents / 100).toFixed(2) }, { header: "Discount USD", get: (o) => (o.discountCents / 100).toFixed(2) }, { header: "Discount code", get: (o) => o.discountCode ?? "" },
    { header: "Delivery USD", get: (o) => (o.shippingCents / 100).toFixed(2) }, { header: "Total USD", get: (o) => (o.totalCents / 100).toFixed(2) },
    { header: "Paid at", get: (o) => (o.paidAt ? stamp(o.paidAt) : "") }, { header: "Confirmed by", get: (o) => o.paidManuallyBy ?? "" }, { header: "Reference", get: (o) => o.paymentReference },
  ];
  return { name: "orders", title: "Orders", csv, rows,
    pdf: [{ header: "Order #", chars: 18 }, { header: "Date", chars: 16 }, { header: "Customer", chars: 20 }, { header: "Phone", chars: 14 }, { header: "Area", chars: 10 }, { header: "Method", chars: 16 }, { header: "Status", chars: 8 }, { header: "Qty", chars: 4, right: true }, { header: "Total", chars: 10, right: true }],
    pdfRow: (o: StoredOrder) => [o.orderNumber, stamp(o.createdAt), o.customer.name, o.customer.phone, area(o), methodLabel(o.method), o.paymentStatus, String(qty(o)), usd(o.totalCents)] };
}
export function transactionsDataset(rows: StoredOrder[]): Dataset {
  const csv: CsvCol<StoredOrder>[] = [
    { header: "Order number", get: (o) => o.orderNumber }, { header: "Date (Phnom Penh)", get: (o) => stamp(o.createdAt) }, { header: "Customer", get: (o) => o.customer.name },
    { header: "Payment method", get: (o) => methodLabel(o.method) }, { header: "Status", get: (o) => o.paymentStatus }, { header: "Subtotal USD", get: (o) => (o.subtotalCents / 100).toFixed(2) },
    { header: "Delivery USD", get: (o) => (o.shippingCents / 100).toFixed(2) }, { header: "Total USD", get: (o) => (o.totalCents / 100).toFixed(2) }, { header: "Reference", get: (o) => o.paymentReference },
  ];
  return { name: "transactions", title: "Transactions", csv, rows,
    pdf: [{ header: "Order #", chars: 18 }, { header: "Date", chars: 16 }, { header: "Customer", chars: 22 }, { header: "Method", chars: 16 }, { header: "Status", chars: 8 }, { header: "Subtotal", chars: 10, right: true }, { header: "Delivery", chars: 10, right: true }, { header: "Total", chars: 10, right: true }],
    pdfRow: (o: StoredOrder) => [o.orderNumber, stamp(o.createdAt), o.customer.name, methodLabel(o.method), o.paymentStatus, usd(o.subtotalCents), usd(o.shippingCents), usd(o.totalCents)] };
}
const price = (p: Product) => p.salePrice ?? p.price;
export function productsDataset(rows: Product[]): Dataset {
  const csv: CsvCol<Product>[] = [
    { header: "SKU", get: (p) => p.sku }, { header: "Name", get: (p) => p.name }, { header: "Category", get: (p) => p.category },
    { header: "Price USD", get: (p) => p.price.toFixed(2) }, { header: "Sale price USD", get: (p) => (p.salePrice != null ? p.salePrice.toFixed(2) : "") },
    { header: "Stock", get: (p) => p.stock }, { header: "Stock status", get: (p) => stockStatus(p.stock) }, { header: "Visible in shop", get: (p) => (p.active === false ? "No" : "Yes") }, { header: "Description", get: (p) => p.description },
  ];
  return { name: "products", title: "Products", csv, rows,
    pdf: [{ header: "SKU", chars: 12 }, { header: "Name", chars: 34 }, { header: "Category", chars: 12 }, { header: "Price", chars: 9, right: true }, { header: "Sale", chars: 9, right: true }, { header: "Stock", chars: 6, right: true }, { header: "Level", chars: 5 }, { header: "Shown", chars: 5 }],
    pdfRow: (p: Product) => [p.sku, p.name, p.category, `$${p.price.toFixed(2)}`, p.salePrice != null ? `$${p.salePrice.toFixed(2)}` : "-", String(p.stock), stockStatus(p.stock), p.active === false ? "No" : "Yes"] };
}
export function stockDataset(rows: Product[]): Dataset {
  const csv: CsvCol<Product>[] = [
    { header: "SKU", get: (p) => p.sku }, { header: "Name", get: (p) => p.name }, { header: "Category", get: (p) => p.category }, { header: "Stock", get: (p) => p.stock },
    { header: "Level", get: (p) => stockStatus(p.stock) }, { header: "Unit price USD", get: (p) => price(p).toFixed(2) }, { header: "Stock value USD", get: (p) => (price(p) * p.stock).toFixed(2) },
  ];
  return { name: "stock", title: "Stock report", csv, rows,
    pdf: [{ header: "SKU", chars: 12 }, { header: "Name", chars: 40 }, { header: "Category", chars: 12 }, { header: "Stock", chars: 6, right: true }, { header: "Level", chars: 6 }, { header: "Unit", chars: 9, right: true }, { header: "Value", chars: 11, right: true }],
    pdfRow: (p: Product) => [p.sku, p.name, p.category, String(p.stock), stockStatus(p.stock), `$${price(p).toFixed(2)}`, `$${(price(p) * p.stock).toFixed(2)}`] };
}
