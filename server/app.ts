import { PROVINCE_NAMES } from "../shared/provinces";
import "./env";
import express, { type Request, type Response } from "express";
import compression from "compression";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { z } from "zod";
import { requireAdmin, requireUser, userFromReq, adminOf, userOf } from "./lib/auth";
import { tooMany, clientKey } from "./lib/rateLimit";
import { listProducts, listAllProducts, getProductById, upsertProduct, skuTaken, deleteProduct, setStock, decrementStock, restoreStock, uploadProductImage, deleteProductImages } from "./lib/productStore";
import { resolveDiscount, listStoreDiscounts, createStoreDiscount, updateStoreDiscount, deleteStoreDiscount } from "./lib/discountStore";
import { saveOrder, getOrder, updateOrder, listAllOrders, listOrdersByEmail, deleteAllOrders } from "./lib/store";
import { getSettings, saveSettings, DEFAULT_SETTINGS } from "./lib/settings";
import { getAllPages, savePage } from "./lib/pages";
import { sendAdminEmail, sendPaidOrderEmail, sendCustomerEmail } from "./lib/email";
import { uploadProof, deleteProofs, proofUrls } from "./lib/proofStore";
import { ordersDataset, transactionsDataset, productsDataset, stockDataset } from "./lib/exports";
import { toCsv } from "../shared/csv";
import { buildPdf } from "./lib/pdf";
import { filterOrders, sortOrders } from "../shared/stats";
import { computeTotals, type PricedProduct } from "../shared/pricing";
import { methodAllowed, shippingFor } from "../shared/delivery";
import { normalizeCode, CODE_RE, percentOk } from "../shared/discount";
import { validateImage, safeFileName } from "../shared/images";
import { canPay } from "../shared/orders";
import { isSlug, MAX_CONTENT, PAGE_DEFS } from "../shared/pages";
import { categoriesOf } from "../shared/products";

const app = express();
app.set("trust proxy", 1);
app.disable("x-powered-by");
/** Security headers on every response (clickjacking, MIME sniffing, XSS, HTTPS downgrade, leaky referrers). */
const CSP = ["default-src 'self'", "script-src 'self'", "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https://*.supabase.co", "connect-src 'self' https://*.supabase.co wss://*.supabase.co", "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'"].join("; ");
app.use((_req, res, next) => {
  res.set({ "Content-Security-Policy": CSP, "X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY", "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()", "Strict-Transport-Security": "max-age=31536000; includeSubDomains", "Cross-Origin-Opener-Policy": "same-origin" });
  next();
});
app.use(compression());
app.use(express.json({ limit: "1mb" }));
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 6 * 1024 * 1024, files: 8 } });
const api = express.Router();
api.use((req, res, next) => { // overall brake per visitor: stops scripted flooding / scanning of the API
  if (tooMany(`all:${clientKey(req)}`, 300)) return res.status(429).json({ error: "Too many requests. Please wait a minute." });
  next(); });
api.get("/health", (_req, res) => res.json({ ok: true, db: !!(process.env.SUPABASE_SERVICE_ROLE_KEY && (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)) }));
/** Plain-language hint for the most common setup problems (shown to the admin only). */
const hint = (m: string) => /relation .* does not exist|could not find the table|schema cache|column .* does not exist|function .* does not exist|Could not find the function/i.test(m) ? "Database tables are missing or out of date. Open Supabase > SQL Editor, paste supabase/setup_all.sql and click Run (it is safe to run again), then reload."
  : /not configured|SUPABASE_SERVICE_ROLE_KEY/i.test(m) ? "SUPABASE_SERVICE_ROLE_KEY (or the Supabase URL) is missing in .env.local. Add it and restart npm run dev."
  : /invalid api key|jwt|apikey/i.test(m) ? "The Supabase key is wrong. Copy the service_role / secret key from Supabase > Project Settings > API into SUPABASE_SERVICE_ROLE_KEY."
  : /fetch failed|ENOTFOUND|ECONNREFUSED|network/i.test(m) ? "The server cannot reach Supabase. Check VITE_SUPABASE_URL and your internet connection."
  : "";
const wrap = (fn: (req: Request, res: Response) => Promise<unknown>) => (req: Request, res: Response) => { fn(req, res).catch((e) => {
  console.error("[api]", req.path, e); const msg = e instanceof Error ? e.message : String(e);
  // Only admin routes explain the cause; public routes stay generic.
  const body = req.path.startsWith("/admin") ? { error: "Server error", detail: msg, hint: hint(msg) } : { error: "Server error" };
  if (!res.headersSent) res.status(500).json(body); }); };
const files = (req: Request, name: string) => ((req.files as Express.Multer.File[] | undefined) ?? []).filter((f) => f.fieldname === name && f.size > 0);
const fld = (req: Request, k: string) => String((req.body as Record<string, unknown>)?.[k] ?? "");
const all = (req: Request, k: string): string[] => { const v = (req.body as Record<string, unknown>)?.[k]; return v === undefined ? [] : Array.isArray(v) ? v.map(String) : [String(v)]; };
const catalogOf = (products: Awaited<ReturnType<typeof listProducts>>) => new Map<string, PricedProduct>(products.map((p) => [p.id, { id: p.id, name: p.name, priceCents: Math.round(p.price * 100), saleCents: p.salePrice ? Math.round(p.salePrice * 100) : null, stock: p.stock, active: true }]));

/* ---------------- public: checkout ---------------- */
const Body = z.object({
  customer: z.object({ name: z.string().trim().min(2).max(100), email: z.union([z.literal(""), z.string().trim().email().max(200)]).optional().transform((v) => v ?? ""), phone: z.string().trim().min(6).max(30), address: z.string().trim().min(5).max(400), notes: z.string().trim().max(300).optional(), facebook: z.string().trim().max(100).optional(), telegram: z.string().trim().max(100).optional() }),
  lines: z.array(z.object({ productId: z.string(), qty: z.number().int().min(1).max(99) })).min(1).max(50),
  area: z.enum(["PHNOM_PENH", "PROVINCE"]), province: z.enum(PROVINCE_NAMES).optional(), method: z.enum(["COD", "QR_IMAGE"]), code: z.string().trim().max(40).optional(),
});
const LABELS: Record<string, string> = { name: "Full name (at least 2 characters)", email: "Email (a valid address)", phone: "Phone (at least 6 digits)", address: "Delivery address (5 to 400 characters)", notes: "Delivery instructions (max 300 characters)", area: "Delivery area", method: "Payment method" };
api.post("/checkout", wrap(async (req, res) => {
  const raw = req.body; const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    const bad = [...new Set(parsed.error.issues.map((i) => { const k = String(i.path[0] === "customer" ? i.path[1] : i.path[0]); const v = raw?.customer?.[k]; return (LABELS[k] ?? "Cart items") + (i.path[0] === "customer" ? `, ${typeof v === "string" ? `you entered ${v.trim().length}` : "nothing received"}` : ""); }))];
    return res.status(400).json({ error: `Please check: ${bad.join("; ")}.` });
  }
  const { customer, lines, area, method } = parsed.data; const codeIn = normalizeCode(parsed.data.code ?? "");
  if (codeIn && tooMany(`c:${clientKey(req)}`)) return res.status(429).json({ error: "Too many tries. Please wait a minute." });
  if (codeIn && !CODE_RE.test(codeIn)) return res.status(400).json({ error: "That discount code is not valid." });
  if (area === "PROVINCE" && !parsed.data.province) return res.status(400).json({ error: "Please choose your province." });
  if (!methodAllowed(method, area)) return res.status(400).json({ error: "Pay with delivery is only available in Phnom Penh." });
  const [settings, products, acct] = await Promise.all([getSettings(), listProducts(), userFromReq(req)]);
  const catalog = catalogOf(products); let usedCode: string | undefined;
  try {
    const ship = shippingFor(area, settings); let discount = 0;
    if (codeIn) { // admin-created codes only (% off the subtotal); checked on the server, never trusted from the browser
      const t0 = computeTotals(lines, catalog, ship); const ev = await resolveDiscount(codeIn, t0.items);
      if (!ev.ok) return res.status(400).json({ error: ev.error });
      usedCode = codeIn; discount = ev.discountCents;
    }
    const t = computeTotals(lines, catalog, ship, discount);
    const orderNumber = `CT-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${crypto.randomUUID().slice(0, 5).toUpperCase()}`;
    const order = { orderNumber, createdAt: new Date().toISOString(), area, ...(area === "PROVINCE" ? { province: parsed.data.province } : {}), method, customer,
      items: t.items.map((i) => ({ productId: i.productId, sku: products.find((p) => p.id === i.productId)!.sku, name: i.name, qty: i.qty, unitCents: i.unitCents, lineCents: i.lineCents })),
      subtotalCents: t.subtotalCents, discountCents: t.discountCents, shippingCents: t.shippingCents, totalCents: t.totalCents, currency: "USD" as const, ...(usedCode ? { discountCode: usedCode } : {}), ...(acct?.email ? { accountEmail: acct.email.toLowerCase() } : {}),
      paymentStatus: "PENDING" as const, paymentReference: `PAY-${orderNumber}`, email: { status: "NONE" as const, attempts: 0 } };
    const lines2 = t.items.map((i) => ({ productId: i.productId, qty: i.qty }));
    await decrementStock(lines2); // atomic in the database; throws INSUFFICIENT_STOCK without changing anything
    try { await saveOrder(order); } catch (e) { await restoreStock(lines2); throw e; }
    try { // EVERY new order (pay with delivery AND QR) is emailed to the admin right away; QR orders get a second email when the customer presses "I have paid"
      const r = await sendAdminEmail(order); // order is never lost if email fails; status is recorded (admin can press "Resend email")
      await updateOrder(orderNumber, (x) => { x.email = { status: r.status, detail: r.detail, attempts: 1 }; });
    } catch (e) { console.error("[checkout email]", orderNumber, e); } // the order is already saved and stock reduced: never answer "could not place the order" because of email
    try { const r = await sendCustomerEmail(order, "placed"); await updateOrder(orderNumber, (x) => { x.customerEmail = { ...r, kind: "placed" }; }); } // personal invoice to the customer; never blocks the order
    catch (e) { console.error("[customer email]", orderNumber, e); }
    return res.json({ orderNumber });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    return res.status(409).json({ error: msg === "INSUFFICIENT_STOCK" ? "An item is out of stock or exceeds available stock." : "Could not place the order." });
  }
}));

/** Preview only: tells the customer how much a code takes off. Does NOT use up the code. */
api.post("/discount/validate", wrap(async (req, res) => {
  if (tooMany(`v:${clientKey(req)}`)) return res.status(429).json({ error: "Too many tries. Please wait a minute." });
  const b = z.object({ code: z.string().max(40), lines: z.array(z.object({ productId: z.string(), qty: z.number().int().min(1).max(99) })).min(1).max(50) }).safeParse(req.body);
  if (!b.success) return res.status(400).json({ error: "Bad request" });
  const code = normalizeCode(b.data.code);
  if (!CODE_RE.test(code)) return res.status(400).json({ error: "That discount code is not valid." });
  try {
    const t = computeTotals(b.data.lines, catalogOf(await listProducts()), 0); const ev = await resolveDiscount(code, t.items);
    return ev.ok ? res.json({ code, discountCents: ev.discountCents }) : res.status(400).json({ error: ev.error });
  } catch { return res.status(400).json({ error: "Could not check the code right now." }); }
}));

/** Payment page data (same exposure as before: whoever has the order number can see it). */
api.get("/orders/:n", wrap(async (req, res) => {
  if (!/^CT-[0-9]{6}-[A-Z0-9]{5}$/.test(String(req.params.n))) return res.status(404).json({ error: "Not found" }); // wrong format: never hits the database
  if (tooMany(`o:${clientKey(req)}`, 30)) return res.status(429).json({ error: "Too many tries. Please wait a minute." }); // blocks order-number guessing
  const o = await getOrder(String(req.params.n)); return o ? res.json({ order: o }) : res.status(404).json({ error: "Not found" }); }));

/** Customer pressed "I have paid": email the full order to the admin (once). */
api.post("/payment/claim", wrap(async (req, res) => {
  const n = typeof req.body?.orderNumber === "string" ? req.body.orderNumber.trim() : "";
  if (!/^CT-[0-9]{6}-[A-Z0-9]{5}$/.test(n)) return res.status(400).json({ error: "Invalid order" });
  if (tooMany(`claim:${clientKey(req)}`, 10)) return res.status(429).json({ error: "Too many tries. Please wait a minute." });
  const o = await getOrder(n);
  if (!o || o.method !== "QR_IMAGE") return res.status(404).json({ error: "Order not found" });
  if (o.paymentStatus === "PENDING" && !o.paymentProof) return res.status(400).json({ error: "Please upload your payment screenshot first." });
  if (o.paymentStatus === "PAID" || o.claimEmail?.status === "SENT") return res.json({ ok: true, already: true, status: "SENT" }); // never email twice
  const r = await sendPaidOrderEmail(o);
  await updateOrder(n, (x) => { x.claimedPaidAt = x.claimedPaidAt ?? new Date().toISOString(); x.claimEmail = r; x.email = r.status !== "SENT" && x.email.status === "SENT" ? { ...x.email, attempts: x.email.attempts + 1 } : { status: r.status, detail: r.detail, attempts: x.email.attempts + 1 }; });
  if (r.status !== "SENT") console.error("[claim email]", n, r.status, r.detail);
  return res.json({ ok: r.status === "SENT", status: r.status, detail: r.detail });
}));
api.post("/payment/proof", upload.any(), wrap(async (req, res) => {
  const n = fld(req, "orderNumber").trim(); const f = files(req, "proof")[0];
  if (!/^CT-[0-9]{6}-[A-Z0-9]{5}$/.test(n) || !f) return res.status(400).json({ error: "Choose your payment screenshot first." });
  if (tooMany(`proof:${clientKey(req)}`, 10)) return res.status(429).json({ error: "Too many tries. Please wait a minute." });
  const o = await getOrder(n);
  if (!o || o.method !== "QR_IMAGE" || o.paymentStatus !== "PENDING") return res.status(404).json({ error: "Order not found." });
  const bytes = new Uint8Array(f.buffer); const v = validateImage(bytes, f.mimetype);
  if (!v.ok) return res.status(400).json({ error: v.error });
  try {
    const small = new Uint8Array(await sharp(bytes).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 85 }).toBuffer());
    const p = await uploadProof(n, small); const oldPath = o.paymentProof;
    await updateOrder(n, (x) => { x.paymentProof = p; x.proofAt = new Date().toISOString(); });
    if (oldPath) await deleteProofs([oldPath]);
    return res.json({ ok: true });
  } catch (e) { console.error("[payment proof]", n, e); return res.status(500).json({ error: "Could not upload the screenshot. Please try again." }); }
}));

/* ---------------- signed-in customer ---------------- */
api.get("/account/orders", requireUser, wrap(async (req, res) => { const u = userOf(req); res.json({ orders: u.email ? await listOrdersByEmail(u.email) : [] }); }));

/* ---------------- admin ---------------- */
const admin = express.Router(); admin.use(requireAdmin); api.use("/admin", admin);
admin.get("/me", (req, res) => res.json({ email: adminOf(req).email }));
admin.get("/dashboard", wrap(async (_req, res) => { const [orders, products] = await Promise.all([listAllOrders(), listAllProducts()]); res.json({ orders, products }); }));
admin.get("/orders", wrap(async (req, res) => { const orders = await listAllOrders(); res.json({ orders, proofs: req.query.proofs ? await proofUrls(orders.map((o) => o.paymentProof ?? "")) : {} }); }));
admin.post("/orders/:n/mark-paid", wrap(async (req, res) => {
  const o = await getOrder(String(req.params.n));
  if (!o || !canPay(o.paymentStatus, "PAID")) return res.json({ ok: false });
  await updateOrder(o.orderNumber, (x) => { x.paymentStatus = "PAID"; x.paidAt = new Date().toISOString(); x.paidManuallyBy = adminOf(req).email ?? "admin"; });
  try { const paid = await getOrder(o.orderNumber); if (paid) { const r = await sendCustomerEmail(paid, "paid"); await updateOrder(o.orderNumber, (x) => { x.customerEmail = { ...r, kind: "paid" }; }); } } // "payment received" receipt
  catch (e) { console.error("[paid receipt email]", o.orderNumber, e); }
  res.json({ ok: true });
}));
admin.post("/orders/:n/resend-email", wrap(async (req, res) => {
  const o = await getOrder(String(req.params.n)); if (!o) return res.status(404).json({ ok: false });
  const r = o.claimedPaidAt ? await sendPaidOrderEmail(o) : await sendAdminEmail(o);
  await updateOrder(o.orderNumber, (x) => { x.email = { status: r.status, detail: r.detail, attempts: x.email.attempts + 1 }; });
  res.json({ ok: r.status === "SENT", status: r.status, detail: r.detail });
}));
admin.post("/orders/:n/resend-invoice", wrap(async (req, res) => {
  const o = await getOrder(String(req.params.n)); if (!o) return res.status(404).json({ ok: false });
  const kind = o.paymentStatus === "PAID" ? "paid" : "placed"; const r = await sendCustomerEmail(o, kind);
  await updateOrder(o.orderNumber, (x) => { x.customerEmail = { ...r, kind }; });
  res.json({ ok: r.status === "SENT", status: r.status, detail: r.detail });
}));
admin.post("/transactions/clear", wrap(async (_req, res) => {
  try { const proofs = (await listAllOrders()).map((o) => o.paymentProof ?? ""); await deleteAllOrders(); await deleteProofs(proofs); res.json({ ok: true }); }
  catch { res.status(500).json({ error: "Could not clear the transactions. Please try again." }); }
}));
admin.get("/export", wrap(async (req, res) => {
  const u = req.query as Record<string, string | undefined>;
  const type = u.type ?? "orders", format = u.format === "pdf" ? "pdf" : "csv";
  const f = { status: u.status, from: u.from, to: u.to, q: u.q };
  let ds;
  if (type === "orders") ds = ordersDataset(sortOrders(filterOrders(await listAllOrders(), f), u.sort ?? "new"));
  else if (type === "transactions") ds = transactionsDataset(sortOrders(filterOrders(await listAllOrders(), f), u.sort ?? "high"));
  else if (type === "products") ds = productsDataset(await listAllProducts());
  else if (type === "stock") ds = stockDataset([...(await listAllProducts())].sort((a, b) => a.stock - b.stock));
  else return res.status(400).send("Unknown export type");
  const date = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
  res.set({ "Content-Disposition": `attachment; filename="cloudy-toy-${ds.name}-${date}.${format}"`, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  if (format === "csv") return res.type("text/csv; charset=utf-8").send(toCsv(ds.rows, ds.csv));
  res.type("application/pdf").send(buildPdf({ title: `Cloudy-Toy - ${ds.title}`, subtitle: `Generated ${date} (Phnom Penh time) - ${ds.rows.length} rows`, cols: ds.pdf, rows: ds.rows.map(ds.pdfRow) }));
}));

// products
const MAX_IMAGES = 6;
const Schema = z.object({
  name: z.string().trim().min(2, "Name needs at least 2 characters").max(120),
  sku: z.string().trim().min(2, "SKU needs at least 2 characters").max(40).regex(/^[A-Za-z0-9_#*-]+$/, "SKU: letters, numbers and the symbols # * _ - only (no spaces)"),
  category: z.string().trim().min(1, "Category is required").max(40),
  description: z.string().trim().max(2000), price: z.coerce.number().min(0).max(100000), stock: z.coerce.number().int("Stock must be a whole number").min(0).max(100000),
});
admin.get("/products", wrap(async (_req, res) => res.json({ products: await listAllProducts() })));
admin.get("/products/:id", wrap(async (req, res) => {
  const p = await getProductById(String(req.params.id)); if (!p) return res.status(404).json({ error: "Not found" });
  res.json({ product: p, categories: categoriesOf(await listAllProducts()) });
}));
admin.get("/product-form-meta", wrap(async (_req, res) => res.json({ categories: categoriesOf(await listAllProducts()) })));
admin.post("/products/save", upload.any(), wrap(async (req, res) => {
  const fail = (error: string) => res.json({ error });
  const id = fld(req, "id");
  const p = Schema.safeParse(Object.fromEntries(["name", "sku", "category", "description", "price", "stock"].map((k) => [k, fld(req, k)])));
  if (!p.success) return fail(p.error.issues[0]?.message ?? "Invalid input");
  const d = p.data;
  if (await skuTaken(d.sku, id || undefined)) return fail("That SKU is already used by another product");
  const old = id ? await getProductById(id) : null; const keep = new Set(all(req, "keep"));
  const images = (old?.images ?? []).filter((i) => keep.has(i.src)); const removed = (old?.images ?? []).filter((i) => !keep.has(i.src)).map((i) => i.src);
  const fl = files(req, "images");
  if (images.length + fl.length > MAX_IMAGES) return fail(`At most ${MAX_IMAGES} images per product`);
  const uploaded: string[] = [];
  for (const f of fl) {
    const bytes = new Uint8Array(f.buffer); const v = validateImage(bytes, f.mimetype);
    if (!v.ok) { await deleteProductImages(uploaded); return fail(`${f.originalname}: ${v.error}`); }
    // shrink to max 1200px WebP so pages load fast
    const small = new Uint8Array(await sharp(bytes).rotate().resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toBuffer());
    const src = await uploadProductImage(safeFileName(d.sku, "webp"), small, "image/webp"); uploaded.push(src); images.push({ src, alt: d.name });
  }
  try { await upsertProduct({ id: id || undefined, name: d.name, sku: d.sku, category: d.category, description: d.description, price: d.price, stock: d.stock, images, active: fld(req, "active") === "on" }); }
  catch { await deleteProductImages(uploaded); return fail("Could not save to the database. Nothing was lost; please try again."); }
  await deleteProductImages(removed); // only after the product row is safely saved
  res.json({ ok: true });
}));
admin.delete("/products/:id", wrap(async (req, res) => { await deleteProduct(String(req.params.id)); res.json({ ok: true }); }));
admin.post("/products/:id/stock", wrap(async (req, res) => { const n = Number(req.body?.stock); if (Number.isInteger(n) && n >= 0 && n <= 100000) await setStock(String(req.params.id), n); res.json({ ok: true }); }));

// pages
admin.get("/pages", wrap(async (_req, res) => res.json({ pages: await getAllPages() })));
admin.post("/pages/save", wrap(async (req, res) => {
  const slug = String(req.body?.slug ?? ""); if (!isSlug(slug)) return res.json({ error: "Unknown page" });
  const content = String(req.body?.content ?? "").replace(/\r\n/g, "\n").trim();
  if (content.length > MAX_CONTENT) return res.json({ error: `Too long (max ${MAX_CONTENT} characters)` });
  await savePage(slug, { content, deleted: false }); res.json({ ok: true });
}));
/** "Delete" hides the page and its footer link and keeps the text, so Restore brings it back. */
admin.post("/pages/:slug/delete", wrap(async (req, res) => { const d = PAGE_DEFS.find((p) => p.slug === req.params.slug); if (!d || !d.deletable) return res.json({ error: "This page cannot be deleted" }); await savePage(d.slug, { deleted: true }); res.json({ ok: true }); }));
admin.post("/pages/:slug/restore", wrap(async (req, res) => { const d = PAGE_DEFS.find((p) => p.slug === req.params.slug); if (!d) return res.json({ error: "Unknown page" }); await savePage(d.slug, { deleted: false }); res.json({ ok: true }); }));

// discounts: the admin creates codes worth 10-50% off the cart subtotal (customers type them at checkout)
admin.get("/discounts", wrap(async (_req, res) => res.json({ codes: await listStoreDiscounts() })));
admin.post("/discounts/create", wrap(async (req, res) => {
  const code = normalizeCode(String(req.body?.code ?? "")), pct = Number(req.body?.percent);
  if (!CODE_RE.test(code)) return res.json({ error: "Code: 3-30 letters, numbers, - or _ (e.g. SAVE10)" });
  if (!percentOk(pct)) return res.json({ error: "Discount % must be a whole number from 10 to 50" });
  if (!(await createStoreDiscount(code, pct))) return res.json({ error: "That code already exists" });
  res.json({ ok: true });
}));
admin.post("/discounts/update", wrap(async (req, res) => {
  const code = normalizeCode(String(req.body?.code ?? "")), pct = Number(req.body?.percent);
  if (!CODE_RE.test(code)) return res.json({ error: "Unknown code" });
  if (!percentOk(pct)) return res.json({ error: "Discount % must be a whole number from 10 to 50" });
  if (!(await updateStoreDiscount(code, pct))) return res.json({ error: "Unknown code" });
  res.json({ ok: true });
}));
admin.post("/discounts/delete", wrap(async (req, res) => { const code = normalizeCode(String(req.body?.code ?? "")); if (!CODE_RE.test(code)) return res.json({ error: "Unknown code" }); await deleteStoreDiscount(code); res.json({ ok: true }); }));

// settings
const Url = z.string().trim().max(300).refine((v) => v === "" || /^https:\/\/[^\s]+$/.test(v), "Links must start with https://");
const Fee = z.coerce.number().min(0).max(100);
admin.post("/settings", wrap(async (req, res) => {
  const p = z.object({ pp: Fee, prov: Fee, tg: Url, fb: Url }).safeParse({ pp: req.body?.pp, prov: req.body?.prov, tg: req.body?.tg ?? "", fb: req.body?.fb ?? "" });
  if (!p.success) return res.json({ error: p.error.issues[0]?.message ?? "Invalid input" });
  await saveSettings({ shipPhnomPenhCents: Math.round(p.data.pp * 100), shipProvinceCents: Math.round(p.data.prov * 100), telegramUrl: p.data.tg, facebookUrl: p.data.fb }); res.json({ ok: true });
}));
/** Admin uploads a new logo (or resets to the built-in one). */
admin.post("/settings/logo", upload.any(), wrap(async (req, res) => {
  const old = (await getSettings()).logoUrl; let next = DEFAULT_SETTINGS.logoUrl, uploaded: string | null = null;
  if (fld(req, "reset") !== "on") {
    const f = files(req, "logo")[0]; if (!f) return res.json({ error: "Choose an image file first" });
    const bytes = new Uint8Array(f.buffer); const v = validateImage(bytes, f.mimetype); if (!v.ok) return res.json({ error: v.error });
    const small = new Uint8Array(await sharp(bytes).rotate().resize({ width: 600, height: 300, fit: "inside", withoutEnlargement: true }).webp({ quality: 90 }).toBuffer());
    uploaded = await uploadProductImage(`logo-${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}.webp`, small, "image/webp"); next = uploaded;
  }
  try { await saveSettings({ logoUrl: next }); } catch { if (uploaded) await deleteProductImages([uploaded]); return res.json({ error: "Could not save the logo. Please try again." }); }
  if (old && old !== next && old.includes("/logo-")) await deleteProductImages([old]);
  res.json({ ok: true });
}));
const MAX_BANNERS = 6;
admin.post("/settings/banners", upload.any(), wrap(async (req, res) => {
  const old = (await getSettings()).banners ?? []; const k = all(req, "keep"); const keep = old.filter((b) => k.includes(b)); const fl = files(req, "banners");
  if (keep.length + fl.length > MAX_BANNERS) return res.json({ error: `At most ${MAX_BANNERS} banner images` });
  const uploaded: string[] = [];
  try {
    for (const f of fl) {
      const bytes = new Uint8Array(f.buffer); const v = validateImage(bytes, f.mimetype);
      if (!v.ok) { await deleteProductImages(uploaded); return res.json({ error: `${f.originalname}: ${v.error}` }); }
      const small = new Uint8Array(await sharp(bytes).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer());
      uploaded.push(await uploadProductImage(`banner-${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}.webp`, small, "image/webp"));
    }
    await saveSettings({ banners: [...keep, ...uploaded] });
  } catch { await deleteProductImages(uploaded); return res.json({ error: "Could not save the banners. Please try again." }); }
  await deleteProductImages(old.filter((b) => !keep.includes(b)));
  res.json({ ok: true });
}));

/** Delete one banner image. */
admin.post("/settings/banners/delete", wrap(async (req, res) => {
  const url = String(req.body?.url ?? ""); const old = (await getSettings()).banners ?? [];
  if (!old.includes(url)) return res.json({ error: "Banner not found" });
  try { await saveSettings({ banners: old.filter((b) => b !== url) }); } catch { return res.json({ error: "Could not delete the banner. Please try again." }); }
  await deleteProductImages([url]); res.json({ ok: true });
}));
/** Payment QR: upload a new image, or delete the custom one (falls back to the built-in QR). */
admin.post("/settings/qr", upload.any(), wrap(async (req, res) => {
  const old = (await getSettings()).qrUrl || DEFAULT_SETTINGS.qrUrl; let next = DEFAULT_SETTINGS.qrUrl, uploaded: string | null = null;
  if (fld(req, "reset") !== "on") {
    const f = files(req, "qr")[0]; if (!f) return res.json({ error: "Choose an image file first" });
    const bytes = new Uint8Array(f.buffer); const v = validateImage(bytes, f.mimetype); if (!v.ok) return res.json({ error: v.error });
    const small = new Uint8Array(await sharp(bytes).rotate().resize({ width: 1200, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 92 }).toBuffer());
    uploaded = await uploadProductImage(`payqr-${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}.webp`, small, "image/webp"); next = uploaded;
  }
  try { await saveSettings({ qrUrl: next }); } catch { if (uploaded) await deleteProductImages([uploaded]); return res.json({ error: "Could not save the QR. Please try again." }); }
  if (old !== next && old.includes("/payqr-")) await deleteProductImages([old]);
  res.json({ ok: true });
}));

app.use("/api", api);
app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));

/* ---------------- production: serve the built React app ---------------- */
const dist = path.resolve(process.cwd(), "dist");
if (fs.existsSync(dist)) {
  app.use("/assets", express.static(path.join(dist, "assets"), { immutable: true, maxAge: "1y" }));
  app.use(express.static(dist, { maxAge: "1h", index: false }));
  app.get("*", (_req, res) => { res.set("Cache-Control", "no-cache"); res.sendFile(path.join(dist, "index.html")); });
}
export default app;
