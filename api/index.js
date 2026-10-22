import{createRequire as __cr}from'module';const require=__cr(import.meta.url);

// shared/provinces.ts
var PROVINCES = [
  { en: "Banteay Meanchey", km: "\u1794\u1793\u17D2\u1791\u17B6\u1799\u1798\u17B6\u1793\u1787\u17D0\u1799" },
  { en: "Battambang", km: "\u1794\u17B6\u178F\u17CB\u178A\u17C6\u1794\u1784" },
  { en: "Kampong Cham", km: "\u1780\u17C6\u1796\u1784\u17CB\u1785\u17B6\u1798" },
  { en: "Kampong Chhnang", km: "\u1780\u17C6\u1796\u1784\u17CB\u1786\u17D2\u1793\u17B6\u17C6\u1784" },
  { en: "Kampong Speu", km: "\u1780\u17C6\u1796\u1784\u17CB\u179F\u17D2\u1796\u17BA" },
  { en: "Kampong Thom", km: "\u1780\u17C6\u1796\u1784\u17CB\u1792\u17C6" },
  { en: "Kampot", km: "\u1780\u17C6\u1796\u178F" },
  { en: "Kandal", km: "\u1780\u178E\u17D2\u178A\u17B6\u179B" },
  { en: "Kep", km: "\u1780\u17C2\u1794" },
  { en: "Koh Kong", km: "\u1780\u17C4\u17C7\u1780\u17BB\u1784" },
  { en: "Kratie", km: "\u1780\u17D2\u179A\u1785\u17C1\u17C7" },
  { en: "Mondulkiri", km: "\u1798\u178E\u17D2\u178C\u179B\u1782\u17B7\u179A\u17B8" },
  { en: "Oddar Meanchey", km: "\u17A7\u178F\u17D2\u178F\u179A\u1798\u17B6\u1793\u1787\u17D0\u1799" },
  { en: "Pailin", km: "\u1794\u17C9\u17C3\u179B\u17B7\u1793" },
  { en: "Preah Sihanouk", km: "\u1796\u17D2\u179A\u17C7\u179F\u17B8\u17A0\u1793\u17BB" },
  { en: "Preah Vihear", km: "\u1796\u17D2\u179A\u17C7\u179C\u17B7\u17A0\u17B6\u179A" },
  { en: "Prey Veng", km: "\u1796\u17D2\u179A\u17C3\u179C\u17C2\u1784" },
  { en: "Pursat", km: "\u1796\u17C4\u1792\u17B7\u17CD\u179F\u17B6\u178F\u17CB" },
  { en: "Ratanakiri", km: "\u179A\u178F\u1793\u1782\u17B7\u179A\u17B8" },
  { en: "Siem Reap", km: "\u179F\u17C0\u1798\u179A\u17B6\u1794" },
  { en: "Stung Treng", km: "\u179F\u17D2\u1791\u17B9\u1784\u178F\u17D2\u179A\u17C2\u1784" },
  { en: "Svay Rieng", km: "\u179F\u17D2\u179C\u17B6\u1799\u179A\u17C0\u1784" },
  { en: "Takeo", km: "\u178F\u17B6\u1780\u17C2\u179C" },
  { en: "Tbong Khmum", km: "\u178F\u17D2\u1794\u17BC\u1784\u1783\u17D2\u1798\u17BB\u17C6" }
];
var PROVINCE_NAMES = PROVINCES.map((p) => p.en);

// server/env.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
var env = {
  supabaseUrl: () => process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  serviceKey: () => process.env.SUPABASE_SERVICE_ROLE_KEY
};

// server/app.ts
import express from "express";
import compression from "compression";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { z } from "zod";

// server/lib/db.ts
import { createClient } from "@supabase/supabase-js";
var cached = null;
function db() {
  if (cached) return cached;
  const url = env.supabaseUrl(), key = env.serviceKey();
  if (!url || !key) throw new Error("Database not configured: set VITE_SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY");
  cached = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return cached;
}
function must(r) {
  if (r.error) throw new Error(r.error.message);
  return r.data;
}

// shared/admin.ts
var ADMIN_EMAILS = ["toyscloudy@gmail.com", "seangheng2006@gmail.com"];
var ADMIN_EMAIL = ADMIN_EMAILS[0];
function isAdminEmail(email, verified, allowlist = ADMIN_EMAILS.join(",")) {
  if (!email || !verified) return false;
  return allowlist.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean).includes(email.toLowerCase());
}

// server/lib/auth.ts
async function userFromReq(req) {
  const h = String(req.headers.authorization ?? "");
  const token = h.startsWith("Bearer ") ? h.slice(7).trim() : "";
  if (!token) return null;
  try {
    const { data, error } = await db().auth.getUser(token);
    return error ? null : data.user;
  } catch {
    return null;
  }
}
var adminOrNull = async (req) => {
  const u = await userFromReq(req);
  return u && isAdminEmail(u.email, !!u.email_confirmed_at) ? u : null;
};
async function requireAdmin(req, res, next) {
  const u = await adminOrNull(req);
  if (!u) return res.status(404).json({ error: "Not found" });
  req.admin = u;
  next();
}
async function requireUser(req, res, next) {
  const u = await userFromReq(req);
  if (!u) return res.status(401).json({ error: "Sign in required" });
  req.user = u;
  next();
}
var adminOf = (req) => req.admin;
var userOf = (req) => req.user;

// server/lib/rateLimit.ts
var hits = /* @__PURE__ */ new Map();
function tooMany(key, max = 15, windowMs = 6e4) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5e3) hits.clear();
  return recent.length > max;
}
var clientKey = (req) => String(req.headers["x-forwarded-for"] ?? req.ip ?? "local").split(",")[0].trim();

// shared/products.ts
var FALLBACK_IMG = "data:image/svg+xml;utf8," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'><rect width='400' height='300' fill='#EAF5FF'/><path d='M110 190a40 40 0 0 1 12-78 55 55 0 0 1 106-8 45 45 0 0 1 58 86z' fill='#8ECCFF'/></svg>");
var LOW_STOCK = 5;
var stockStatus = (stock) => stock <= 0 ? "OUT" : stock <= LOW_STOCK ? "LOW" : "OK";
var categoriesOf = (list) => [...new Set(list.map((p) => p.category).filter(Boolean))].sort();
function slugify(s) {
  return s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "product";
}
var toProduct = (r) => ({ id: r.id, slug: r.slug, name: r.name, sku: r.sku, price: Number(r.price), stock: r.stock, category: r.category ?? "", createdAt: r.created_at, description: r.description ?? "", images: r.images ?? [], active: r.active });

// server/lib/productStore.ts
var BUCKET = "product-images";
var isUuid = (s) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
async function listAllProducts() {
  return must(await db().from("products").select("*").order("created_at", { ascending: true })).map(toProduct);
}
async function listProducts() {
  return must(await db().from("products").select("*").eq("active", true).order("created_at", { ascending: false })).map(toProduct);
}
async function getProductById(id) {
  if (!isUuid(id)) return null;
  const r = must(await db().from("products").select("*").eq("id", id).maybeSingle());
  return r ? toProduct(r) : null;
}
async function upsertProduct(p) {
  const fields = { name: p.name, sku: p.sku, category: p.category, description: p.description, price: p.price, stock: p.stock, images: p.images, active: p.active !== false, updated_at: (/* @__PURE__ */ new Date()).toISOString() };
  if (p.id) {
    must(await db().from("products").update(fields).eq("id", p.id).select("id").single());
    return p.id;
  }
  const base = slugify(p.name);
  const taken = new Set(must(await db().from("products").select("slug").like("slug", `${base}%`)).map((x) => x.slug));
  let slug = base, n = 2;
  while (taken.has(slug)) slug = `${base}-${n++}`;
  return must(await db().from("products").insert({ ...fields, slug }).select("id").single()).id;
}
async function skuTaken(sku, exceptId) {
  const rows = must(await db().from("products").select("id").ilike("sku", sku.replace(/[\\%_]/g, "\\$&")));
  return rows.some((r) => r.id !== exceptId);
}
async function deleteProduct(id) {
  const p = await getProductById(id);
  if (!p) return;
  must(await db().from("products").delete().eq("id", id).select("id"));
  await deleteProductImages(p.images.map((i) => i.src));
}
async function setStock(id, stock) {
  if (!isUuid(id)) return;
  must(await db().from("products").update({ stock: Math.max(0, Math.floor(stock)), updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", id).select("id"));
}
async function decrementStock(items2) {
  const r = await db().rpc("decrement_stock", { items: items2 });
  if (r.error) throw new Error(r.error.message.includes("INSUFFICIENT_STOCK") ? "INSUFFICIENT_STOCK" : r.error.message);
}
async function restoreStock(items2) {
  must(await db().rpc("restore_stock", { items: items2 }));
}
async function uploadProductImage(name, bytes, mime) {
  const s = db().storage.from(BUCKET);
  const r = await s.upload(name, bytes, { contentType: mime, upsert: false, cacheControl: "31536000" });
  if (r.error) throw new Error(r.error.message);
  return s.getPublicUrl(name).data.publicUrl;
}
async function deleteProductImages(srcs) {
  const names = srcs.map((s) => s.split("/").pop() ?? "").filter((n) => /^[a-z0-9-]+\.(jpg|png|webp)$/.test(n));
  if (names.length) await db().storage.from(BUCKET).remove(names).catch(() => void 0);
}

// shared/discount.ts
var MIN_PERCENT = 10;
var MAX_PERCENT = 50;
var percentOk = (n) => Number.isInteger(n) && n >= MIN_PERCENT && n <= MAX_PERCENT;
var CODE_RE = /^[A-Z0-9_-]{3,30}$/;
var normalizeCode = (s) => s.trim().toUpperCase();
function subtotalCodeDiscount(subtotalCents, percent) {
  const cents = Math.round(subtotalCents * percent / 100);
  return cents > 0 ? { ok: true, discountCents: cents } : { ok: false, error: "That discount code is not valid for the items in your cart." };
}

// server/lib/discountStore.ts
async function listStoreDiscounts() {
  const rows = must(await db().from("store_discounts").select("code,percent,created_at").order("created_at", { ascending: true }));
  return rows.map((r) => ({ code: r.code, percent: Number(r.percent), createdAt: r.created_at }));
}
async function getStoreDiscountPercent(code) {
  const r = must(await db().from("store_discounts").select("percent").eq("code", code).maybeSingle());
  return r ? Number(r.percent) : null;
}
async function createStoreDiscount(code, percent) {
  if (await getStoreDiscountPercent(code) !== null) return false;
  must(await db().from("store_discounts").insert({ code, percent }).select("code"));
  return true;
}
async function updateStoreDiscount(code, percent) {
  const rows = must(await db().from("store_discounts").update({ percent }).eq("code", code).select("code"));
  return rows.length > 0;
}
async function deleteStoreDiscount(code) {
  must(await db().from("store_discounts").delete().eq("code", code).select("code"));
}
var resolveDiscount = async (code, items2) => {
  const pct = await getStoreDiscountPercent(code);
  if (pct === null) return { ok: false, error: "That discount code is not valid." };
  return subtotalCodeDiscount(items2.reduce((s, i) => s + i.lineCents, 0), pct);
};

// server/lib/store.ts
var d = (c) => c / 100;
var toRow = (o) => ({
  order_number: o.orderNumber,
  customer_name: o.customer.name,
  customer_email: o.customer.email.toLowerCase(),
  customer_phone: o.customer.phone,
  shipping_address: { address: o.customer.address, area: o.area, province: o.province ?? null },
  delivery_instructions: o.customer.notes ?? null,
  subtotal: d(o.subtotalCents),
  discount: d(o.discountCents),
  shipping_fee: d(o.shippingCents),
  total: d(o.totalCents),
  currency: o.currency,
  payment_status: o.paymentStatus,
  created_at: o.createdAt,
  updated_at: (/* @__PURE__ */ new Date()).toISOString(),
  data: o
});
var fromRows = (rows) => (rows ?? []).map((r) => r.data).filter((x) => !!x);
async function saveOrder(o) {
  must(await db().from("orders").insert(toRow(o)).select("order_number").single());
}
async function getOrder(n) {
  const r = await db().from("orders").select("data").eq("order_number", n).maybeSingle();
  return must(r)?.data ?? null;
}
async function updateOrder(n, fn) {
  const o = await getOrder(n);
  if (!o) return null;
  fn(o);
  must(await db().from("orders").update(toRow(o)).eq("order_number", n).select("order_number").single());
  return o;
}
async function listOrdersByEmail(email) {
  const e = email.toLowerCase();
  const results = await Promise.allSettled([
    db().from("orders").select("data").eq("customer_email", e).order("created_at", { ascending: false }),
    db().from("orders").select("data").eq("data->>accountEmail", e).order("created_at", { ascending: false })
  ]);
  const rows = [];
  let failures = 0;
  for (const r of results) {
    if (r.status === "fulfilled" && !r.value.error) rows.push(...fromRows(r.value.data));
    else {
      failures++;
      console.error("[orders by email]", r.status === "rejected" ? r.reason : r.value.error?.message);
    }
  }
  if (failures === results.length) throw new Error("Could not load orders");
  const seen = /* @__PURE__ */ new Set();
  return rows.filter((o) => !seen.has(o.orderNumber) && !!seen.add(o.orderNumber)).sort((x, y) => (y.createdAt ?? "").localeCompare(x.createdAt ?? ""));
}
async function listAllOrders() {
  return fromRows(must(await db().from("orders").select("data").order("created_at", { ascending: false })));
}
async function deleteAllOrders() {
  const rows = must(await db().from("orders").delete().neq("order_number", "").select("order_number"));
  return rows?.length ?? 0;
}

// shared/types.ts
var DEFAULT_SETTINGS = { shipPhnomPenhCents: 150, shipProvinceCents: 200, telegramUrl: "", facebookUrl: "", logoUrl: "/img/logo.png", banners: [], qrUrl: "/img/qr-pay.png" };

// server/lib/settings.ts
var cache = null;
async function getSettings() {
  if (cache && Date.now() - cache.at < 15e3) return cache.v;
  try {
    const r = must(await db().from("site_settings").select("value").eq("key", "main").maybeSingle());
    const v = { ...DEFAULT_SETTINGS, ...r?.value ?? {} };
    if (!Array.isArray(v.banners)) v.banners = [];
    cache = { at: Date.now(), v };
    return v;
  } catch {
    return DEFAULT_SETTINGS;
  }
}
async function saveSettings(patch) {
  cache = null;
  const next = { ...await getSettings(), ...patch };
  must(await db().from("site_settings").upsert({ key: "main", value: next, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).select("key").single());
  cache = null;
}

// shared/pages.ts
var PAGE_DEFS = [
  { slug: "about", title: "About", deletable: false },
  { slug: "contact", title: "Contact", deletable: true }
];
var isSlug = (s) => PAGE_DEFS.some((p) => p.slug === s);
var MAX_CONTENT = 2e4;
var DEFAULT_ABOUT = `## Our story

Cloudy-Toy started with one simple idea: little toys can bring big happiness.

We choose toys that are fun, safe and worth giving, and we deliver them across Cambodia, from Phnom Penh to the provinces.

## What we believe

Every child deserves a moment of joy, and every parent deserves a shop they can trust. That is why we keep our prices clear, our delivery simple, and our team easy to reach on Telegram and Facebook.

## Thank you

Thank you for being part of the Cloudy-Toy story.`;
var DEFAULT_CONTACT = `## Contact our admin

Have a question about an order or a toy? Message our admin and we will reply as soon as we can.

Please include your order number so we can help you faster.`;
var PAGE_DEFAULTS = { about: DEFAULT_ABOUT, contact: DEFAULT_CONTACT };
var resolvePage = (s, slug) => ({ content: s[slug]?.content ?? PAGE_DEFAULTS[slug], deleted: !!s[slug]?.deleted });

// server/lib/pages.ts
async function readStore() {
  try {
    const r = must(await db().from("site_settings").select("value").eq("key", "pages").maybeSingle());
    return r?.value ?? {};
  } catch {
    return {};
  }
}
async function getAllPages() {
  const s = await readStore();
  const out = {};
  for (const d2 of PAGE_DEFS) out[d2.slug] = resolvePage(s, d2.slug);
  return out;
}
async function savePage(slug, patch) {
  const fresh = must(await db().from("site_settings").select("value").eq("key", "pages").maybeSingle())?.value ?? {};
  const next = { ...fresh, [slug]: { ...fresh[slug], ...patch } };
  must(await db().from("site_settings").upsert({ key: "pages", value: next, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).select("key").single());
}

// shared/delivery.ts
var shippingFor = (a, s) => a === "PHNOM_PENH" ? s.shipPhnomPenhCents : s.shipProvinceCents;
var methodAllowed = (m, a) => m === "QR_IMAGE" || m === "COD" && a === "PHNOM_PENH";
var areaLabel = (o) => o.area === "PHNOM_PENH" ? "Phnom Penh" : o.province ? `Province: ${o.province}` : "Province";
var methodLabel = (m) => m === "COD" ? "Pay with delivery" : "QR image payment";

// server/lib/email.ts
var esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var usd = (c) => `$${(c / 100).toFixed(2)}`;
function adminSubject(o) {
  return `[Cloudy-Toy] New Order #${o.orderNumber} - ${o.method === "COD" ? "PAY WITH DELIVERY" : "QR PAYMENT (verify manually)"}`;
}
function adminHtml(o) {
  const note = o.method === "COD" ? `<p style="background:#fff3cd;padding:10px"><b>PAY WITH DELIVERY (Phnom Penh):</b> collect <b>${usd(o.totalCents)}</b> in cash when delivering. Not paid yet.</p>` : `<p style="background:#fff3cd;padding:10px"><b>QR IMAGE PAYMENT, NOT VERIFIED.</b> The customer may have scanned your QR. Check your bank/Bakong app for <b>${usd(o.totalCents)}</b> with order number ${esc(o.orderNumber)}, then mark it paid in Admin &gt; Orders.</p>`;
  const rows = o.items.map((i) => `<tr><td>${esc(i.name)}</td><td>${esc(i.sku)}</td><td>${i.qty}</td><td>${usd(i.unitCents)}</td><td>${usd(i.lineCents)}</td></tr>`).join("");
  return `<h2>New order #${esc(o.orderNumber)}</h2>${note}<p>Created: ${esc(o.createdAt)}<br>Method: ${methodLabel(o.method)}<br>Payment status: ${o.paymentStatus}<br>Reference: ${esc(o.paymentReference)}</p>
<h3>Customer</h3><p>${esc(o.customer.name)}<br>${esc(o.customer.email || "-")}<br>${esc(o.customer.phone)}<br>Facebook: ${esc(o.customer.facebook ?? "-")}<br>Telegram: ${esc(o.customer.telegram ?? "-")}<br>${esc(areaLabel(o))}: ${esc(o.customer.address)}<br>Notes: ${esc(o.customer.notes ?? "-")}</p>
<table border="1" cellpadding="6" cellspacing="0"><tr><th>Item</th><th>SKU</th><th>Qty</th><th>Unit</th><th>Line</th></tr>${rows}</table>
<p>Subtotal ${usd(o.subtotalCents)}<br>Discount ${usd(o.discountCents)}${o.discountCode ? ` (code ${esc(o.discountCode)})` : ""}<br>Delivery ${usd(o.shippingCents)}<br><b>Total ${usd(o.totalCents)} ${o.currency}</b></p>`;
}
var TEST_SENDER = "Cloudy-Toy <onboarding@resend.dev>";
var FREE_MAIL = ["gmail.com", "googlemail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com", "live.com"];
function fromAddress(v) {
  const addr = (v ?? "").trim();
  if (!addr) return TEST_SENDER;
  const domain = (addr.match(/@([^>\s]+)/)?.[1] ?? "").toLowerCase();
  return !domain || FREE_MAIL.includes(domain) ? TEST_SENDER : addr;
}
var adminInbox = () => process.env.ADMIN_NOTIFICATION_EMAIL || ADMIN_EMAIL;
var recipients = () => adminInbox().split(",").map((x) => x.trim()).filter(Boolean);
var plain = (h) => h.replace(/<\/(p|h[1-6]|tr|table)>|<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();
var wait = (ms) => new Promise((r) => setTimeout(r, ms));
var validEmail = (v) => !!v && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(v);
async function deliver(subject, html, o) {
  try {
    const key = process.env.RESEND_API_KEY?.trim();
    if (!key) return { status: "SKIPPED", detail: "Set RESEND_API_KEY in your environment variables" };
    const text = plain(html);
    const send = async (from, to2) => {
      const body = JSON.stringify({
        from, to: to2, subject, html, text,
        ...validEmail(o.customer.email) ? { reply_to: o.customer.email } : {},
        headers: { "X-Entity-Ref-ID": `${o.orderNumber}-${Date.now()}` }
      });
      let detail = "";
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const res = await fetch("https://api.resend.com/emails", { method: "POST", signal: AbortSignal.timeout(4e3), headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body });
          if (res.ok) return { status: "SENT" };
          detail = `Resend HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`;
          if (res.status !== 429 && res.status < 500) break;
        } catch (e) {
          detail = e instanceof Error ? e.message : "network error";
        }
        if (attempt < 2) await wait(500);
      }
      return { status: "FAILED", detail };
    };
    const to = recipients();
    if (!to.length) return { status: "FAILED", detail: "No admin email configured (ADMIN_NOTIFICATION_EMAIL)" };
    const primary = fromAddress(process.env.EMAIL_FROM);
    let r = await send(primary, to);
    if (r.status === "FAILED" && /HTTP (400|401|403|422)/.test(r.detail ?? "")) {
      const first = r.detail;
      if (primary !== TEST_SENDER || to.length > 1) {
        let ok = 0;
        let last = "";
        for (const one of to) {
          const x = await send(TEST_SENDER, [one]);
          if (x.status === "SENT") ok++;
          else last = x.detail ?? "";
        }
        if (ok > 0) return { status: "SENT", detail: `Sent with Resend test sender (${ok}/${to.length} inbox) because the normal sender was rejected (${first}). Verify your domain in Resend to reach every inbox.` };
        r = { status: "FAILED", detail: `${first} | test sender: ${last}` };
      }
    }
    if (r.status === "FAILED") console.error("[email]", o.orderNumber, r.detail);
    return r;
  } catch (e) {
    const detail = e instanceof Error ? e.message : "unexpected email error";
    console.error("[email]", o.orderNumber, detail);
    return { status: "FAILED", detail };
  }
}
var sendAdminEmail = (o) => deliver(adminSubject(o), adminHtml(o), o);
function claimHtml(o) {
  return `<p style="background:#fff3cd;padding:10px"><b>CUSTOMER SAYS THEY PAID (NOT VERIFIED).</b> Check your ABA app for <b>${usd(o.totalCents)}</b> with order number <b>${esc(o.orderNumber)}</b>. Expect a screenshot on Telegram/Facebook. When confirmed, open Admin &gt; Orders &gt; Mark as paid.</p>
<p>Order: <b>${esc(o.orderNumber)}</b><br>Total: <b>${usd(o.totalCents)} ${o.currency}</b><br>Customer: ${esc(o.customer.name)}<br>Phone: ${esc(o.customer.phone)}<br>Email: ${esc(o.customer.email)}<br>${esc(areaLabel(o))}: ${esc(o.customer.address)}<br>Items: ${esc(o.items.map((i) => `${i.name} x${i.qty}`).join(", "))}</p>`;
}
var paidOrderSubject = (o) => `[Cloudy-Toy] New Order #${o.orderNumber} - QR PAYMENT, CUSTOMER SAYS PAID (verify)`;
var proofNote = (o) => o.paymentProof ? `<p style="background:#d1f2d1;padding:10px"><b>Payment screenshot uploaded.</b> Open it in Admin &gt; Transactions (order ${esc(o.orderNumber)}).</p>` : "";
var sendPaidOrderEmail = (o) => deliver(paidOrderSubject(o), claimHtml(o) + proofNote(o) + "<hr>" + adminHtml(o), o);

// server/lib/proofStore.ts
var BUCKET2 = "payment-proofs";
var ready = false;
async function ensureBucket() {
  if (ready) return;
  const r = await db().storage.createBucket(BUCKET2, { public: false, fileSizeLimit: 5 * 1024 * 1024, allowedMimeTypes: ["image/webp"] });
  if (r.error && !/already exists|duplicate/i.test(r.error.message)) throw new Error(r.error.message);
  ready = true;
}
async function uploadProof(orderNumber, bytes) {
  await ensureBucket();
  const path2 = `${orderNumber.toLowerCase()}-${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}.webp`;
  const r = await db().storage.from(BUCKET2).upload(path2, bytes, { contentType: "image/webp", upsert: false });
  if (r.error) throw new Error(r.error.message);
  return path2;
}
async function proofUrls(paths) {
  const out = {};
  const list = [...new Set(paths.filter(Boolean))];
  if (!list.length) return out;
  try {
    const r = await db().storage.from(BUCKET2).createSignedUrls(list, 3600);
    for (const x of r.data ?? []) if (x.path && x.signedUrl) out[x.path] = x.signedUrl;
  } catch {
  }
  return out;
}
async function deleteProofs(paths) {
  const list = paths.filter(Boolean);
  if (list.length) await db().storage.from(BUCKET2).remove(list).catch(() => void 0);
}

// shared/stats.ts
var PP_OFFSET_MS = 7 * 3600 * 1e3;
var dayKey = (iso) => new Date(Date.parse(iso) + PP_OFFSET_MS).toISOString().slice(0, 10);
var stamp = (iso) => new Date(Date.parse(iso) + PP_OFFSET_MS).toISOString().slice(0, 16).replace("T", " ");
var usd2 = (c) => `$${(c / 100).toFixed(2)}`;
function filterOrders(orders, f) {
  const q = (f.q ?? "").trim().toLowerCase();
  return orders.filter((o) => {
    if (f.status && f.status !== "ALL" && o.paymentStatus !== f.status) return false;
    const d2 = dayKey(o.createdAt);
    if (f.from && d2 < f.from) return false;
    if (f.to && d2 > f.to) return false;
    if (q && !`${o.orderNumber} ${o.customer.name} ${o.customer.email} ${o.customer.phone}`.toLowerCase().includes(q)) return false;
    return true;
  });
}
function sortOrders(orders, sort) {
  const a = [...orders];
  if (sort === "low") a.sort((x, y) => x.totalCents - y.totalCents);
  else if (sort === "high") a.sort((x, y) => y.totalCents - x.totalCents);
  else if (sort === "oldest") a.sort((x, y) => x.createdAt.localeCompare(y.createdAt));
  else a.sort((x, y) => y.createdAt.localeCompare(x.createdAt));
  return a;
}

// server/lib/exports.ts
var area = (o) => areaLabel(o);
var items = (o) => o.items.map((i) => `${i.name} x${i.qty}`).join("; ");
var qty = (o) => o.items.reduce((s, i) => s + i.qty, 0);
function ordersDataset(rows) {
  const csv = [
    { header: "Order number", get: (o) => o.orderNumber },
    { header: "Date (Phnom Penh)", get: (o) => stamp(o.createdAt) },
    { header: "Customer", get: (o) => o.customer.name },
    { header: "Email", get: (o) => o.customer.email },
    { header: "Phone", get: (o) => o.customer.phone },
    { header: "Area", get: area },
    { header: "Address", get: (o) => o.customer.address },
    { header: "Payment method", get: (o) => methodLabel(o.method) },
    { header: "Payment status", get: (o) => o.paymentStatus },
    { header: "Items", get: items },
    { header: "Item count", get: qty },
    { header: "Subtotal USD", get: (o) => (o.subtotalCents / 100).toFixed(2) },
    { header: "Discount USD", get: (o) => (o.discountCents / 100).toFixed(2) },
    { header: "Discount code", get: (o) => o.discountCode ?? "" },
    { header: "Delivery USD", get: (o) => (o.shippingCents / 100).toFixed(2) },
    { header: "Total USD", get: (o) => (o.totalCents / 100).toFixed(2) },
    { header: "Paid at", get: (o) => o.paidAt ? stamp(o.paidAt) : "" },
    { header: "Confirmed by", get: (o) => o.paidManuallyBy ?? "" },
    { header: "Reference", get: (o) => o.paymentReference }
  ];
  return {
    name: "orders",
    title: "Orders",
    csv,
    rows,
    pdf: [{ header: "Order #", chars: 18 }, { header: "Date", chars: 16 }, { header: "Customer", chars: 20 }, { header: "Phone", chars: 14 }, { header: "Area", chars: 10 }, { header: "Method", chars: 16 }, { header: "Status", chars: 8 }, { header: "Qty", chars: 4, right: true }, { header: "Total", chars: 10, right: true }],
    pdfRow: (o) => [o.orderNumber, stamp(o.createdAt), o.customer.name, o.customer.phone, area(o), methodLabel(o.method), o.paymentStatus, String(qty(o)), usd2(o.totalCents)]
  };
}
function transactionsDataset(rows) {
  const csv = [
    { header: "Order number", get: (o) => o.orderNumber },
    { header: "Date (Phnom Penh)", get: (o) => stamp(o.createdAt) },
    { header: "Customer", get: (o) => o.customer.name },
    { header: "Payment method", get: (o) => methodLabel(o.method) },
    { header: "Status", get: (o) => o.paymentStatus },
    { header: "Subtotal USD", get: (o) => (o.subtotalCents / 100).toFixed(2) },
    { header: "Delivery USD", get: (o) => (o.shippingCents / 100).toFixed(2) },
    { header: "Total USD", get: (o) => (o.totalCents / 100).toFixed(2) },
    { header: "Reference", get: (o) => o.paymentReference }
  ];
  return {
    name: "transactions",
    title: "Transactions",
    csv,
    rows,
    pdf: [{ header: "Order #", chars: 18 }, { header: "Date", chars: 16 }, { header: "Customer", chars: 22 }, { header: "Method", chars: 16 }, { header: "Status", chars: 8 }, { header: "Subtotal", chars: 10, right: true }, { header: "Delivery", chars: 10, right: true }, { header: "Total", chars: 10, right: true }],
    pdfRow: (o) => [o.orderNumber, stamp(o.createdAt), o.customer.name, methodLabel(o.method), o.paymentStatus, usd2(o.subtotalCents), usd2(o.shippingCents), usd2(o.totalCents)]
  };
}
var price = (p) => p.salePrice ?? p.price;
function productsDataset(rows) {
  const csv = [
    { header: "SKU", get: (p) => p.sku },
    { header: "Name", get: (p) => p.name },
    { header: "Category", get: (p) => p.category },
    { header: "Price USD", get: (p) => p.price.toFixed(2) },
    { header: "Sale price USD", get: (p) => p.salePrice != null ? p.salePrice.toFixed(2) : "" },
    { header: "Stock", get: (p) => p.stock },
    { header: "Stock status", get: (p) => stockStatus(p.stock) },
    { header: "Visible in shop", get: (p) => p.active === false ? "No" : "Yes" },
    { header: "Description", get: (p) => p.description }
  ];
  return {
    name: "products",
    title: "Products",
    csv,
    rows,
    pdf: [{ header: "SKU", chars: 12 }, { header: "Name", chars: 34 }, { header: "Category", chars: 12 }, { header: "Price", chars: 9, right: true }, { header: "Sale", chars: 9, right: true }, { header: "Stock", chars: 6, right: true }, { header: "Level", chars: 5 }, { header: "Shown", chars: 5 }],
    pdfRow: (p) => [p.sku, p.name, p.category, `$${p.price.toFixed(2)}`, p.salePrice != null ? `$${p.salePrice.toFixed(2)}` : "-", String(p.stock), stockStatus(p.stock), p.active === false ? "No" : "Yes"]
  };
}
function stockDataset(rows) {
  const csv = [
    { header: "SKU", get: (p) => p.sku },
    { header: "Name", get: (p) => p.name },
    { header: "Category", get: (p) => p.category },
    { header: "Stock", get: (p) => p.stock },
    { header: "Level", get: (p) => stockStatus(p.stock) },
    { header: "Unit price USD", get: (p) => price(p).toFixed(2) },
    { header: "Stock value USD", get: (p) => (price(p) * p.stock).toFixed(2) }
  ];
  return {
    name: "stock",
    title: "Stock report",
    csv,
    rows,
    pdf: [{ header: "SKU", chars: 12 }, { header: "Name", chars: 40 }, { header: "Category", chars: 12 }, { header: "Stock", chars: 6, right: true }, { header: "Level", chars: 6 }, { header: "Unit", chars: 9, right: true }, { header: "Value", chars: 11, right: true }],
    pdfRow: (p) => [p.sku, p.name, p.category, String(p.stock), stockStatus(p.stock), `$${price(p).toFixed(2)}`, `$${(price(p) * p.stock).toFixed(2)}`]
  };
}

// shared/csv.ts
var safe = (v) => typeof v === "number" ? String(v) : /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
var quote = (s) => `"${s.replace(/"/g, '""')}"`;
function toCsv(rows, cols) {
  const lines = [cols.map((c) => quote(c.header)).join(",")];
  for (const r of rows) lines.push(cols.map((c) => quote(safe(c.get(r)))).join(","));
  return "\uFEFF" + lines.join("\r\n") + "\r\n";
}

// server/lib/pdf.ts
var W = 842;
var H = 595;
var M = 30;
var FS = 8;
var LH = 11;
var TOP = 512;
var BOTTOM = 40;
var ROWS_PER_PAGE = Math.floor((TOP - BOTTOM) / LH);
var clean = (s) => s.replace(/[\r\n\t]+/g, " ").replace(/[^\x20-\x7e\xa0-\xff]/g, "?");
var esc2 = (s) => clean(s).replace(/[\\()]/g, (c) => "\\" + c).replace(/[\x80-\xff]/g, (c) => "\\" + c.charCodeAt(0).toString(8).padStart(3, "0"));
var fit = (s, n, right) => {
  let t = clean(s);
  if (t.length > n) t = t.slice(0, Math.max(1, n - 1)) + ".";
  return right ? t.padStart(n) : t.padEnd(n);
};
function buildPdf(o) {
  const line = (cells) => cells.map((c, i) => fit(c, o.cols[i].chars, o.cols[i].right)).join("  ");
  const header = line(o.cols.map((c) => c.header));
  const pages = [];
  for (let i = 0; i < o.rows.length || i === 0; i += ROWS_PER_PAGE) pages.push(o.rows.slice(i, i + ROWS_PER_PAGE));
  const objs = [];
  const add = (s) => {
    objs.push(s);
    return objs.length;
  };
  add("<< /Type /Catalog /Pages 2 0 R >>");
  add("PAGES");
  add("<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>");
  add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
  add("<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold /Encoding /WinAnsiEncoding >>");
  const kids = [];
  pages.forEach((rows, pi) => {
    let c = `BT /F2 14 Tf ${M} 560 Td (${esc2(o.title)}) Tj ET
`;
    if (o.subtitle) c += `BT /F1 8 Tf ${M} 546 Td (${esc2(o.subtitle)}) Tj ET
`;
    c += `BT /F3 ${FS} Tf ${M} 526 Td (${esc2(header)}) Tj ET
0.5 w ${M} 522 m ${W - M} 522 l S
`;
    c += `BT /F1 ${FS} Tf ${LH} TL ${M} ${TOP} Td
` + rows.map((r) => `(${esc2(line(r))}) '`).join("\n") + `
ET
`;
    c += `BT /F1 7 Tf ${M} 20 Td (${esc2(`Page ${pi + 1} of ${pages.length}  -  Cloudy-Toy`)}) Tj ET
`;
    const content = add(`<< /Length ${c.length} >>
stream
${c}endstream`);
    kids.push(add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents ${content} 0 R >>`));
  });
  objs[1] = `<< /Type /Pages /Count ${kids.length} /Kids [${kids.map((k) => `${k} 0 R`).join(" ")}] >>`;
  let out = "%PDF-1.4\n";
  const offsets = [];
  objs.forEach((b, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj
${b}
endobj
`;
  });
  const xref = out.length;
  out += `xref
0 ${objs.length + 1}
0000000000 65535 f 
` + offsets.map((x) => `${String(x).padStart(10, "0")} 00000 n 
`).join("") + `trailer
<< /Size ${objs.length + 1} /Root 1 0 R >>
startxref
${xref}
%%EOF`;
  return Buffer.from(out, "latin1");
}

// shared/pricing.ts
function computeTotals(lines, catalog, shippingCents, discountCents = 0) {
  if (!lines.length) throw new Error("EMPTY_CART");
  let subtotal = 0;
  const items2 = lines.map((l) => {
    const p = catalog.get(l.productId);
    if (!p || !p.active) throw new Error("PRODUCT_UNAVAILABLE");
    if (!Number.isInteger(l.qty) || l.qty < 1 || l.qty > 99) throw new Error("INVALID_QTY");
    if (l.qty > p.stock && !p.backorder) throw new Error("INSUFFICIENT_STOCK");
    const unit = p.saleCents != null && p.saleCents < p.priceCents ? p.saleCents : p.priceCents;
    subtotal += unit * l.qty;
    return { productId: p.id, name: p.name, qty: l.qty, unitCents: unit, lineCents: unit * l.qty };
  });
  const discount = Math.min(Math.max(discountCents, 0), subtotal);
  return { items: items2, subtotalCents: subtotal, discountCents: discount, shippingCents, totalCents: subtotal - discount + shippingCents };
}

// shared/images.ts
var MAX_BYTES = 5 * 1024 * 1024;
var ALLOWED = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
function sniff(b) {
  if (b.length > 11 && b[0] === 255 && b[1] === 216 && b[2] === 255) return "image/jpeg";
  if (b.length > 8 && b[0] === 137 && b[1] === 80 && b[2] === 78 && b[3] === 71) return "image/png";
  if (b.length > 12 && String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP") return "image/webp";
  return null;
}
function validateImage(bytes, declaredMime) {
  if (bytes.length === 0) return { ok: false, error: "Empty file" };
  if (bytes.length > MAX_BYTES) return { ok: false, error: "File larger than 5 MB" };
  const real = sniff(bytes);
  if (!real) return { ok: false, error: "Unsupported image type. Use JPEG, PNG or WebP." };
  if (real !== declaredMime) return { ok: false, error: "File content does not match its type" };
  return { ok: true, mime: real, ext: ALLOWED[real] };
}
function safeFileName(sku, ext, rand = crypto.randomUUID().replace(/-/g, "").slice(0, 6)) {
  const s = sku.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 32) || "product";
  return `${s}-${rand}.${ext}`;
}

// shared/orders.ts
var PAY = { PENDING: ["PAID", "FAILED", "EXPIRED"], PAID: ["REFUNDED"], FAILED: [], EXPIRED: ["PAID"], REFUNDED: [] };
var canPay = (a, b) => PAY[a].includes(b);

// server/app.ts
var app = express();
app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(compression());
app.use(express.json({ limit: "1mb" }));
var upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 6 * 1024 * 1024, files: 8 } });
var api = express.Router();
api.get("/health", (_req, res) => res.json({ ok: true, db: !!(process.env.SUPABASE_SERVICE_ROLE_KEY && (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)) }));
var hint = (m) => /relation .* does not exist|could not find the table|schema cache|column .* does not exist|function .* does not exist|Could not find the function/i.test(m) ? "Database tables are missing or out of date. Open Supabase > SQL Editor, paste supabase/setup_all.sql and click Run (it is safe to run again), then reload." : /not configured|SUPABASE_SERVICE_ROLE_KEY/i.test(m) ? "SUPABASE_SERVICE_ROLE_KEY (or the Supabase URL) is missing in .env.local. Add it and restart npm run dev." : /invalid api key|jwt|apikey/i.test(m) ? "The Supabase key is wrong. Copy the service_role / secret key from Supabase > Project Settings > API into SUPABASE_SERVICE_ROLE_KEY." : /fetch failed|ENOTFOUND|ECONNREFUSED|network/i.test(m) ? "The server cannot reach Supabase. Check VITE_SUPABASE_URL and your internet connection." : "";
var wrap = (fn) => (req, res) => {
  fn(req, res).catch((e) => {
    console.error("[api]", req.path, e);
    const msg = e instanceof Error ? e.message : String(e);
    const body = req.path.startsWith("/admin") ? { error: "Server error", detail: msg, hint: hint(msg) } : { error: "Server error" };
    if (!res.headersSent) res.status(500).json(body);
  });
};
var files = (req, name) => (req.files ?? []).filter((f) => f.fieldname === name && f.size > 0);
var fld = (req, k) => String(req.body?.[k] ?? "");
var all = (req, k) => {
  const v = req.body?.[k];
  return v === void 0 ? [] : Array.isArray(v) ? v.map(String) : [String(v)];
};
var catalogOf = (products) => new Map(products.map((p) => [p.id, { id: p.id, name: p.name, priceCents: Math.round(p.price * 100), saleCents: p.salePrice ? Math.round(p.salePrice * 100) : null, stock: p.stock, active: true }]));
var Body = z.object({
  customer: z.object({ name: z.string().trim().min(2).max(100), email: z.union([z.literal(""), z.string().trim().email().max(200)]).optional().transform((v) => v ?? ""), phone: z.string().trim().min(6).max(30), address: z.string().trim().min(5).max(400), notes: z.string().trim().max(300).optional(), facebook: z.string().trim().max(100).optional(), telegram: z.string().trim().max(100).optional() }),
  lines: z.array(z.object({ productId: z.string(), qty: z.number().int().min(1).max(99) })).min(1).max(50),
  area: z.enum(["PHNOM_PENH", "PROVINCE"]),
  province: z.enum(PROVINCE_NAMES).optional(),
  method: z.enum(["COD", "QR_IMAGE"]),
  code: z.string().trim().max(40).optional()
});
var LABELS = { name: "Full name (at least 2 characters)", email: "Email (a valid address)", phone: "Phone (at least 6 digits)", address: "Delivery address (5 to 400 characters)", notes: "Delivery instructions (max 300 characters)", area: "Delivery area", method: "Payment method" };
api.post("/checkout", wrap(async (req, res) => {
  const raw = req.body;
  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    const bad = [...new Set(parsed.error.issues.map((i) => {
      const k = String(i.path[0] === "customer" ? i.path[1] : i.path[0]);
      const v = raw?.customer?.[k];
      return (LABELS[k] ?? "Cart items") + (i.path[0] === "customer" ? `, ${typeof v === "string" ? `you entered ${v.trim().length}` : "nothing received"}` : "");
    }))];
    return res.status(400).json({ error: `Please check: ${bad.join("; ")}.` });
  }
  const { customer, lines, area: area2, method } = parsed.data;
  const codeIn = normalizeCode(parsed.data.code ?? "");
  if (codeIn && tooMany(`c:${clientKey(req)}`)) return res.status(429).json({ error: "Too many tries. Please wait a minute." });
  if (codeIn && !CODE_RE.test(codeIn)) return res.status(400).json({ error: "That discount code is not valid." });
  if (area2 === "PROVINCE" && !parsed.data.province) return res.status(400).json({ error: "Please choose your province." });
  if (!methodAllowed(method, area2)) return res.status(400).json({ error: "Pay with delivery is only available in Phnom Penh." });
  const [settings, products, acct] = await Promise.all([getSettings(), listProducts(), userFromReq(req)]);
  const catalog = catalogOf(products);
  let usedCode;
  try {
    const ship = shippingFor(area2, settings);
    let discount = 0;
    if (codeIn) {
      const t0 = computeTotals(lines, catalog, ship);
      const ev = await resolveDiscount(codeIn, t0.items);
      if (!ev.ok) return res.status(400).json({ error: ev.error });
      usedCode = codeIn;
      discount = ev.discountCents;
    }
    const t = computeTotals(lines, catalog, ship, discount);
    const orderNumber = `CT-${(/* @__PURE__ */ new Date()).toISOString().slice(2, 10).replace(/-/g, "")}-${crypto.randomUUID().slice(0, 5).toUpperCase()}`;
    const order = {
      orderNumber,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      area: area2,
      ...area2 === "PROVINCE" ? { province: parsed.data.province } : {},
      method,
      customer,
      items: t.items.map((i) => ({ productId: i.productId, sku: products.find((p) => p.id === i.productId).sku, name: i.name, qty: i.qty, unitCents: i.unitCents, lineCents: i.lineCents })),
      subtotalCents: t.subtotalCents,
      discountCents: t.discountCents,
      shippingCents: t.shippingCents,
      totalCents: t.totalCents,
      currency: "USD",
      ...usedCode ? { discountCode: usedCode } : {},
      ...acct?.email ? { accountEmail: acct.email.toLowerCase() } : {},
      paymentStatus: "PENDING",
      paymentReference: `PAY-${orderNumber}`,
      email: { status: "NONE", attempts: 0 }
    };
    const lines2 = t.items.map((i) => ({ productId: i.productId, qty: i.qty }));
    await decrementStock(lines2);
    try {
      await saveOrder(order);
    } catch (e) {
      await restoreStock(lines2);
      throw e;
    }
    try {
      const r = await sendAdminEmail(order);
      await updateOrder(orderNumber, (x) => {
        x.email = { status: r.status, detail: r.detail, attempts: 1 };
      });
    } catch (e) {
      console.error("[checkout email]", orderNumber, e);
    }
    return res.json({ orderNumber });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    return res.status(409).json({ error: msg === "INSUFFICIENT_STOCK" ? "An item is out of stock or exceeds available stock." : "Could not place the order." });
  }
}));
api.post("/discount/validate", wrap(async (req, res) => {
  if (tooMany(`v:${clientKey(req)}`)) return res.status(429).json({ error: "Too many tries. Please wait a minute." });
  const b = z.object({ code: z.string().max(40), lines: z.array(z.object({ productId: z.string(), qty: z.number().int().min(1).max(99) })).min(1).max(50) }).safeParse(req.body);
  if (!b.success) return res.status(400).json({ error: "Bad request" });
  const code = normalizeCode(b.data.code);
  if (!CODE_RE.test(code)) return res.status(400).json({ error: "That discount code is not valid." });
  try {
    const t = computeTotals(b.data.lines, catalogOf(await listProducts()), 0);
    const ev = await resolveDiscount(code, t.items);
    return ev.ok ? res.json({ code, discountCents: ev.discountCents }) : res.status(400).json({ error: ev.error });
  } catch {
    return res.status(400).json({ error: "Could not check the code right now." });
  }
}));
api.get("/orders/:n", wrap(async (req, res) => {
  const o = await getOrder(String(req.params.n));
  return o ? res.json({ order: o }) : res.status(404).json({ error: "Not found" });
}));
api.post("/payment/claim", wrap(async (req, res) => {
  const n = typeof req.body?.orderNumber === "string" ? req.body.orderNumber.trim() : "";
  if (!/^CT-[0-9]{6}-[A-Z0-9]{5}$/.test(n)) return res.status(400).json({ error: "Invalid order" });
  if (tooMany(`claim:${clientKey(req)}`, 10)) return res.status(429).json({ error: "Too many tries. Please wait a minute." });
  const o = await getOrder(n);
  if (!o || o.method !== "QR_IMAGE") return res.status(404).json({ error: "Order not found" });
  if (o.paymentStatus === "PENDING" && !o.paymentProof) return res.status(400).json({ error: "Please upload your payment screenshot first." });
  if (o.paymentStatus === "PAID" || o.claimEmail?.status === "SENT") return res.json({ ok: true, already: true, status: "SENT" });
  const r = await sendPaidOrderEmail(o);
  await updateOrder(n, (x) => {
    x.claimedPaidAt = x.claimedPaidAt ?? (/* @__PURE__ */ new Date()).toISOString();
    x.claimEmail = r;
    x.email = r.status !== "SENT" && x.email.status === "SENT" ? { ...x.email, attempts: x.email.attempts + 1 } : { status: r.status, detail: r.detail, attempts: x.email.attempts + 1 };
  });
  if (r.status !== "SENT") console.error("[claim email]", n, r.status, r.detail);
  return res.json({ ok: r.status === "SENT", status: r.status, detail: r.detail });
}));
api.post("/payment/proof", upload.any(), wrap(async (req, res) => {
  const n = fld(req, "orderNumber").trim();
  const f = files(req, "proof")[0];
  if (!/^CT-[0-9]{6}-[A-Z0-9]{5}$/.test(n) || !f) return res.status(400).json({ error: "Choose your payment screenshot first." });
  if (tooMany(`proof:${clientKey(req)}`, 10)) return res.status(429).json({ error: "Too many tries. Please wait a minute." });
  const o = await getOrder(n);
  if (!o || o.method !== "QR_IMAGE" || o.paymentStatus !== "PENDING") return res.status(404).json({ error: "Order not found." });
  const bytes = new Uint8Array(f.buffer);
  const v = validateImage(bytes, f.mimetype);
  if (!v.ok) return res.status(400).json({ error: v.error });
  try {
    const small = new Uint8Array(await sharp(bytes).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 85 }).toBuffer());
    const p = await uploadProof(n, small);
    const oldPath = o.paymentProof;
    await updateOrder(n, (x) => {
      x.paymentProof = p;
      x.proofAt = (/* @__PURE__ */ new Date()).toISOString();
    });
    if (oldPath) await deleteProofs([oldPath]);
    return res.json({ ok: true });
  } catch (e) {
    console.error("[payment proof]", n, e);
    return res.status(500).json({ error: "Could not upload the screenshot. Please try again." });
  }
}));
api.get("/account/orders", requireUser, wrap(async (req, res) => {
  const u = userOf(req);
  res.json({ orders: u.email ? await listOrdersByEmail(u.email) : [] });
}));
var admin = express.Router();
admin.use(requireAdmin);
api.use("/admin", admin);
admin.get("/me", (req, res) => res.json({ email: adminOf(req).email }));
admin.get("/dashboard", wrap(async (_req, res) => {
  const [orders, products] = await Promise.all([listAllOrders(), listAllProducts()]);
  res.json({ orders, products });
}));
admin.get("/orders", wrap(async (req, res) => {
  const orders = await listAllOrders();
  res.json({ orders, proofs: req.query.proofs ? await proofUrls(orders.map((o) => o.paymentProof ?? "")) : {} });
}));
admin.post("/orders/:n/mark-paid", wrap(async (req, res) => {
  const o = await getOrder(String(req.params.n));
  if (!o || !canPay(o.paymentStatus, "PAID")) return res.json({ ok: false });
  await updateOrder(o.orderNumber, (x) => {
    x.paymentStatus = "PAID";
    x.paidAt = (/* @__PURE__ */ new Date()).toISOString();
    x.paidManuallyBy = adminOf(req).email ?? "admin";
  });
  res.json({ ok: true });
}));
admin.post("/orders/:n/resend-email", wrap(async (req, res) => {
  const o = await getOrder(String(req.params.n));
  if (!o) return res.status(404).json({ ok: false });
  const r = o.claimedPaidAt ? await sendPaidOrderEmail(o) : await sendAdminEmail(o);
  await updateOrder(o.orderNumber, (x) => {
    x.email = { status: r.status, detail: r.detail, attempts: x.email.attempts + 1 };
  });
  res.json({ ok: r.status === "SENT", status: r.status, detail: r.detail });
}));
admin.post("/transactions/clear", wrap(async (_req, res) => {
  try {
    const proofs = (await listAllOrders()).map((o) => o.paymentProof ?? "");
    await deleteAllOrders();
    await deleteProofs(proofs);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Could not clear the transactions. Please try again." });
  }
}));
admin.get("/export", wrap(async (req, res) => {
  const u = req.query;
  const type = u.type ?? "orders", format = u.format === "pdf" ? "pdf" : "csv";
  const f = { status: u.status, from: u.from, to: u.to, q: u.q };
  let ds;
  if (type === "orders") ds = ordersDataset(sortOrders(filterOrders(await listAllOrders(), f), u.sort ?? "new"));
  else if (type === "transactions") ds = transactionsDataset(sortOrders(filterOrders(await listAllOrders(), f), u.sort ?? "high"));
  else if (type === "products") ds = productsDataset(await listAllProducts());
  else if (type === "stock") ds = stockDataset([...await listAllProducts()].sort((a, b) => a.stock - b.stock));
  else return res.status(400).send("Unknown export type");
  const date = new Date(Date.now() + 7 * 36e5).toISOString().slice(0, 10);
  res.set({ "Content-Disposition": `attachment; filename="cloudy-toy-${ds.name}-${date}.${format}"`, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  if (format === "csv") return res.type("text/csv; charset=utf-8").send(toCsv(ds.rows, ds.csv));
  res.type("application/pdf").send(buildPdf({ title: `Cloudy-Toy - ${ds.title}`, subtitle: `Generated ${date} (Phnom Penh time) - ${ds.rows.length} rows`, cols: ds.pdf, rows: ds.rows.map(ds.pdfRow) }));
}));
var MAX_IMAGES = 6;
var Schema = z.object({
  name: z.string().trim().min(2, "Name needs at least 2 characters").max(120),
  sku: z.string().trim().min(2, "SKU needs at least 2 characters").max(40).regex(/^[A-Za-z0-9_#*-]+$/, "SKU: letters, numbers and the symbols # * _ - only (no spaces)"),
  category: z.string().trim().min(1, "Category is required").max(40),
  description: z.string().trim().max(2e3),
  price: z.coerce.number().min(0).max(1e5),
  stock: z.coerce.number().int("Stock must be a whole number").min(0).max(1e5)
});
admin.get("/products", wrap(async (_req, res) => res.json({ products: await listAllProducts() })));
admin.get("/products/:id", wrap(async (req, res) => {
  const p = await getProductById(String(req.params.id));
  if (!p) return res.status(404).json({ error: "Not found" });
  res.json({ product: p, categories: categoriesOf(await listAllProducts()) });
}));
admin.get("/product-form-meta", wrap(async (_req, res) => res.json({ categories: categoriesOf(await listAllProducts()) })));
admin.post("/products/save", upload.any(), wrap(async (req, res) => {
  const fail = (error) => res.json({ error });
  const id = fld(req, "id");
  const p = Schema.safeParse(Object.fromEntries(["name", "sku", "category", "description", "price", "stock"].map((k) => [k, fld(req, k)])));
  if (!p.success) return fail(p.error.issues[0]?.message ?? "Invalid input");
  const d2 = p.data;
  if (await skuTaken(d2.sku, id || void 0)) return fail("That SKU is already used by another product");
  const old = id ? await getProductById(id) : null;
  const keep = new Set(all(req, "keep"));
  const images = (old?.images ?? []).filter((i) => keep.has(i.src));
  const removed = (old?.images ?? []).filter((i) => !keep.has(i.src)).map((i) => i.src);
  const fl = files(req, "images");
  if (images.length + fl.length > MAX_IMAGES) return fail(`At most ${MAX_IMAGES} images per product`);
  const uploaded = [];
  for (const f of fl) {
    const bytes = new Uint8Array(f.buffer);
    const v = validateImage(bytes, f.mimetype);
    if (!v.ok) {
      await deleteProductImages(uploaded);
      return fail(`${f.originalname}: ${v.error}`);
    }
    const small = new Uint8Array(await sharp(bytes).rotate().resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toBuffer());
    const src = await uploadProductImage(safeFileName(d2.sku, "webp"), small, "image/webp");
    uploaded.push(src);
    images.push({ src, alt: d2.name });
  }
  try {
    await upsertProduct({ id: id || void 0, name: d2.name, sku: d2.sku, category: d2.category, description: d2.description, price: d2.price, stock: d2.stock, images, active: fld(req, "active") === "on" });
  } catch {
    await deleteProductImages(uploaded);
    return fail("Could not save to the database. Nothing was lost; please try again.");
  }
  await deleteProductImages(removed);
  res.json({ ok: true });
}));
admin.delete("/products/:id", wrap(async (req, res) => {
  await deleteProduct(String(req.params.id));
  res.json({ ok: true });
}));
admin.post("/products/:id/stock", wrap(async (req, res) => {
  const n = Number(req.body?.stock);
  if (Number.isInteger(n) && n >= 0 && n <= 1e5) await setStock(String(req.params.id), n);
  res.json({ ok: true });
}));
admin.get("/pages", wrap(async (_req, res) => res.json({ pages: await getAllPages() })));
admin.post("/pages/save", wrap(async (req, res) => {
  const slug = String(req.body?.slug ?? "");
  if (!isSlug(slug)) return res.json({ error: "Unknown page" });
  const content = String(req.body?.content ?? "").replace(/\r\n/g, "\n").trim();
  if (content.length > MAX_CONTENT) return res.json({ error: `Too long (max ${MAX_CONTENT} characters)` });
  await savePage(slug, { content, deleted: false });
  res.json({ ok: true });
}));
admin.post("/pages/:slug/delete", wrap(async (req, res) => {
  const d2 = PAGE_DEFS.find((p) => p.slug === req.params.slug);
  if (!d2 || !d2.deletable) return res.json({ error: "This page cannot be deleted" });
  await savePage(d2.slug, { deleted: true });
  res.json({ ok: true });
}));
admin.post("/pages/:slug/restore", wrap(async (req, res) => {
  const d2 = PAGE_DEFS.find((p) => p.slug === req.params.slug);
  if (!d2) return res.json({ error: "Unknown page" });
  await savePage(d2.slug, { deleted: false });
  res.json({ ok: true });
}));
admin.get("/discounts", wrap(async (_req, res) => res.json({ codes: await listStoreDiscounts() })));
admin.post("/discounts/create", wrap(async (req, res) => {
  const code = normalizeCode(String(req.body?.code ?? "")), pct = Number(req.body?.percent);
  if (!CODE_RE.test(code)) return res.json({ error: "Code: 3-30 letters, numbers, - or _ (e.g. SAVE10)" });
  if (!percentOk(pct)) return res.json({ error: "Discount % must be a whole number from 10 to 50" });
  if (!await createStoreDiscount(code, pct)) return res.json({ error: "That code already exists" });
  res.json({ ok: true });
}));
admin.post("/discounts/update", wrap(async (req, res) => {
  const code = normalizeCode(String(req.body?.code ?? "")), pct = Number(req.body?.percent);
  if (!CODE_RE.test(code)) return res.json({ error: "Unknown code" });
  if (!percentOk(pct)) return res.json({ error: "Discount % must be a whole number from 10 to 50" });
  if (!await updateStoreDiscount(code, pct)) return res.json({ error: "Unknown code" });
  res.json({ ok: true });
}));
admin.post("/discounts/delete", wrap(async (req, res) => {
  const code = normalizeCode(String(req.body?.code ?? ""));
  if (!CODE_RE.test(code)) return res.json({ error: "Unknown code" });
  await deleteStoreDiscount(code);
  res.json({ ok: true });
}));
var Url = z.string().trim().max(300).refine((v) => v === "" || /^https:\/\/[^\s]+$/.test(v), "Links must start with https://");
var Fee = z.coerce.number().min(0).max(100);
admin.post("/settings", wrap(async (req, res) => {
  const p = z.object({ pp: Fee, prov: Fee, tg: Url, fb: Url }).safeParse({ pp: req.body?.pp, prov: req.body?.prov, tg: req.body?.tg ?? "", fb: req.body?.fb ?? "" });
  if (!p.success) return res.json({ error: p.error.issues[0]?.message ?? "Invalid input" });
  await saveSettings({ shipPhnomPenhCents: Math.round(p.data.pp * 100), shipProvinceCents: Math.round(p.data.prov * 100), telegramUrl: p.data.tg, facebookUrl: p.data.fb });
  res.json({ ok: true });
}));
admin.post("/settings/logo", upload.any(), wrap(async (req, res) => {
  const old = (await getSettings()).logoUrl;
  let next = DEFAULT_SETTINGS.logoUrl, uploaded = null;
  if (fld(req, "reset") !== "on") {
    const f = files(req, "logo")[0];
    if (!f) return res.json({ error: "Choose an image file first" });
    const bytes = new Uint8Array(f.buffer);
    const v = validateImage(bytes, f.mimetype);
    if (!v.ok) return res.json({ error: v.error });
    const small = new Uint8Array(await sharp(bytes).rotate().resize({ width: 600, height: 300, fit: "inside", withoutEnlargement: true }).webp({ quality: 90 }).toBuffer());
    uploaded = await uploadProductImage(`logo-${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}.webp`, small, "image/webp");
    next = uploaded;
  }
  try {
    await saveSettings({ logoUrl: next });
  } catch {
    if (uploaded) await deleteProductImages([uploaded]);
    return res.json({ error: "Could not save the logo. Please try again." });
  }
  if (old && old !== next && old.includes("/logo-")) await deleteProductImages([old]);
  res.json({ ok: true });
}));
var MAX_BANNERS = 6;
admin.post("/settings/banners", upload.any(), wrap(async (req, res) => {
  const old = (await getSettings()).banners ?? [];
  const k = all(req, "keep");
  const keep = old.filter((b) => k.includes(b));
  const fl = files(req, "banners");
  if (keep.length + fl.length > MAX_BANNERS) return res.json({ error: `At most ${MAX_BANNERS} banner images` });
  const uploaded = [];
  try {
    for (const f of fl) {
      const bytes = new Uint8Array(f.buffer);
      const v = validateImage(bytes, f.mimetype);
      if (!v.ok) {
        await deleteProductImages(uploaded);
        return res.json({ error: `${f.originalname}: ${v.error}` });
      }
      const small = new Uint8Array(await sharp(bytes).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer());
      uploaded.push(await uploadProductImage(`banner-${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}.webp`, small, "image/webp"));
    }
    await saveSettings({ banners: [...keep, ...uploaded] });
  } catch {
    await deleteProductImages(uploaded);
    return res.json({ error: "Could not save the banners. Please try again." });
  }
  await deleteProductImages(old.filter((b) => !keep.includes(b)));
  res.json({ ok: true });
}));
admin.post("/settings/banners/delete", wrap(async (req, res) => {
  const url = String(req.body?.url ?? "");
  const old = (await getSettings()).banners ?? [];
  if (!old.includes(url)) return res.json({ error: "Banner not found" });
  try {
    await saveSettings({ banners: old.filter((b) => b !== url) });
  } catch {
    return res.json({ error: "Could not delete the banner. Please try again." });
  }
  await deleteProductImages([url]);
  res.json({ ok: true });
}));
admin.post("/settings/qr", upload.any(), wrap(async (req, res) => {
  const old = (await getSettings()).qrUrl || DEFAULT_SETTINGS.qrUrl;
  let next = DEFAULT_SETTINGS.qrUrl, uploaded = null;
  if (fld(req, "reset") !== "on") {
    const f = files(req, "qr")[0];
    if (!f) return res.json({ error: "Choose an image file first" });
    const bytes = new Uint8Array(f.buffer);
    const v = validateImage(bytes, f.mimetype);
    if (!v.ok) return res.json({ error: v.error });
    const small = new Uint8Array(await sharp(bytes).rotate().resize({ width: 1200, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 92 }).toBuffer());
    uploaded = await uploadProductImage(`payqr-${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}.webp`, small, "image/webp");
    next = uploaded;
  }
  try {
    await saveSettings({ qrUrl: next });
  } catch {
    if (uploaded) await deleteProductImages([uploaded]);
    return res.json({ error: "Could not save the QR. Please try again." });
  }
  if (old !== next && old.includes("/payqr-")) await deleteProductImages([old]);
  res.json({ ok: true });
}));
app.use("/api", api);
app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));
var dist = path.resolve(process.cwd(), "dist");
if (fs.existsSync(dist)) {
  app.use("/assets", express.static(path.join(dist, "assets"), { immutable: true, maxAge: "1y" }));
  app.use(express.static(dist, { maxAge: "1h", index: false }));
  app.get("*", (_req, res) => {
    res.set("Cache-Control", "no-cache");
    res.sendFile(path.join(dist, "index.html"));
  });
}
var app_default = app;

// server/vercel-entry.ts
var vercel_entry_default = app_default;
export {
  vercel_entry_default as default
};
