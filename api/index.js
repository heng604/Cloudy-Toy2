import{createRequire as __cr}from'module';const require=__cr(import.meta.url);

// server/app.ts
import crypto3 from "node:crypto";

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
import { z as z2 } from "zod";

// shared/profile.ts
import { z } from "zod";
var ProfileInput = z.object({
  display_name: z.string().trim().max(80),
  phone: z.string().trim().max(30).regex(/^[0-9+\-\s()]*$/, "Use digits, spaces, + or - only"),
  address: z.string().trim().max(300).default(""),
  facebook: z.string().trim().max(100).default(""),
  telegram: z.string().trim().max(100).default("")
});

// shared/gifts.ts
var MAX_GIFT_POINTS = 1e6;
var MAX_GIFT_STOCK = 1e5;
var int = (v) => v === "" || v === null || v === void 0 ? NaN : Number(v);
function checkGift(i) {
  const name = String(i.name ?? "").trim(), description = String(i.description ?? "").trim(), image = String(i.image ?? "").trim();
  if (name.length < 2 || name.length > 80) return { ok: false, error: "Gift name needs 2 to 80 characters" };
  if (description.length > 500) return { ok: false, error: "Description is too long (500 characters at most)" };
  const points = int(i.points);
  if (!Number.isInteger(points) || points < 1 || points > MAX_GIFT_POINTS) return { ok: false, error: "Points must be a whole number of 1 or more" };
  const noWas = i.wasPoints === "" || i.wasPoints === null || i.wasPoints === void 0;
  const was = noWas ? null : int(i.wasPoints);
  if (was !== null && (!Number.isInteger(was) || was <= points || was > MAX_GIFT_POINTS)) return { ok: false, error: "The old points must be more than the points now (or leave it empty)" };
  const stock = int(i.stock);
  if (!Number.isInteger(stock) || stock < 0 || stock > MAX_GIFT_STOCK) return { ok: false, error: "Stock must be a whole number (0 or more)" };
  if (image.length > 600 || image && !/^(\/|https?:\/\/)/.test(image)) return { ok: false, error: "Gift picture is not valid" };
  return { ok: true, value: { name, description, points, wasPoints: was, stock, image, active: i.active !== false && i.active !== "false" } };
}

// shared/orders.ts
var PAY = { PENDING: ["PAID", "FAILED", "EXPIRED"], PAID: ["REFUNDED"], FAILED: [], EXPIRED: ["PAID"], REFUNDED: [] };
var canPay = (a, b) => PAY[a].includes(b);
var payNowCents = (o) => o.preorder ? o.preorder.depositCents : o.totalCents;

// shared/delivery.ts
var shippingFor = (a, s) => a === "PHNOM_PENH" ? s.shipPhnomPenhCents : s.shipProvinceCents;
var methodAllowed = (m, a) => m === "QR_IMAGE" || m === "BAKONG" || m === "COD" && a === "PHNOM_PENH";
var areaLabel = (o) => o.area === "PHNOM_PENH" ? "Phnom Penh" : o.province ? `Province: ${o.province}` : "Province";
var methodLabel = (m) => m === "COD" ? "Pay with delivery" : m === "BAKONG" ? "Bakong KHQR" : "QR image payment";

// shared/products.ts
var LABELS = [{ id: "new_arrival", en: "New Arrival", km: "\u1798\u1780\u1790\u17D2\u1798\u17B8" }, { id: "restock", en: "Restock", km: "\u1785\u17BC\u179B\u179F\u17D2\u178F\u17BB\u1780\u17A1\u17BE\u1784\u179C\u17B7\u1789" }, { id: "limited_edition", en: "Limited Edition", km: "\u1785\u17C6\u1793\u17BD\u1793\u1780\u17C6\u178E\u178F\u17CB" }, { id: "preorder", en: "Pre-Order Item", km: "\u1780\u1798\u17D2\u1798\u1784\u17CB\u1798\u17BB\u1793" }, { id: "best_seller", en: "Best Seller", km: "\u179B\u1780\u17CB\u178A\u17B6\u1785\u17CB\u1794\u17C6\u1795\u17BB\u178F" }];
var LABEL_IDS = LABELS.map((l) => l.id);
var isPreorder = (p) => !!p.labels?.includes("preorder");
var isoDay = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && (/* @__PURE__ */ new Date(`${v}T00:00:00Z`)).toISOString().slice(0, 10) === v;
function checkPreorderDates(startIn, endIn) {
  const start = String(startIn ?? "").trim(), end = String(endIn ?? "").trim();
  if (start === "" !== (end === "")) return { ok: false, error: "Set both the pre-order start date and its deadline, or leave both empty" };
  if (start && (!isoDay(start) || !isoDay(end))) return { ok: false, error: "Pre-order dates must be real calendar dates" };
  if (start && end < start) return { ok: false, error: "The pre-order deadline cannot be before the start date" };
  return { ok: true, start, end };
}
var shopToday = (now = Date.now()) => new Date(now + 7 * 36e5).toISOString().slice(0, 10);
function preorderPhase(w, now = Date.now()) {
  if (!w.preorderStart || !w.preorderEnd) return "open";
  const d2 = shopToday(now);
  return d2 < w.preorderStart ? "upcoming" : d2 > w.preorderEnd ? "closed" : "open";
}
var dayShort = (d2) => (/* @__PURE__ */ new Date(`${d2}T00:00:00Z`)).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
var windowText = (w) => w.preorderStart && w.preorderEnd ? `${dayShort(w.preorderStart)} to ${dayShort(w.preorderEnd)}` : "";
var HIDE_AFTER_MS = 2 * 24 * 60 * 60 * 1e3;
var FALLBACK_IMG = "data:image/svg+xml;utf8," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'><rect width='400' height='300' fill='#EAF5FF'/><path d='M110 190a40 40 0 0 1 12-78 55 55 0 0 1 106-8 45 45 0 0 1 58 86z' fill='#8ECCFF'/></svg>");
var LOW_STOCK = 5;
var stockStatus = (stock) => stock <= 0 ? "OUT" : stock <= LOW_STOCK ? "LOW" : "OK";
function slugify(s) {
  return s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "product";
}
var toProduct = (r) => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  sku: r.sku,
  price: Number(r.price),
  stock: r.stock,
  category: r.category ?? "",
  createdAt: r.created_at,
  description: r.description ?? "",
  images: r.images ?? [],
  active: r.active,
  ...r.out_of_stock_at ? { outOfStockAt: r.out_of_stock_at } : {},
  ...r.preorder_start && r.preorder_end ? { preorderStart: String(r.preorder_start).slice(0, 10), preorderEnd: String(r.preorder_end).slice(0, 10) } : {},
  ...r.name_km ? { nameKm: r.name_km } : {},
  ...r.brand ? { brand: r.brand } : {},
  ...r.uom ? { uom: r.uom } : {},
  ...r.variants ? { variants: r.variants } : {},
  ...r.labels?.length ? { labels: r.labels.filter((l) => LABEL_IDS.includes(l)) } : {}
});
var OPTION_LIMITS = { groups: 6, values: 30, name: 30, value: 40, stored: 4e4, selected: 300, src: 500 };
var OPTION_SEP = " \xB7 ";
var cleanTxt = (s, max) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, max);
function cleanOptionGroups(input) {
  if (!Array.isArray(input)) return [];
  const out = [];
  for (const g of input) {
    const name = cleanTxt(g?.name, OPTION_LIMITS.name);
    const raw = Array.isArray(g?.values) ? g.values : [];
    const values = [...new Set(raw.map((v) => cleanTxt(v, OPTION_LIMITS.value)).filter(Boolean))].slice(0, OPTION_LIMITS.values);
    const im = g?.images;
    const images = {};
    if (im && typeof im === "object") for (const v of values) {
      const src = typeof im[v] === "string" ? im[v].trim() : "";
      if (src && src.length <= OPTION_LIMITS.src) images[v] = src;
    }
    if (name && values.length) {
      const same = out.find((o) => o.name.toLowerCase() === name.toLowerCase());
      if (same) {
        same.values = [.../* @__PURE__ */ new Set([...same.values, ...values])].slice(0, OPTION_LIMITS.values);
        same.images = { ...same.images, ...images };
        if (!Object.keys(same.images).length) delete same.images;
      } else out.push({ name, values, ...Object.keys(images).length ? { images } : {} });
    }
  }
  return out.slice(0, OPTION_LIMITS.groups);
}
var pruneOptionImages = (groups, srcs) => groups.map((g) => {
  const images = Object.fromEntries(Object.entries(g.images ?? {}).filter(([, src]) => srcs.includes(src)));
  const { images: _drop, ...rest } = g;
  return Object.keys(images).length ? { ...rest, images } : rest;
});
function parseOptions(v) {
  const s = String(v ?? "").trim();
  if (!s) return [];
  if (s.startsWith("[")) {
    try {
      return cleanOptionGroups(JSON.parse(s));
    } catch {
    }
  }
  const groups = [];
  for (const piece of s.split(/[,;\n]/).map((x) => x.trim()).filter(Boolean)) {
    const i = piece.indexOf(":");
    if (i > 0) {
      groups.push({ name: piece.slice(0, i), values: piece.slice(i + 1).trim() ? [piece.slice(i + 1)] : [] });
    } else if (groups.length) groups[groups.length - 1].values.push(piece);
    else groups.push({ name: "Option", values: [piece] });
  }
  return cleanOptionGroups(groups);
}
var serializeOptions = (groups) => {
  const g = cleanOptionGroups(groups);
  return g.length ? JSON.stringify(g) : "";
};
function isValidOption(groups, opt) {
  const s = String(opt ?? "").trim();
  if (!groups.length) return s === "";
  const walk = (gi, rest) => {
    if (gi === groups.length) return rest === "";
    for (const v of groups[gi].values) {
      const piece = `${groups[gi].name}: ${v}`;
      if (rest === piece) {
        if (gi === groups.length - 1) return true;
      } else if (rest.startsWith(piece + OPTION_SEP) && walk(gi + 1, rest.slice(piece.length + OPTION_SEP.length))) return true;
    }
    return false;
  };
  return walk(0, s);
}

// shared/admin.ts
var ADMIN_EMAILS = ["toyscloudy@gmail.com", "seangheng2006@gmail.com"];
var ADMIN_EMAIL = ADMIN_EMAILS[0];
function isAdminEmail(email, verified2, allowlist = ADMIN_EMAILS.join(",")) {
  if (!email || !verified2) return false;
  return allowlist.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean).includes(email.toLowerCase());
}

// server/lib/db.ts
import { createClient } from "@supabase/supabase-js";
var cached = null;
function db() {
  if (cached) return cached;
  const url = env.supabaseUrl(), key2 = env.serviceKey();
  if (!url || !key2) throw new Error("Database not configured: set VITE_SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY");
  cached = createClient(url, key2, { auth: { persistSession: false, autoRefreshToken: false } });
  return cached;
}
function must(r) {
  if (r.error) throw new Error(r.error.message);
  return r.data;
}

// shared/types.ts
var DEFAULT_SETTINGS = { shipPhnomPenhCents: 150, shipProvinceCents: 200, telegramUrl: "", facebookUrl: "", instagramUrl: "", logoUrl: "/img/logo.png", banners: [], categories: [], categoryImages: {}, offerHeroImage: "", offerMascotImage: "", offerFooterImage: "", offerDetailImage: "", productsBannerImage: "", membershipBannerImage: "", newArrivalBannerImage: "", preorderBannerImage: "", offerFullImage: "", offerMascotScale: 100, imageSizes: {}, offerHeroText: true, offerFooterButton: true, qrUrl: "/img/qr-pay.png", payBakong: "on", payQr: "on", payCod: "on" };

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
var lastBeat = 0;
var seenCache = null;
async function beatWatcher(hasPending) {
  const now = Date.now();
  if (now - lastBeat < (hasPending ? 15e3 : 6e4)) return;
  lastBeat = now;
  try {
    must(await db().from("site_settings").upsert({ key: "bakong_watcher", value: { at: now }, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).select("key").single());
    seenCache = null;
  } catch (e) {
    console.error("[watcher beat]", e);
  }
}
async function watcherSeenAt() {
  if (seenCache && Date.now() - seenCache.at < 4e3) return seenCache.v;
  try {
    const r = must(await db().from("site_settings").select("value").eq("key", "bakong_watcher").maybeSingle());
    const v = typeof r?.value?.at === "number" ? r.value.at : null;
    seenCache = { at: Date.now(), v };
    return v;
  } catch {
    return null;
  }
}

// shared/invoice.ts
var usd = (c) => `$${(c / 100).toFixed(2)}`;
var invoiceNo = (orderNumber) => `INV-${orderNumber.replace(/^CT-/, "")}`;
var firstName = (full) => {
  const w = full.trim().split(/\s+/)[0] ?? "";
  return w ? w.charAt(0).toUpperCase() + w.slice(1) : "friend";
};
var dateLong = (iso) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Phnom_Penh" });
var timeShort = (iso) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Phnom_Penh" });
var invoiceState = (o) => o.paymentStatus === "PAID" ? { label: "PAID", tone: "green" } : o.paymentStatus === "FAILED" || o.paymentStatus === "EXPIRED" ? { label: "FAILED PAYMENT", tone: "red" } : o.paymentStatus === "REFUNDED" ? { label: "REFUNDED", tone: "amber" } : o.method === "COD" ? { label: "PAY WITH DELIVERY", tone: "red" } : { label: "AWAITING PAYMENT", tone: "amber" };
function nextStep(o) {
  const pre = o.preorder, full = !!pre && pre.balanceCents <= 0;
  if (o.paymentStatus === "FAILED" || o.paymentStatus === "EXPIRED") return "We could not confirm the payment for this order. Please contact us on Telegram or Facebook, or place the order again.";
  if (o.paymentStatus === "REFUNDED") return "This payment was refunded. If you have any questions, just reply to this email.";
  if (o.paymentStatus === "PAID") return pre ? full ? `Your full payment is confirmed. Your pre-order will be dispatched in ${pre.dispatch}.` : `Your deposit is confirmed. Your pre-order will be dispatched in ${pre.dispatch}; the balance of ${usd(pre.balanceCents)} is paid then.` : "Your payment is confirmed. We are packing your toys with love and will deliver them soon.";
  if (o.method === "COD") return `Please keep ${usd(o.totalCents)} in cash ready for our delivery driver. We will call you before we arrive.`;
  return o.paymentProof || o.claimedPaidAt ? "Thank you for sending your payment screenshot. We are checking it now and will confirm your order very soon." : `Please pay ${pre ? full ? "the full pre-order price of " : `your ${pre.percent}% pre-order deposit of ` : ""}${usd(payNowCents(o))} by scanning our QR code and write ${o.orderNumber} in the note. Then send us the screenshot so we can confirm.${pre && !full ? ` The balance of ${usd(pre.balanceCents)} is paid when your order is dispatched (${pre.dispatch}).` : ""}`;
}
var BRAND = { name: "Cloudy Toys", tagline: "Little Toys, Big Happiness", sky: "#8ECCFF", skyDeep: "#6CB8F5", skyPale: "#EAF5FF", border: "#D8EAFE", ink: "#2F4156", red: "#D62828", redPale: "#FDE4E4", mute: "#64748B", pink: "#FFB6C8" };
var INVOICE_LOGO = "/img/invoice-logo.jpg";
var contactLines = (s) => [s.telegramUrl && `Telegram: ${s.telegramUrl.replace(/^https?:\/\//, "")}`, s.facebookUrl && `Facebook: ${s.facebookUrl.replace(/^https?:\/\//, "")}`].filter(Boolean);

// server/lib/email.ts
import { readFileSync } from "node:fs";
import { join } from "node:path";

// server/lib/customerEmail.ts
var esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var LOGO_CID = "invoice-logo";
var MASCOT_CID = "cloudy-mascot";
var siteUrl = () => (process.env.SITE_URL ?? "").trim().replace(/\/+$/, "");
var failed = (o) => o.paymentStatus === "FAILED" || o.paymentStatus === "EXPIRED";
var customerSubject = (o, kind) => failed(o) ? `Your payment was not completed (${o.orderNumber})` : kind === "paid" ? `Payment received, thank you ${firstName(o.customer.name)}! \u{1F499} (${o.orderNumber})` : o.preorder ? `Your pre-order is reserved, ${firstName(o.customer.name)}! \u{1F39F}\uFE0F (${o.orderNumber})` : `Thank you, ${firstName(o.customer.name)}! Your Cloudy Toys invoice ${invoiceNo(o.orderNumber)} \u{1F9F8}`;
var itemWindow = (o, i) => {
  const from = i.opens ?? o.preorder?.opens, to = i.closes ?? o.preorder?.closes;
  return from && to ? windowText({ preorderStart: from, preorderEnd: to }) : "";
};
var isFullPay = (o) => !!o.preorder && o.preorder.balanceCents <= 0;
var preorderPlan = (o) => isFullPay(o) ? "Full price" : `${o.preorder?.percent}% deposit`;
var STAMP = { "PAID": "#1f7a3a", "AWAITING PAYMENT": "#B87500", "PAY WITH DELIVERY": "#1F4E9C", "FAILED PAYMENT": "#D62828", "REFUNDED": "#64748B" };
var body = "'Nunito','Segoe UI',ui-rounded,Arial,'Helvetica Neue',sans-serif";
var LINE = "#D6E6F5";
var SOFT = "#F5FAFF";
function orderEmail(o, { mode, kind = "placed", base, banner = "", contact: contact2 = [], inlineLogo = false }) {
  const owner = mode === "admin", c = o.customer, pre = o.preorder, name = esc(firstName(c.name)), full = isFullPay(o);
  const st = invoiceState(o), col = STAMP[st.label] ?? BRAND.ink, paid = o.paymentStatus === "PAID", bad = failed(o);
  const pieces = o.items.reduce((s, i) => s + i.qty, 0), first = o.items[0]?.name ?? "your toy", more = o.items.length - 1;
  const firstTxt = `<b>${esc(first)}</b>${more > 0 ? ` and ${more} more` : ""}`;
  const logoSrc = inlineLogo ? `cid:${LOGO_CID}` : base ? `${esc(base)}${INVOICE_LOGO}` : "";
  const mascotSrc = inlineLogo ? `cid:${MASCOT_CID}` : base ? `${esc(base)}/img/email/mascot.png` : "";
  const brand = `<table role="presentation" cellpadding="0" cellspacing="0"><tr>${logoSrc ? `<td style="padding-right:8px"><img src="${logoSrc}" alt="" width="30" height="30" style="display:block;width:30px;height:30px;border-radius:50%"></td>` : ""}<td style="font-weight:900;font-size:17px;color:${BRAND.ink};white-space:nowrap">Cloudy Toys</td></tr></table>`;
  const mascot = mascotSrc ? `<img src="${mascotSrc}" alt="Cloudy Toys mascot" width="170" style="display:block;width:170px;max-width:100%;height:auto;border:0">` : `<div style="font-size:54px;line-height:1">\u2601\uFE0F</div>`;
  const kv = (k, v) => `<tr><td style="padding:3px 10px 3px 0;color:${BRAND.mute};font-size:12.5px;white-space:nowrap;vertical-align:top">${k}</td><td style="padding:3px 0;font-size:13px;font-weight:800;line-height:1.4">${v}</td></tr>`;
  const who = [esc(c.phone), c.email ? esc(c.email) : ""].filter(Boolean).join("<br>");
  const cell = (v, a, x = "") => `<td align="${a}" style="padding:9px 12px;border-top:1px solid ${LINE};font-size:13.5px;${x}">${v}</td>`;
  const rows = o.items.map((i) => `<tr>${cell(`<b>${esc(i.name)}</b><br><span style="color:${BRAND.mute};font-size:11.5px">SKU ${esc(i.sku)}</span>${pre && itemWindow(o, i) ? `<br><span style="color:#7a5a00;font-size:11.5px">Pre-order: ${esc(itemWindow(o, i))}</span>` : ""}`, "left")}${cell(String(i.qty), "center")}${cell(usd(i.unitCents), "right")}${cell(usd(i.lineCents), "right", "font-weight:800;")}</tr>`).join("");
  const th = (t, a) => `<td align="${a}" style="padding:9px 12px;font-size:11px;letter-spacing:1.2px;font-weight:800;color:${BRAND.mute}">${t}</td>`;
  const sum = (k, v, s = "") => `<tr><td style="padding:4px 0;font-size:13.5px;color:${BRAND.mute};${s}">${k}</td><td align="right" style="padding:4px 0;font-size:13.5px;white-space:nowrap;${s}">${v}</td></tr>`;
  const hello = owner ? "Hi Shop Owner," : `Hi ${name},`;
  const lead = owner ? `${pre ? "New pre-order" : "New order"} received for ${firstTxt}.` : bad ? `We could not confirm the payment for ${firstTxt}.` : pre ? `Your pre-order for ${firstTxt} is reserved. We will message you when it is ready to dispatch (about <b>${esc(pre.dispatch)}</b>).` : kind === "paid" ? `Thank you! Your payment for ${firstTxt} is confirmed and we are packing your toys with love.` : `Thank you so much for shopping with us. Here is your invoice for ${firstTxt}.`;
  const planRows = pre ? `${kv("Dispatch", `about ${esc(pre.dispatch)}`)}${kv("Plan", esc(preorderPlan(o)))}` : "";
  const right = `${kv("Placed", `${esc(dateLong(o.createdAt))}, ${esc(timeShort(o.createdAt))}`)}${kv("Order no.", esc(o.orderNumber))}${kv("Payment", esc(methodLabel(o.method)))}${o.paidAt ? kv("Paid on", esc(dateLong(o.paidAt))) : ""}${planRows}`;
  const nextBox = owner ? "" : `<tr><td style="padding:12px 28px 0"><div style="background:${bad ? BRAND.redPale : paid ? "#E8F8EC" : "#FFF8DC"};border-radius:14px;padding:10px 14px;font-size:13.5px;line-height:1.55">\u{1F48C} ${esc(nextStep(o))}</div></td></tr>`;
  const ownerBox = owner ? `<tr><td style="padding:12px 28px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1.5px dashed ${LINE};border-radius:16px"><tr><td style="padding:12px 16px"><div style="font-size:11px;letter-spacing:1.6px;font-weight:800;color:${BRAND.mute};margin-bottom:4px">OWNER ONLY</div>
    <table role="presentation" cellpadding="0" cellspacing="0">${kv("Status", esc(o.paymentStatus))}${kv("Reference", esc(o.paymentReference))}${kv("Facebook / Telegram", `${esc(c.facebook ?? "-")} / ${esc(c.telegram ?? "-")}`)}${c.notes ? kv("Customer note", esc(c.notes)) : ""}</table></td></tr></table></td></tr>
    ${base ? `<tr><td align="center" style="padding:12px 28px 0"><a href="${esc(base)}/admin/invoice/${encodeURIComponent(o.orderNumber)}" style="display:inline-block;background:${BRAND.sky};color:${BRAND.ink};font-weight:800;font-size:14px;text-decoration:none;padding:11px 24px;border-radius:999px">\u{1F9FE} Open invoice (print / download)</a></td></tr>` : ""}` : c.notes ? `<tr><td style="padding:12px 28px 0"><div style="background:#FFFBEA;border-radius:14px;padding:10px 14px;font-size:13px;line-height:1.5"><b>Your note:</b> ${esc(c.notes)}</div></td></tr>` : "";
  const caption = pre ? paid ? full ? "Paid in full. Thank you!" : `Deposit received. Balance ${usd(pre.balanceCents)} is paid at dispatch.` : bad ? "" : full ? "Pay the full price to reserve your spot." : `Pay the ${pre.percent}% deposit to reserve your spot.` : paid ? `Thank you${owner ? ", payment is in" : `, ${name}`}! \u{1F499}` : st.label === "PAY WITH DELIVERY" ? `Pay ${usd(o.totalCents)} in cash on delivery.` : "";
  const payRows = pre ? `${sum(paid ? full ? "Paid in full" : "Deposit paid" : full ? "Pay now (full)" : `Pay now (${pre.percent}%)`, usd(pre.depositCents), "font-weight:900;color:#8a5a00;")}${full ? "" : sum("Balance at dispatch", usd(pre.balanceCents))}` : "";
  const stamp2 = `<div style="padding:8px 0 10px 6px"><div style="display:inline-block;transform:rotate(-6deg);border:4px double ${col};color:${col};border-radius:14px;padding:5px 12px;font-weight:900;letter-spacing:1.5px;font-size:17px;white-space:nowrap">${st.label}</div></div>`;
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"></head>
<body style="margin:0;padding:0;background:#E4F3FF;font-family:${body}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(owner ? `${usd(o.totalCents)} \xB7 ${st.label}` : nextStep(o))}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#E4F3FF"><tr><td align="center" style="padding:20px 10px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#fff;border-radius:28px;overflow:hidden;color:${BRAND.ink};box-shadow:0 10px 36px rgba(108,184,245,.35)">
<tr><td style="padding:22px 28px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1.5px solid ${LINE};border-radius:999px"><tr>
  <td style="padding:10px 8px 10px 16px">${brand}</td>
  <td align="right" style="padding:10px 18px 10px 6px;font-size:14px;font-weight:800;letter-spacing:.5px;white-space:nowrap">${esc(invoiceNo(o.orderNumber))}</td></tr></table></td></tr>
<tr><td style="padding:22px 28px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
  <td valign="middle"><div style="font-size:24px;font-weight:900;line-height:1.2">${hello}</div><p style="margin:6px 0 0;font-size:14.5px;line-height:1.6">${lead}</p></td>
  <td width="170" valign="middle" align="right" style="padding-left:12px">${mascot}</td></tr></table></td></tr>
${banner ? `<tr><td style="padding:12px 28px 0">${banner}</td></tr>` : ""}
<tr><td style="padding:14px 28px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SOFT};border:1.5px solid ${LINE};border-radius:18px"><tr>
  <td width="50%" valign="top" style="padding:14px 16px"><table role="presentation" cellpadding="0" cellspacing="0">${kv("Customer", `<span style="text-transform:capitalize">${esc(c.name)}</span>`)}${kv("Contact", who)}${kv("Ship to", `${esc(areaLabel(o))}<br>${esc(c.address)}`)}</table></td>
  <td width="50%" valign="top" style="padding:14px 16px;border-left:1.5px solid ${LINE}"><table role="presentation" cellpadding="0" cellspacing="0">${right}</table></td></tr></table></td></tr>
<tr><td style="padding:14px 28px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1.5px solid ${LINE};border-radius:16px;border-collapse:separate;overflow:hidden"><tr style="background:${SOFT}">${th("ITEM", "left")}${th("QTY", "center")}${th("PRICE", "right")}${th("TOTAL", "right")}</tr>${rows}</table></td></tr>
<tr><td style="padding:14px 28px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
  <td valign="middle" style="font-size:12.5px;color:${BRAND.mute};line-height:1.5;padding-right:12px">${stamp2}${caption ? `<div>${esc(caption)}</div>` : ""}<div style="margin-top:4px">${pieces} ${pieces === 1 ? "toy" : "toys"} \xB7 ${esc(methodLabel(o.method))}</div></td>
  <td width="270" valign="top" style="border:1.5px solid ${LINE};border-radius:16px;padding:10px 16px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    ${sum("Subtotal", usd(o.subtotalCents))}${o.discountCents > 0 ? sum(`Discount${o.discountCode ? ` (${esc(o.discountCode)})` : ""}`, `\u2212${usd(o.discountCents)}`, `color:${BRAND.red};font-weight:bold;`) : ""}${sum("Shipping", usd(o.shippingCents))}${sum("Total", `${usd(o.totalCents)} ${o.currency}`, `font-weight:900;color:${BRAND.ink};border-top:1px solid ${LINE};`)}${payRows}</table></td></tr></table></td></tr>
${nextBox}${ownerBox}
<tr><td style="padding:22px 28px 22px"><div style="border-top:1.5px dashed ${LINE};padding-top:14px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
  <td valign="middle" style="font-size:15px;font-weight:900">with love, ${BRAND.name} \u{1F499}</td>
  <td align="right" valign="middle" style="font-size:12px;line-height:1.6;color:${BRAND.mute}">${contact2.length ? contact2.map((x) => `${esc(x)}<br>`).join("") : owner ? "" : "Questions? Just reply to this email.<br>"}${owner ? "" : "Please keep this invoice for your records."}</td></tr></table></div></td></tr>
</table></td></tr></table></body></html>`;
}
var customerHtml = (o, kind = "placed", base = siteUrl(), contact2 = [], inlineLogo = false) => orderEmail(o, { mode: "customer", kind, base, contact: contact2, inlineLogo });
var adminInvoiceHtml = (o, banner, base = siteUrl(), contact2 = [], inlineLogo = false) => orderEmail(o, { mode: "admin", base, banner, contact: contact2, inlineLogo });

// server/lib/itemsEmail.ts
var hand = "'Caveat','Segoe Print','Bradley Hand','Comic Sans MS',cursive";
var body2 = "'Nunito','Segoe UI',ui-rounded,Arial,'Helvetica Neue',sans-serif";
var CARD = ["#EAF5FF", "#FFF6F9", "#FFFBEA", "#F3EEFF"];
var itemsSubject = (o) => `Meet your toys, ${firstName(o.customer.name)}! \u{1F9F8} Order ${o.orderNumber}`;
function itemsHtml(o, images = {}, base = siteUrl(), contact2 = [], inlineLogo = false) {
  const name = esc(firstName(o.customer.name)), pieces = o.items.reduce((s, i) => s + i.qty, 0);
  const logoSrc = inlineLogo ? `cid:${LOGO_CID}` : base ? `${esc(base)}${INVOICE_LOGO}` : "";
  const logo = logoSrc ? `<img src="${logoSrc}" alt="Cloudy Toys" width="72" height="72" style="display:block;width:72px;height:72px;border-radius:50%;border:4px solid #fff;background:#fff">` : `<div style="font:900 14px ${body2};color:${BRAND.ink};letter-spacing:1px">CLOUDY TOYS</div>`;
  const pic = (id) => {
    const s = images[id] ?? "";
    return /^https:\/\//.test(s) ? s : s.startsWith("/") && base ? `${base}${s}` : "";
  };
  const cards = o.items.map((i, n) => {
    const src = pic(i.productId), bg = CARD[n % CARD.length];
    const img = src ? `<img src="${esc(src)}" alt="${esc(i.name)}" width="96" height="96" style="display:block;width:96px;height:96px;border-radius:18px;object-fit:cover;background:#fff">` : `<div style="width:96px;height:96px;border-radius:18px;background:#fff;text-align:center;line-height:96px;font-size:40px">\u{1F9F8}</div>`;
    return `<tr><td style="padding:0 0 12px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${bg};border-radius:22px"><tr>
      <td width="112" valign="middle" style="padding:12px 0 12px 12px">${img}</td>
      <td valign="middle" style="padding:12px 14px"><div style="font-weight:900;font-size:16px;line-height:1.3;color:${BRAND.ink}">${esc(i.name)}</div>
        <div style="margin-top:3px;font-size:12px;color:${BRAND.mute}">SKU ${esc(i.sku)}</div>${o.preorder && itemWindow(o, i) ? `<div style="margin-top:6px"><span style="display:inline-block;background:#FFEFC2;border-radius:999px;padding:3px 10px;font-size:12px;font-weight:800;color:#7a5a00">\u{1F552} Pre-order: ${esc(itemWindow(o, i))}</span></div>` : ""}
        <div style="margin-top:8px"><span style="display:inline-block;background:#fff;border-radius:999px;padding:3px 12px;font-size:13px;font-weight:900;color:${BRAND.ink}">\xD7 ${i.qty}</span> <span style="font-size:13px;color:${BRAND.mute}">${usd(i.unitCents)} each</span></div></td>
      <td align="right" valign="middle" style="padding:12px 16px 12px 0;font-weight:900;font-size:17px;white-space:nowrap;color:${BRAND.ink}">${usd(i.lineCents)}</td></tr></table></td></tr>`;
  }).join("");
  const pre = o.preorder ? `<tr><td style="padding:0 0 12px"><div style="background:#FFEFC2;border-radius:16px;padding:10px 14px;font-size:13.5px;line-height:1.5;color:#7a5a00">\u{1F552} This is a <b>pre-order</b>. We will dispatch it in <b>${esc(o.preorder.dispatch)}</b>.</div></td></tr>` : "";
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"></head>
<body style="margin:0;padding:0;background:#FFF8E6;font-family:${body2}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${pieces} ${pieces === 1 ? "toy is" : "toys are"} on the way to being packed for you.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8E6"><tr><td align="center" style="padding:20px 10px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#fff;border-radius:28px;overflow:hidden;color:${BRAND.ink};box-shadow:0 10px 36px rgba(255,182,200,.35)">
<tr><td style="background:${BRAND.sky};background-image:linear-gradient(135deg,#BFE3FF,#FFD9E6);padding:22px 28px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
  <td width="84" valign="middle">${logo}</td><td valign="middle" align="right"><div style="font-family:${hand};font-size:30px;line-height:1.1;color:#1F4E9C">Cloudy Toys</div><div style="font-size:12px;letter-spacing:2px;font-weight:800;color:${BRAND.ink}">YOUR ORDER \xB7 ${esc(invoiceNo(o.orderNumber))}</div></td></tr></table></td></tr>
<tr><td style="padding:26px 28px 6px"><div style="font-family:${hand};font-size:38px;line-height:1.1">Meet your toys, ${name}! \u{1F9F8}</div>
  <p style="margin:8px 0 0;font-size:15px;line-height:1.6;color:${BRAND.mute}">You chose <b style="color:${BRAND.ink}">${pieces} ${pieces === 1 ? "toy" : "toys"}</b> from us. Here ${pieces === 1 ? "it is" : "they are"}, one by one. We are packing ${pieces === 1 ? "it" : "them"} with love.</p></td></tr>
<tr><td style="padding:16px 28px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${pre}${cards}</table></td></tr>
<tr><td style="padding:4px 28px 0"><div style="background:${BRAND.skyPale};border-radius:18px;padding:12px 16px;font-size:14px;line-height:1.6">Order <b>${esc(o.orderNumber)}</b> \xB7 ${usd(o.totalCents)} in total. Your invoice is in the other email we sent you.</div></td></tr>
<tr><td style="padding:22px 28px 24px"><div style="border-top:2px dashed ${BRAND.border};padding-top:16px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
  <td valign="middle"><div style="font-family:${hand};font-size:28px;color:${BRAND.ink}">Thank you! \u{1F499}</div></td>
  <td valign="middle" align="right" style="font-size:12.5px;line-height:1.6">${contact2.length ? contact2.map((x) => `${esc(x)}<br>`).join("") : "Questions? Just reply to this email.<br>"}<span style="color:${BRAND.mute}">\xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} Cloudy Toys. All rights reserved.</span></td></tr></table></div></td></tr>
</table></td></tr></table></body></html>`;
}

// server/lib/email.ts
var esc2 = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var usd2 = (c) => `$${(c / 100).toFixed(2)}`;
function adminSubject(o) {
  return `[Cloudy-Toy] New ${o.preorder ? "PRE-ORDER" : "Order"} #${o.orderNumber} - ${o.method === "COD" ? "PAY WITH DELIVERY" : o.method === "BAKONG" ? "BAKONG KHQR (waiting for payment)" : "QR PAYMENT (verify manually)"}`;
}
var box = (bg, html) => `<div style="background:${bg};border-radius:14px;padding:12px 16px;font-size:14px;line-height:1.6;margin-top:8px">${html}</div>`;
function adminHtml(o, extra = "", contact2 = [], inlineLogo = false) {
  const note = o.method === "COD" ? box("#fff3cd", `<b>PAY WITH DELIVERY (Phnom Penh):</b> collect <b>${usd2(o.totalCents)}</b> in cash when delivering. Not paid yet.`) : o.method === "BAKONG" ? box("#fff3cd", `<b>BAKONG KHQR: waiting for payment.</b> You will get a separate PAID email when the bank confirms <b>${usd2(payNowCents(o))}</b>.`) : box("#fff3cd", `<b>QR IMAGE PAYMENT, NOT VERIFIED.</b> The customer may have scanned your QR. Check your bank/Bakong app for <b>${usd2(payNowCents(o))}</b> with order number ${esc2(o.orderNumber)}, then mark it paid in Admin &gt; Orders.`);
  const pre = o.preorder ? box("#e8defa", isFullPay(o) ? `<b>PRE-ORDER, PAID IN FULL:</b> the customer pays the full price of <b>${usd2(o.preorder.depositCents)}</b> now. Nothing is due at dispatch (${esc2(o.preorder.dispatch)}).` : `<b>PRE-ORDER:</b> the customer pays a ${o.preorder.percent}% deposit of <b>${usd2(o.preorder.depositCents)}</b> now. Balance <b>${usd2(o.preorder.balanceCents)}</b> is due when the order is dispatched (${esc2(o.preorder.dispatch)}).`) : "";
  return adminInvoiceHtml(o, extra + pre + note, void 0, contact2, inlineLogo);
}
var TEST_SENDER = "Cloudy-Toy <onboarding@resend.dev>";
var FREE_MAIL = ["gmail.com", "googlemail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com", "live.com"];
function fromAddress(v) {
  const addr = (v ?? "").trim();
  if (!addr) return TEST_SENDER;
  const domain = (addr.match(/@([^>\s]+)/)?.[1] ?? "").toLowerCase();
  return !domain || FREE_MAIL.includes(domain) ? TEST_SENDER : addr;
}
var logoB64;
var logoAttachment = () => {
  if (logoB64 === void 0) {
    try {
      logoB64 = readFileSync(join(process.cwd(), "public", INVOICE_LOGO)).toString("base64");
    } catch {
      logoB64 = null;
    }
  }
  return logoB64 ? [{ filename: "cloudy-toys-logo.jpg", content: logoB64, content_type: "image/jpeg", content_id: LOGO_CID }] : [];
};
var mascotB64;
var mascotAttachment = () => {
  if (mascotB64 === void 0) {
    try {
      mascotB64 = readFileSync(join(process.cwd(), "public", "img", "email", "mascot.png")).toString("base64");
    } catch {
      mascotB64 = null;
    }
  }
  return mascotB64 ? [{ filename: "cloudy-mascot.png", content: mascotB64, content_type: "image/png", content_id: MASCOT_CID }] : [];
};
function friendlyMailError(detail) {
  const d2 = detail ?? "";
  if (/HTTP 403/.test(d2) && /testing emails|own email|verify a domain/i.test(d2)) return `Resend is still in test mode, so it can only email ${adminInbox().split(",")[0].trim() || "your own address"}. To email customers: verify your domain at resend.com/domains, then set EMAIL_FROM to an address on that domain.`;
  if (/HTTP 401/.test(d2)) return "Resend rejected the API key. Check RESEND_API_KEY in your environment variables.";
  if (/HTTP 403/.test(d2) || /HTTP 422/.test(d2)) return "Resend refused this email. Check that your sending domain is verified and EMAIL_FROM uses it.";
  if (/HTTP 429/.test(d2)) return "Resend is busy (too many emails at once). Please wait a minute and try again.";
  if (/HTTP 5\d\d/.test(d2)) return "Resend had a temporary problem. Please try again in a moment.";
  if (/timeout|aborted|network|fetch failed/i.test(d2)) return "Could not reach Resend (network problem). Please try again.";
  return d2 || "The email could not be sent.";
}
var adminInbox = () => process.env.ADMIN_NOTIFICATION_EMAIL || ADMIN_EMAIL;
var recipients = () => adminInbox().split(",").map((x) => x.trim()).filter(Boolean);
var plain = (h2) => h2.replace(/<\/(p|h[1-6]|tr|table)>|<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();
var wait = (ms) => new Promise((r) => setTimeout(r, ms));
var validEmail = (v) => !!v && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(v);
var alertSubject = (emoji, o, subject) => `${emoji} ${usd2(payNowCents(o))} ${o.customer.name.replace(/\s+/g, " ").trim().slice(0, 24)} | ${subject}`;
var preheader = (o) => `<div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:#ffffff">${esc2(`${o.customer.name} \xB7 ${o.customer.phone} \xB7 ${o.items.map((i) => `${i.name} x${i.qty}`).join(", ")}`.slice(0, 140))}</div>`;
var withPreheader = (html, o) => /<body[^>]*>/i.test(html) ? html.replace(/<body[^>]*>/i, (m) => m + preheader(o)) : preheader(o) + html;
async function deliver(subject, html, o, customerTo) {
  try {
    const key2 = process.env.RESEND_API_KEY?.trim();
    if (!key2) return { status: "SKIPPED", detail: "Set RESEND_API_KEY in your environment variables" };
    if (!customerTo) html = withPreheader(html, o);
    const text = plain(html);
    const send = async (from, to2) => {
      const body3 = JSON.stringify({
        from,
        to: to2,
        subject,
        html,
        text,
        attachments: [...html.includes(`cid:${LOGO_CID}`) ? logoAttachment() : [], ...html.includes(`cid:${MASCOT_CID}`) ? mascotAttachment() : []],
        ...customerTo ? { reply_to: recipients()[0] } : validEmail(o.customer.email) ? { reply_to: o.customer.email } : {},
        // admin mail: reply goes to the customer; customer mail: reply goes to the shop
        headers: { "X-Entity-Ref-ID": `${o.orderNumber}-${Date.now()}`, ...customerTo ? {} : { "X-Priority": "1", "X-MSMail-Priority": "High", Importance: "high", Priority: "urgent" } }
      });
      let detail = "";
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const res = await fetch("https://api.resend.com/emails", { method: "POST", signal: AbortSignal.timeout(4e3), headers: { Authorization: `Bearer ${key2}`, "Content-Type": "application/json" }, body: body3 });
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
    const to = customerTo ? [customerTo] : recipients();
    if (!to.length) return { status: "FAILED", detail: "No admin email configured (ADMIN_NOTIFICATION_EMAIL)" };
    const primary = fromAddress(process.env.EMAIL_FROM);
    let r = await send(primary, to);
    if (!customerTo && r.status === "FAILED" && /HTTP (400|401|403|422)/.test(r.detail ?? "")) {
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
    if (r.status === "FAILED") {
      console.error("[email]", o.orderNumber, r.detail);
      if (customerTo) r = { ...r, detail: friendlyMailError(r.detail) };
    }
    return r;
  } catch (e) {
    const detail = e instanceof Error ? e.message : "unexpected email error";
    console.error("[email]", o.orderNumber, detail);
    return { status: "FAILED", detail };
  }
}
var contact = async () => contactLines(await getSettings());
var sendAdminEmail = async (o) => deliver(alertSubject("\u{1F6D2}", o, adminSubject(o)), adminHtml(o, "", await contact(), logoAttachment().length > 0), o);
var paidOrderSubject = (o) => `[Cloudy-Toy] New Order #${o.orderNumber} - QR PAYMENT, CUSTOMER SAYS PAID (verify)`;
var proofNote = (o) => o.paymentProof ? box("#d1f2d1", `<b>Payment screenshot uploaded.</b> Open it in Admin &gt; Transactions (order ${esc2(o.orderNumber)}).`) : "";
var claimNote = (o) => box("#fff3cd", `<b>CUSTOMER SAYS THEY PAID (NOT VERIFIED).</b> Check your ABA app for <b>${usd2(payNowCents(o))}</b> with order number <b>${esc2(o.orderNumber)}</b>. Expect a screenshot on Telegram/Facebook. When confirmed, open Admin &gt; Orders &gt; Mark as paid.`);
var sendPaidOrderEmail = async (o) => deliver(alertSubject("\u{1F514}", o, paidOrderSubject(o)), adminHtml(o, claimNote(o) + proofNote(o), await contact(), logoAttachment().length > 0), o);
var bakongPaidSubject = (o) => `[Cloudy-Toy] PAID #${o.orderNumber} - ${usd2(payNowCents(o))} - Bakong KHQR (verified)`;
var sendBakongPaidEmail = async (o) => deliver(alertSubject("\u{1F4B0}", o, bakongPaidSubject(o)), adminInvoiceHtml(o, box("#d1f2d1", `<b>\u2705 PAID via Bakong KHQR (verified automatically).</b> <b>${usd2(payNowCents(o))}</b> received for order <b>${esc2(o.orderNumber)}</b>${o.bakongHash ? ` \xB7 transaction ${esc2(o.bakongHash.slice(0, 12))}\u2026` : ""}. Nothing to verify. Pack and ship the order.`), void 0, await contact(), logoAttachment().length > 0), o);
var sendCustomerEmail = async (o, kind) => validEmail(o.customer.email) ? deliver(customerSubject(o, kind), customerHtml(o, kind, void 0, await contact(), logoAttachment().length > 0), o, o.customer.email.trim()) : { status: "SKIPPED", detail: "Customer gave no email address" };
var sendCustomerItemsEmail = async (o, images = {}) => validEmail(o.customer.email) ? deliver(itemsSubject(o), itemsHtml(o, images, void 0, await contact(), logoAttachment().length > 0), o, o.customer.email.trim()) : { status: "SKIPPED", detail: "Customer gave no email address" };

// server/lib/giftEmail.ts
var ref = (g) => ({ orderNumber: `GIFT-${g.redemption.id}`, customer: { name: g.name, email: g.email, phone: g.phone, address: g.address }, items: [{ productId: g.redemption.giftId, sku: "", name: g.redemption.giftName, qty: 1, unitCents: 0, lineCents: 0 }] });
var when = (iso) => new Date(iso).toLocaleString("en-GB", { timeZone: "Asia/Phnom_Penh", dateStyle: "medium", timeStyle: "short" }) + " (Phnom Penh)";
var row = (k, v) => `<tr><td style="padding:6px 0;color:#667085;width:140px">${esc(k)}</td><td style="padding:6px 0;font-weight:700;color:#1d2a55">${v}</td></tr>`;
var shell = (title, intro, g, extraRows, foot) => {
  const r = g.redemption;
  const img = r.giftImage && /^https?:\/\//.test(r.giftImage) ? `<img src="${esc(r.giftImage)}" alt="" width="96" height="96" style="border-radius:14px;object-fit:cover;display:block;margin:0 0 12px"/>` : "";
  return `<!doctype html><html><body style="margin:0;background:#EAF3FF;font-family:Arial,Helvetica,sans-serif;color:#1d2a55"><div style="max-width:560px;margin:0 auto;padding:20px"><div style="background:#fff;border-radius:22px;padding:24px;border:1px solid #D6E6FB">
<h1 style="margin:0 0 6px;font-size:22px;color:#2B1A8F">${esc(title)}</h1><p style="margin:0 0 14px;font-size:15px;line-height:1.5">${intro}</p>${img}
<table style="width:100%;border-collapse:collapse;font-size:14px">${row("Gift", esc(r.giftName))}${row("Points used", `${r.points} pts`)}${row("Points left", `${g.balanceAfter} pts`)}${row("Receipt no.", esc(`GIFT-${r.id}`))}${row("Date", esc(when(r.createdAt)))}${extraRows}</table>
<p style="margin:16px 0 0;font-size:13px;color:#667085;line-height:1.5">${foot}</p></div></div></body></html>`;
};
async function sendGiftAdminEmail(g) {
  const extra = row("Customer", esc(g.name)) + row("Email", esc(g.email)) + row("Phone", esc(g.phone || "-")) + row("Address", esc(g.address || "-")) + (g.facebook ? row("Facebook", esc(g.facebook)) : "") + (g.telegram ? row("Telegram", esc(g.telegram)) : "") + (g.tierName ? row("Level", esc(g.tierName)) : "");
  const html = shell("New gift exchange", `<b>${esc(g.name)}</b> exchanged points for a gift. Please contact them and hand it over, then press <b>Received</b> in Admin &gt; Membership &gt; Gifts.`, g, extra, "Status: waiting for hand-over. If you cancel it in the admin, the points and the stock go back automatically.");
  return deliver(`\u{1F381} Gift exchange ${g.redemption.points} pts | ${g.name.slice(0, 24)} | ${g.redemption.giftName.slice(0, 40)} | GIFT-${g.redemption.id}`, html, ref(g));
}
async function sendGiftCustomerEmail(g) {
  if (!g.email) return { status: "SKIPPED", detail: "No customer email" };
  const html = shell(`Your gift is on its way, ${g.name.split(" ")[0] || "friend"}!`, `Thank you for being part of Cloudy Toys! You exchanged your points for a gift. We will contact you soon to hand it over.`, g, "", `Keep this email as your receipt. Questions? Just reply to this email and we will help you.`);
  return deliver(`Your Cloudy Toys gift receipt (GIFT-${g.redemption.id})`, html, ref(g), g.email);
}

// server/lib/giftStore.ts
var toGift = (r) => ({ id: r.id, name: r.name, description: r.description, points: r.points, wasPoints: r.was_points, stock: r.stock, image: r.image, active: r.active });
var toRed = (r) => ({ id: r.id, email: r.email, customerName: r.customer_name, giftId: r.gift_id, giftName: r.gift_name, giftImage: r.gift_image, points: r.points, status: r.status, createdAt: r.created_at, claimedAt: r.claimed_at });
var newId = () => crypto.randomUUID().slice(0, 12);
async function listGifts(onlyActive = false) {
  let q = db().from("gifts").select("*").order("created_at", { ascending: true });
  if (onlyActive) q = q.eq("active", true);
  return must(await q).map(toGift);
}
async function saveGift(id, v) {
  const row2 = { name: v.name, description: v.description, points: v.points, was_points: v.wasPoints, stock: v.stock, image: v.image, active: v.active };
  if (!id) {
    must(await db().from("gifts").insert({ id: newId(), ...row2 }).select("id"));
    return true;
  }
  return must(await db().from("gifts").update(row2).eq("id", id).select("id")).length > 0;
}
async function getGift(id) {
  const r = must(await db().from("gifts").select("*").eq("id", id).maybeSingle());
  return r ? toGift(r) : null;
}
async function deleteGift(id) {
  must(await db().from("gifts").delete().eq("id", id).select("id"));
}
async function listRedemptions(email) {
  let q = db().from("gift_redemptions").select("*").order("created_at", { ascending: false }).limit(1e3);
  if (email) q = q.eq("email", email.toLowerCase());
  return must(await q).map(toRed);
}
var redeemedPoints = (list) => {
  const m = /* @__PURE__ */ new Map();
  for (const r of list) if (r.status !== "CANCELLED") m.set(r.email.toLowerCase(), (m.get(r.email.toLowerCase()) ?? 0) + r.points);
  return m;
};
async function takeStock(gift) {
  const rows = must(await db().from("gifts").update({ stock: gift.stock - 1 }).eq("id", gift.id).eq("stock", gift.stock).gt("stock", 0).select("id"));
  return rows.length > 0;
}
var giveStock = async (id) => {
  const g = await getGift(id);
  if (g) await db().from("gifts").update({ stock: g.stock + 1 }).eq("id", id).eq("stock", g.stock);
};
var locks = /* @__PURE__ */ new Map();
var serial = (key2, fn) => {
  const run = (locks.get(key2) ?? Promise.resolve()).catch(() => {
  }).then(fn);
  locks.set(key2, run);
  run.finally(() => {
    if (locks.get(key2) === run) locks.delete(key2);
  }).catch(() => {
  });
  return run;
};
function redeemGift(email, name, giftId, earned) {
  const em = email.toLowerCase();
  return serial(em, async () => {
    const gift = await getGift(giftId);
    if (!gift || !gift.active) return { error: "This gift is not available" };
    const spent = redeemedPoints(await listRedemptions(em)).get(em) ?? 0;
    if (earned - spent < gift.points) return { error: "You don't have enough points for this gift yet. Keep collecting!" };
    if (!await takeStock(gift)) return { error: "Oh no, this gift just ran out of stock. Please pick another one!" };
    try {
      const row2 = { id: newId(), email: em, customer_name: name.slice(0, 100), gift_id: gift.id, gift_name: gift.name, gift_image: gift.image, points: gift.points, status: "PENDING" };
      return { ok: toRed(must(await db().from("gift_redemptions").insert(row2).select("*").single())) };
    } catch (e) {
      await giveStock(gift.id);
      throw e;
    }
  });
}
async function setRedemption(id, status) {
  const cur = must(await db().from("gift_redemptions").select("*").eq("id", id).maybeSingle());
  if (!cur || cur.status !== "PENDING") return false;
  const rows = must(await db().from("gift_redemptions").update({ status, claimed_at: status === "CLAIMED" ? (/* @__PURE__ */ new Date()).toISOString() : null }).eq("id", id).eq("status", "PENDING").select("id"));
  if (rows.length > 0 && status === "CANCELLED") await giveStock(cur.gift_id);
  return rows.length > 0;
}

// server/lib/profileStore.ts
var COLS = "id, email, display_name, phone, address, facebook, telegram, avatar_url";
var info = (r, fallbackName = "") => ({ name: r?.display_name ?? fallbackName, phone: r?.phone ?? "", address: r?.address ?? "", facebook: r?.facebook ?? "", telegram: r?.telegram ?? "", avatar: r?.avatar_url ?? "" });
async function getProfile(id, fallbackName = "") {
  const { data } = await db().from("profiles").select(COLS).eq("id", id).maybeSingle();
  return info(data, fallbackName);
}
async function saveProfile(id, email, v) {
  const { error } = await db().from("profiles").upsert({ id, ...email ? { email: email.toLowerCase() } : {}, ...v, updated_at: (/* @__PURE__ */ new Date()).toISOString() });
  if (error) throw new Error(error.message);
}
async function setAvatar(id, email, url) {
  const old = (await db().from("profiles").select("avatar_url").eq("id", id).maybeSingle()).data?.avatar_url ?? "";
  const { error } = await db().from("profiles").upsert({ id, ...email ? { email: email.toLowerCase() } : {}, avatar_url: url || null, updated_at: (/* @__PURE__ */ new Date()).toISOString() });
  if (error) throw new Error(error.message);
  return old;
}
async function profilesByEmail() {
  const out = /* @__PURE__ */ new Map();
  try {
    const { data, error } = await db().from("profiles").select(COLS).not("email", "is", null).limit(5e3);
    if (error) throw error;
    for (const r of data ?? []) if (r.email) out.set(r.email.toLowerCase(), info(r));
  } catch {
  }
  return out;
}

// server/lib/auth.ts
import crypto2 from "node:crypto";

// shared/roles.ts
var ROLES = ["owner", "admin", "editor"];
var isRole = (v) => ROLES.includes(v);
var ALL = ["orders", "products", "pages", "promotions", "settings", "staff"];
var PERMS = { owner: ALL, admin: ALL.filter((p) => p !== "staff"), editor: ["products", "pages"] };
var can = (role, p) => !!role && PERMS[role].includes(p);

// server/lib/staff.ts
var REMOVED = "__removed__";
var isGone = (r) => !!r && r.name === REMOVED;
var toStaff = (r) => ({ email: r.email, name: r.name ?? "", role: isRole(r.role) ? r.role : "editor", active: r.active, lastActiveAt: r.last_active_at, createdAt: r.created_at });
var COLS2 = "email,name,role,active,last_active_at,created_at";
var cache2 = /* @__PURE__ */ new Map();
var seen = /* @__PURE__ */ new Map();
var key = (e) => e.trim().toLowerCase();
var founding = (email) => ADMIN_EMAILS.includes(email);
async function rowFor(email) {
  const k = key(email), hit = cache2.get(k);
  if (hit && Date.now() - hit.at < 3e4) return hit.row;
  const row2 = must(await db().from("staff_members").select(COLS2).eq("email", k).maybeSingle());
  cache2.set(k, { at: Date.now(), row: row2 });
  return row2;
}
async function roleFor(email, verified2) {
  if (!email || !verified2) return null;
  try {
    const r = await rowFor(email);
    if (r) return !isGone(r) && r.active && isRole(r.role) ? r.role : null;
  } catch {
  }
  return isAdminEmail(email, true) ? "owner" : null;
}
async function touchStaff(email, name) {
  if (!email) return;
  const k = key(email);
  if (Date.now() - (seen.get(k) ?? 0) < 6e4) return;
  seen.set(k, Date.now());
  try {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const rows = must(await db().from("staff_members").update({ last_active_at: now }).eq("email", k).select("email"));
    if (!rows.length && founding(k)) must(await db().from("staff_members").insert({ email: k, role: "owner", last_active_at: now, ...name ? { name } : {} }).select("email"));
    cache2.delete(k);
  } catch {
  }
}
async function listStaff() {
  let all2 = [], ready2 = true;
  try {
    all2 = must(await db().from("staff_members").select(COLS2).order("created_at", { ascending: true }));
  } catch (e) {
    ready2 = false;
    console.error("[staff list]", e instanceof Error ? e.message : e);
  }
  const have = new Set(all2.map((r) => r.email));
  const owners = ADMIN_EMAILS.filter((e) => !have.has(e)).map((email) => ({ email, name: "", role: "owner", active: true, lastActiveAt: null, createdAt: "" }));
  const staff = [...all2.filter((r) => !isGone(r)).map(toStaff), ...owners].sort((a, b) => Number(b.role === "owner") - Number(a.role === "owner") || a.createdAt.localeCompare(b.createdAt));
  return { staff, ready: ready2 };
}
var SETUP = "The staff table is missing. Open Supabase > SQL Editor, paste supabase/setup_all.sql and click Run (safe to run again), then reload.";
var missing = (e) => /does not exist|schema cache|could not find the table|relation .* does not exist/i.test(e instanceof Error ? e.message : String(e));
async function guarded(fn) {
  try {
    return await fn();
  } catch (e) {
    if (missing(e)) return SETUP;
    throw e;
  }
}
var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
var LAST_OWNER = "There must always be at least one active owner.";
var cleanName = (v) => {
  const n = String(v ?? "").trim().slice(0, 80);
  return n === REMOVED ? "" : n;
};
var lastOwner = (staff, email) => !staff.some((s) => s.email !== email && s.role === "owner" && s.active);
var addStaff = (i) => guarded(() => addStaffRaw(i));
async function addStaffRaw(i) {
  const email = key(String(i.email ?? ""));
  if (!EMAIL.test(email) || email.length > 200) return "Enter a valid email address";
  if (!isRole(i.role)) return "Choose a role: Owner, Admin or Editor";
  const { staff } = await listStaff();
  if (staff.some((s) => s.email === email)) return "That email is already on the team";
  const old = await rowFor(email).catch(() => null);
  cache2.delete(email);
  if (isGone(old)) must(await db().from("staff_members").update({ name: cleanName(i.name), role: i.role, active: true, last_active_at: null }).eq("email", email).select("email"));
  else must(await db().from("staff_members").insert({ email, name: cleanName(i.name), role: i.role, active: true }).select("email"));
  cache2.delete(email);
  return null;
}
var updateStaff = (i) => guarded(() => updateStaffRaw(i));
async function updateStaffRaw(i) {
  const email = key(String(i.email ?? ""));
  const patch = {};
  if (i.name !== void 0) patch.name = cleanName(i.name);
  if (i.role !== void 0) {
    if (!isRole(i.role)) return "Choose a role: Owner, Admin or Editor";
    patch.role = i.role;
  }
  if (i.active !== void 0) patch.active = i.active === true;
  const { staff } = await listStaff();
  const cur = staff.find((s) => s.email === email);
  if (!cur) return "Staff member not found";
  if (cur.role === "owner" && cur.active && ((patch.role ?? "owner") !== "owner" || patch.active === false) && lastOwner(staff, email)) return LAST_OWNER;
  const row2 = await rowFor(email).catch(() => null);
  must(await db().from("staff_members").upsert({ email, ...row2 ? {} : { role: "owner", name: "" }, ...patch }, { onConflict: "email" }).select("email"));
  cache2.delete(email);
  return null;
}
var deleteStaff = (emailIn) => guarded(() => deleteStaffRaw(emailIn));
async function deleteStaffRaw(emailIn) {
  const email = key(emailIn);
  const { staff } = await listStaff();
  const cur = staff.find((s) => s.email === email);
  if (!cur) return null;
  if (cur.role === "owner" && cur.active && lastOwner(staff, email)) return LAST_OWNER;
  if (founding(email)) must(await db().from("staff_members").upsert({ email, name: REMOVED, role: "editor", active: false }, { onConflict: "email" }).select("email"));
  else must(await db().from("staff_members").delete().eq("email", email).select("email"));
  cache2.delete(email);
  return null;
}

// server/lib/auth.ts
var verified = /* @__PURE__ */ new Map();
var checking = /* @__PURE__ */ new Map();
var jwtExpiryMs = (token) => {
  try {
    const p = JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64url").toString("utf8"));
    return typeof p.exp === "number" ? p.exp * 1e3 : 0;
  } catch {
    return 0;
  }
};
async function verifyToken(token) {
  const k = crypto2.createHash("sha256").update(token).digest("hex"), now = Date.now(), hit = verified.get(k);
  if (hit && hit.until > now) return hit.user;
  const running = checking.get(k);
  if (running) return running;
  const p = (async () => {
    try {
      const { data, error } = await db().auth.getUser(token);
      if (error || !data.user) return null;
      const exp = jwtExpiryMs(token);
      const until = Math.min(Date.now() + 6e4, exp || 0);
      if (until > Date.now()) {
        if (verified.size > 1e3) verified.clear();
        verified.set(k, { user: data.user, until });
      }
      return data.user;
    } catch {
      return null;
    } finally {
      checking.delete(k);
    }
  })();
  checking.set(k, p);
  return p;
}
async function userFromReq(req) {
  const h2 = String(req.headers.authorization ?? "");
  const token = h2.startsWith("Bearer ") ? h2.slice(7).trim() : "";
  return token ? verifyToken(token) : null;
}
var adminOrNull = async (req) => {
  const u = await userFromReq(req);
  if (!u) return null;
  const role = await roleFor(u.email, !!u.email_confirmed_at);
  return role ? { user: u, role } : null;
};
async function requireAdmin(req, res, next) {
  const a = await adminOrNull(req);
  if (!a) return res.status(404).json({ error: "Not found" });
  Object.assign(req, { admin: a.user, role: a.role });
  const m = a.user.user_metadata ?? {};
  await touchStaff(a.user.email, m.full_name || m.name);
  next();
}
var needs = (p) => (req, res, next) => can(roleOf(req), p) ? next() : res.status(403).json({ error: "Your role cannot do this." });
async function requireUser(req, res, next) {
  const u = await userFromReq(req);
  if (!u) return res.status(401).json({ error: "Sign in required" });
  req.user = u;
  next();
}
var adminOf = (req) => req.admin;
var userOf = (req) => req.user;
var roleOf = (req) => req.role;

// shared/membership.ts
var PERK_KINDS = ["percent", "amount", "free_shipping", "custom"];
var MAX_LEVEL_DESCRIPTION = 1e3;
var MAX_TIERS = 10;
var MAX_PERKS = 12;
var MAX_MONTHLY_LIMIT = 999;
var DEFAULT_POINT_CENTS = 1e3;
var isPointCents = (n) => typeof n === "number" && Number.isInteger(n) && n >= 100 && n <= 1e7;
var DEFAULT_UPGRADE_CENTS = [0, 4500, 1e4, 15e3];
function layoutTiers(tiers, _pointCents = DEFAULT_POINT_CENTS) {
  const out = [];
  tiers.forEach((t, i) => {
    const prev = out[i - 1];
    const single = Math.max(1, Math.round(t.singleOrderCents || DEFAULT_UPGRADE_CENTS[i] || 1e4 * (i + 1)));
    out.push(i === 0 || !prev ? { ...t, pointsMore: 0, singleOrderCents: 0 } : { ...t, pointsMore: 0, singleOrderCents: single, minSpendCents: prev.minSpendCents + single });
  });
  return out;
}
var mk = (id, kind, o = {}) => ({ id, kind, title: "", percent: 0, amountCents: 0, minSpendCents: 0, active: true, monthlyLimit: 0, onPromo: false, detail: "", image: "", ...o });
var earn = mk("pts", "custom", { title: "Earn points to redeem gifts!" });
var DEFAULT_TIERS = layoutTiers([
  { id: "bronze", singleOrderCents: 0, name: "Bronze", emoji: "\u{1F949}", image: "", description: "", minSpendCents: 3e3, pointsMore: 0, specialName: "", perks: [earn], active: true },
  { id: "silver", singleOrderCents: 4500, name: "Silver", emoji: "\u{1F948}", image: "", description: "", minSpendCents: 0, pointsMore: 0, specialName: "Silver", perks: [mk("disc", "percent", { title: "Silver", percent: 5, minSpendCents: 1e3 }), earn], active: true },
  { id: "gold", singleOrderCents: 1e4, name: "Gold", emoji: "\u{1F947}", image: "", description: "", minSpendCents: 0, pointsMore: 0, specialName: "Gold", perks: [mk("disc", "percent", { title: "Gold", percent: 10, minSpendCents: 1e3 }), earn], active: true },
  { id: "platinum", singleOrderCents: 15e3, name: "Platinum", emoji: "\u{1F48E}", image: "", description: "", minSpendCents: 0, pointsMore: 0, specialName: "Platinum", perks: [mk("disc", "percent", { title: "Platinum", percent: 15 }), mk("ship", "free_shipping", { title: "Platinum", minSpendCents: 6e3 }), earn], active: true }
]);
var num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
};
var idOk = (v) => typeof v === "string" && /^[a-z0-9-]{1,24}$/.test(v);
var newId2 = () => Math.random().toString(36).slice(2, 10);
function checkPerk(i, tierName) {
  const kind = i.kind;
  const title = kind !== "custom" && tierName ? tierName : String(i.title ?? "").trim();
  if (!PERK_KINDS.includes(kind)) return { ok: false, error: "Choose a special type" };
  if (title.length < 2 || title.length > 60) return { ok: false, error: kind === "custom" ? "Write what the member gets (2 to 60 characters)" : "Special name needs 2 to 60 characters" };
  const minSpendCents = Math.round(num(i.minSpend ?? 0) * 100);
  if (!Number.isFinite(minSpendCents) || minSpendCents < 0 || minSpendCents > 1e7) return { ok: false, error: "Minimum order must be $0 or more" };
  const monthlyLimit = i.monthlyLimit === void 0 || i.monthlyLimit === "" || i.monthlyLimit === null ? 0 : num(i.monthlyLimit);
  if (!Number.isInteger(monthlyLimit) || monthlyLimit < 0 || monthlyLimit > MAX_MONTHLY_LIMIT) return { ok: false, error: `Monthly limit must be a whole number from 0 to ${MAX_MONTHLY_LIMIT} (0 = no limit)` };
  const detail = kind === "custom" ? String(i.detail ?? "").trim() : "";
  if (detail.length > 500) return { ok: false, error: "Special detail is too long (500 characters at most)" };
  const image = kind === "custom" ? String(i.image ?? "").trim() : "";
  if (image.length > 600 || image && !/^(\/|https?:\/\/)/.test(image)) return { ok: false, error: "Special picture is not valid" };
  const base = { id: idOk(i.id) ? String(i.id) : newId2(), kind, title, percent: 0, amountCents: 0, minSpendCents, active: i.active !== false, monthlyLimit, onPromo: i.onPromo !== false && i.onPromo !== "false", detail, image };
  if (kind === "percent") {
    const percent = num(i.percent);
    if (!Number.isInteger(percent) || percent < 1 || percent > 90) return { ok: false, error: "Discount % must be a whole number from 1 to 90" };
    return { ok: true, value: { ...base, percent } };
  }
  if (kind === "amount") {
    const amountCents = Math.round(num(i.amount) * 100);
    if (!Number.isFinite(amountCents) || amountCents < 1 || amountCents > 1e7) return { ok: false, error: "Discount amount must be more than $0" };
    if (minSpendCents > 0 && amountCents >= minSpendCents) return { ok: false, error: "Discount amount must be smaller than the minimum order" };
    return { ok: true, value: { ...base, amountCents } };
  }
  return { ok: true, value: base };
}
function checkTier(i) {
  const name = String(i.name ?? "").trim(), emoji = String(i.emoji ?? "").trim();
  const noSpend = i.minSpend === void 0 || i.minSpend === null || i.minSpend === "", minSpendCents = noSpend ? 0 : Math.round(num(i.minSpend) * 100);
  const noSingle = i.singleOrder === void 0 || i.singleOrder === null || i.singleOrder === "", singleOrderCents = noSingle ? 0 : Math.round(num(i.singleOrder) * 100);
  if (name.length < 2 || name.length > 30) return { ok: false, error: "Level name needs 2 to 30 characters" };
  if (emoji.length > 8) return { ok: false, error: "Icon can be one emoji" };
  const image = String(i.image ?? "").trim();
  if (image.length > 600 || image && !/^(\/|https?:\/\/)/.test(image)) return { ok: false, error: "Level picture is not valid" };
  if (!noSpend && (!Number.isFinite(minSpendCents) || minSpendCents < 1 || minSpendCents > 1e8)) return { ok: false, error: "Spend to reach this level must be more than $0" };
  if (!noSingle && (!Number.isFinite(singleOrderCents) || singleOrderCents < 1 || singleOrderCents > 1e8)) return { ok: false, error: "The one-order amount to upgrade must be more than $0" };
  const specialName = String(i.specialName ?? "").trim();
  if (specialName.length > 60) return { ok: false, error: "Name shown to the customer is too long (60 characters at most)" };
  const description = String(i.description ?? "").replace(/\r\n/g, "\n").trim();
  if (description.length > MAX_LEVEL_DESCRIPTION) return { ok: false, error: `The level description is too long (${MAX_LEVEL_DESCRIPTION} characters at most)` };
  const raw = Array.isArray(i.perks) ? i.perks : [];
  if (raw.length > MAX_PERKS) return { ok: false, error: `At most ${MAX_PERKS} specials per level` };
  const perks = [];
  for (const p of raw) {
    const c = checkPerk(p ?? {}, specialName || name);
    if (!c.ok) return c;
    perks.push(c.value);
  }
  return { ok: true, value: { id: idOk(i.id) ? String(i.id) : newId2(), name, emoji, image, minSpendCents, pointsMore: 0, singleOrderCents, specialName, description, perks, active: i.active !== false } };
}
function normalizeTiers(v, pointCents = DEFAULT_POINT_CENTS) {
  if (!Array.isArray(v)) return layoutTiers(DEFAULT_TIERS, pointCents);
  const out = [];
  for (const x of v) {
    const t = x ?? {};
    const c = checkTier({ id: t.id, description: t.description, name: t.name, emoji: t.emoji, image: t.image, minSpend: (t.minSpendCents ?? 0) / 100 || void 0, singleOrder: (t.singleOrderCents ?? 0) / 100 || void 0, specialName: t.specialName ?? (Array.isArray(t.perks) ? t.perks.find((p) => p && p.kind !== "custom" && typeof p.title === "string")?.title : void 0), active: t.active, perks: (Array.isArray(t.perks) ? t.perks : []).map((p) => {
      const q = p ?? {};
      return { id: q.id, kind: q.kind, title: q.title, percent: q.percent, amount: (q.amountCents ?? 0) / 100, minSpend: (q.minSpendCents ?? 0) / 100, active: q.active, monthlyLimit: q.monthlyLimit, onPromo: q.onPromo, detail: q.detail, image: q.image };
    }) });
    if (c.ok && !out.some((o) => o.id === c.value.id)) out.push(c.value);
  }
  const kept = out.slice(0, MAX_TIERS);
  if (kept[0] && kept[0].minSpendCents < 1) kept[0].minSpendCents = DEFAULT_TIERS[0].minSpendCents;
  return layoutTiers(kept, pointCents);
}
function pointsOf(spendCents, tiers, pointCents = DEFAULT_POINT_CENTS) {
  const first = tiers?.[0];
  if (!first || spendCents < first.minSpendCents) return 0;
  return Math.floor((spendCents - first.minSpendCents) / pointCents);
}
var memberSpendOf = (orders) => orders.reduce((s, o) => o.paymentStatus === "PAID" ? s + Math.max(0, o.totalCents - o.shippingCents) : s, 0);
var live = (tiers) => (tiers ?? []).filter((t) => t.active).sort((a, b) => a.minSpendCents - b.minSpendCents);
function tierByOrders(orders, tiers) {
  const ladder = live(tiers);
  if (ladder.length === 0) return null;
  let idx = -1, total = 0;
  const paid = orders.filter((o) => o.paymentStatus === "PAID").sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));
  for (const o of paid) {
    const goods = Math.max(0, o.totalCents - o.shippingCents);
    if (idx < 0) {
      total += goods;
      if (total >= ladder[0].minSpendCents) idx = 0;
      continue;
    }
    while (ladder[idx + 1] && ladder[idx + 1].singleOrderCents > 0 && goods >= ladder[idx + 1].singleOrderCents) idx++;
  }
  return idx >= 0 ? ladder[idx] : null;
}
var levelAfter = (tier, tiers) => {
  const l = live(tiers);
  const i = tier ? l.findIndex((x) => x.id === tier.id) : -1;
  return l[i + 1] ?? null;
};
var shopMonth = (d2 = Date.now()) => new Date(new Date(d2).getTime() + 7 * 36e5).toISOString().slice(0, 7);
function monthUsage(orders, month = shopMonth()) {
  const out = {};
  for (const o of orders) {
    if (!o.createdAt || shopMonth(o.createdAt) !== month || ["FAILED", "EXPIRED", "REFUNDED"].includes(o.paymentStatus)) continue;
    for (const id of o.memberPerks ?? []) out[id] = (out[id] ?? 0) + 1;
  }
  return out;
}
function memberBenefits(tier, cart, used = {}) {
  const out = [], perks = [], shipPerks = [];
  const pre = Math.max(0, cart.preorderCents ?? 0), eff = Math.max(0, cart.subtotalCents - pre);
  let left = Math.min(Math.max(0, cart.leftCents), eff), freeShipping = false;
  if (!tier) return { discounts: out, freeShipping, perks, shipPerks };
  for (const p of tier.perks) {
    if (!p.active || eff < p.minSpendCents) continue;
    if (p.monthlyLimit > 0 && (used[p.id] ?? 0) >= p.monthlyLimit) continue;
    if (p.kind === "free_shipping") {
      if (pre > 0) continue;
      freeShipping = true;
      shipPerks.push(p.id);
      continue;
    }
    const base = p.onPromo ? eff : Math.min(eff, Math.max(0, cart.fullPriceCents ?? eff));
    const want = p.kind === "percent" ? Math.round(base * p.percent / 100) : p.kind === "amount" ? Math.min(p.amountCents, base) : 0;
    const cents = Math.min(want, left);
    if (cents > 0) {
      out.push({ id: `member-${tier.id}-${p.id}`, name: p.title === tier.name ? `${tier.name} member` : `${tier.name} member: ${p.title}`, cents });
      perks.push(p.id);
      left -= cents;
    }
  }
  return { discounts: out, freeShipping, perks, shipPerks };
}

// shared/promotions.ts
var DEFAULT_PREORDER = { depositPercent: 50, dispatchText: "10 - 14 Business Days", capSlots: 50 };
var CAMPAIGN_KINDS = ["spend_amount", "spend_percent", "spend_gift", "category_percent", "category_amount", "product_percent", "product_amount", "bogo", "free_shipping"];
var DEFAULT_PROMOTIONS = { preorder: DEFAULT_PREORDER, campaigns: [], festivals: [], membership: DEFAULT_TIERS, memberPointCents: DEFAULT_POINT_CENTS };
var MAX_CAMPAIGNS = 20;
var MAX_FESTIVALS = 20;
var MAX_FESTIVAL_PRODUCTS = 500;
var cleanImage = (v) => {
  const s = String(v ?? "").trim();
  return s === "" ? "" : s.length <= 300 && /^(\/api\/img\/[a-z0-9-]+\.(webp|jpg|png)|https:\/\/[^\s"'<>]+)$/.test(s) ? s : null;
};
var int2 = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
};
function checkPreorder(i) {
  const depositPercent = int2(i.depositPercent), capSlots = int2(i.capSlots), dispatchText = String(i.dispatchText ?? "").trim();
  if (!Number.isInteger(depositPercent) || depositPercent < 1 || depositPercent > 100) return { ok: false, error: "Required deposit must be a whole number from 1 to 100" };
  if (dispatchText.length < 2 || dispatchText.length > 60) return { ok: false, error: "Estimated dispatch timeline needs 2 to 60 characters (e.g. 10 - 14 Business Days)" };
  if (!Number.isInteger(capSlots) || capSlots < 1 || capSlots > 1e5) return { ok: false, error: "Pre-order cap slot limit must be a whole number from 1 to 100000" };
  return { ok: true, value: { depositPercent, dispatchText, capSlots } };
}
var isoDay0 = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && (/* @__PURE__ */ new Date(`${v}T00:00:00Z`)).toISOString().slice(0, 10) === v;
function checkCampaign(i) {
  const name = String(i.name ?? "").trim(), kind = i.kind;
  if (name.length < 2 || name.length > 60) return { ok: false, error: "Campaign name needs 2 to 60 characters" };
  if (!CAMPAIGN_KINDS.includes(kind)) return { ok: false, error: "Choose a campaign type" };
  const startDate = String(i.startDate ?? "").trim(), endDate = String(i.endDate ?? "").trim();
  if (startDate === "" !== (endDate === "")) return { ok: false, error: "Set both the start date and the end date, or leave both empty" };
  if (startDate && (!isoDay0(startDate) || !isoDay0(endDate))) return { ok: false, error: "Dates must be real calendar dates" };
  if (startDate && endDate < startDate) return { ok: false, error: "The end date cannot be before the start date" };
  const usesSpend = kind === "spend_amount" || kind === "spend_percent" || kind === "spend_gift" || kind === "free_shipping";
  const minSpendCents = usesSpend ? Math.round(int2(i.minSpend ?? 0) * 100) : 0, amountCents = Math.round(int2(i.amount ?? 0) * 100), percent = int2(i.percent ?? 0), category = String(i.category ?? "").trim();
  const image = cleanImage(i.image);
  if (image === null) return { ok: false, error: "The offer picture is not valid. Upload it again." };
  const base = { image, name, kind, minSpendCents, amountCents: 0, percent: 0, category: "", startDate, endDate, productIds: [], buyQty: 0, buyType: "category", buyTarget: "", getQty: 0, bonusProductId: "", minQty: 0, area: "all" };
  if (usesSpend && (!Number.isFinite(minSpendCents) || minSpendCents < 0 || minSpendCents > 1e7)) return { ok: false, error: "Minimum spend must be $0 or more" };
  if (kind === "spend_amount") {
    if (!Number.isFinite(amountCents) || amountCents < 1 || amountCents > 1e7) return { ok: false, error: "Discount amount must be more than $0" };
    if (minSpendCents > 0 && amountCents >= minSpendCents) return { ok: false, error: "Discount amount must be smaller than the minimum spend" };
    return { ok: true, value: { ...base, amountCents } };
  }
  if (kind === "category_amount" || kind === "product_amount") {
    if (!Number.isFinite(amountCents) || amountCents < 1 || amountCents > 1e7) return { ok: false, error: "Discount amount must be more than $0" };
    if (kind === "category_amount") {
      if (category.length < 1 || category.length > 40) return { ok: false, error: "Choose the category this discount applies to" };
      return { ok: true, value: { ...base, amountCents, category } };
    }
    const ids = [...new Set((Array.isArray(i.productIds) ? i.productIds : []).map((x) => String(x)).filter((x) => x.length > 0 && x.length <= 64))];
    if (ids.length < 1) return { ok: false, error: "Pick at least one product for this discount" };
    if (ids.length > MAX_FESTIVAL_PRODUCTS) return { ok: false, error: `At most ${MAX_FESTIVAL_PRODUCTS} products per rule` };
    return { ok: true, value: { ...base, amountCents, productIds: ids } };
  }
  if (kind === "spend_gift") {
    const bonusProductId = String(i.bonusProductId ?? "").trim(), getQty = i.getQty === void 0 || i.getQty === "" ? 1 : int2(i.getQty);
    if (minSpendCents < 1) return { ok: false, error: "Minimum spend must be more than $0 for a free gift" };
    if (!Number.isInteger(getQty) || getQty < 1 || getQty > 20) return { ok: false, error: "Free gift quantity must be a whole number from 1 to 20" };
    if (bonusProductId.length < 1 || bonusProductId.length > 64) return { ok: false, error: "Choose the free gift product" };
    return { ok: true, value: { ...base, minSpendCents, getQty, bonusProductId } };
  }
  if (kind === "spend_percent" || kind === "category_percent" || kind === "product_percent") {
    if (!Number.isInteger(percent) || percent < 1 || percent > 90) return { ok: false, error: "Discount % must be a whole number from 1 to 90" };
    if (kind === "category_percent") {
      if (category.length < 1 || category.length > 40) return { ok: false, error: "Choose the category this discount applies to" };
      return { ok: true, value: { ...base, percent, category } };
    }
    if (kind === "product_percent") {
      const ids = [...new Set((Array.isArray(i.productIds) ? i.productIds : []).map((x) => String(x)).filter((x) => x.length > 0 && x.length <= 64))];
      if (ids.length < 1) return { ok: false, error: "Pick at least one product for this discount" };
      if (ids.length > MAX_FESTIVAL_PRODUCTS) return { ok: false, error: `At most ${MAX_FESTIVAL_PRODUCTS} products per rule` };
      return { ok: true, value: { ...base, percent, productIds: ids } };
    }
    return { ok: true, value: { ...base, percent } };
  }
  if (kind === "bogo") {
    const buyQty = int2(i.buyQty), getQty = int2(i.getQty), buyType = i.buyType === "product" ? "product" : "category", buyTarget = String(i.buyTarget ?? "").trim(), bonusProductId = String(i.bonusProductId ?? "").trim();
    if (!Number.isInteger(buyQty) || buyQty < 1 || buyQty > 99) return { ok: false, error: "Customer buys qty (X) must be a whole number from 1 to 99" };
    if (!Number.isInteger(getQty) || getQty < 1 || getQty > 20) return { ok: false, error: "Customer gets qty (Y) must be a whole number from 1 to 20" };
    if (buyTarget.length < 1 || buyTarget.length > 64) return { ok: false, error: "Choose the category or product the customer must buy" };
    if (bonusProductId.length < 1 || bonusProductId.length > 64) return { ok: false, error: "Choose the free bonus product" };
    return { ok: true, value: { ...base, buyQty, getQty, buyType, buyTarget, bonusProductId } };
  }
  const cond = String(i.minQty !== void 0 && int2(i.minQty) > 0 ? "qty" : minSpendCents > 0 ? "spend" : "none"), minQty = cond === "qty" ? int2(i.minQty) : 0;
  if (cond === "qty" && (!Number.isInteger(minQty) || minQty < 1 || minQty > 99)) return { ok: false, error: "Minimum item count must be a whole number from 1 to 99" };
  return { ok: true, value: { ...base, minSpendCents: cond === "spend" ? minSpendCents : 0, minQty, area: i.area === "PHNOM_PENH" ? "PHNOM_PENH" : "all" } };
}
function normalizePromotions(v) {
  const o = v && typeof v === "object" ? v : {};
  const pre = checkPreorder({ ...DEFAULT_PREORDER, ...o.preorder ?? {} });
  const campaigns = (Array.isArray(o.campaigns) ? o.campaigns : []).flatMap((c) => {
    const x = c;
    if (!x || typeof x.id !== "string" || !CAMPAIGN_KINDS.includes(x.kind)) return [];
    const chk = checkCampaign({ name: x.name, kind: x.kind, minSpend: (x.minSpendCents ?? 0) / 100, amount: (x.amountCents ?? 0) / 100, percent: x.percent, category: x.category, startDate: x.startDate, endDate: x.endDate, productIds: x.productIds, buyQty: x.buyQty, buyType: x.buyType, buyTarget: x.buyTarget, getQty: x.getQty, bonusProductId: x.bonusProductId, minQty: x.minQty, area: x.area, image: x.image });
    return chk.ok ? [{ ...chk.value, id: x.id, active: x.active !== false, createdAt: String(x.createdAt ?? "") }] : [];
  }).slice(0, MAX_CAMPAIGNS);
  const festivals = (Array.isArray(o.festivals) ? o.festivals : []).flatMap((f) => {
    const x = f;
    if (!x || typeof x.id !== "string") return [];
    const chk = checkFestival({ name: x.name, nameKm: x.nameKm, text: x.text, textKm: x.textKm, code: x.code, startDate: x.startDate, endDate: x.endDate, percent: x.percent, productIds: x.productIds, image: x.image });
    return chk.ok ? [{ ...chk.value, id: x.id, active: x.active !== false, createdAt: String(x.createdAt ?? "") }] : [];
  }).slice(0, MAX_FESTIVALS);
  const memberPointCents = isPointCents(o.memberPointCents) ? o.memberPointCents : DEFAULT_POINT_CENTS;
  return { preorder: pre.ok ? pre.value : DEFAULT_PREORDER, campaigns, festivals, membership: normalizeTiers(o.membership, memberPointCents), memberPointCents };
}
function campaignLive(c, now = Date.now()) {
  if (!c.active) return false;
  if (!c.startDate || !c.endDate) return true;
  const d2 = shopToday(now);
  return d2 >= c.startDate && d2 <= c.endDate;
}
var liveCampaigns = (cs, now = Date.now()) => (cs ?? []).filter((c) => campaignLive(c, now));
var isoDay2 = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && (/* @__PURE__ */ new Date(`${v}T00:00:00Z`)).toISOString().slice(0, 10) === v;
function checkFestival(i) {
  const name = String(i.name ?? "").trim(), nameKm = String(i.nameKm ?? "").trim(), text = String(i.text ?? "").trim(), textKm = String(i.textKm ?? "").trim();
  const startDate = String(i.startDate ?? "").trim(), endDate = String(i.endDate ?? "").trim(), percent = i.percent === "" || i.percent == null ? 0 : int2(i.percent);
  if (name.length < 2 || name.length > 60) return { ok: false, error: "Festival / event name needs 2 to 60 characters" };
  if (nameKm.length > 60) return { ok: false, error: "Khmer name can have at most 60 characters" };
  if (text.length > 600 || textKm.length > 600) return { ok: false, error: "Promotion text can have at most 600 characters" };
  if (startDate === "" !== (endDate === "")) return { ok: false, error: "Set both the start date and the end date, or leave both empty" };
  if (startDate && (!isoDay2(startDate) || !isoDay2(endDate))) return { ok: false, error: "Dates must be real calendar dates" };
  if (startDate && endDate < startDate) return { ok: false, error: "The end date cannot be before the start date" };
  if (!Number.isInteger(percent) || percent < 0 || percent > 90) return { ok: false, error: "Discount % must be a whole number from 0 to 90 (0 = no discount, just show the products)" };
  const code = String(i.code ?? "").trim().toUpperCase();
  if (code && !/^[A-Z0-9_-]{3,30}$/.test(code)) return { ok: false, error: "Event code needs 3 to 30 letters, numbers, - or _" };
  const ids = Array.isArray(i.productIds) ? i.productIds : [];
  const productIds = [...new Set(ids.map((x) => String(x)).filter((x) => x.length > 0 && x.length <= 64))];
  if (productIds.length > MAX_FESTIVAL_PRODUCTS) return { ok: false, error: `At most ${MAX_FESTIVAL_PRODUCTS} products per offer` };
  const image = cleanImage(i.image);
  if (image === null) return { ok: false, error: "The offer picture is not valid. Upload it again." };
  return { ok: true, value: { name, nameKm, text, textKm, code, startDate, endDate, percent, productIds, image } };
}
function festivalPhase(f, now = Date.now()) {
  if (!f.active) return "paused";
  if (!f.startDate || !f.endDate) return "live";
  const d2 = shopToday(now);
  return d2 < f.startDate ? "upcoming" : d2 > f.endDate ? "ended" : "live";
}
var liveFestivals = (festivals, now = Date.now()) => (festivals ?? []).filter((f) => festivalPhase(f, now) === "live");
function autoDiscounts(lines, campaigns, festivals = [], now = Date.now()) {
  const subtotal = lines.reduce((s, l) => s + l.lineCents, 0);
  let left = subtotal;
  const out = [];
  for (const c of liveCampaigns(campaigns, now)) {
    let cents = 0;
    if (c.kind === "spend_amount") cents = subtotal >= c.minSpendCents ? c.amountCents : 0;
    else if (c.kind === "spend_percent") cents = subtotal >= c.minSpendCents ? Math.round(subtotal * c.percent / 100) : 0;
    else if (c.kind === "category_percent") {
      const base = lines.filter((l) => l.category.trim().toLowerCase() === c.category.trim().toLowerCase()).reduce((s, l) => s + l.lineCents, 0);
      cents = Math.round(base * c.percent / 100);
    } else if (c.kind === "category_amount") {
      const units = lines.filter((l) => l.category.trim().toLowerCase() === c.category.trim().toLowerCase()).reduce((n, l) => n + (l.qty ?? 1), 0);
      cents = Math.min(units * c.amountCents, lines.filter((l) => l.category.trim().toLowerCase() === c.category.trim().toLowerCase()).reduce((s, l) => s + l.lineCents, 0));
    } else if (c.kind === "product_amount") {
      const ids = new Set(c.productIds ?? []);
      const hit = lines.filter((l) => l.productId && ids.has(l.productId));
      cents = Math.min(hit.reduce((n, l) => n + (l.qty ?? 1), 0) * c.amountCents, hit.reduce((s, l) => s + l.lineCents, 0));
    } else if (c.kind === "product_percent") {
      const ids = new Set(c.productIds ?? []);
      const base = lines.filter((l) => l.productId && ids.has(l.productId)).reduce((s, l) => s + l.lineCents, 0);
      cents = Math.round(base * c.percent / 100);
    }
    cents = Math.min(cents, left);
    if (cents > 0) {
      out.push({ id: c.id, name: c.name, cents });
      left -= cents;
    }
  }
  for (const f of liveFestivals(festivals, now)) {
    if (f.percent <= 0) continue;
    const ids = new Set(f.productIds);
    const base = lines.filter((l) => l.productId && ids.has(l.productId)).reduce((s, l) => s + l.lineCents, 0);
    const cents = Math.min(Math.round(base * f.percent / 100), left);
    if (cents > 0) {
      out.push({ id: `fest-${f.id}`, name: f.name, cents });
      left -= cents;
    }
  }
  return out;
}
function productPromo(p, campaigns, festivals = [], now = Date.now()) {
  const cat = (p.category ?? "").trim().toLowerCase();
  const hits2 = liveCampaigns(campaigns, now).filter((c) => (c.kind === "category_percent" || c.kind === "category_amount") && c.category.trim().toLowerCase() === cat || (c.kind === "product_percent" || c.kind === "product_amount") && !!p.id && (c.productIds ?? []).includes(p.id));
  const festivalHits = p.id ? liveFestivals(festivals, now).filter((f) => f.productIds.includes(p.id)) : [];
  const baseCents = Math.round((p.salePrice ?? p.price) * 100);
  let left = baseCents, offCents = 0;
  for (const c of hits2) {
    const x = Math.min(c.kind === "category_amount" || c.kind === "product_amount" ? c.amountCents : Math.round(baseCents * c.percent / 100), left);
    offCents += x;
    left -= x;
  }
  for (const f of festivalHits) {
    const x = Math.min(Math.round(baseCents * f.percent / 100), left);
    offCents += x;
    left -= x;
  }
  return { hits: hits2, festivalHits, baseCents, offCents, finalCents: baseCents - offCents, percent: baseCents > 0 ? Math.round(offCents * 100 / baseCents) : 0 };
}
function fullPriceCents(lines, campaigns, festivals = [], now = Date.now()) {
  return lines.reduce((s, l) => {
    if (l.p.preorder || l.p.labels?.includes("preorder") || typeof l.p.stock === "number" && l.p.stock <= 0) return s;
    const x = productPromo(l.p, campaigns, festivals, now);
    return l.p.salePrice != null || x.offCents > 0 || x.festivalHits.length > 0 ? s : s + l.lineCents;
  }, 0);
}
function codeEligibleCents(lines, campaigns, festivals = [], now = Date.now()) {
  return lines.reduce((s, l) => {
    if (l.p.preorder || l.p.labels?.includes("preorder")) return s;
    const x = productPromo(l.p, campaigns, festivals, now);
    return l.p.salePrice != null || x.offCents > 0 || x.festivalHits.length > 0 ? s : s + l.lineCents;
  }, 0);
}
function bogoGifts(lines, campaigns, now = Date.now()) {
  const out = [];
  const subtotal = lines.reduce((s, l) => s + (l.lineCents ?? 0), 0);
  for (const c of liveCampaigns(campaigns, now)) {
    if (c.kind === "spend_gift") {
      if (c.bonusProductId && c.minSpendCents > 0 && subtotal >= c.minSpendCents) out.push({ campaignId: c.id, name: c.name, productId: c.bonusProductId, qty: Math.min(c.getQty || 1, 99) });
      continue;
    }
    if (c.kind !== "bogo" || !c.buyQty || !c.getQty || !c.bonusProductId) continue;
    const have = lines.filter((l) => c.buyType === "product" ? l.productId === c.buyTarget : l.category.trim().toLowerCase() === (c.buyTarget ?? "").trim().toLowerCase()).reduce((n, l) => n + l.qty, 0);
    const qty2 = Math.min(Math.floor(have / c.buyQty) * c.getQty, 99);
    if (qty2 > 0) out.push({ campaignId: c.id, name: c.name, productId: c.bonusProductId, qty: qty2 });
  }
  return out;
}
function freeShippingRule(cart, campaigns, now = Date.now()) {
  return liveCampaigns(campaigns, now).find((c) => c.kind === "free_shipping" && (c.area !== "PHNOM_PENH" || cart.area === "PHNOM_PENH") && ((c.minQty ?? 0) > 0 ? cart.qty >= c.minQty : cart.subtotalCents >= c.minSpendCents)) ?? null;
}
var autoTotal = (d2) => d2.reduce((s, x) => s + x.cents, 0);
function preorderSplit(totalCents, rules, full = false) {
  const depositCents = full ? totalCents : Math.min(totalCents, Math.max(1, Math.ceil(totalCents * rules.depositPercent / 100)));
  return { percent: full ? 100 : rules.depositPercent, ...full ? { full: true } : {}, depositCents, balanceCents: totalCents - depositCents, dispatch: rules.dispatchText };
}

// server/lib/promotionsStore.ts
var cache3 = null;
async function getPromotions() {
  if (cache3 && Date.now() - cache3.at < 1e4) return cache3.v;
  try {
    const r = must(await db().from("site_settings").select("value").eq("key", "promotions").maybeSingle());
    const v = normalizePromotions(r?.value);
    cache3 = { at: Date.now(), v };
    return v;
  } catch {
    return DEFAULT_PROMOTIONS;
  }
}
async function savePromotions(next) {
  cache3 = null;
  must(await db().from("site_settings").upsert({ key: "promotions", value: next, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).select("key").single());
  cache3 = null;
}

// server/lib/rateLimit.ts
var hits = /* @__PURE__ */ new Map();
function tooMany(key2, max = 15, windowMs = 6e4) {
  const now = Date.now();
  const recent = (hits.get(key2) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key2, recent);
  if (hits.size > 5e3) {
    for (const [k, v] of hits) if (!v.length || now - v[v.length - 1] >= windowMs) hits.delete(k);
    for (const k of hits.keys()) {
      if (hits.size <= 4e3) break;
      hits.delete(k);
    }
  }
  return recent.length > max;
}
var clientKey = (req) => req.ip ?? "local";

// server/lib/productStore.ts
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { join as join2 } from "node:path";

// server/lib/cache.ts
var store = /* @__PURE__ */ new Map();
var epoch = 0;
async function cached2(key2, ttlMs, fn) {
  const e = store.get(key2);
  if (e && e.v !== void 0 && Date.now() - e.at < ttlMs) return e.v;
  if (e?.p) return e.p;
  const startedAt = epoch;
  const p = fn().then(
    (v) => {
      if (epoch === startedAt) store.set(key2, { at: Date.now(), v });
      else if (store.get(key2)?.p === p) store.delete(key2);
      return v;
    },
    (err) => {
      if (store.get(key2)?.p === p) store.delete(key2);
      throw err;
    }
  );
  store.set(key2, { at: e?.at ?? 0, v: e?.v, p });
  return p;
}
function invalidate(prefix = "") {
  epoch++;
  for (const k of store.keys()) if (k.startsWith(prefix)) store.delete(k);
}

// server/lib/r2.ts
import { createHmac, createHash } from "node:crypto";
var cfg = () => ({
  account: process.env.R2_ACCOUNT_ID || "",
  key: process.env.R2_ACCESS_KEY_ID || "",
  secret: process.env.R2_SECRET_ACCESS_KEY || "",
  bucket: process.env.R2_BUCKET || "",
  publicUrl: (process.env.R2_PUBLIC_URL || "").replace(/\/+$/, "")
});
var r2Enabled = () => {
  const c = cfg();
  return !!(c.account && c.key && c.secret && c.bucket && c.publicUrl);
};
var sha256hex = (d2) => createHash("sha256").update(d2).digest("hex");
var hmac = (k, d2) => createHmac("sha256", k).update(d2).digest();
function sigV4Authorization(o) {
  const names = Object.keys(o.headers).sort();
  const canonicalHeaders = names.map((n) => `${n}:${o.headers[n].trim()}
`).join("");
  const signedHeaders = names.join(";");
  const canonicalRequest = [o.method, o.path, o.query ?? "", canonicalHeaders, signedHeaders, o.payloadHash].join("\n");
  const day = o.amzDate.slice(0, 8), scope = `${day}/${o.region}/${o.service}/aws4_request`;
  const toSign = ["AWS4-HMAC-SHA256", o.amzDate, scope, sha256hex(canonicalRequest)].join("\n");
  const kSigning = hmac(hmac(hmac(hmac("AWS4" + o.secretKey, day), o.region), o.service), "aws4_request");
  const signature = createHmac("sha256", kSigning).update(toSign).digest("hex");
  return `AWS4-HMAC-SHA256 Credential=${o.accessKey}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
}
async function call(method, name, body3, extra = {}) {
  const c = cfg(), host = `${c.account}.r2.cloudflarestorage.com`, path2 = `/${c.bucket}/${name}`;
  const amzDate = (/* @__PURE__ */ new Date()).toISOString().replace(/[:-]|\.\d{3}/g, "");
  const payloadHash = sha256hex(body3 ?? "");
  const headers = { host, "x-amz-content-sha256": payloadHash, "x-amz-date": amzDate, ...extra };
  const authorization = sigV4Authorization({ method, path: path2, headers, payloadHash, amzDate, region: "auto", service: "s3", accessKey: c.key, secretKey: c.secret });
  const { host: _h, ...sendHeaders } = headers;
  const init = { method, headers: { ...sendHeaders, authorization } };
  if (body3) init.body = body3;
  const res = await fetch(`https://${host}${path2}`, init);
  if (!res.ok) throw new Error(`R2 ${method} failed (${res.status}): ${(await res.text().catch(() => "")).slice(0, 200)}`);
  return res;
}
async function r2Put(name, bytes, mime) {
  await call("PUT", name, bytes, { "content-type": mime, "cache-control": "public, max-age=31536000, immutable" });
  return `${cfg().publicUrl}/${name}`;
}
async function r2Delete(names) {
  await Promise.all(names.map((n) => call("DELETE", n)));
}
async function r2Get(name) {
  const res = await call("GET", name);
  return { bytes: new Uint8Array(await res.arrayBuffer()), mime: res.headers.get("content-type") || "image/webp" };
}

// server/lib/productStore.ts
var BUCKET = "product-images";
var isUuid = (s) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
async function listAllProducts() {
  return must(await db().from("products").select("*").order("created_at", { ascending: true })).map(toProduct);
}
async function listProductsByIds(ids) {
  const list = [...new Set(ids.filter(isUuid))];
  if (!list.length) return [];
  return must(await db().from("products").select("*").eq("active", true).in("id", list)).map(toProduct);
}
async function firstImagesById(ids) {
  const list = [...new Set(ids.filter(isUuid))];
  const out = {};
  if (!list.length) return out;
  for (const r of must(await db().from("products").select("id,images").in("id", list))) {
    const src = r.images?.[0]?.src;
    if (src) out[r.id] = src;
  }
  return out;
}
async function categoryCounts() {
  const counts = /* @__PURE__ */ new Map();
  for (const r of must(await db().from("products").select("category"))) if (r.category) counts.set(r.category, (counts.get(r.category) ?? 0) + 1);
  return counts;
}
async function getProductById(id) {
  if (!isUuid(id)) return null;
  const r = must(await db().from("products").select("*").eq("id", id).maybeSingle());
  return r ? toProduct(r) : null;
}
async function upsertProduct(p) {
  const fields = { name: p.name, name_km: p.nameKm || null, brand: p.brand || null, uom: p.uom || null, variants: p.variants || null, labels: p.labels ?? [], sku: p.sku, category: p.category, description: p.description, price: p.price, stock: p.stock, images: p.images, preorder_start: p.preorderStart || null, preorder_end: p.preorderEnd || null, active: p.active !== false, updated_at: (/* @__PURE__ */ new Date()).toISOString() };
  if (p.id) {
    must(await db().from("products").update(fields).eq("id", p.id).select("id").single());
    invalidate("products:");
    return p.id;
  }
  const base = slugify(p.name);
  const taken = new Set(must(await db().from("products").select("slug").like("slug", `${base}%`)).map((x) => x.slug));
  let slug = base, n = 2;
  while (taken.has(slug)) slug = `${base}-${n++}`;
  const id = must(await db().from("products").insert({ ...fields, slug }).select("id").single()).id;
  invalidate("products:");
  return id;
}
async function renameCategory(from, to) {
  if (from !== to) {
    must(await db().from("products").update({ category: to, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("category", from).select("id"));
    invalidate("products:");
  }
}
async function setLabels(id, labels) {
  if (!isUuid(id)) return;
  must(await db().from("products").update({ labels, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", id).select("id"));
  invalidate("products:");
}
async function skuTaken(sku, exceptId) {
  const rows = must(await db().from("products").select("id").ilike("sku", sku.replace(/[\\%_]/g, "\\$&")));
  return rows.some((r) => r.id !== exceptId);
}
async function deleteProduct(id) {
  if (!isUuid(id)) return;
  const gone = must(await db().from("products").delete().eq("id", id).select("id,images"));
  invalidate("products:");
  if (gone[0]) await deleteProductImages((gone[0].images ?? []).map((i) => i.src));
}
async function setStock(id, stock) {
  if (!isUuid(id)) return;
  must(await db().from("products").update({ stock: Math.max(0, Math.floor(stock)), updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", id).select("id"));
  invalidate("products:");
}
async function decrementStock(items2) {
  const r = await db().rpc("decrement_stock", { items: items2 });
  invalidate("products:");
  if (r.error) throw new Error(r.error.message.includes("INSUFFICIENT_STOCK") ? "INSUFFICIENT_STOCK" : r.error.message);
}
async function restoreStock(items2) {
  must(await db().rpc("restore_stock", { items: items2 }));
  invalidate("products:");
}
var LOCAL_DIR = join2(process.cwd(), "public", "img", "uploads");
var safeName = (n) => /^[a-z0-9-]+\.(jpg|png|webp)$/.test(n);
async function uploadProductImage(name, bytes, mime) {
  const url = r2Enabled() ? (await r2Put(name, bytes, mime), `/api/img/${name}`) : await uploadToSupabase(name, bytes, mime);
  if (safeName(name)) {
    try {
      await mkdir(LOCAL_DIR, { recursive: true });
      await writeFile(join2(LOCAL_DIR, name), bytes);
    } catch {
    }
  }
  return url;
}
async function uploadToSupabase(name, bytes, mime) {
  const s = db().storage.from(BUCKET);
  const r = await s.upload(name, bytes, { contentType: mime, upsert: false, cacheControl: "31536000" });
  if (r.error) throw new Error(r.error.message);
  return s.getPublicUrl(name).data.publicUrl;
}
async function deleteProductImages(srcs) {
  const onR2 = (src) => r2Enabled() && (src.startsWith("/api/img/") || /^https?:\/\/[^/]+\/[a-z0-9-]+\.(jpg|png|webp)$/.test(src) && !src.includes(".supabase.co"));
  const nameOf = (s) => s.split("/").pop() ?? "";
  const r2Names = srcs.filter(onR2).map(nameOf).filter(safeName);
  const sbNames = srcs.filter((s) => !onR2(s)).map(nameOf).filter(safeName);
  if (r2Names.length) await r2Delete(r2Names).catch(() => void 0);
  if (sbNames.length) await db().storage.from(BUCKET).remove(sbNames).catch(() => void 0);
  await Promise.all([...r2Names, ...sbNames].map((n) => unlink(join2(LOCAL_DIR, n)).catch(() => void 0)));
}

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
async function markPaidOnce(n, fn) {
  const o = await getOrder(n);
  if (!o || o.paymentStatus !== "PENDING") return null;
  o.paymentStatus = "PAID";
  fn(o);
  const r = await db().from("orders").update(toRow(o)).eq("order_number", n).eq("payment_status", "PENDING").select("order_number");
  return must(r)?.length ? o : null;
}
async function listOrdersByEmail(email) {
  const e = email.toLowerCase();
  const results = await Promise.allSettled([
    db().from("orders").select("data").eq("customer_email", e).order("created_at", { ascending: false }).limit(200),
    db().from("orders").select("data").eq("data->>accountEmail", e).order("created_at", { ascending: false }).limit(200)
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
  const seen2 = /* @__PURE__ */ new Set();
  return rows.filter((o) => !seen2.has(o.orderNumber) && !!seen2.add(o.orderNumber)).sort((x, y) => (y.createdAt ?? "").localeCompare(x.createdAt ?? ""));
}
async function listAllOrders() {
  return fromRows(must(await db().from("orders").select("data").order("created_at", { ascending: false })));
}
async function deleteAllOrders() {
  const rows = must(await db().from("orders").delete().neq("order_number", "").select("order_number"));
  return rows?.length ?? 0;
}
async function listPendingBakong() {
  const r = await db().from("orders").select("data").eq("payment_status", "PENDING").eq("data->>method", "BAKONG").order("created_at", { ascending: false }).limit(30);
  return fromRows(must(r)).filter((o) => (o.bakongMd5s?.length ?? 0) > 0 && Date.now() - Date.parse(o.createdAt) < 6 * 36e5);
}
async function markUnpaidOnce(n, status, known) {
  const o = known ?? await getOrder(n);
  if (!o || o.paymentStatus !== "PENDING") return null;
  o.paymentStatus = status;
  o.stockReleased = true;
  const r = await db().from("orders").update(toRow(o)).eq("order_number", n).eq("payment_status", "PENDING").select("order_number");
  return must(r)?.length ? o : null;
}
async function listPendingBakongAll() {
  return fromRows(must(await db().from("orders").select("data").eq("payment_status", "PENDING").eq("data->>method", "BAKONG").order("created_at", { ascending: false }).limit(100)));
}
async function listAdminOrders() {
  const r = await db().from("orders").select("data").not("payment_status", "in", "(FAILED,EXPIRED)").or("payment_status.neq.PENDING,data->>method.neq.BAKONG").order("created_at", { ascending: false });
  return fromRows(must(r));
}
async function listProofPaths() {
  const rows = must(await db().from("orders").select("proof:data->>paymentProof"));
  return rows.map((r) => r.proof ?? "").filter(Boolean);
}
async function updatePendingOrder(n, fn) {
  const o = await getOrder(n);
  if (!o || o.paymentStatus !== "PENDING") return null;
  fn(o);
  const r = await db().from("orders").update(toRow(o)).eq("order_number", n).eq("payment_status", "PENDING").select("order_number");
  must(r);
  return o;
}
async function listCodeUses() {
  const rows = must(await db().from("orders").select("customer_email,payment_status,code:data->>discountCode,acct:data->>accountEmail").not("data->>discountCode", "is", null));
  return rows.filter((r) => r.code && !["FAILED", "EXPIRED", "REFUNDED"].includes(r.payment_status)).map((r) => ({ code: r.code, email: (r.acct || r.customer_email || "").toLowerCase() }));
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
  const rows = must(await db().from("store_discounts").select("code,percent,created_at,max_uses,per_customer").order("created_at", { ascending: true }));
  const uses = await listCodeUses().catch(() => []);
  const n = /* @__PURE__ */ new Map();
  for (const u of uses) n.set(u.code, (n.get(u.code) ?? 0) + 1);
  return rows.map((r) => ({ code: r.code, percent: Number(r.percent), createdAt: r.created_at, maxUses: r.max_uses, perCustomer: r.per_customer, used: n.get(r.code) ?? 0 }));
}
var readInfo = async (code) => {
  const r = must(await db().from("store_discounts").select("percent,max_uses,per_customer").eq("code", code).maybeSingle());
  return r ? { percent: Number(r.percent), maxUses: r.max_uses, perCustomer: r.per_customer } : null;
};
var getInfo = (code, fresh = false) => fresh ? readInfo(code) : cached2(`discount:${code}`, 1e4, async () => await readInfo(code) ?? { percent: -1 }).then((v) => v.percent < 0 ? null : v);
async function createStoreDiscount(code, percent, maxUses = null, perCustomer = null) {
  if (await getInfo(code, true) !== null) return false;
  must(await db().from("store_discounts").insert({ code, percent, max_uses: maxUses, per_customer: perCustomer }).select("code"));
  invalidate("discount:");
  return true;
}
async function updateStoreDiscount(code, patch) {
  const row2 = {};
  if (patch.percent !== void 0) row2.percent = patch.percent;
  if (patch.maxUses !== void 0) row2.max_uses = patch.maxUses;
  if (patch.perCustomer !== void 0) row2.per_customer = patch.perCustomer;
  const rows = must(await db().from("store_discounts").update(row2).eq("code", code).select("code"));
  invalidate("discount:");
  return rows.length > 0;
}
async function deleteStoreDiscount(code) {
  must(await db().from("store_discounts").delete().eq("code", code).select("code"));
  invalidate("discount:");
}
var resolveDiscount = async (code, items2, fresh = false, email) => {
  const info2 = await getInfo(code, fresh);
  if (!info2) return { ok: false, error: "That discount code is not valid." };
  if (info2.maxUses !== null || info2.perCustomer !== null) {
    const uses = (await listCodeUses()).filter((u) => u.code === code);
    if (info2.maxUses !== null && uses.length >= info2.maxUses) return { ok: false, error: "This discount code has reached its use limit." };
    if (info2.perCustomer !== null) {
      if (!email) return { ok: false, error: "Please sign in to use this discount code." };
      if (uses.filter((u) => u.email === email.toLowerCase()).length >= info2.perCustomer) return { ok: false, error: "You have already used this code the most times allowed." };
    }
  }
  return subtotalCodeDiscount(items2.reduce((s, i) => s + i.lineCents, 0), info2.percent);
};

// shared/pages.ts
var PAGE_DEFS = [
  { slug: "about", title: "About", deletable: false },
  { slug: "contact", title: "Contact", deletable: true },
  { slug: "shipping", title: "Shipping Policy", deletable: true },
  { slug: "preorder", title: "Pre-Order FAQ", deletable: true }
];
var isBuiltin = (s) => PAGE_DEFS.some((p) => p.slug === s);
var SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
var RESERVED_SLUGS = ["admin", "api", "shop", "cart", "checkout", "payment", "login", "auth", "account", "product", "offer", "about", "contact", "shipping", "preorder", "assets", "img", "public"];
var MAX_TITLE = 60;
var MAX_CUSTOM_PAGES = 30;
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
var DEFAULT_SHIPPING = `## Delivery across Cambodia

We deliver to Phnom Penh and to the provinces. The delivery fee for your area is shown at checkout before you pay.

## When we send your order

We pack and send your order after your payment is confirmed. If you have a question about your delivery, message us on Telegram or Facebook with your order number.`;
var DEFAULT_PREORDER2 = `## How pre-orders work

A pre-order item is a toy we order for you before it is in our shop. Pay the deposit at checkout to reserve your spot, and pay the rest when we dispatch your order.

## Questions

Message us on Telegram or Facebook with your order number and we will help.`;
var PAGE_DEFAULTS = { about: DEFAULT_ABOUT, contact: DEFAULT_CONTACT, shipping: DEFAULT_SHIPPING, preorder: DEFAULT_PREORDER2 };
var isCustomEntry = (slug, e) => !isBuiltin(slug) && !!e?.custom && typeof e.title === "string";
var allDefs = (s) => [
  ...PAGE_DEFS.map((d2) => ({ slug: d2.slug, title: d2.title, deletable: d2.deletable, custom: false })),
  ...Object.keys(s).filter((k) => isCustomEntry(k, s[k])).map((k) => ({ slug: k, title: String(s[k].title), deletable: true, custom: true }))
];
var isSlug = (s, store2 = {}) => isBuiltin(s) || isCustomEntry(s, store2[s]);
var resolvePage = (s, slug) => ({ content: s[slug]?.content ?? (isBuiltin(slug) ? PAGE_DEFAULTS[slug] : ""), deleted: !!s[slug]?.deleted, title: isBuiltin(slug) ? String(PAGE_DEFS.find((d2) => d2.slug === slug).title) : String(s[slug]?.title ?? slug), custom: !isBuiltin(slug) && !!s[slug]?.custom });

// server/lib/pages.ts
async function readStore() {
  try {
    return await cached2("pages:store", 15e3, async () => {
      const r = must(await db().from("site_settings").select("value").eq("key", "pages").maybeSingle());
      return r?.value ?? {};
    });
  } catch {
    return {};
  }
}
async function readFresh() {
  return must(await db().from("site_settings").select("value").eq("key", "pages").maybeSingle())?.value ?? {};
}
async function writeStore(next) {
  must(await db().from("site_settings").upsert({ key: "pages", value: next, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).select("key").single());
  invalidate("pages:");
}
async function getAllPages() {
  const s = await readStore();
  const out = {};
  for (const d2 of allDefs(s)) out[d2.slug] = resolvePage(s, d2.slug);
  return out;
}
async function savePage(slug, patch) {
  const fresh = await readFresh();
  await writeStore({ ...fresh, [slug]: { ...fresh[slug], ...patch } });
}
async function createCustomPage(slug, title, content) {
  const fresh = await readFresh();
  if (fresh[slug]) return false;
  await writeStore({ ...fresh, [slug]: { title, content, deleted: false, custom: true } });
  return true;
}
async function removeCustomPage(slug) {
  const fresh = await readFresh();
  if (!fresh[slug]?.custom) return false;
  const { [slug]: _gone, ...rest } = fresh;
  await writeStore(rest);
  return true;
}

// shared/payOptions.ts
var PAY_KEY = { BAKONG: "payBakong", QR_IMAGE: "payQr", COD: "payCod" };
function modeOf(s, m) {
  const v = s[PAY_KEY[m]];
  return v === "paused" || v === "soon" ? v : v === false ? "paused" : "on";
}
var methodOn = (s, m) => modeOf(s, m) === "on";

// server/lib/bakong.ts
import { createRequire } from "node:module";
import QRCode from "qrcode";
var nodeRequire = createRequire(import.meta.url);
var { BakongKHQR, khqrData, IndividualInfo } = nodeRequire("bakong-khqr");
var QR_MINUTES = 5;
var QR_MAX = 3;
var QR_GRACE_MS = 5 * 6e4;
var cfg2 = () => ({
  account: (process.env.BAKONG_ACCOUNT_ID ?? "").trim(),
  // your Bakong account id, e.g. yourname@aba
  token: (process.env.BAKONG_API_TOKEN ?? "").trim(),
  // Bakong Open API token (https://api-bakong.nbc.gov.kh/register)
  name: (process.env.BAKONG_MERCHANT_NAME ?? "Cloudy Toys").trim().slice(0, 25),
  city: (process.env.BAKONG_MERCHANT_CITY ?? "Phnom Penh").trim().slice(0, 15),
  api: (process.env.BAKONG_API_URL ?? "https://api-bakong.nbc.gov.kh").trim().replace(/\/$/, ""),
  relay: (process.env.BAKONG_RELAY_URL ?? "").trim().replace(/\/$/, ""),
  // optional: small relay running on a computer inside Cambodia (tools/bakong-relay.mjs), for hosts abroad such as Vercel
  relaySecret: (process.env.BAKONG_RELAY_SECRET ?? "").trim()
});
var bakongEnabled = () => {
  const c = cfg2();
  return !!c.account && !!c.token;
};
var bakongName = () => cfg2().name;
async function makeKhqr(orderNumber, totalCents, reuseExpiresAt) {
  const c = cfg2();
  const expiresAt = reuseExpiresAt ?? Date.now() + QR_MINUTES * 6e4;
  const info2 = new IndividualInfo(c.account, c.name, c.city, { currency: khqrData.currency.usd, amount: totalCents / 100, billNumber: orderNumber, expirationTimestamp: expiresAt });
  const r = new BakongKHQR().generateIndividual(info2);
  if (!r?.data?.qr || !r.data.md5) throw new Error(`KHQR failed: ${r?.status?.message ?? "unknown"}`);
  const image = await QRCode.toDataURL(r.data.qr, { errorCorrectionLevel: "M", margin: 1, width: 560 });
  return { qr: r.data.qr, md5: r.data.md5, expiresAt, image };
}
function callCheck(md5, ms) {
  const c = cfg2();
  const signal = AbortSignal.timeout(ms);
  if (c.relay) return fetch(`${c.relay}/check`, { method: "POST", signal, headers: { "Content-Type": "application/json", "x-relay-secret": c.relaySecret }, body: JSON.stringify({ md5 }) });
  return fetch(`${c.api}/v1/check_transaction_by_md5`, { method: "POST", signal, headers: { Authorization: `Bearer ${c.token}`, "Content-Type": "application/json" }, body: JSON.stringify({ md5 }) });
}
async function checkPaid(md5, totalCents) {
  try {
    const res = await callCheck(md5, 6e3);
    const j = await res.json().catch(() => null);
    if (!j) return { ok: false, reason: "ERROR", detail: `Bakong HTTP ${res.status}` };
    if (j.responseCode !== 0 || !j.data) return j.responseCode === 1 ? { ok: false, reason: "NOT_FOUND" } : { ok: false, reason: "ERROR", detail: `Bakong HTTP ${res.status}: ${j.responseMessage ?? "error"}` };
    return matchPaid(j.data, totalCents);
  } catch (e) {
    return { ok: false, reason: "ERROR", detail: e instanceof Error ? e.message : "network error" };
  }
}
async function bakongDiagnose() {
  const c = cfg2();
  const steps = [];
  steps.push({ label: "BAKONG_ACCOUNT_ID", ok: !!c.account, detail: c.account ? `set (${c.account})` : "missing: add it in Vercel \u2192 Settings \u2192 Environment Variables, then redeploy" });
  steps.push({ label: "BAKONG_API_TOKEN", ok: !!c.token, detail: c.token ? "set" : "missing: get one at https://api-bakong.nbc.gov.kh/register, add it in Vercel, then redeploy" });
  if (!c.account || !c.token) return { ok: false, steps };
  try {
    const res = await callCheck("0".repeat(32), 8e3);
    const text = await res.text();
    let j = null;
    try {
      j = JSON.parse(text);
    } catch {
    }
    if (!j) steps.push({ label: "Reach Bakong API", ok: false, detail: `HTTP ${res.status}, not a Bakong reply. Bakong usually blocks servers outside Cambodia. Fix: use the shop-PC watcher: set BAKONG_WATCHER_SECRET (see README) and run start-bakong-watcher.bat on a computer in Cambodia.` });
    else if (res.status === 401 || res.status === 403 || j.responseCode === 3 || /token|unauthor|expired/i.test(j.responseMessage ?? "")) steps.push({ label: "Reach Bakong API", ok: false, detail: `Bakong answered HTTP ${res.status}: ${j.responseMessage ?? "rejected"}. The token is invalid or expired: renew it, or the request was blocked by region.` });
    else {
      steps.push({ label: "Reach Bakong API", ok: true, detail: `connected (HTTP ${res.status})` });
      steps.push({ label: "Token accepted", ok: true, detail: j.responseMessage ?? "ok" });
    }
  } catch (e) {
    steps.push({ label: "Reach Bakong API", ok: false, detail: `${e instanceof Error ? e.message : "network error"}. The server cannot connect to Bakong (often blocked outside Cambodia).` });
  }
  return { ok: steps.every((s) => s.ok), steps };
}
function matchPaid(d2, totalCents) {
  const local = (x) => x.trim().toLowerCase().split("@")[0];
  const to = (d2.toAccountId ?? "").trim(), sameAccount = !to.includes("@") || local(to) === local(cfg2().account);
  const amountOk = Math.abs(Number(d2.amount) * 100 - totalCents) < 0.5, currencyOk = String(d2.currency ?? "USD").toUpperCase() === "USD";
  if (!currencyOk || !amountOk || !sameAccount) return { ok: false, reason: "MISMATCH", detail: `amount ${d2.amount} ${d2.currency} to ${d2.toAccountId}` };
  return { ok: true, hash: d2.hash };
}
var watcherSecret = () => (process.env.BAKONG_WATCHER_SECRET ?? "").trim();

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
var signed = /* @__PURE__ */ new Map();
async function proofUrls(paths) {
  const out = {};
  const now = Date.now();
  const need = [];
  for (const p of new Set(paths.filter(Boolean))) {
    const hit = signed.get(p);
    if (hit && hit.until > now) out[p] = hit.url;
    else need.push(p);
  }
  if (!need.length) return out;
  try {
    const r = await db().storage.from(BUCKET2).createSignedUrls(need, 3600);
    if (signed.size > 2e3) signed.clear();
    for (const x of r.data ?? []) if (x.path && x.signedUrl) {
      out[x.path] = x.signedUrl;
      signed.set(x.path, { url: x.signedUrl, until: now + 30 * 6e4 });
    }
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
var usd3 = (c) => `$${(c / 100).toFixed(2)}`;
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
var n0 = (n) => n.toLocaleString("en-US");
var area = (o) => areaLabel(o);
var items = (o) => o.items.map((i) => `${i.name} x${i.qty}`).join("; ");
var qty = (o) => o.items.reduce((s, i) => s + i.qty, 0);
function ordersDataset(rows) {
  const csv = [
    { header: "Order number", get: (o) => o.orderNumber },
    { header: "Date (Phnom Penh)", get: (o) => stamp(o.createdAt) },
    { header: "Customer", get: (o) => o.customer.name },
    { header: "Phone", get: (o) => o.customer.phone },
    { header: "Area", get: area },
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
    ...orderNotes(rows, "Hello Cloudy Toys team! Here are your orders, newest first, so you can see who is waiting and who has paid."),
    pdf: [{ header: "Order #", chars: 18 }, { header: "Date", chars: 16 }, { header: "Customer", chars: 20 }, { header: "Phone", chars: 14 }, { header: "Area", chars: 10 }, { header: "Method", chars: 16 }, { header: "Status", chars: 8 }, { header: "Qty", chars: 4, right: true }, { header: "Total", chars: 10, right: true }],
    pdfRow: (o) => [o.orderNumber, stamp(o.createdAt), o.customer.name, o.customer.phone, area(o), methodLabel(o.method), o.paymentStatus, String(qty(o)), usd3(o.totalCents)]
  };
}
var products = (o) => o.items.map((i) => i.name).join("; ");
var money = (c) => (c / 100).toFixed(2);
var saleCents = (o) => o.subtotalCents - o.discountCents;
var deliveryStatus = (o) => o.paymentStatus === "PAID" ? o.preorder ? `Paid - dispatch ${o.preorder.dispatch}` : "Paid - ready to deliver" : o.method === "COD" ? "Cash on delivery" : "Waiting for payment";
function transactionsDataset(rows) {
  const csv = [
    { header: "Date", get: (o) => stamp(o.createdAt) },
    { header: "Order number", get: (o) => o.orderNumber },
    { header: "Product", get: products },
    { header: "Customer", get: (o) => o.customer.name },
    { header: "Sold QTY", get: qty },
    { header: "Sub Amount", get: (o) => money(o.subtotalCents) },
    { header: "Invoice Discount", get: (o) => money(o.discountCents) },
    { header: "Total Sale", get: (o) => money(saleCents(o)) }
  ];
  return {
    name: "sales",
    title: "Sales Transaction Report",
    csv,
    rows,
    intro: "Hello Cloudy Toys team! Here is what you sold: each order with its toys, quantity and what the customer paid for them (delivery is in the Delivery Report).",
    summary: [["Orders", n0(rows.length)], ["Toys sold", n0(rows.reduce((t, o) => t + qty(o), 0))], ["Invoice discounts", usd3(rows.reduce((t, o) => t + o.discountCents, 0))], ["Total sale", usd3(rows.reduce((t, o) => t + saleCents(o), 0))]],
    pdf: [{ header: "Date", chars: 15 }, { header: "Order number", chars: 17 }, { header: "Product", chars: 28 }, { header: "Customer", chars: 18 }, { header: "Sold QTY", chars: 10, right: true }, { header: "Sub Amount", chars: 11, right: true }, { header: "Invoice Discount", chars: 13, right: true }, { header: "Total Sale", chars: 11, right: true }],
    pdfRow: (o) => [stamp(o.createdAt), o.orderNumber, products(o), o.customer.name, String(qty(o)), usd3(o.subtotalCents), usd3(o.discountCents), usd3(saleCents(o))]
  };
}
function deliveryDataset(rows) {
  const csv = [
    { header: "Date", get: (o) => stamp(o.createdAt) },
    { header: "Order number", get: (o) => o.orderNumber },
    { header: "Customer", get: (o) => o.customer.name },
    { header: "Sub Amount", get: (o) => money(o.subtotalCents) },
    { header: "Discount", get: (o) => money(o.discountCents) },
    { header: "Delivery Fee", get: (o) => money(o.shippingCents) },
    { header: "Total Sale", get: (o) => money(o.totalCents) },
    { header: "Delivery Status", get: deliveryStatus }
  ];
  return {
    name: "delivery",
    title: "Delivery Report",
    csv,
    rows,
    intro: "Hello Cloudy Toys team! Here are your deliveries: what each customer owes, the delivery fee, and whether the parcel is ready to go.",
    summary: [["Deliveries", n0(rows.length)], ["Ready to deliver", n0(rows.filter((o) => o.paymentStatus === "PAID").length)], ["Delivery fees", usd3(rows.reduce((t, o) => t + o.shippingCents, 0))], ["Total sale", usd3(rows.reduce((t, o) => t + o.totalCents, 0))]],
    pdf: [{ header: "Date", chars: 15 }, { header: "Order number", chars: 17 }, { header: "Customer", chars: 20 }, { header: "Sub Amount", chars: 11, right: true }, { header: "Discount", chars: 10, right: true }, { header: "Delivery Fee", chars: 11, right: true }, { header: "Total Sale", chars: 11, right: true }, { header: "Delivery Status", chars: 22 }],
    pdfRow: (o) => [stamp(o.createdAt), o.orderNumber, o.customer.name, usd3(o.subtotalCents), usd3(o.discountCents), usd3(o.shippingCents), usd3(o.totalCents), deliveryStatus(o)]
  };
}
var orderNotes = (rows, intro) => ({ intro, summary: [["Orders", n0(rows.length)], ["Paid", n0(rows.filter((o) => o.paymentStatus === "PAID").length)], ["Waiting for payment", n0(rows.filter((o) => o.paymentStatus !== "PAID").length)], ["Money received", usd3(rows.filter((o) => o.paymentStatus === "PAID").reduce((t, o) => t + o.totalCents, 0))]] });
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
    intro: "Hello Cloudy Toys team! Here is your whole toy shelf, with prices, sale prices and what customers can see in the shop.",
    summary: [["Products", n0(rows.length)], ["Shown in the shop", n0(rows.filter((p) => p.active !== false).length)], ["On sale", n0(rows.filter((p) => p.salePrice != null).length)], ["Out of stock", n0(rows.filter((p) => p.stock <= 0).length)]],
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
    intro: "Hello Cloudy Toys team! Here is how much of each toy is on your shelf, starting with the ones that need restocking first.",
    summary: [["Toys listed", n0(rows.length)], ["Units in stock", n0(rows.reduce((t, p) => t + p.stock, 0))], ["Stock value", `$${n0(Math.round(rows.reduce((t, p) => t + price(p) * p.stock, 0) * 100) / 100)}`], ["Need restocking", n0(rows.filter((p) => stockStatus(p.stock) !== "OK").length)]],
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

// server/lib/report.ts
import { readFileSync as readFileSync2 } from "node:fs";
import { join as join3 } from "node:path";
var COPYRIGHT = (year) => `\xA9 ${year} Cloudy Toys. All rights reserved.`;
function jpegInfo(b) {
  if (b.length < 4 || b[0] !== 255 || b[1] !== 216) return null;
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 255) {
      i++;
      continue;
    }
    const m = b[i + 1];
    if (m >= 192 && m <= 207 && m !== 196 && m !== 200 && m !== 204) return { jpeg: b, h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7), comps: b[i + 9] };
    i += 2 + b.readUInt16BE(i + 2);
  }
  return null;
}
var cached3;
function loadLogo() {
  if (cached3 === void 0) {
    try {
      const l = jpegInfo(readFileSync2(join3(process.cwd(), "public", INVOICE_LOGO)));
      cached3 = l && (l.comps === 3 || l.comps === 1) ? l : null;
    } catch {
      cached3 = null;
    }
  }
  return cached3;
}
function contactsOf(s) {
  const bare = (u) => u.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return [s.telegramUrl && `Telegram: ${bare(s.telegramUrl)}`, s.instagramUrl && `Instagram: ${bare(s.instagramUrl)}`, s.facebookUrl && `Facebook: ${bare(s.facebookUrl)}`].filter(Boolean);
}
var makeMeta = (s, generated, extra = {}) => ({ brand: BRAND.name, tagline: BRAND.tagline, contacts: contactsOf(s), logo: loadLogo(), generated, year: Number(generated.slice(0, 4)) || (/* @__PURE__ */ new Date()).getFullYear(), ...extra });

// server/lib/pdf.ts
var W = 842;
var H = 595;
var M = 30;
var HEAD_H = 70;
var FOOT_H = 50;
var ROW = 16;
var TH = 20;
var INK = "0.184 0.255 0.337";
var BLUE = "0.122 0.306 0.612";
var SKY = "0.557 0.800 1";
var PALE = "0.918 0.961 1";
var ZEBRA = "0.965 0.980 1";
var LINE2 = "0.847 0.918 0.996";
var MUTE = "0.392 0.455 0.545";
var clean = (s) => s.replace(/[\r\n\t]+/g, " ").replace(/[^\x20-\x7e\xa0-\xff]/g, "?");
var esc3 = (s) => clean(s).replace(/[\\()]/g, (c) => "\\" + c).replace(/[\x80-\xff]/g, (c) => "\\" + c.charCodeAt(0).toString(8).padStart(3, "0"));
var HW = [278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584];
var tw = (s, size, bold = false) => {
  let n = 0;
  for (const ch of clean(s)) {
    const c = ch.charCodeAt(0);
    n += c >= 32 && c <= 126 ? HW[c - 32] : 556;
  }
  return n / 1e3 * size * (bold ? 1.07 : 1);
};
var fit = (s, max, size, bold = false) => {
  let t = clean(s);
  if (tw(t, size, bold) <= max) return t;
  while (t.length > 1 && tw(t + "..", size, bold) > max) t = t.slice(0, -1);
  return t + "..";
};
var T = (x, y, s, size, font, color = INK, right = false) => `BT /${font} ${size} Tf ${color} rg ${(right ? x - tw(s, size, font === "F2") : x).toFixed(2)} ${y.toFixed(2)} Td (${esc3(s)}) Tj ET
`;
var R = (x, y, w, h2, fill) => `${fill} rg ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h2.toFixed(2)} re f
`;
var L = (x1, y, x2, color, w = 0.6) => `${color} RG ${w} w ${x1} ${y} m ${x2} ${y} l S
`;
var mark = (x, y, size, hasLogo) => hasLogo ? `q ${size} 0 0 ${size} ${x} ${y} cm /Im1 Do Q
` : R(x, y, size, size, SKY) + T(x + size / 2 - tw("CT", size * 0.42, true) / 2, y + size * 0.3, "CT", size * 0.42, "F2", BLUE);
function buildPdf(o) {
  const { meta } = o, logo = meta.logo, usable = W - 2 * M, totalChars = o.cols.reduce((s, c) => s + c.chars, 0);
  const xs = [];
  const ws = o.cols.map((c) => c.chars / totalChars * usable);
  ws.reduce((x, w) => (xs.push(x), x + w), M);
  const hasSummary = !!(meta.intro || meta.summary?.length), firstTop = hasSummary ? H - HEAD_H - 92 : H - HEAD_H - 16, nextTop = H - HEAD_H - 16;
  const cap = (top) => Math.max(1, Math.floor((top - TH - FOOT_H - 6) / ROW));
  const pages = [];
  let at = 0;
  do {
    const n = cap(pages.length === 0 ? firstTop : nextTop);
    pages.push(o.rows.slice(at, at + n));
    at += n;
  } while (at < o.rows.length);
  const bufs = [];
  const add = (b) => {
    bufs.push(typeof b === "string" ? Buffer.from(b, "latin1") : b);
    return bufs.length;
  };
  add("<< /Type /Catalog /Pages 2 0 R >>");
  add("PAGES");
  add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
  let img = 0;
  if (logo) img = add(Buffer.concat([Buffer.from(`<< /Type /XObject /Subtype /Image /Width ${logo.w} /Height ${logo.h} /ColorSpace /${logo.comps === 1 ? "DeviceGray" : "DeviceRGB"} /BitsPerComponent 8 /Filter /DCTDecode /Length ${logo.jpeg.length} >>
stream
`, "latin1"), logo.jpeg, Buffer.from("\nendstream", "latin1")]));
  const kids = [];
  pages.forEach((rows, pi) => {
    const top = pi === 0 ? firstTop : nextTop;
    let c = "";
    c += R(0, H - HEAD_H, W, HEAD_H, PALE) + R(0, H - HEAD_H - 3, W, 3, SKY);
    c += mark(M, H - HEAD_H + 12, 46, !!logo);
    c += T(M + 58, H - 39, meta.brand, 22, "F2", BLUE) + T(M + 58, H - 55, meta.tagline, 9, "F1", MUTE);
    c += T(W - M, H - 36, o.title, 16, "F2", INK, true) + T(W - M, H - 52, `Made on ${meta.generated}  -  ${o.rows.length} ${o.rows.length === 1 ? "row" : "rows"}`, 8.5, "F1", MUTE, true);
    if (pi === 0 && hasSummary) {
      let y = H - HEAD_H - 28;
      if (meta.intro) c += T(M, y, meta.intro, 10.5, "F1", INK), y -= 14;
      const gap = 10, box2 = (usable - 3 * gap) / 4;
      (meta.summary ?? []).slice(0, 4).forEach(([label, value], i) => {
        const x = M + i * (box2 + gap), by = H - HEAD_H - 88;
        c += R(x, by, box2, 40, PALE) + R(x, by, 4, 40, SKY) + T(x + 14, by + 25, fit(label, box2 - 22, 8), 8, "F1", MUTE) + T(x + 14, by + 9, fit(value, box2 - 22, 14, true), 14, "F2", BLUE);
      });
    }
    const hy = top - TH;
    c += R(M, hy, usable, TH, SKY);
    o.cols.forEach((col, i) => {
      const s = fit(col.header, ws[i] - 12, 8.5, true);
      c += T(col.right ? xs[i] + ws[i] - 6 : xs[i] + 6, hy + 6.5, s, 8.5, "F2", INK, !!col.right);
    });
    rows.forEach((r, ri) => {
      const y = hy - (ri + 1) * ROW;
      if (ri % 2 === 0) c += R(M, y, usable, ROW, ZEBRA);
      r.forEach((cell, i) => {
        const s = fit(cell, ws[i] - 12, 8.5);
        c += T(o.cols[i].right ? xs[i] + ws[i] - 6 : xs[i] + 6, y + 4.8, s, 8.5, "F1", INK, !!o.cols[i].right);
      });
    });
    const endY = hy - rows.length * ROW;
    c += L(M, endY, W - M, LINE2, 0.8);
    c += L(M, FOOT_H - 4, W - M, SKY, 1.2) + mark(M, 12, 28, !!logo);
    c += T(M + 38, 28, meta.brand, 10.5, "F2", BLUE) + T(M + 38, 15, fit(meta.contacts.length ? meta.contacts.join("   |   ") : "Thank you for shopping with us", usable * 0.55, 8), 8, "F1", MUTE);
    c += T(W - M, 28, COPYRIGHT(meta.year), 8.5, "F1", INK, true) + T(W - M, 15, `Page ${pi + 1} of ${pages.length}`, 8, "F1", MUTE, true);
    const body3 = Buffer.from(c, "latin1");
    const content = add(Buffer.concat([Buffer.from(`<< /Length ${body3.length} >>
stream
`, "latin1"), body3, Buffer.from("endstream", "latin1")]));
    kids.push(add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >>${img ? ` /XObject << /Im1 ${img} 0 R >>` : ""} >> /Contents ${content} 0 R >>`));
  });
  bufs[1] = Buffer.from(`<< /Type /Pages /Count ${kids.length} /Kids [${kids.map((k) => `${k} 0 R`).join(" ")}] >>`, "latin1");
  const parts = [Buffer.from("%PDF-1.4\n", "latin1")];
  const offsets = [];
  let pos = parts[0].length;
  bufs.forEach((b, i) => {
    offsets.push(pos);
    const p = Buffer.concat([Buffer.from(`${i + 1} 0 obj
`, "latin1"), b, Buffer.from("\nendobj\n", "latin1")]);
    parts.push(p);
    pos += p.length;
  });
  parts.push(Buffer.from(`xref
0 ${bufs.length + 1}
0000000000 65535 f 
` + offsets.map((x) => `${String(x).padStart(10, "0")} 00000 n 
`).join("") + `trailer
<< /Size ${bufs.length + 1} /Root 1 0 R >>
startxref
${pos}
%%EOF`, "latin1"));
  return Buffer.concat(parts);
}

// server/lib/xlsx.ts
import { deflateRawSync } from "node:zlib";
var INK2 = "2F4156";
var BLUE2 = "1F4E9C";
var MUTE2 = "64748B";
var SKY2 = "8ECCFF";
var PALE2 = "EAF5FF";
var ZEBRA2 = "F6FAFF";
var LINE3 = "D8EAFE";
var esc4 = (s) => s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
var colName = (n) => {
  let s = "";
  for (; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + (n - 1) % 26) + s;
  return s;
};
var S = { brand: 1, tag: 2, title: 3, band: 4, accent: 5, intro: 6, sumLabel: 7, sumValue: 8, head: 9, text: 10, textZ: 11, int: 12, intZ: 13, usd: 14, usdZ: 15, totLabel: 16, totInt: 17, totUsd: 18, fBrand: 19, fSmall: 20, blank: 21 };
var STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="2"><numFmt numFmtId="164" formatCode="&quot;$&quot;#,##0.00"/><numFmt numFmtId="165" formatCode="#,##0"/></numFmts>
<fonts count="11"><font><sz val="11"/><color rgb="FF${INK2}"/><name val="Calibri"/></font>
<font><b/><sz val="22"/><color rgb="FF${BLUE2}"/><name val="Calibri"/></font><font><sz val="10"/><color rgb="FF${MUTE2}"/><name val="Calibri"/></font>
<font><b/><sz val="14"/><color rgb="FF${INK2}"/><name val="Calibri"/></font><font><i/><sz val="11"/><color rgb="FF${INK2}"/><name val="Calibri"/></font>
<font><sz val="9"/><color rgb="FF${MUTE2}"/><name val="Calibri"/></font><font><b/><sz val="14"/><color rgb="FF${BLUE2}"/><name val="Calibri"/></font>
<font><b/><sz val="11"/><color rgb="FF${INK2}"/><name val="Calibri"/></font><font><b/><sz val="12"/><color rgb="FF${BLUE2}"/><name val="Calibri"/></font>
<font><sz val="9"/><color rgb="FF${MUTE2}"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FF${INK2}"/><name val="Calibri"/></font></fonts>
<fills count="5"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF${PALE2}"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FF${SKY2}"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF${ZEBRA2}"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="4"><border><left/><right/><top/><bottom/><diagonal/></border><border><left/><right/><top/><bottom style="thin"><color rgb="FF${LINE3}"/></bottom><diagonal/></border>
<border><left/><right/><top/><bottom style="medium"><color rgb="FF${BLUE2}"/></bottom><diagonal/></border><border><left/><right/><top style="medium"><color rgb="FF${SKY2}"/></top><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="22"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="0" fontId="2" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="0" fontId="3" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="0" fontId="0" fillId="2" borderId="0" xfId="0" applyFill="1"/><xf numFmtId="0" fontId="0" fillId="3" borderId="0" xfId="0" applyFill="1"/>
<xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="0" fontId="5" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="left" vertical="bottom" indent="1"/></xf>
<xf numFmtId="0" fontId="6" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="left" vertical="center" indent="1"/></xf>
<xf numFmtId="0" fontId="7" fillId="3" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" indent="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="4" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" indent="1"/></xf>
<xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center" indent="1"/></xf>
<xf numFmtId="165" fontId="0" fillId="4" borderId="1" xfId="0" applyNumberFormat="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center" indent="1"/></xf>
<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center" indent="1"/></xf>
<xf numFmtId="164" fontId="0" fillId="4" borderId="1" xfId="0" applyNumberFormat="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center" indent="1"/></xf>
<xf numFmtId="0" fontId="10" fillId="2" borderId="3" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="165" fontId="10" fillId="2" borderId="3" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center" indent="1"/></xf>
<xf numFmtId="164" fontId="10" fillId="2" borderId="3" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center" indent="1"/></xf>
<xf numFmtId="0" fontId="8" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="0" fontId="9" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
var CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
var crc32 = (b) => {
  let c = 4294967295;
  for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ c >>> 8;
  return (c ^ 4294967295) >>> 0;
};
function zip(files2) {
  const out = [], central = [];
  let pos = 0;
  for (const f of files2) {
    const name = Buffer.from(f.name, "utf8"), raw = f.data, comp = f.store ? raw : deflateRawSync(raw), crc = crc32(raw), method = f.store ? 0 : 8;
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(67324752, 0);
    lh.writeUInt16LE(20, 4);
    lh.writeUInt16LE(2048, 6);
    lh.writeUInt16LE(method, 8);
    lh.writeUInt16LE(0, 10);
    lh.writeUInt16LE(33, 12);
    lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(comp.length, 18);
    lh.writeUInt32LE(raw.length, 22);
    lh.writeUInt16LE(name.length, 26);
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(33639248, 0);
    ch.writeUInt16LE(20, 4);
    ch.writeUInt16LE(20, 6);
    ch.writeUInt16LE(2048, 8);
    ch.writeUInt16LE(method, 10);
    ch.writeUInt16LE(0, 12);
    ch.writeUInt16LE(33, 14);
    ch.writeUInt32LE(crc, 16);
    ch.writeUInt32LE(comp.length, 20);
    ch.writeUInt32LE(raw.length, 24);
    ch.writeUInt16LE(name.length, 28);
    ch.writeUInt32LE(pos, 42);
    out.push(lh, name, comp);
    central.push(Buffer.concat([ch, name]));
    pos += 30 + name.length + comp.length;
  }
  const cd = Buffer.concat(central), end = Buffer.alloc(22);
  end.writeUInt32LE(101010256, 0);
  end.writeUInt16LE(files2.length, 8);
  end.writeUInt16LE(files2.length, 10);
  end.writeUInt32LE(cd.length, 12);
  end.writeUInt32LE(pos, 16);
  return Buffer.concat([...out, cd, end]);
}
var SUMMED = /* @__PURE__ */ new Set(["Total", "Total USD", "Value", "Stock value USD", "Qty", "Item count", "Stock", "Sold QTY", "Sub Amount", "Invoice Discount", "Discount", "Delivery Fee", "Total Sale"]);
var kindOf = (h2) => /^(Total|Price|Sale|Unit|Value)$|( USD|Amount|Discount|Fee|Total Sale)$/.test(h2) ? "usd" : /^(Stock|Qty|Item count|Sold QTY)$/.test(h2) ? "int" : "text";
var toNum = (v) => {
  if (typeof v === "number") return v;
  const t = String(v ?? "").replace(/[$,\s]/g, "");
  return t === "" || t === "-" ? NaN : Number(t);
};
function buildXlsx(o) {
  const { meta } = o, logo = meta.logo, N = o.cols.length, kinds = o.cols.map((c) => kindOf(c.header)), last = colName(N), textCol = logo ? 2 : 1;
  const rowsXml = [], merges = [];
  const row2 = (r2, ht, cells, fillStyle) => {
    const a = [];
    for (let c = 1; c <= N; c++) a.push(cells.get(c) ?? (fillStyle !== void 0 ? `<c r="${colName(c)}${r2}" s="${fillStyle}"/>` : ""));
    rowsXml.push(`<row r="${r2}" ht="${ht}" customHeight="1">${a.join("")}</row>`);
  };
  const str = (r2, c, s, v) => `<c r="${colName(c)}${r2}" s="${s}" t="inlineStr"><is><t xml:space="preserve">${esc4(v)}</t></is></c>`;
  const num3 = (r2, c, s, v) => `<c r="${colName(c)}${r2}" s="${s}"><v>${Number.isFinite(v) ? v : 0}</v></c>`;
  row2(1, 28, /* @__PURE__ */ new Map([[textCol, str(1, textCol, S.brand, meta.brand)]]), S.band);
  row2(2, 20, /* @__PURE__ */ new Map([[textCol, str(2, textCol, S.tag, meta.tagline)]]), S.band);
  row2(3, 22, /* @__PURE__ */ new Map([[textCol, str(3, textCol, S.title, `${o.title}  -  made on ${meta.generated}`)]]), S.band);
  for (let r2 = 1; r2 <= 3; r2++) merges.push(`${colName(textCol)}${r2}:${last}${r2}`);
  row2(4, 5, /* @__PURE__ */ new Map(), S.accent);
  let r = 5;
  if (meta.intro) {
    row2(r, 26, /* @__PURE__ */ new Map([[1, str(r, 1, S.intro, meta.intro)]]));
    merges.push(`A${r}:${last}${r}`);
    r++;
  }
  if (meta.summary?.length) {
    const items2 = meta.summary.slice(0, 4), span = Math.max(1, Math.min(3, Math.floor(N / items2.length)));
    const lab = /* @__PURE__ */ new Map(), val = /* @__PURE__ */ new Map();
    items2.forEach(([l, v], i) => {
      const c = 1 + i * span;
      lab.set(c, str(r, c, S.sumLabel, l));
      val.set(c, str(r + 1, c, S.sumValue, v));
      if (span > 1) {
        merges.push(`${colName(c)}${r}:${colName(c + span - 1)}${r}`, `${colName(c)}${r + 1}:${colName(c + span - 1)}${r + 1}`);
      }
    });
    const fillTo = (m, rr, st) => {
      for (let c = 1; c <= N; c++) if (!m.has(c)) m.set(c, `<c r="${colName(c)}${rr}" s="${st}"/>`);
    };
    fillTo(lab, r, S.band);
    fillTo(val, r + 1, S.band);
    row2(r, 18, lab);
    row2(r + 1, 26, val);
    r += 2;
  }
  row2(r, 8, /* @__PURE__ */ new Map());
  r++;
  const headRow = r;
  row2(r, 30, new Map(o.cols.map((c, i) => [i + 1, str(r, i + 1, S.head, c.header)])));
  r++;
  const first = r;
  o.rows.forEach((vals, ri) => {
    const z3 = ri % 2 === 1;
    const m = /* @__PURE__ */ new Map();
    vals.forEach((v, i) => {
      const k = kinds[i];
      if (k === "text") m.set(i + 1, str(r, i + 1, z3 ? S.textZ : S.text, String(v ?? "")));
      else {
        const n = toNum(v);
        m.set(i + 1, Number.isFinite(n) ? num3(r, i + 1, k === "usd" ? z3 ? S.usdZ : S.usd : z3 ? S.intZ : S.int, n) : str(r, i + 1, z3 ? S.textZ : S.text, ""));
      }
    });
    row2(r, 20, m);
    r++;
  });
  const lastData = r - 1;
  if (o.rows.length) {
    const m = /* @__PURE__ */ new Map([[1, str(r, 1, S.totLabel, "Total of the rows shown")]]);
    o.cols.forEach((c, i) => {
      if (!SUMMED.has(c.header) || kinds[i] === "text") return;
      const col = colName(i + 1), sum = o.rows.reduce((s, v) => s + (toNum(v[i]) || 0), 0);
      m.set(i + 1, `<c r="${col}${r}" s="${kinds[i] === "usd" ? S.totUsd : S.totInt}"><f>SUBTOTAL(109,${col}${first}:${col}${lastData})</f><v>${Math.round(sum * 100) / 100}</v></c>`);
    });
    row2(r, 22, m, S.totLabel);
    r++;
  }
  row2(r, 10, /* @__PURE__ */ new Map());
  r++;
  const fStart = r;
  row2(r, 24, /* @__PURE__ */ new Map([[textCol, str(r, textCol, S.fBrand, meta.brand)]]), S.band);
  row2(r + 1, 18, /* @__PURE__ */ new Map([[textCol, str(r + 1, textCol, S.fSmall, meta.contacts.length ? meta.contacts.join("     |     ") : "Thank you for shopping with us")]]), S.band);
  row2(r + 2, 20, /* @__PURE__ */ new Map([[textCol, str(r + 2, textCol, S.fSmall, COPYRIGHT(meta.year))]]), S.band);
  for (let k = 0; k < 3; k++) merges.push(`${colName(textCol)}${r + k}:${last}${r + k}`);
  const lastRow = r + 2;
  const widths = o.cols.map((c, i) => {
    let m = c.header.length;
    for (const v of o.rows) {
      const l = String(v[i] ?? "").length;
      if (l > m) m = l;
    }
    return Math.min(48, Math.max(10, m + 3));
  });
  if (logo) widths[0] = Math.max(widths[0], 16);
  const hf = (s) => esc4(s.slice(0, 80).replace(/&/g, "&&"));
  const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><dimension ref="A1:${last}${lastRow}"/>
<sheetViews><sheetView showGridLines="0" workbookViewId="0" zoomScale="100"><selection activeCell="A1" sqref="A1"/></sheetView></sheetViews>
<sheetFormatPr defaultRowHeight="18"/><cols>${widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("")}</cols>
<sheetData>${rowsXml.join("")}</sheetData>${o.rows.length ? `<autoFilter ref="A${headRow}:${last}${lastData}"/>` : ""}<mergeCells count="${merges.length}">${merges.map((m) => `<mergeCell ref="${m}"/>`).join("")}</mergeCells>
<pageMargins left="0.5" right="0.5" top="0.8" bottom="0.8" header="0.3" footer="0.3"/><pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"/>
<headerFooter><oddHeader>&amp;L&amp;B&amp;16${hf(meta.brand)}&amp;R&amp;11${hf(o.title)}</oddHeader><oddFooter>&amp;L&amp;9${hf(meta.contacts.join("  |  "))}&amp;C&amp;9${hf(COPYRIGHT(meta.year))}&amp;R&amp;9Page &amp;P of &amp;N</oddFooter></headerFooter><ignoredErrors><ignoredError sqref="A1:${last}${lastRow}" numberStoredAsText="1" formula="1" formulaRange="1" emptyCellReference="1"/></ignoredErrors>${logo ? `<drawing r:id="rId1"/>` : ""}</worksheet>`;
  const px = 9525, size = 70 * px, pic = (id, row0) => `<xdr:oneCellAnchor><xdr:from><xdr:col>0</xdr:col><xdr:colOff>${6 * px}</xdr:colOff><xdr:row>${row0}</xdr:row><xdr:rowOff>${4 * px}</xdr:rowOff></xdr:from><xdr:ext cx="${size}" cy="${size}"/><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="${id}" name="Cloudy Toys logo ${id - 1}" descr="Cloudy Toys logo"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${size}" cy="${size}"/></a:xfrm><a:prstGeom prst="ellipse"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor>`;
  const drawing = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">${pic(2, 0)}${pic(3, fStart - 1)}</xdr:wsDr>`;
  const X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>', RELS = "http://schemas.openxmlformats.org/package/2006/relationships", OD = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
  const sheetName = esc4(o.sheet.replace(/[\\/?*[\]:]/g, " ").slice(0, 31));
  const files2 = [
    { name: "[Content_Types].xml", data: Buffer.from(`${X}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="jpeg" ContentType="image/jpeg"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${logo ? `<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>` : ""}<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`) },
    { name: "_rels/.rels", data: Buffer.from(`${X}<Relationships xmlns="${RELS}"><Relationship Id="rId1" Type="${OD}/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`) },
    { name: "docProps/core.xml", data: Buffer.from(`${X}<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${esc4(`${meta.brand} - ${o.title}`)}</dc:title><dc:creator>${esc4(meta.brand)}</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${(/* @__PURE__ */ new Date()).toISOString().slice(0, 19)}Z</dcterms:created></cp:coreProperties>`) },
    { name: "xl/workbook.xml", data: Buffer.from(`${X}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="${OD}"><bookViews><workbookView/></bookViews><sheets><sheet name="${sheetName}" sheetId="1" r:id="rId1"/></sheets><definedNames><definedName name="_xlnm.Print_Titles" localSheetId="0">'${sheetName}'!$${headRow}:$${headRow}</definedName></definedNames></workbook>`) },
    { name: "xl/_rels/workbook.xml.rels", data: Buffer.from(`${X}<Relationships xmlns="${RELS}"><Relationship Id="rId1" Type="${OD}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${OD}/styles" Target="styles.xml"/></Relationships>`) },
    { name: "xl/styles.xml", data: Buffer.from(STYLES) },
    { name: "xl/worksheets/sheet1.xml", data: Buffer.from(sheet) }
  ];
  if (logo) files2.push(
    { name: "xl/worksheets/_rels/sheet1.xml.rels", data: Buffer.from(`${X}<Relationships xmlns="${RELS}"><Relationship Id="rId1" Type="${OD}/drawing" Target="../drawings/drawing1.xml"/></Relationships>`) },
    { name: "xl/drawings/drawing1.xml", data: Buffer.from(drawing) },
    { name: "xl/drawings/_rels/drawing1.xml.rels", data: Buffer.from(`${X}<Relationships xmlns="${RELS}"><Relationship Id="rId1" Type="${OD}/image" Target="../media/logo.jpeg"/></Relationships>`) },
    { name: "xl/media/logo.jpeg", data: logo.jpeg, store: true }
  );
  return zip(files2);
}

// server/lib/sheetHtml.ts
var INK3 = "#2F4156";
var BLUE3 = "#1F4E9C";
var MUTE3 = "#64748B";
var SKY3 = "#8ECCFF";
var PALE3 = "#EAF5FF";
var ZEBRA3 = "#F6FAFF";
var LINE4 = "#D8EAFE";
var h = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
var num2 = (v) => {
  const t = String(v ?? "").replace(/[$,\s]/g, "");
  return t === "" || t === "-" ? NaN : Number(t);
};
var WHITE = "background-color:#ffffff;";
var td = (c0) => {
  const c = { ...c0, style: "padding:0 6px;" + (/background-color/.test(c0.style ?? "") ? c0.style : WHITE + (c0.style ?? "")) };
  return `<td${c.span && c.span > 1 ? ` colspan="${c.span}"` : ""}${c.rows && c.rows > 1 ? ` rowspan="${c.rows}"` : ""} style="${c.style ?? ""}"${c.formula ? ` data-sheets-value="${h(JSON.stringify({ 1: 2, 2: "" }))}" data-sheets-formula="${h(c.formula)}"` : c.str !== void 0 ? ` data-sheets-value="${h(JSON.stringify({ 1: 2, 2: c.str }))}"` : ""}${c.n !== void 0 ? ` data-sheets-value="${h(JSON.stringify({ 1: 3, 3: c.n }))}"${c.fmt ? ` data-sheets-numberformat="${h(JSON.stringify({ 1: 2, 2: c.fmt, 3: 1 }))}"` : ""}` : ""}>${h(c.text)}</td>`;
};
function buildSheetHtml(o) {
  const { meta } = o, N = o.cols.length, kinds = o.cols.map((c) => kindOf(c.header));
  const total = o.cols.reduce((s, c) => s + (c.chars ?? 12), 0), trs = [];
  const px = o.cols.map((c) => Math.max(48, Math.round((c.chars ?? 12) / total * 960))), pxTotal = px.reduce((a, b) => a + b, 0);
  let k = 1, wk = px[N - 1];
  while (k < N - 2 && wk < 290) {
    k++;
    wk += px[N - k];
  }
  k = Math.max(1, Math.min(Math.max(k, 2), N - 2));
  const left = Math.max(1, N - 1 - k);
  const logo = (size) => o.logoUrl ? { formula: `=IMAGE("${o.logoUrl}",4,${size},${size})` } : { text: "CT" };
  const badge = (size) => o.logoUrl ? "" : `color:${BLUE3};font-weight:bold;font-size:${size > 40 ? 18 : 11}pt;`;
  const row2 = (ht, cells, bg = "") => trs.push(`<tr style="height:${ht}px${bg ? `;background-color:${bg}` : ""}">${cells}</tr>`);
  const fill = (cells) => cells;
  const band = `background-color:${PALE3};`;
  row2(40, td({ rows: 2, style: `${band}${badge(56)}vertical-align:middle;text-align:center`, ...logo(56) }) + td({ text: meta.brand, span: left, style: `${band}color:${BLUE3};font-size:22pt;font-weight:bold;vertical-align:bottom` }) + td({ text: o.title, span: k, style: `${band}color:${INK3};font-size:16pt;font-weight:bold;text-align:right;vertical-align:bottom;white-space:nowrap` }));
  row2(26, td({ text: meta.tagline, span: left, style: `${band}color:${MUTE3};font-size:9pt;vertical-align:top` }) + td({ text: `Made on ${meta.generated}  -  ${o.rows.length} ${o.rows.length === 1 ? "row" : "rows"}`, span: k, style: `${band}color:${MUTE3};font-size:9pt;text-align:right;vertical-align:top` }));
  row2(4, td({ text: "", span: N, style: `background-color:${SKY3}` }));
  row2(14, td({ text: "", span: N }));
  if (meta.intro) {
    row2(22, td({ text: meta.intro, span: N, style: `color:${INK3};font-size:10.5pt;vertical-align:middle` }));
    row2(10, td({ text: "", span: N }));
  }
  const items2 = (meta.summary ?? []).slice(0, 4);
  if (items2.length) {
    const spans = [];
    {
      let prev = 0;
      items2.forEach((_, i) => {
        if (i === items2.length - 1) {
          spans.push(N - prev);
          return;
        }
        const want = pxTotal * (i + 1) / items2.length;
        let best = prev + 1, bd = Infinity, acc = 0;
        px.forEach((w, j) => {
          acc += w;
          if (j + 1 > prev && j + 1 <= N - (items2.length - 1 - i)) {
            const d2 = Math.abs(acc - want);
            if (d2 < bd) {
              bd = d2;
              best = j + 1;
            }
          }
        });
        spans.push(best - prev);
        prev = best;
      });
    }
    const box2 = `${band}border-left:3px solid ${SKY3};border-right:3px solid #ffffff;`;
    const line = (ht, pick) => row2(ht, items2.map((it, n) => td({ ...pick(it, n), span: spans[n] })).join(""));
    line(20, ([l]) => ({ text: l, style: `${box2}color:${MUTE3};font-size:8.5pt;vertical-align:bottom;padding-left:10px` }));
    line(26, ([, v]) => ({ text: v, style: `${box2}color:${BLUE3};font-size:14pt;font-weight:bold;vertical-align:top;padding-left:10px` }));
    row2(12, td({ text: "", span: N }));
  }
  row2(24, o.cols.map((c, i) => td({ text: c.header, style: `background-color:${SKY3};color:${INK3};font-size:9pt;font-weight:bold;vertical-align:middle;text-align:${c.right ? "right" : "left"}` })).join(""));
  o.rows.forEach((r, ri) => row2(20, o.cols.map((c, i) => {
    const v = String(r[i] ?? ""), n = num2(v), style = `${ri % 2 === 0 ? `background-color:${ZEBRA3};` : ""}color:${INK3};font-size:9pt;vertical-align:middle;text-align:${c.right ? "right" : "left"};${ri === o.rows.length - 1 ? `border-bottom:1px solid ${LINE4};` : ""}`;
    if (kinds[i] === "usd" && Number.isFinite(n)) return td({ text: v, n, fmt: '"$"#,##0.00_)', style });
    if (kinds[i] === "int" && Number.isFinite(n)) return td({ text: v, n, fmt: "#,##0_)", style });
    return td({ text: v, str: kinds[i] === "text" ? v : void 0, style });
  }).join("")));
  row2(14, td({ text: "", span: N }));
  row2(3, td({ text: "", span: N, style: `background-color:${SKY3}` }));
  row2(22, td({ rows: 2, style: `${badge(34)}vertical-align:middle;text-align:center`, ...logo(34) }) + td({ text: meta.brand, span: left, style: `color:${BLUE3};font-size:10.5pt;font-weight:bold;vertical-align:bottom` }) + td({ text: COPYRIGHT(meta.year), span: k, style: `color:${INK3};font-size:8.5pt;text-align:right;vertical-align:bottom;white-space:nowrap` }));
  row2(20, td({ text: meta.contacts.length ? meta.contacts.join("   |   ") : "Thank you for shopping with us", span: left + k, style: `color:${MUTE3};font-size:8pt;vertical-align:top` }));
  const cols = o.cols.map((c) => `<col width="${Math.max(48, Math.round((c.chars ?? 12) / total * 960))}"/>`).join("");
  const html = `<google-sheets-html-origin><style type="text/css"><!--td {border: none;}--></style><table xmlns="http://www.w3.org/1999/xhtml" cellspacing="0" cellpadding="0" dir="ltr" border="0" style="table-layout:fixed;font-size:10pt;font-family:Arial;border-collapse:collapse;border:none"><colgroup>${cols}</colgroup><tbody>${fill(trs.join(""))}</tbody></table></google-sheets-html-origin>`;
  const tab = (a) => a.map((x) => String(x ?? "").replace(/[\t\r\n]+/g, " ")).join("	");
  const text = [o.title, meta.intro ?? "", "", tab(o.cols.map((c) => c.header)), ...o.rows.map(tab)].join("\n");
  return { html, text };
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

// server/lib/memberStore.ts
var cache4 = null;
async function getOverrides() {
  if (cache4 && Date.now() - cache4.at < 1e4) return cache4.v;
  try {
    const r = must(await db().from("site_settings").select("value").eq("key", "member_overrides").maybeSingle());
    const v = r?.value && typeof r.value === "object" ? r.value : {};
    cache4 = { at: Date.now(), v };
    return v;
  } catch {
    return {};
  }
}
async function setOverride(email, o) {
  const cur = { ...await getOverrides() };
  const key2 = email.toLowerCase();
  const was = cur[key2];
  const bonus = o.bonus ?? was?.bonus ?? 0;
  const log = o.log ?? was?.log ?? [];
  if (!o.tierId && !o.blocked && !o.removed && !o.added && !bonus) delete cur[key2];
  else cur[key2] = { ...o.tierId ? { tierId: o.tierId } : {}, ...o.blocked ? { blocked: true } : {}, ...o.removed ? { removed: true } : {}, ...o.added ? { added: true, ...o.name ? { name: o.name } : {}, ...o.phone ? { phone: o.phone } : {} } : {}, ...bonus ? { bonus } : {}, ...log.length ? { log: log.slice(-30) } : {} };
  cache4 = null;
  must(await db().from("site_settings").upsert({ key: "member_overrides", value: cur, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).select("key").single());
  cache4 = null;
}

// server/lib/publicOrder.ts
function publicOrder(o) {
  const { customer, accountEmail, paymentProof, proofAt, bakongMd5s, bakongQrExpiresAt, bakongHash, paidManuallyBy, claimEmail, customerEmail, email, ...rest } = o;
  return { ...rest, customer: { name: "", email: "", phone: "", address: "" }, email: { status: email.status, attempts: 0 } };
}

// server/app.ts
async function sendItemsMail(order) {
  try {
    const images = await firstImagesById(order.items.map((i) => i.productId));
    const r = await sendCustomerItemsEmail(order, images);
    if (r.status === "FAILED") console.error("[items email]", order.orderNumber, r.detail);
    return r;
  } catch (e) {
    console.error("[items email]", order.orderNumber, e);
    return { status: "FAILED", detail: "Could not send" };
  }
}
var app = express();
app.set("trust proxy", 1);
app.disable("x-powered-by");
var R2_ORIGIN = (() => {
  try {
    return process.env.R2_PUBLIC_URL ? new URL(process.env.R2_PUBLIC_URL).origin : "";
  } catch {
    return "";
  }
})();
var CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  `img-src 'self' data: blob: https://*.supabase.co https://*.r2.dev ${R2_ORIGIN}`.trim(),
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'"
].join("; ");
app.use((_req, res, next) => {
  res.set({
    "Content-Security-Policy": CSP,
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Cross-Origin-Opener-Policy": "same-origin",
    "X-Permitted-Cross-Domain-Policies": "none",
    "X-DNS-Prefetch-Control": "off"
  });
  next();
});
app.use(compression());
app.use(express.json({ limit: "1mb" }));
var upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 6 * 1024 * 1024, files: 12, fields: 60, parts: 80, fieldSize: 64 * 1024, headerPairs: 100 } });
var api = express.Router();
api.get("/img/:name", async (req, res) => {
  const name = String(req.params.name);
  if (!r2Enabled() || !/^[a-z0-9-]+\.(jpg|png|webp)$/.test(name)) return res.status(404).end();
  const etag = `"${name}"`;
  if (req.headers["if-none-match"] === etag) return res.status(304).set({ ETag: etag, "Cache-Control": "public, max-age=31536000, immutable" }).end();
  try {
    const { bytes, mime } = await r2Get(name);
    res.set({ "Content-Type": mime, ETag: etag, "Cache-Control": "public, max-age=31536000, immutable" }).end(Buffer.from(bytes));
  } catch {
    res.status(404).set("Cache-Control", "no-store").end();
  }
});
api.use((_req, res, next) => {
  res.set("Cache-Control", "private, no-cache");
  next();
});
api.use((req, res, next) => {
  if (tooMany(`all:${clientKey(req)}`, 300)) return res.status(429).json({ error: "Too many requests. Please wait a minute." });
  next();
});
api.get("/health", (_req, res) => res.json({ ok: true, db: !!(process.env.SUPABASE_SERVICE_ROLE_KEY && (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)) }));
var hint = (m) => /relation .* does not exist|could not find the table|schema cache|column .* does not exist|function .* does not exist|Could not find the function/i.test(m) ? "Database tables are missing or out of date. Open Supabase > SQL Editor, paste supabase/setup_all.sql and click Run (it is safe to run again), then reload." : /not configured|SUPABASE_SERVICE_ROLE_KEY/i.test(m) ? "SUPABASE_SERVICE_ROLE_KEY (or the Supabase URL) is missing in .env.local. Add it and restart npm run dev." : /invalid api key|jwt|apikey/i.test(m) ? "The Supabase key is wrong. Copy the service_role / secret key from Supabase > Project Settings > API into SUPABASE_SERVICE_ROLE_KEY." : /fetch failed|ENOTFOUND|ECONNREFUSED|network/i.test(m) ? "The server cannot reach Supabase. Check VITE_SUPABASE_URL and your internet connection." : "";
var wrap = (fn) => (req, res) => {
  fn(req, res).catch((e) => {
    console.error("[api]", req.path, e);
    const msg = e instanceof Error ? e.message : String(e);
    const body3 = req.path.startsWith("/admin") ? { error: "Server error", detail: msg, hint: hint(msg) } : { error: "Server error" };
    if (!res.headersSent) res.status(500).json(body3);
  });
};
var files = (req, name) => (req.files ?? []).filter((f) => f.fieldname === name && f.size > 0);
var fld = (req, k) => String(req.body?.[k] ?? "");
var all = (req, k) => {
  const v = req.body?.[k];
  return v === void 0 ? [] : Array.isArray(v) ? v.map(String) : [String(v)];
};
var catalogOf = (products2) => new Map(products2.map((p) => [p.id, { id: p.id, name: p.name, priceCents: Math.round(p.price * 100), saleCents: p.salePrice ? Math.round(p.salePrice * 100) : null, stock: p.stock, active: true }]));
var memberOf = async (email, tiers) => {
  const none = { spendCents: 0, isMember: false, bonus: 0, tier: null, used: {} };
  if (!email || tiers.length === 0) return none;
  const orders = await listOrdersByEmail(email);
  const spendCents = memberSpendOf(orders);
  const ov = (await getOverrides())[email.toLowerCase()];
  const forced = ov?.tierId ? tiers.find((t) => t.id === ov.tierId && t.active) ?? null : null;
  const tier = ov?.blocked || ov?.removed ? null : forced ?? tierByOrders(orders, tiers);
  return { spendCents, tier, isMember: !ov?.removed && (!!ov?.tierId || !!tierByOrders(orders, tiers)), bonus: ov?.bonus ?? 0, used: monthUsage(orders) };
};
var noMember = { spendCents: 0, isMember: false, bonus: 0, tier: null, used: {} };
var Body = z2.object({
  customer: z2.object({ name: z2.string().trim().min(2).max(100), email: z2.union([z2.literal(""), z2.string().trim().email().max(200)]).optional().transform((v) => v ?? ""), phone: z2.string().trim().min(6).max(30), address: z2.string().trim().min(5).max(400), notes: z2.string().trim().max(300).optional(), facebook: z2.string().trim().max(100).optional(), telegram: z2.string().trim().max(100).optional() }),
  lines: z2.array(z2.object({ productId: z2.string(), qty: z2.number().int().min(1).max(99), option: z2.string().trim().max(OPTION_LIMITS.selected).optional() })).min(1).max(50),
  area: z2.enum(["PHNOM_PENH", "PROVINCE"]),
  province: z2.enum(PROVINCE_NAMES).optional(),
  method: z2.enum(["COD", "QR_IMAGE", "BAKONG"]),
  code: z2.string().trim().max(40).optional(),
  preorderPay: z2.enum(["deposit", "full"]).optional(),
  useMember: z2.boolean().optional()
});
var itemDates = (p) => p && isPreorder(p) && p.preorderStart && p.preorderEnd ? { opens: p.preorderStart, closes: p.preorderEnd } : {};
var LABELS2 = { name: "Full name (at least 2 characters)", email: "Email (a valid address)", phone: "Phone (at least 6 digits)", address: "Delivery address (5 to 400 characters)", notes: "Delivery instructions (max 300 characters)", area: "Delivery area", method: "Payment method" };
api.post("/checkout", requireUser, wrap(async (req, res) => {
  const raw = req.body;
  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    const bad = [...new Set(parsed.error.issues.map((i) => {
      const k = String(i.path[0] === "customer" ? i.path[1] : i.path[0]);
      const v = raw?.customer?.[k];
      return (LABELS2[k] ?? "Cart items") + (i.path[0] === "customer" ? `, ${typeof v === "string" ? `you entered ${v.trim().length}` : "nothing received"}` : "");
    }))];
    return res.status(400).json({ error: `Please check: ${bad.join("; ")}.` });
  }
  const { customer, lines, area: area2, method } = parsed.data;
  const codeIn = normalizeCode(parsed.data.code ?? "");
  if (codeIn && tooMany(`c:${clientKey(req)}`)) return res.status(429).json({ error: "Too many tries. Please wait a minute." });
  if (codeIn && !CODE_RE.test(codeIn)) return res.status(400).json({ error: "That discount code is not valid." });
  if (area2 === "PROVINCE" && !parsed.data.province) return res.status(400).json({ error: "Please choose your province." });
  if (method === "BAKONG" && !bakongEnabled()) return res.status(400).json({ error: "Bakong payment is not available right now. Please choose another payment method." });
  if (!methodAllowed(method, area2)) return res.status(400).json({ error: "Pay with delivery is only available in Phnom Penh." });
  const acct = userOf(req);
  const ids = lines.map((l) => l.productId);
  const promos = await getPromotions();
  const memberAll = await memberOf(acct?.email, promos.membership).catch(() => noMember);
  const member = memberAll;
  const bonusIds = promos.campaigns.filter((c) => (c.kind === "bogo" || c.kind === "spend_gift") && c.bonusProductId).map((c) => c.bonusProductId);
  const [settings, products2] = await Promise.all([getSettings(), expireStaleBakong(5e3).then(() => listProductsByIds([.../* @__PURE__ */ new Set([...ids, ...bonusIds])]))]);
  if (!methodOn(settings, method)) return res.status(400).json({ error: "This payment option is not available right now. Please choose another one." });
  for (const l of lines) {
    const p = products2.find((x) => x.id === l.productId);
    if (!p) continue;
    if (!isValidOption(parseOptions(p.variants), l.option)) return res.status(400).json({ error: `Please choose an option for "${p.name}" in your cart (the choices may have changed).` });
  }
  const catalog = catalogOf(products2.filter((p) => ids.includes(p.id)));
  let usedCode;
  try {
    const t00 = computeTotals(lines, catalog, 0);
    const preOf = (its) => its.reduce((n, i) => {
      const p = products2.find((x) => x.id === i.productId);
      return p && isPreorder(p) ? n + i.lineCents : n;
    }, 0);
    const freeShip = freeShippingRule({ subtotalCents: t00.subtotalCents, qty: t00.items.reduce((n, i) => n + i.qty, 0), area: area2 }, promos.campaigns);
    const memShip = memberBenefits(member.tier, { subtotalCents: t00.subtotalCents, leftCents: 0, preorderCents: preOf(t00.items) }, member.used);
    const memFree = memShip.freeShipping;
    const ship = freeShip || memFree ? 0 : shippingFor(area2, settings);
    const t0 = computeTotals(lines, catalog, ship);
    const byId = new Map(products2.map((p) => [p.id, p]));
    const auto = autoDiscounts(t0.items.map((i) => ({ category: byId.get(i.productId)?.category ?? "", lineCents: i.lineCents, productId: i.productId, qty: i.qty })), promos.campaigns, promos.festivals);
    const mb = memberBenefits(member.tier, { subtotalCents: t0.subtotalCents, leftCents: t0.subtotalCents - autoTotal(auto), preorderCents: preOf(t0.items), fullPriceCents: fullPriceCents(t0.items.flatMap((i) => {
      const p = byId.get(i.productId);
      return p ? [{ p, lineCents: i.lineCents }] : [];
    }), promos.campaigns, promos.festivals) }, member.used);
    auto.push(...mb.discounts);
    const memberPerks = [...mb.perks, ...memFree && !freeShip ? memShip.shipPerks : []];
    let discount = autoTotal(auto);
    if (codeIn) {
      if (member.isMember) return res.status(400).json({ error: "Discount codes are for customers without a membership. Members get their level specials instead." });
      const codeBase = Math.min(codeEligibleCents(t0.items.flatMap((i) => {
        const p = byId.get(i.productId);
        return p ? [{ p, lineCents: i.lineCents }] : [];
      }), promos.campaigns, promos.festivals), t0.subtotalCents - discount);
      if (codeBase <= 0) return res.status(400).json({ error: "This code only works on products without a discount. Pre-order products and products that already have a sale or promotion are not included." });
      const ev = await resolveDiscount(codeIn, [{ lineCents: codeBase }], true, acct?.email ?? void 0);
      if (!ev.ok) return res.status(400).json({ error: ev.error });
      usedCode = codeIn;
      discount += ev.discountCents;
    }
    const t = computeTotals(lines, catalog, ship, discount);
    const hasPre = t.items.some((i) => {
      const p = byId.get(i.productId);
      return !!p && isPreorder(p);
    });
    for (const i of t.items) {
      const p = byId.get(i.productId);
      if (!p || !isPreorder(p)) continue;
      const ph = preorderPhase(p);
      if (ph === "upcoming") return res.status(400).json({ error: `Pre-order for "${p.name}" opens on ${dayShort(p.preorderStart)}. Please remove it from your cart for now.` });
      if (ph === "closed") return res.status(400).json({ error: `Pre-order for "${p.name}" closed on ${dayShort(p.preorderEnd)}. Please remove it from your cart.` });
    }
    if (hasPre && method === "COD") return res.status(400).json({ error: "Pre-order items are paid with a deposit online. Please choose Bakong or QR payment." });
    const orderNumber = `CT-${(/* @__PURE__ */ new Date()).toISOString().slice(2, 10).replace(/-/g, "")}-${crypto3.randomUUID().slice(0, 5).toUpperCase()}`;
    const order = {
      orderNumber,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      area: area2,
      ...area2 === "PROVINCE" ? { province: parsed.data.province } : {},
      method,
      customer,
      items: t.items.map((i, n) => {
        const option = lines[n]?.option?.trim() || void 0;
        return { productId: i.productId, sku: byId.get(i.productId).sku, name: option ? `${i.name} (${option})` : i.name, ...option ? { option } : {}, qty: i.qty, unitCents: i.unitCents, lineCents: i.lineCents, ...itemDates(byId.get(i.productId)) };
      }),
      subtotalCents: t.subtotalCents,
      discountCents: t.discountCents,
      shippingCents: t.shippingCents,
      totalCents: t.totalCents,
      currency: "USD",
      ...usedCode ? { discountCode: usedCode } : {},
      ...auto.length ? { autoDiscounts: auto } : {},
      ...member.tier ? { memberTier: member.tier.name } : {},
      ...memberPerks.length ? { memberPerks } : {},
      ...hasPre ? { preorder: preorderSplit(t.totalCents, promos.preorder, parsed.data.preorderPay === "full") } : {},
      ...acct?.email ? { accountEmail: acct.email.toLowerCase() } : {},
      paymentStatus: "PENDING",
      paymentReference: `PAY-${orderNumber}`,
      email: { status: "NONE", attempts: 0 }
    };
    const taken = /* @__PURE__ */ new Map();
    for (const i of t.items) taken.set(i.productId, (taken.get(i.productId) ?? 0) + i.qty);
    const giftItems = [];
    for (const g of bogoGifts(t.items.map((i) => ({ productId: i.productId, category: byId.get(i.productId)?.category ?? "", qty: i.qty, lineCents: i.lineCents })), promos.campaigns)) {
      const bp = byId.get(g.productId);
      if (!bp || bp.active === false || isPreorder(bp)) continue;
      const room = Math.max(0, bp.stock - (taken.get(bp.id) ?? 0));
      const qty2 = Math.min(g.qty, room);
      if (qty2 < 1) continue;
      taken.set(bp.id, (taken.get(bp.id) ?? 0) + qty2);
      giftItems.push({ productId: bp.id, sku: bp.sku, name: `${bp.name} (free gift)`, qty: qty2, unitCents: 0, lineCents: 0 });
    }
    if (giftItems.length) order.items = [...order.items, ...giftItems];
    const lines2 = [...taken].map(([productId, qty2]) => ({ productId, qty: qty2 }));
    await decrementStock(lines2);
    try {
      await saveOrder(order);
    } catch (e) {
      await restoreStock(lines2);
      throw e;
    }
    if (method === "BAKONG") return res.json({ orderNumber });
    const [adminMail, customerMail] = await Promise.allSettled([sendAdminEmail(order), sendCustomerEmail(order, "placed"), sendItemsMail(order)]);
    if (adminMail.status === "rejected") console.error("[checkout email]", orderNumber, adminMail.reason);
    if (customerMail.status === "rejected") console.error("[customer email]", orderNumber, customerMail.reason);
    if (adminMail.status === "fulfilled" || customerMail.status === "fulfilled") {
      try {
        await updateOrder(orderNumber, (x) => {
          if (adminMail.status === "fulfilled") x.email = { status: adminMail.value.status, detail: adminMail.value.detail, attempts: 1 };
          if (customerMail.status === "fulfilled") x.customerEmail = { ...customerMail.value, kind: "placed" };
        });
      } catch (e) {
        console.error("[checkout email status]", orderNumber, e);
      }
    }
    return res.json({ orderNumber });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    return res.status(409).json({ error: msg === "INSUFFICIENT_STOCK" ? "An item is out of stock or exceeds available stock." : "Oops, we couldn't place your order. Please try again." });
  }
}));
api.post("/discount/validate", wrap(async (req, res) => {
  if (tooMany(`v:${clientKey(req)}`)) return res.status(429).json({ error: "Too many tries. Please wait a minute." });
  const b = z2.object({ code: z2.string().max(40), lines: z2.array(z2.object({ productId: z2.string(), qty: z2.number().int().min(1).max(99) })).min(1).max(50), useMember: z2.boolean().optional() }).safeParse(req.body);
  if (!b.success) return res.status(400).json({ error: "Bad request" });
  const code = normalizeCode(b.data.code);
  if (!CODE_RE.test(code)) return res.status(400).json({ error: "That discount code is not valid." });
  try {
    const [products2, promos, who] = await Promise.all([listProductsByIds(b.data.lines.map((l) => l.productId)), getPromotions(), userFromReq(req)]);
    const t = computeTotals(b.data.lines, catalogOf(products2), 0);
    const auto = autoDiscounts(t.items.map((i) => ({ category: products2.find((p) => p.id === i.productId)?.category ?? "", lineCents: i.lineCents, productId: i.productId, qty: i.qty })), promos.campaigns, promos.festivals);
    const mem = await memberOf(who?.email ?? void 0, promos.membership).catch(() => noMember);
    const byId = new Map(products2.map((p) => [p.id, p]));
    if (mem.isMember) return res.status(400).json({ error: "Discount codes are for customers without a membership. Members get their level specials instead." });
    const codeBase = Math.min(codeEligibleCents(t.items.flatMap((i) => {
      const p = byId.get(i.productId);
      return p ? [{ p, lineCents: i.lineCents }] : [];
    }), promos.campaigns, promos.festivals), t.subtotalCents - autoTotal(auto));
    if (codeBase <= 0) return res.status(400).json({ error: "This code only works on products without a discount. Pre-order products and products that already have a sale or promotion are not included." });
    const ev = await resolveDiscount(code, [{ lineCents: codeBase }], false, who?.email ?? void 0);
    return ev.ok ? res.json({ code, discountCents: ev.discountCents }) : res.status(400).json({ error: ev.error });
  } catch {
    return res.status(400).json({ error: "Could not check the code right now." });
  }
}));
api.get("/orders/:n", wrap(async (req, res) => {
  if (!/^CT-[0-9]{6}-[A-Z0-9]{5}$/.test(String(req.params.n))) return res.status(404).json({ error: "Not found" });
  if (tooMany(`o:${clientKey(req)}`, 30)) return res.status(429).json({ error: "Too many tries. Please wait a minute." });
  const o = await getOrder(String(req.params.n));
  return o ? res.json({ order: publicOrder(o) }) : res.status(404).json({ error: "Not found" });
}));
var ORDER_RE = /^CT-[0-9]{6}-[A-Z0-9]{5}$/;
api.get("/payment/bakong/enabled", wrap(async (_req, res) => res.json({ enabled: bakongEnabled() && methodOn(await getSettings(), "BAKONG") })));
api.post("/payment/bakong/qr", wrap(async (req, res) => {
  const n = typeof req.body?.orderNumber === "string" ? req.body.orderNumber.trim() : "";
  if (!ORDER_RE.test(n)) return res.status(400).json({ error: "Invalid order" });
  if (tooMany(`bkqr:${clientKey(req)}`, 30)) return res.status(429).json({ error: "Too many tries. Please wait a minute." });
  if (!bakongEnabled()) return res.status(503).json({ error: "Bakong payment is not set up yet." });
  const o = await getOrder(n);
  if (!o || o.method !== "BAKONG") return res.status(404).json({ error: "Order not found" });
  if (o.paymentStatus === "PAID") return res.json({ paid: true });
  if (o.paymentStatus !== "PENDING") return res.json({ closed: true, status: o.paymentStatus });
  const now = Date.now(), used = o.bakongMd5s?.length ?? 0, live2 = !!o.bakongQrExpiresAt && o.bakongQrExpiresAt > now + 3e3;
  if (!live2 && used >= QR_MAX) {
    await releaseBakongOrder(n, "EXPIRED");
    const again = await getOrder(n);
    return res.json(again?.paymentStatus === "PAID" ? { paid: true } : { closed: true, status: again?.paymentStatus ?? "EXPIRED" });
  }
  const k = await makeKhqr(n, payNowCents(o), live2 ? o.bakongQrExpiresAt : void 0);
  const qrNumber = live2 && (o.bakongMd5s ?? []).includes(k.md5) ? used : used + 1;
  await updatePendingOrder(n, (x) => {
    if (!(x.bakongMd5s ?? []).includes(k.md5)) x.bakongMd5s = [...x.bakongMd5s ?? [], k.md5].slice(-10);
    x.bakongQrExpiresAt = k.expiresAt;
  });
  res.json({ paid: false, image: k.image, expiresAt: k.expiresAt, amountCents: payNowCents(o), merchant: bakongName(), qrNumber, qrMax: QR_MAX });
}));
api.post("/payment/bakong/cancel", wrap(async (req, res) => {
  const n = typeof req.body?.orderNumber === "string" ? req.body.orderNumber.trim() : "";
  if (!ORDER_RE.test(n)) return res.status(400).json({ error: "Invalid order" });
  if (tooMany(`bkc:${clientKey(req)}`, 10)) return res.status(429).json({ error: "Too many tries. Please wait a minute." });
  const o = await getOrder(n);
  if (!o || o.method !== "BAKONG") return res.status(404).json({ error: "Order not found" });
  if (o.paymentStatus === "PAID") return res.json({ paid: true });
  await releaseBakongOrder(n, "FAILED");
  const now = await getOrder(n);
  res.json(now?.paymentStatus === "PAID" ? { paid: true } : { ok: true, status: now?.paymentStatus ?? "FAILED" });
}));
async function releaseBakongOrder(n, status, known) {
  const o = await markUnpaidOnce(n, status, known);
  if (!o) return false;
  try {
    await restoreStock(o.items.map((i) => ({ productId: i.productId, qty: i.qty })));
  } catch (e) {
    console.error("[restock failed]", n, e);
  }
  return true;
}
var lastSweep = 0;
async function expireStaleBakong(minGapMs = 2e4) {
  if (Date.now() - lastSweep < minGapMs) return;
  lastSweep = Date.now();
  try {
    const stale = (await listPendingBakongAll()).filter((o) => Date.now() > (o.bakongQrExpiresAt ?? Date.parse(o.createdAt) + 15 * 6e4) + QR_GRACE_MS);
    await Promise.all(stale.map((o) => releaseBakongOrder(o.orderNumber, "EXPIRED", o).catch((e) => console.error("[expire sweep]", o.orderNumber, e))));
  } catch (e) {
    console.error("[expire sweep]", e);
  }
}
async function finalizeBakongPaid(n, hash) {
  const won = await markPaidOnce(n, (x) => {
    x.paidAt = (/* @__PURE__ */ new Date()).toISOString();
    x.paidManuallyBy = void 0;
    x.bakongHash = hash;
  });
  if (!won) return;
  await Promise.allSettled([
    (async () => {
      const r = await sendBakongPaidEmail(won);
      await updateOrder(n, (x) => {
        x.claimEmail = r;
        x.email = { status: r.status, detail: r.detail, attempts: x.email.attempts + 1 };
      });
      if (r.status !== "SENT") console.error("[bakong paid email]", n, r.status, r.detail);
    })().catch((e) => console.error("[bakong paid email]", n, e)),
    (async () => {
      const r = await sendCustomerEmail(won, "paid");
      await updateOrder(n, (x) => {
        x.customerEmail = { ...r, kind: "paid" };
      });
    })().catch((e) => console.error("[bakong receipt]", n, e)),
    sendItemsMail(won).catch((e) => console.error("[bakong items mail]", n, e))
  ]);
}
api.get("/payment/bakong/status/:n", wrap(async (req, res) => {
  const n = String(req.params.n);
  if (!ORDER_RE.test(n)) return res.status(404).json({ error: "Not found" });
  if (tooMany(`bks:${clientKey(req)}`, 90)) return res.status(429).json({ error: "Too many tries. Please wait a minute." });
  const o = await getOrder(n);
  if (!o || o.method !== "BAKONG") return res.status(404).json({ error: "Not found" });
  if (o.paymentStatus === "PAID") return res.json({ paid: true });
  if (o.paymentStatus !== "PENDING") return res.json({ paid: false, closed: true, status: o.paymentStatus });
  await expireStaleBakong();
  const watcherOn = !!watcherSecret();
  const skipDirect = watcherOn && Date.now() - directDownAt < 6e4;
  const md5s = [...o.bakongMd5s ?? []].reverse();
  let hash;
  let problem = false;
  let directErr = false;
  const results = skipDirect ? [] : await Promise.all(md5s.map((md5) => checkPaid(md5, payNowCents(o)).then((r) => ({ md5, r }))));
  for (const { md5, r } of results) {
    if (r.ok) {
      hash = hash ?? r.hash ?? md5;
    } else if (r.reason === "ERROR") {
      problem = true;
      directErr = true;
    } else if (r.reason === "MISMATCH") {
      problem = true;
      console.error("[bakong check]", n, r.reason, r.detail);
    }
  }
  if (directErr && !hash) {
    directDownAt = Date.now();
    if (!watcherOn) console.error("[bakong check]", n, "ERROR", results.map(({ r }) => r.ok ? "" : r.detail).find(Boolean));
  }
  if (hash) {
    await finalizeBakongPaid(n, hash);
    return res.json({ paid: true });
  }
  if (watcherOn) {
    const seen2 = await watcherSeenAt(), online = !!seen2 && Date.now() - seen2 < 4e4, directDown = skipDirect || directErr;
    return res.json({ paid: false, problem: false, watcher: online || !directDown ? "online" : "offline", ...false ? { debug: [directDown ? "direct check from the website: BLOCKED (normal outside Cambodia)" : "direct check from the website: working", online ? "watcher: online" : `watcher: OFFLINE (last seen ${seen2 ? Math.round((Date.now() - (seen2 ?? 0)) / 1e3) + " s ago" : "never"}); start start-bakong-watcher.bat on a computer in Cambodia, check BAKONG_WATCHER_SECRET is identical in Vercel and .env.local`, ...results.map(({ r }) => r.ok ? "ok" : `${r.reason}${r.detail ? `: ${r.detail}` : ""}`)] } : {} });
  }
  res.json({ paid: false, problem, ...false ? { debug: results.map(({ r }) => r.ok ? "ok" : `${r.reason}${r.detail ? `: ${r.detail}` : ""}`) } : {} });
}));
var directDownAt = 0;
var watcherOk = (req) => {
  const s = watcherSecret(), got = String(req.headers["x-relay-secret"] ?? "");
  return s.length >= 12 && got.length === s.length && crypto3.timingSafeEqual(Buffer.from(got), Buffer.from(s));
};
api.get("/relay/pending", wrap(async (req, res) => {
  if (tooMany(`rp:${clientKey(req)}`, 600)) return res.status(429).json({ error: "slow down" });
  if (!watcherOk(req)) return res.status(401).json({ error: "bad secret" });
  await expireStaleBakong();
  const list = await listPendingBakong();
  await beatWatcher(list.length > 0);
  res.json({ orders: list.map((o) => ({ orderNumber: o.orderNumber, md5s: o.bakongMd5s ?? [] })) });
}));
api.post("/relay/confirm", wrap(async (req, res) => {
  if (tooMany(`rc:${clientKey(req)}`, 120)) return res.status(429).json({ error: "slow down" });
  if (!watcherOk(req)) return res.status(401).json({ error: "bad secret" });
  const b = z2.object({ orderNumber: z2.string(), md5: z2.string().regex(/^[a-f0-9]{32}$/i), data: z2.object({ hash: z2.string().optional(), amount: z2.union([z2.number(), z2.string()]), currency: z2.string(), toAccountId: z2.string().optional() }) }).safeParse(req.body);
  if (!b.success || !ORDER_RE.test(b.data.orderNumber)) return res.status(400).json({ error: "Bad request" });
  const o = await getOrder(b.data.orderNumber);
  if (!o || o.method !== "BAKONG" || !(o.bakongMd5s ?? []).includes(b.data.md5.toLowerCase())) return res.status(404).json({ error: "Unknown order or QR" });
  if (o.paymentStatus === "PAID") return res.json({ ok: true, already: true });
  const m = matchPaid(b.data.data, payNowCents(o));
  if (!m.ok) {
    console.error("[bakong confirm]", o.orderNumber, m.reason, m.detail);
    return res.status(422).json({ error: "Payment does not match the order", detail: m.detail });
  }
  await finalizeBakongPaid(o.orderNumber, m.hash ?? b.data.md5);
  res.json({ ok: true });
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
  res.json({ orders: u.email ? (await listOrdersByEmail(u.email)).filter((o) => o.paymentStatus === "PAID" || o.method === "COD") : [] });
}));
api.get("/membership/me", requireUser, wrap(async (req, res) => {
  const u = userOf(req);
  const promos = await getPromotions();
  const m = await memberOf(u.email ?? void 0, promos.membership);
  const reds = u.email ? await listRedemptions(u.email).catch(() => []) : [];
  const auto = m.isMember ? pointsOf(m.spendCents, promos.membership, promos.memberPointCents) : 0, earned = auto + (m.isMember ? m.bonus : 0), spent = [...redeemedPoints(reds).values()][0] ?? 0;
  res.json({ spendCents: m.spendCents, used: m.used, tierId: m.tier?.id ?? null, isMember: m.isMember, nextId: levelAfter(m.tier, promos.membership)?.id ?? null, points: Math.max(0, earned - spent), earned, bonus: m.isMember ? m.bonus : 0, spent, redemptions: reds.slice(0, 30) });
}));
api.get("/gifts", wrap(async (_req, res) => {
  res.json({ gifts: await listGifts(true).catch(() => []) });
}));
api.post("/membership/redeem", requireUser, wrap(async (req, res) => {
  const u = userOf(req);
  if (!u.email) return res.json({ error: "Please sign in with an email first" });
  if (tooMany(`redeem:${u.id}`, 10)) return res.status(429).json({ error: "Too many tries. Please wait a minute." });
  const promos = await getPromotions();
  const m = await memberOf(u.email, promos.membership);
  if (!m.isMember) return res.json({ error: "Only members can exchange points. Keep shopping to become a member!" });
  const earned = pointsOf(m.spendCents, promos.membership, promos.memberPointCents) + m.bonus;
  const prof = await getProfile(u.id).catch(() => null);
  const r = await redeemGift(u.email, prof?.name || (u.user_metadata ?? {}).full_name || u.email, String(req.body?.giftId ?? ""), earned);
  if ("error" in r) return res.json({ error: r.error });
  try {
    const all2 = await listRedemptions(u.email).catch(() => [r.ok]);
    const left = Math.max(0, earned - (redeemedPoints(all2).get(u.email.toLowerCase()) ?? 0));
    const info2 = { redemption: r.ok, email: u.email, name: prof?.name || r.ok.customerName || u.email, phone: prof?.phone ?? "", address: prof?.address ?? "", facebook: prof?.facebook ?? "", telegram: prof?.telegram ?? "", balanceAfter: left, tierName: m.tier?.name };
    const [a, c] = await Promise.allSettled([sendGiftAdminEmail(info2), sendGiftCustomerEmail(info2)]);
    if (a.status === "rejected" || a.status === "fulfilled" && a.value.status !== "SENT") console.error("[gift admin email]", r.ok.id, a.status === "rejected" ? a.reason : a.value.detail);
    if (c.status === "rejected" || c.status === "fulfilled" && c.value.status === "FAILED") console.error("[gift customer email]", r.ok.id, c.status === "rejected" ? c.reason : c.value.detail);
  } catch (e) {
    console.error("[gift receipt]", r.ok.id, e);
  }
  res.json({ ok: true, redemption: r.ok });
}));
api.get("/account/profile", requireUser, wrap(async (req, res) => {
  const u = userOf(req);
  const m = u.user_metadata ?? {};
  res.json({ profile: await getProfile(u.id, m.full_name || m.name || ""), email: u.email ?? "" });
}));
api.post("/account/profile", requireUser, wrap(async (req, res) => {
  const u = userOf(req);
  if (tooMany(`profile:${u.id}`, 30)) return res.status(429).json({ error: "Too many tries. Please wait a minute." });
  const p = ProfileInput.safeParse(req.body ?? {});
  if (!p.success) return res.json({ error: p.error.issues[0]?.message ?? "Invalid input" });
  try {
    await saveProfile(u.id, u.email ?? void 0, p.data);
  } catch (e) {
    console.error("[profile save]", e);
    return res.json({ error: "Could not save. Check that the database migration 0018 has been applied." });
  }
  res.json({ ok: true });
}));
api.post("/account/profile/avatar", requireUser, upload.any(), wrap(async (req, res) => {
  const u = userOf(req);
  if (tooMany(`avatar:${u.id}`, 10)) return res.json({ error: "Too many tries. Please wait a minute." });
  const f = files(req, "image")[0];
  if (!f && fld(req, "remove") !== "1") return res.json({ error: "Choose a picture first" });
  let url = "";
  if (f) {
    const r = await savePicture(f, "avatar", 400, 400, "cover");
    if ("error" in r) return res.json({ error: r.error });
    url = r.url;
  }
  let old = "";
  try {
    old = await setAvatar(u.id, u.email ?? void 0, url);
  } catch (e) {
    console.error("[avatar save]", e);
    await dropImage(url);
    return res.json({ error: "Could not save. Check that the database migration 0018 has been applied." });
  }
  if (old && old !== url) await dropImage(old);
  res.json({ ok: true, url });
}));
api.get("/staff/me", requireUser, wrap(async (req, res) => {
  const u = userOf(req);
  res.json({ role: await roleFor(u.email, !!u.email_confirmed_at) });
}));
var admin = express.Router();
admin.use(requireAdmin);
api.use("/admin", admin);
admin.get("/me", (req, res) => {
  const u = adminOf(req);
  const m = u.user_metadata ?? {};
  res.json({ email: u.email, role: roleOf(req), name: m.full_name || m.name || "" });
});
admin.use(["/orders", "/transactions"], needs("orders"));
admin.use("/pages", needs("pages"));
admin.use(["/discounts", "/promotions", "/members"], needs("promotions"));
admin.use(["/settings", "/bakong"], needs("settings"));
admin.use("/staff", needs("staff"));
admin.use(["/products", "/product-form-meta", "/categories"], needs("products"));
admin.get("/dashboard", wrap(async (req, res) => {
  const [orders, products2] = await Promise.all([can(roleOf(req), "orders") ? listAdminOrders() : Promise.resolve([]), listAllProducts()]);
  res.json({ orders, products: products2 });
}));
admin.get("/orders", wrap(async (req, res) => {
  const orders = await listAdminOrders();
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
  try {
    const paid = await getOrder(o.orderNumber);
    if (paid) {
      const r = await sendCustomerEmail(paid, "paid");
      await updateOrder(o.orderNumber, (x) => {
        x.customerEmail = { ...r, kind: "paid" };
      });
    }
  } catch (e) {
    console.error("[paid receipt email]", o.orderNumber, e);
  }
  res.json({ ok: true });
}));
admin.post("/orders/:n/mark-failed", wrap(async (req, res) => {
  const o = await getOrder(String(req.params.n));
  if (!o || !canPay(o.paymentStatus, "FAILED")) return res.json({ ok: false });
  await updateOrder(o.orderNumber, (x) => {
    x.paymentStatus = "FAILED";
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
admin.post("/orders/:n/resend-items", wrap(async (req, res) => {
  const o = await getOrder(String(req.params.n));
  if (!o) return res.status(404).json({ ok: false });
  const r = await sendItemsMail(o);
  res.json({ ok: r.status === "SENT", status: r.status, detail: r.detail });
}));
admin.post("/orders/:n/resend-invoice", wrap(async (req, res) => {
  const o = await getOrder(String(req.params.n));
  if (!o) return res.status(404).json({ ok: false });
  const kind = o.paymentStatus === "PAID" ? "paid" : "placed";
  const r = await sendCustomerEmail(o, kind);
  await updateOrder(o.orderNumber, (x) => {
    x.customerEmail = { ...r, kind };
  });
  res.json({ ok: r.status === "SENT", status: r.status, detail: r.detail });
}));
admin.post("/transactions/clear", wrap(async (_req, res) => {
  try {
    const proofs = await listProofPaths();
    await deleteAllOrders();
    await deleteProofs(proofs);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Could not clear the transactions. Please try again." });
  }
}));
admin.get("/export", wrap(async (req, res) => {
  const u = req.query;
  const type = u.type ?? "orders", format = u.format === "pdf" ? "pdf" : u.format === "xlsx" ? "xlsx" : u.format === "sheet" ? "sheet" : "csv";
  if ((type === "orders" || type === "transactions" || type === "delivery") && !can(roleOf(req), "orders")) return res.status(403).send("Your role cannot export orders");
  const f = { status: u.status, from: u.from, to: u.to, q: u.q };
  let ds;
  if (type === "orders") ds = ordersDataset(sortOrders(filterOrders(await listAdminOrders(), f), u.sort ?? "new"));
  else if (type === "transactions") ds = transactionsDataset(sortOrders(filterOrders(await listAdminOrders(), f), u.sort ?? "high"));
  else if (type === "delivery") ds = deliveryDataset(sortOrders(filterOrders(await listAdminOrders(), f), u.sort ?? "new"));
  else if (type === "products") ds = productsDataset(await listAllProducts());
  else if (type === "stock") ds = stockDataset([...await listAllProducts()].sort((a, b) => a.stock - b.stock));
  else return res.status(400).send("Unknown export type");
  const date = new Date(Date.now() + 7 * 36e5).toISOString().slice(0, 10);
  if (format === "sheet") return res.set({ "Cache-Control": "no-store" }).json(buildSheetHtml({ title: ds.title, cols: ds.pdf, rows: ds.rows.map(ds.pdfRow), logoUrl: /^https:\/\/[\w.-]+(:\d+)?$/.test(u.origin ?? "") && !/^https:\/\/(localhost|127\.)/.test(u.origin ?? "") ? `${u.origin}${INVOICE_LOGO}` : void 0, meta: makeMeta(await getSettings(), date, { intro: ds.intro, summary: ds.summary }) }));
  res.set({ "Content-Disposition": `attachment; filename="cloudy-toy-${ds.name}-${date}.${format}"`, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  if (format === "csv") return res.type("text/csv; charset=utf-8").send(toCsv(ds.rows, ds.csv));
  const meta = makeMeta(await getSettings(), date, { intro: ds.intro, summary: ds.summary });
  if (format === "xlsx") return res.type("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet").send(buildXlsx({ title: ds.title, sheet: ds.title, cols: ds.pdf.map((c) => ({ header: c.header })), rows: ds.rows.map(ds.pdfRow), meta }));
  res.type("application/pdf").send(buildPdf({ title: ds.title, cols: ds.pdf, rows: ds.rows.map(ds.pdfRow), meta }));
}));
var MAX_IMAGES = 10;
var Schema = z2.object({
  name: z2.string().trim().min(2, "Name needs at least 2 characters").max(120),
  sku: z2.string().trim().min(2, "SKU needs at least 2 characters").max(40).regex(/^[A-Za-z0-9_#*-]+$/, "SKU: letters, numbers and the symbols # * _ - only (no spaces)"),
  category: z2.string().trim().min(1, "Category is required").max(40),
  nameKm: z2.string().trim().max(120),
  brand: z2.string().trim().max(60),
  uom: z2.string().trim().max(20),
  variants: z2.string().trim().max(OPTION_LIMITS.stored),
  description: z2.string().trim().max(2e3),
  price: z2.coerce.number().min(0).max(1e5),
  stock: z2.coerce.number().int("Stock must be a whole number").min(0).max(1e5)
});
var categoryList = async () => {
  const [used, settings] = await Promise.all([categoryCounts(), getSettings()]);
  const counts = /* @__PURE__ */ new Map();
  for (const c of settings.categories ?? []) counts.set(c, 0);
  for (const [c, n] of used) counts.set(c, n);
  return [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name));
};
var ownImage = (s) => !!s && (s.startsWith("/api/img/") || s.includes(".supabase.co"));
var dropImage = async (s) => {
  if (ownImage(s)) await deleteProductImages([s]);
};
async function savePicture(f, prefix, w, h2, fit2) {
  const bytes = new Uint8Array(f.buffer);
  const v = validateImage(bytes, f.mimetype);
  if (!v.ok) return { error: `${f.originalname}: ${v.error}` };
  const small = new Uint8Array(await sharp(bytes).rotate().resize({ width: w, height: h2, fit: fit2, withoutEnlargement: fit2 === "inside" }).webp({ quality: 85 }).toBuffer());
  return { url: await uploadProductImage(`${prefix}-${crypto3.randomUUID().replace(/-/g, "").slice(0, 8)}.webp`, small, "image/webp") };
}
var catName = (v) => String(v ?? "").trim().replace(/\s+/g, " ").slice(0, 40);
admin.get("/categories", wrap(async (_req, res) => res.json({ categories: await categoryList() })));
admin.post("/categories/add", wrap(async (req, res) => {
  const name = catName(req.body?.name);
  if (!name) return res.json({ error: "Type a category name" });
  const list = await categoryList();
  if (list.some((c) => c.name.toLowerCase() === name.toLowerCase())) return res.json({ error: "That category already exists" });
  const extra = (await getSettings()).categories ?? [];
  await saveSettings({ categories: [...extra, name] });
  res.json({ ok: true });
}));
admin.post("/categories/rename", wrap(async (req, res) => {
  const from = catName(req.body?.from), to = catName(req.body?.to);
  if (!from || !to) return res.json({ error: "Type the new category name" });
  const list = await categoryList();
  if (!list.some((c) => c.name === from)) return res.json({ error: "Category not found" });
  const same = list.find((c) => c.name.toLowerCase() === to.toLowerCase() && c.name !== from);
  const target = same?.name ?? to;
  await renameCategory(from, target);
  const extra = ((await getSettings()).categories ?? []).filter((c) => c !== from);
  if (!extra.includes(target) && (list.find((c) => c.name === from)?.count ?? 0) === 0) extra.push(target);
  const imgs = { ...(await getSettings()).categoryImages ?? {} };
  if (from !== target && imgs[from]) {
    if (!imgs[target]) imgs[target] = imgs[from];
    else await dropImage(imgs[from]);
    delete imgs[from];
  }
  await saveSettings({ categories: extra, categoryImages: imgs });
  res.json({ ok: true });
}));
admin.post("/categories/delete", wrap(async (req, res) => {
  const name = catName(req.body?.name);
  const c = (await categoryList()).find((x) => x.name === name);
  if (!c) return res.json({ error: "Category not found" });
  if (c.count > 0) return res.json({ error: `${c.count} product${c.count === 1 ? " uses" : "s use"} this category. Rename it to merge it into another one, or move those products first.` });
  const s = await getSettings();
  const imgs = { ...s.categoryImages ?? {} };
  const old = imgs[name];
  delete imgs[name];
  await saveSettings({ categories: (s.categories ?? []).filter((x) => x !== name), categoryImages: imgs });
  await dropImage(old);
  res.json({ ok: true });
}));
admin.post("/categories/image", upload.any(), wrap(async (req, res) => {
  const raw = fld(req, "name").trim();
  const special = raw === "__all" || raw === "__new";
  const key2 = special ? raw : catName(raw);
  if (!special && !(await categoryList()).some((c) => c.name === key2)) return res.json({ error: "Category not found" });
  const cur = (await getSettings()).categoryImages ?? {};
  const old = cur[key2];
  const next = { ...cur };
  let uploaded = "";
  const f = files(req, "image")[0];
  if (f) {
    const r = await savePicture(f, "cat", 320, 320, "cover");
    if ("error" in r) return res.json({ error: r.error });
    uploaded = r.url;
    next[key2] = uploaded;
  } else if (fld(req, "remove") === "on") delete next[key2];
  else return res.json({ error: "Choose a picture first" });
  try {
    await saveSettings({ categoryImages: next });
  } catch {
    await dropImage(uploaded);
    return res.json({ error: "Could not save the icon. Please try again." });
  }
  if (old && old !== next[key2]) await dropImage(old);
  res.json({ ok: true, url: next[key2] ?? "" });
}));
admin.get("/products", wrap(async (_req, res) => res.json({ products: await listAllProducts() })));
admin.get("/products/:id", wrap(async (req, res) => {
  const [p, cats] = await Promise.all([getProductById(String(req.params.id)), categoryList()]);
  if (!p) return res.status(404).json({ error: "Not found" });
  res.json({ product: p, categories: cats.map((c) => c.name) });
}));
admin.get("/product-form-meta", wrap(async (_req, res) => res.json({ categories: (await categoryList()).map((c) => c.name) })));
admin.post("/products/save", upload.any(), wrap(async (req, res) => {
  const fail = (error) => res.json({ error });
  const id = fld(req, "id");
  const p = Schema.safeParse(Object.fromEntries(["name", "nameKm", "brand", "uom", "variants", "sku", "category", "description", "price", "stock"].map((k) => [k, fld(req, k)])));
  if (!p.success) return fail(p.error.issues[0]?.message ?? "Invalid input");
  const d2 = p.data;
  const labels = all(req, "labels").filter((l, i, a) => LABEL_IDS.includes(l) && a.indexOf(l) === i);
  if (labels.includes("preorder")) {
    const cap = (await getPromotions()).preorder.capSlots;
    if (d2.stock > cap) return fail(`A pre-order item can have at most ${cap} slots (Promotions > Pre-Order Global Rules). For pre-order items, Stock Qty is the number of slots.`);
  }
  const dates = labels.includes("preorder") ? checkPreorderDates(fld(req, "preorderStart"), fld(req, "preorderEnd")) : { ok: true, start: "", end: "" };
  if (!dates.ok) return fail(dates.error);
  const [taken, old] = await Promise.all([skuTaken(d2.sku, id || void 0), id ? getProductById(id) : Promise.resolve(null)]);
  if (taken) return fail("That SKU is already used by another product");
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
  let savedId = id;
  try {
    savedId = await upsertProduct({ id: id || void 0, name: d2.name, nameKm: d2.nameKm, brand: d2.brand, uom: d2.uom, variants: serializeOptions(pruneOptionImages(parseOptions(d2.variants), images.map((i) => i.src))), labels, sku: d2.sku, category: d2.category, description: d2.description, price: d2.price, stock: d2.stock, images, ...dates.start ? { preorderStart: dates.start, preorderEnd: dates.end } : {}, active: fld(req, "active") === "on" });
  } catch (e) {
    await deleteProductImages(uploaded);
    return fail(hint(e instanceof Error ? e.message : "") || "Could not save to the database. Nothing was lost; please try again.");
  }
  await deleteProductImages(removed);
  if (fld(req, "festivalsSent") === "1" && savedId) {
    try {
      const want = new Set(all(req, "festival"));
      const cur = await getPromotions();
      const next = cur.festivals.map((f) => {
        const has = f.productIds.includes(savedId), should = want.has(f.id);
        return has === should ? f : { ...f, productIds: should ? [...f.productIds, savedId] : f.productIds.filter((x) => x !== savedId) };
      });
      if (next.some((f, i) => f !== cur.festivals[i])) await savePromotions({ ...cur, festivals: next });
    } catch {
      return res.json({ error: "The product was saved, but its special offers could not be updated. Please open it again and re-tick them." });
    }
  }
  res.json({ ok: true });
}));
admin.post("/products/:id/labels", wrap(async (req, res) => {
  const p = await getProductById(String(req.params.id));
  if (!p) return res.status(404).json({ error: "Not found" });
  const next = (Array.isArray(req.body?.labels) ? req.body.labels : []).map(String).filter((l, i, a) => LABEL_IDS.includes(l) && a.indexOf(l) === i);
  if (next.some((l) => !(p.labels ?? []).includes(l))) return res.json({ error: "Labels can only be removed here. Use Edit to add a label." });
  await setLabels(p.id, next);
  res.json({ ok: true });
}));
admin.delete("/products/:id", wrap(async (req, res) => {
  const pid = String(req.params.id);
  await deleteProduct(pid);
  try {
    const cur = await getPromotions();
    if (cur.festivals.some((f) => f.productIds.includes(pid))) await savePromotions({ ...cur, festivals: cur.festivals.map((f) => ({ ...f, productIds: f.productIds.filter((x) => x !== pid) })) });
  } catch {
  }
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
  if (!isSlug(slug, await readStore())) return res.json({ error: "Unknown page" });
  const content = String(req.body?.content ?? "").replace(/\r\n/g, "\n").trim();
  if (content.length > MAX_CONTENT) return res.json({ error: `Too long (max ${MAX_CONTENT} characters)` });
  const patch = { content, deleted: false };
  if (!isBuiltin(slug) && req.body?.title !== void 0) {
    const title = String(req.body.title).trim().slice(0, MAX_TITLE);
    if (!title) return res.json({ error: "Page title is required" });
    patch.title = title;
  }
  await savePage(slug, patch);
  res.json({ ok: true });
}));
admin.post("/pages/create", wrap(async (req, res) => {
  const title = String(req.body?.title ?? "").trim().slice(0, MAX_TITLE);
  if (!title) return res.json({ error: "Page title is required" });
  const slug = String(req.body?.slug ?? "").trim().toLowerCase();
  if (!SLUG_RE.test(slug) || slug.length > 40) return res.json({ error: "Web address: use lowercase letters, numbers and dashes only (e.g. gift-guide)" });
  if (RESERVED_SLUGS.includes(slug) || isBuiltin(slug)) return res.json({ error: "That web address is already used by the shop. Pick another." });
  const content = String(req.body?.content ?? "").replace(/\r\n/g, "\n").trim();
  if (content.length > MAX_CONTENT) return res.json({ error: `Too long (max ${MAX_CONTENT} characters)` });
  if (allDefs(await readStore()).filter((d2) => d2.custom).length >= MAX_CUSTOM_PAGES) return res.json({ error: `You can have up to ${MAX_CUSTOM_PAGES} custom pages` });
  if (!await createCustomPage(slug, title, content)) return res.json({ error: "That web address is already used. Pick another." });
  res.json({ ok: true, slug });
}));
admin.post("/pages/:slug/delete", wrap(async (req, res) => {
  const slug = String(req.params.slug);
  if (!isBuiltin(slug)) {
    return res.json(await removeCustomPage(slug) ? { ok: true } : { error: "Unknown page" });
  }
  const d2 = PAGE_DEFS.find((p) => p.slug === slug);
  if (!d2 || !d2.deletable) return res.json({ error: "This page cannot be deleted" });
  await savePage(d2.slug, { deleted: true });
  res.json({ ok: true });
}));
admin.post("/pages/:slug/restore", wrap(async (req, res) => {
  const slug = String(req.params.slug);
  if (!isSlug(slug, await readStore())) return res.json({ error: "Unknown page" });
  await savePage(slug, { deleted: false });
  res.json({ ok: true });
}));
admin.get("/discounts", wrap(async (_req, res) => res.json({ codes: await listStoreDiscounts() })));
var limitOf = (v) => {
  if (v === void 0 || v === null || v === "" || Number(v) === 0) return null;
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= 1e6 ? n : "bad";
};
admin.post("/discounts/create", wrap(async (req, res) => {
  const code = normalizeCode(String(req.body?.code ?? "")), pct = Number(req.body?.percent), maxUses = limitOf(req.body?.maxUses), perCustomer = limitOf(req.body?.perCustomer);
  if (!CODE_RE.test(code)) return res.json({ error: "Code: 3-30 letters, numbers, - or _ (e.g. SAVE10)" });
  if (!percentOk(pct)) return res.json({ error: "Discount % must be a whole number from 10 to 50" });
  if (maxUses === "bad" || perCustomer === "bad") return res.json({ error: "A use limit must be a whole number of 1 or more (leave it empty for no limit)" });
  if (!await createStoreDiscount(code, pct, maxUses, perCustomer)) return res.json({ error: "That code already exists" });
  res.json({ ok: true });
}));
admin.post("/discounts/update", wrap(async (req, res) => {
  const code = normalizeCode(String(req.body?.code ?? ""));
  const b = req.body ?? {};
  if (!CODE_RE.test(code)) return res.json({ error: "Unknown code" });
  const patch = {};
  if (b.percent !== void 0) {
    const pct = Number(b.percent);
    if (!percentOk(pct)) return res.json({ error: "Discount % must be a whole number from 10 to 50" });
    patch.percent = pct;
  }
  if ("maxUses" in b) {
    const v = limitOf(b.maxUses);
    if (v === "bad") return res.json({ error: "A use limit must be a whole number of 1 or more (leave it empty for no limit)" });
    patch.maxUses = v;
  }
  if ("perCustomer" in b) {
    const v = limitOf(b.perCustomer);
    if (v === "bad") return res.json({ error: "A use limit must be a whole number of 1 or more (leave it empty for no limit)" });
    patch.perCustomer = v;
  }
  if (!await updateStoreDiscount(code, patch)) return res.json({ error: "Unknown code" });
  res.json({ ok: true });
}));
admin.get("/gifts", wrap(async (_req, res) => {
  const [gifts, redemptions] = await Promise.all([listGifts(false), listRedemptions()]);
  res.json({ gifts, redemptions });
}));
admin.post("/gifts/save", wrap(async (req, res) => {
  const c = checkGift(req.body ?? {});
  if (!c.ok) return res.json({ error: c.error });
  const id = String(req.body?.id ?? "") || void 0;
  const old = id ? (await listGifts(false)).find((g) => g.id === id) : void 0;
  if (id && !old) return res.json({ error: "Gift not found" });
  await saveGift(id, c.value);
  if (old?.image && old.image !== c.value.image) await dropImage(old.image);
  res.json({ ok: true });
}));
admin.post("/gifts/delete", wrap(async (req, res) => {
  const id = String(req.body?.id ?? "");
  const old = (await listGifts(false)).find((g) => g.id === id);
  await deleteGift(id);
  await dropImage(old?.image);
  res.json({ ok: true });
}));
admin.post("/gifts/redemption", wrap(async (req, res) => {
  const st = req.body?.status === "CANCELLED" ? "CANCELLED" : "CLAIMED";
  const ok = await setRedemption(String(req.body?.id ?? ""), st);
  res.json(ok ? { ok: true } : { error: "This redemption was already handled" });
}));
admin.get("/members", wrap(async (_req, res) => {
  const [orders, promos, ov, profiles] = await Promise.all([listAllOrders(), getPromotions(), getOverrides(), profilesByEmail()]);
  const by = /* @__PURE__ */ new Map();
  for (const o of orders) {
    const e = (o.accountEmail || o.customer.email || "").toLowerCase();
    if (!e) continue;
    (by.get(e) ?? by.set(e, []).get(e)).push(o);
  }
  const members = [...by.entries()].map(([email, os]) => {
    const spendCents = memberSpendOf(os), auto = tierByOrders(os, promos.membership), o = ov[email], forced = o?.tierId ? promos.membership.find((t) => t.id === o.tierId) ?? null : null;
    const last = os.reduce((a, x) => (x.createdAt ?? "") > (a.createdAt ?? "") ? x : a, os[0]);
    const pr = profiles.get(email);
    return { email, name: pr?.name || last.customer.name, phone: pr?.phone || last.customer.phone, avatar: pr?.avatar ?? "", address: pr?.address || last.customer.address || "", facebook: pr?.facebook || last.customer.facebook || "", telegram: pr?.telegram || last.customer.telegram || "", spendCents, orders: os.length, lastOrderAt: last.createdAt ?? "", autoTierId: auto?.id ?? null, tierId: o?.blocked || o?.removed ? null : (forced ?? auto)?.id ?? null, forcedTierId: o?.tierId ?? null, blocked: !!o?.blocked, removed: !!o?.removed, used: monthUsage(os) };
  });
  for (const [email, o] of Object.entries(ov)) {
    if (by.has(email) || !o.added) continue;
    const pr = profiles.get(email);
    members.push({ email, name: pr?.name || o.name || email, phone: pr?.phone || o.phone || "", avatar: pr?.avatar ?? "", address: pr?.address ?? "", facebook: pr?.facebook ?? "", telegram: pr?.telegram ?? "", spendCents: 0, orders: 0, lastOrderAt: "", autoTierId: null, tierId: o.blocked || o.removed ? null : o.tierId ?? null, forcedTierId: o.tierId ?? null, blocked: !!o.blocked, removed: !!o.removed, used: {} });
  }
  const spent = redeemedPoints(await listRedemptions().catch(() => []));
  const withPoints = members.map((m) => {
    const bonus = ov[m.email]?.bonus ?? 0, auto = pointsOf(m.spendCents, promos.membership, promos.memberPointCents);
    return { ...m, points: Math.max(0, auto + bonus - (spent.get(m.email) ?? 0)), pointsAuto: auto, pointsBonus: bonus, pointLog: (ov[m.email]?.log ?? []).slice(-10).reverse(), pointsSpent: spent.get(m.email) ?? 0 };
  });
  withPoints.sort((a, b) => b.spendCents - a.spendCents);
  withPoints.length = Math.min(withPoints.length, 2e3);
  res.json({ members: withPoints });
}));
admin.post("/members/set", wrap(async (req, res) => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const tierId = String(req.body?.tierId ?? "");
  const promos = await getPromotions();
  if (!email || email.length > 200) return res.json({ error: "Member not found" });
  if (tierId && !promos.membership.some((t) => t.id === tierId)) return res.json({ error: "Level not found" });
  const prev = (await getOverrides())[email];
  await setOverride(email, { tierId: tierId || void 0, blocked: req.body?.blocked === true, removed: req.body?.removed === true, added: prev?.added, name: prev?.name, phone: prev?.phone });
  res.json({ ok: true });
}));
admin.post("/members/points", wrap(async (req, res) => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const delta = Number(req.body?.points);
  const note = String(req.body?.note ?? "").trim().slice(0, 80);
  if (!email || email.length > 200) return res.json({ error: "Member not found" });
  if (!Number.isInteger(delta) || delta === 0 || Math.abs(delta) > 1e5) return res.json({ error: "Enter a whole number of points (not 0). Use a minus sign to take points off." });
  const promos = await getPromotions();
  const orders = await listOrdersByEmail(email);
  const o = (await getOverrides())[email];
  if (!orders.length && !o) return res.json({ error: "Member not found" });
  const auto = pointsOf(memberSpendOf(orders), promos.membership, promos.memberPointCents);
  const spent = redeemedPoints(await listRedemptions().catch(() => [])).get(email) ?? 0;
  const bonus = o?.bonus ?? 0;
  if (auto + bonus + delta - spent < 0) return res.json({ error: `This member only has ${Math.max(0, auto + bonus - spent)} points. You cannot take off more than that.` });
  await setOverride(email, { tierId: o?.tierId, blocked: o?.blocked, removed: o?.removed, added: o?.added, name: o?.name, phone: o?.phone, bonus: bonus + delta, log: [...o?.log ?? [], { at: (/* @__PURE__ */ new Date()).toISOString(), delta, note }] });
  res.json({ ok: true });
}));
admin.post("/members/add", wrap(async (req, res) => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const name = String(req.body?.name ?? "").trim().slice(0, 80);
  const phone = String(req.body?.phone ?? "").trim().slice(0, 30);
  const tierId = String(req.body?.tierId ?? "");
  const promos = await getPromotions();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return res.json({ error: "Enter a valid email address" });
  if (!tierId || !promos.membership.some((t) => t.id === tierId)) return res.json({ error: "Choose a membership level" });
  const prev = (await getOverrides())[email];
  await setOverride(email, { tierId, blocked: false, removed: false, added: prev?.added ?? true, name: name || prev?.name, phone: phone || prev?.phone });
  res.json({ ok: true });
}));
admin.post("/discounts/delete", wrap(async (req, res) => {
  const code = normalizeCode(String(req.body?.code ?? ""));
  if (!CODE_RE.test(code)) return res.json({ error: "Unknown code" });
  await deleteStoreDiscount(code);
  res.json({ ok: true });
}));
admin.get("/promotions", wrap(async (_req, res) => res.json({ promotions: await getPromotions(), categories: (await categoryList()).map((c) => c.name), products: (await listAllProducts()).map((p) => ({ id: p.id, name: p.name, nameKm: p.nameKm, sku: p.sku, category: p.category, price: p.price, image: p.images[0]?.src ?? "", active: p.active !== false })) })));
admin.post("/promotions/preorder", wrap(async (req, res) => {
  const c = checkPreorder({ depositPercent: req.body?.depositPercent, dispatchText: req.body?.dispatchText, capSlots: req.body?.capSlots });
  if (!c.ok) return res.json({ error: c.error });
  await savePromotions({ ...await getPromotions(), preorder: c.value });
  res.json({ ok: true });
}));
var campaignFields = (b) => checkCampaign({ name: b?.name, kind: b?.kind, minSpend: b?.minSpend, amount: b?.amount, percent: b?.percent, category: b?.category, startDate: b?.startDate, endDate: b?.endDate, productIds: b?.productIds, image: b?.image, buyQty: b?.buyQty, buyType: b?.buyType, buyTarget: b?.buyTarget, getQty: b?.getQty, bonusProductId: b?.bonusProductId, minQty: b?.minQty, area: b?.area });
admin.post("/promotions/campaigns/add", wrap(async (req, res) => {
  const c = campaignFields(req.body);
  if (!c.ok) return res.json({ error: c.error });
  const cur = await getPromotions();
  if (cur.campaigns.length >= MAX_CAMPAIGNS) return res.json({ error: `At most ${MAX_CAMPAIGNS} campaigns. Delete one first.` });
  await savePromotions({ ...cur, campaigns: [...cur.campaigns, { ...c.value, id: crypto3.randomUUID().slice(0, 8), active: req.body?.active !== false, createdAt: (/* @__PURE__ */ new Date()).toISOString() }] });
  res.json({ ok: true });
}));
admin.post("/promotions/campaigns/update", wrap(async (req, res) => {
  const c = campaignFields(req.body);
  if (!c.ok) return res.json({ error: c.error });
  const cur = await getPromotions();
  const id = String(req.body?.id ?? "");
  const prev = cur.campaigns.find((x) => x.id === id);
  if (!prev) return res.json({ error: "Campaign not found" });
  await savePromotions({ ...cur, campaigns: cur.campaigns.map((x) => x.id === id ? { ...x, ...c.value, ...typeof req.body?.active === "boolean" ? { active: req.body.active } : {} } : x) });
  if (prev.image && prev.image !== c.value.image) await dropImage(prev.image);
  res.json({ ok: true });
}));
admin.post("/promotions/campaigns/toggle", wrap(async (req, res) => {
  const cur = await getPromotions();
  const id = String(req.body?.id ?? "");
  if (!cur.campaigns.some((x) => x.id === id)) return res.json({ error: "Campaign not found" });
  await savePromotions({ ...cur, campaigns: cur.campaigns.map((x) => x.id === id ? { ...x, active: req.body?.active === true } : x) });
  res.json({ ok: true });
}));
admin.post("/promotions/campaigns/delete", wrap(async (req, res) => {
  const cur = await getPromotions();
  const id = String(req.body?.id ?? "");
  const gone = cur.campaigns.find((x) => x.id === id);
  await savePromotions({ ...cur, campaigns: cur.campaigns.filter((x) => x.id !== id) });
  await dropImage(gone?.image);
  res.json({ ok: true });
}));
var tierFields = (b) => checkTier({ id: b?.id, name: b?.name, emoji: b?.emoji, image: b?.image, minSpend: b?.minSpend, singleOrder: b?.singleOrder, specialName: b?.specialName, description: b?.description, perks: b?.perks, active: b?.active });
admin.post("/promotions/membership/save", wrap(async (req, res) => {
  const c = tierFields(req.body);
  if (!c.ok) return res.json({ error: c.error });
  const cur = await getPromotions();
  const id = String(req.body?.id ?? "");
  const at = cur.membership.findIndex((t) => t.id === id);
  const exists = at >= 0;
  if (!exists && cur.membership.length >= MAX_TIERS) return res.json({ error: `At most ${MAX_TIERS} levels. Delete one first.` });
  const index = exists ? at : cur.membership.length;
  if (index === 0 && c.value.minSpendCents < 1) return res.json({ error: "Enter how much a customer pays to join this first level (more than $0)" });
  if (index > 0 && c.value.singleOrderCents < 1) return res.json({ error: "Enter how much a customer pays in ONE order to upgrade to this level (more than $0)" });
  const prev = exists ? cur.membership[at] : void 0;
  const value = exists ? { ...c.value, id, minSpendCents: index === 0 ? c.value.minSpendCents : prev.minSpendCents } : { ...c.value, id: crypto3.randomUUID().slice(0, 8) };
  const list = exists ? cur.membership.map((t, i) => i === at ? value : t) : [...cur.membership, value];
  await savePromotions({ ...cur, membership: layoutTiers(list, cur.memberPointCents) });
  if (prev?.image && prev.image !== value.image) await dropImage(prev.image);
  const keep = new Set(value.perks.map((p) => p.image).filter(Boolean));
  for (const p of prev?.perks ?? []) if (p.image && !keep.has(p.image)) await dropImage(p.image);
  res.json({ ok: true });
}));
admin.post("/promotions/membership/points", wrap(async (req, res) => {
  const pointCents = Math.round(Number(req.body?.pointDollars) * 100);
  if (!isPointCents(pointCents)) return res.json({ error: "Dollars per point must be between $1 and $100,000" });
  const cur = await getPromotions();
  await savePromotions({ ...cur, memberPointCents: pointCents, membership: layoutTiers(cur.membership, pointCents) });
  res.json({ ok: true });
}));
admin.post("/promotions/membership/move", wrap(async (req, res) => {
  const cur = await getPromotions();
  const id = String(req.body?.id ?? "");
  const i = cur.membership.findIndex((t) => t.id === id);
  if (i < 0) return res.json({ error: "Level not found" });
  const j = req.body?.dir === "down" ? i - 1 : i + 1;
  if (j < 0 || j >= cur.membership.length) return res.json({ ok: true });
  const list = cur.membership.map((t) => ({ ...t }));
  const base = list[0].minSpendCents;
  [list[i], list[j]] = [list[j], list[i]];
  list[0].minSpendCents = base;
  await savePromotions({ ...cur, membership: layoutTiers(list, cur.memberPointCents) });
  res.json({ ok: true });
}));
admin.post("/promotions/membership/toggle", wrap(async (req, res) => {
  const cur = await getPromotions();
  const id = String(req.body?.id ?? "");
  if (!cur.membership.some((t) => t.id === id)) return res.json({ error: "Level not found" });
  await savePromotions({ ...cur, membership: cur.membership.map((t) => t.id === id ? { ...t, active: req.body?.active === true } : t) });
  res.json({ ok: true });
}));
admin.post("/promotions/membership/delete", wrap(async (req, res) => {
  const cur = await getPromotions();
  const id = String(req.body?.id ?? "");
  if (!cur.membership.some((t) => t.id === id)) return res.json({ error: "Level not found" });
  const gone = cur.membership.find((t) => t.id === id);
  await savePromotions({ ...cur, membership: layoutTiers(cur.membership.filter((t) => t.id !== id), cur.memberPointCents) });
  await dropImage(gone?.image);
  for (const p of gone?.perks ?? []) await dropImage(p.image);
  res.json({ ok: true });
}));
admin.post("/promotions/image", upload.any(), wrap(async (req, res) => {
  const f = files(req, "image")[0];
  if (!f) return res.json({ error: "Choose a picture first" });
  const r = await savePicture(f, "offer", 900, 900, "inside");
  if ("error" in r) return res.json({ error: r.error });
  res.json({ ok: true, url: r.url });
}));
var festivalFields = (b) => checkFestival({ name: b?.name, code: b?.code, nameKm: b?.nameKm, text: b?.text, textKm: b?.textKm, startDate: b?.startDate, endDate: b?.endDate, percent: b?.percent, productIds: b?.productIds, image: b?.image });
admin.post("/promotions/festivals/add", wrap(async (req, res) => {
  const f = festivalFields(req.body);
  if (!f.ok) return res.json({ error: f.error });
  const cur = await getPromotions();
  if (cur.festivals.length >= MAX_FESTIVALS) return res.json({ error: `At most ${MAX_FESTIVALS} special offers. Delete one first.` });
  await savePromotions({ ...cur, festivals: [...cur.festivals, { ...f.value, id: crypto3.randomUUID().slice(0, 8), active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString() }] });
  res.json({ ok: true });
}));
admin.post("/promotions/festivals/update", wrap(async (req, res) => {
  const f = festivalFields(req.body);
  if (!f.ok) return res.json({ error: f.error });
  const cur = await getPromotions();
  const id = String(req.body?.id ?? "");
  const prev = cur.festivals.find((x) => x.id === id);
  if (!prev) return res.json({ error: "Special offer not found" });
  await savePromotions({ ...cur, festivals: cur.festivals.map((x) => x.id === id ? { ...x, ...f.value } : x) });
  if (prev.image && prev.image !== f.value.image) await dropImage(prev.image);
  res.json({ ok: true });
}));
admin.post("/promotions/festivals/toggle", wrap(async (req, res) => {
  const cur = await getPromotions();
  const id = String(req.body?.id ?? "");
  if (!cur.festivals.some((x) => x.id === id)) return res.json({ error: "Special offer not found" });
  await savePromotions({ ...cur, festivals: cur.festivals.map((x) => x.id === id ? { ...x, active: req.body?.active === true } : x) });
  res.json({ ok: true });
}));
admin.post("/promotions/festivals/delete", wrap(async (req, res) => {
  const cur = await getPromotions();
  const id = String(req.body?.id ?? "");
  const gone = cur.festivals.find((x) => x.id === id);
  await savePromotions({ ...cur, festivals: cur.festivals.filter((x) => x.id !== id) });
  await dropImage(gone?.image);
  res.json({ ok: true });
}));
admin.get("/staff", wrap(async (req, res) => res.json({ ...await listStaff(), me: (adminOf(req).email ?? "").toLowerCase() })));
admin.post("/staff/add", wrap(async (req, res) => {
  const e = await addStaff(req.body ?? {});
  res.json(e ? { error: e } : { ok: true });
}));
admin.post("/staff/update", wrap(async (req, res) => {
  const body3 = req.body ?? {};
  const self = String(body3.email ?? "").trim().toLowerCase() === (adminOf(req).email ?? "").toLowerCase();
  if (self && (body3.role !== void 0 && body3.role !== "owner" || body3.active === false)) return res.json({ error: "You cannot lower or deactivate your own access. Ask another owner." });
  const e = await updateStaff(body3);
  res.json(e ? { error: e } : { ok: true });
}));
admin.post("/staff/delete", wrap(async (req, res) => {
  if (String(req.body?.email ?? "").trim().toLowerCase() === (adminOf(req).email ?? "").toLowerCase()) return res.json({ error: "You cannot remove yourself." });
  const e = await deleteStaff(String(req.body?.email ?? ""));
  res.json(e ? { error: e } : { ok: true });
}));
var Url = z2.string().trim().max(300).refine((v) => v === "" || /^https:\/\/[^\s]+$/.test(v), "Links must start with https://");
var Fee = z2.coerce.number().min(0).max(100);
admin.post("/settings", wrap(async (req, res) => {
  const p = z2.object({ pp: Fee, prov: Fee, tg: Url, fb: Url, ig: Url }).safeParse({ pp: req.body?.pp, prov: req.body?.prov, tg: req.body?.tg ?? "", fb: req.body?.fb ?? "", ig: req.body?.ig ?? "" });
  if (!p.success) return res.json({ error: p.error.issues[0]?.message ?? "Invalid input" });
  await saveSettings({ shipPhnomPenhCents: Math.round(p.data.pp * 100), shipProvinceCents: Math.round(p.data.prov * 100), telegramUrl: p.data.tg, facebookUrl: p.data.fb, instagramUrl: p.data.ig });
  res.json({ ok: true });
}));
admin.get("/bakong/diagnose", wrap(async (_req, res) => {
  const d2 = await bakongDiagnose();
  const directOk = d2.ok;
  if (watcherSecret()) {
    for (const x of d2.steps) if (x.label === "Reach Bakong API") x.label = "Direct check from the website";
    const seen2 = await watcherSeenAt(), ago = seen2 ? Math.round((Date.now() - seen2) / 1e3) : null, on = ago !== null && ago < 120;
    d2.steps.push({ label: "Shop-PC watcher (optional)", ok: on || directOk, detail: on ? `running (last contact ${ago} s ago)` : `NOT running${ago === null ? " (never contacted this site)" : ` (last contact ${Math.round(ago / 60)} min ago)`}. ${directOk ? "Not needed while the direct check works." : "Needed because Bakong blocks the website: run start-bakong-watcher.bat on a computer in Cambodia that stays on 24/7."}` });
    d2.ok = directOk || on;
  }
  res.json(d2);
}));
admin.post("/settings/payments", wrap(async (req, res) => {
  const p = z2.object({ payBakong: z2.enum(["on", "paused", "soon"]), payQr: z2.enum(["on", "paused", "soon"]), payCod: z2.enum(["on", "paused", "soon"]) }).safeParse(req.body);
  if (!p.success) return res.json({ error: "Invalid input" });
  if (![p.data.payBakong, p.data.payQr, p.data.payCod].includes("on")) return res.json({ error: "Keep at least one payment option on (working), or customers cannot check out." });
  await saveSettings(p.data);
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
    uploaded = await uploadProductImage(`logo-${crypto3.randomUUID().replace(/-/g, "").slice(0, 8)}.webp`, small, "image/webp");
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
var MAX_BANNERS = 10;
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
      const small = new Uint8Array(await sharp(bytes).rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer());
      uploaded.push(await uploadProductImage(`banner-${crypto3.randomUUID().replace(/-/g, "").slice(0, 8)}.webp`, small, "image/webp"));
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
var OFFER_SLOTS = { hero: { key: "offerHeroImage", prefix: "offer-hero", w: 2400, h: 1200 }, mascot: { key: "offerMascotImage", prefix: "offer-mascot", w: 900, h: 900 }, footer: { key: "offerFooterImage", prefix: "offer-footer", w: 2400, h: 600 }, detail: { key: "offerDetailImage", prefix: "offer-detail", w: 2400, h: 1e3 }, full: { key: "offerFullImage", prefix: "offer-full", w: 2400, h: 1e3 }, products: { key: "productsBannerImage", prefix: "offer-products", w: 2400, h: 900 }, membership: { key: "membershipBannerImage", prefix: "banner-membership", w: 2400, h: 900 }, newarrival: { key: "newArrivalBannerImage", prefix: "banner-newarrival", w: 2400, h: 900 }, preorder: { key: "preorderBannerImage", prefix: "banner-preorder", w: 2400, h: 900 } };
admin.post("/settings/offer-page", upload.any(), wrap(async (req, res) => {
  const slot = fld(req, "slot");
  if (slot === "text") {
    try {
      await saveSettings({ offerHeroText: fld(req, "value") === "on" });
    } catch {
      return res.json({ error: "Could not save. Please try again." });
    }
    return res.json({ ok: true });
  }
  if (slot === "footerbtn") {
    try {
      await saveSettings({ offerFooterButton: fld(req, "value") === "on" });
    } catch {
      return res.json({ error: "Could not save. Please try again." });
    }
    return res.json({ ok: true });
  }
  if (slot === "size") {
    const id = fld(req, "key"), n = Math.round(Number(fld(req, "value")));
    if (!/^[a-z][a-z-]{0,30}$/.test(id) || !Number.isFinite(n)) return res.json({ error: "Invalid size" });
    const cur = (await getSettings()).imageSizes ?? {};
    try {
      await saveSettings({ imageSizes: { ...cur, [id]: Math.min(250, Math.max(50, n)) } });
    } catch {
      return res.json({ error: "Could not save. Please try again." });
    }
    return res.json({ ok: true });
  }
  if (slot === "mascotsize") {
    const n = Math.round(Number(fld(req, "value")));
    if (!Number.isFinite(n)) return res.json({ error: "Invalid size" });
    try {
      await saveSettings({ offerMascotScale: Math.min(250, Math.max(50, n)) });
    } catch {
      return res.json({ error: "Could not save. Please try again." });
    }
    return res.json({ ok: true });
  }
  if (!(slot in OFFER_SLOTS)) return res.json({ error: "Unknown picture" });
  const sl = OFFER_SLOTS[slot];
  const old = (await getSettings())[sl.key];
  let uploaded = "";
  const f = files(req, "image")[0];
  if (f) {
    const r = await savePicture(f, sl.prefix, sl.w, sl.h, "inside");
    if ("error" in r) return res.json({ error: r.error });
    uploaded = r.url;
  } else if (fld(req, "remove") !== "on") return res.json({ error: "Choose a picture first" });
  try {
    await saveSettings({ [sl.key]: uploaded });
  } catch {
    await dropImage(uploaded);
    return res.json({ error: "Could not save the picture. Please try again." });
  }
  if (old && old !== uploaded) await dropImage(old);
  res.json({ ok: true, url: uploaded });
}));
admin.post("/settings/qr", upload.any(), wrap(async (req, res) => {
  const old = (await getSettings()).qrUrl || DEFAULT_SETTINGS.qrUrl;
  let next = "none", uploaded = null;
  if (fld(req, "reset") !== "on") {
    const f = files(req, "qr")[0];
    if (!f) return res.json({ error: "Choose an image file first" });
    const bytes = new Uint8Array(f.buffer);
    const v = validateImage(bytes, f.mimetype);
    if (!v.ok) return res.json({ error: v.error });
    const small = new Uint8Array(await sharp(bytes).rotate().resize({ width: 1200, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 92 }).toBuffer());
    uploaded = await uploadProductImage(`payqr-${crypto3.randomUUID().replace(/-/g, "").slice(0, 8)}.webp`, small, "image/webp");
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
app.use((err, _req, res, next) => {
  if (res.headersSent) return next(err);
  const e = err;
  if (e?.type === "entity.too.large" || e?.code === "LIMIT_FILE_SIZE") return res.status(413).json({ error: "The file or request is too large." });
  if (e?.type === "entity.parse.failed" || e?.code?.startsWith?.("LIMIT_")) return res.status(400).json({ error: "Bad request" });
  console.error("[unhandled]", err);
  res.status(500).json({ error: "Server error" });
});
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
