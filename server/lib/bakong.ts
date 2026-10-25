// Bakong KHQR: builds a dynamic QR for one order and asks Bakong whether it was paid. The ONLY way a Bakong order becomes PAID is checkPaid() returning ok.
import { createRequire } from "node:module";
import QRCode from "qrcode";
const nodeRequire = createRequire(import.meta.url);
const { BakongKHQR, khqrData, IndividualInfo } = nodeRequire("bakong-khqr") as any; // the package ships no types
export const QR_MINUTES = 10;
const cfg = () => ({
  account: (process.env.BAKONG_ACCOUNT_ID ?? "").trim(), // your Bakong account id, e.g. yourname@aba
  token: (process.env.BAKONG_API_TOKEN ?? "").trim(), // Bakong Open API token (https://api-bakong.nbc.gov.kh/register)
  name: (process.env.BAKONG_MERCHANT_NAME ?? "Cloudy Toys").trim().slice(0, 25),
  city: (process.env.BAKONG_MERCHANT_CITY ?? "Phnom Penh").trim().slice(0, 15),
  api: (process.env.BAKONG_API_URL ?? "https://api-bakong.nbc.gov.kh").trim().replace(/\/$/, ""),
});
export const bakongEnabled = () => { const c = cfg(); return !!c.account && !!c.token; };
export const bakongAccount = () => cfg().account;
export const bakongName = () => cfg().name;
/** KHQR string + md5 + PNG data-URL for an exact USD amount. */
export async function makeKhqr(orderNumber: string, totalCents: number) {
  const c = cfg(); const expiresAt = Date.now() + QR_MINUTES * 60_000;
  const info = new IndividualInfo(c.account, c.name, c.city, { currency: khqrData.currency.usd, amount: totalCents / 100, billNumber: orderNumber, expirationTimestamp: expiresAt });
  const r = new BakongKHQR().generateIndividual(info);
  if (!r?.data?.qr || !r.data.md5) throw new Error(`KHQR failed: ${r?.status?.message ?? "unknown"}`);
  const image = await QRCode.toDataURL(r.data.qr, { errorCorrectionLevel: "M", margin: 1, width: 560 });
  return { qr: r.data.qr as string, md5: r.data.md5 as string, expiresAt, image };
}
export type PaidCheck = { ok: true; hash?: string } | { ok: false; reason: "NOT_FOUND" | "MISMATCH" | "ERROR"; detail?: string };
/** Asks Bakong about one QR (by md5). Amount, currency and receiving account must ALL match the order, otherwise it is not accepted. */
export async function checkPaid(md5: string, totalCents: number): Promise<PaidCheck> {
  const c = cfg();
  try {
    const res = await fetch(`${c.api}/v1/check_transaction_by_md5`, { method: "POST", signal: AbortSignal.timeout(6000), headers: { Authorization: `Bearer ${c.token}`, "Content-Type": "application/json" }, body: JSON.stringify({ md5 }) });
    const j = await res.json().catch(() => null) as { responseCode?: number; responseMessage?: string; data?: { hash?: string; amount?: number; currency?: string; toAccountId?: string } | null } | null;
    if (!j) return { ok: false, reason: "ERROR", detail: `Bakong HTTP ${res.status}` };
    if (j.responseCode !== 0 || !j.data) return j.responseCode === 1 ? { ok: false, reason: "NOT_FOUND" } : { ok: false, reason: "ERROR", detail: `Bakong HTTP ${res.status}: ${j.responseMessage ?? "error"}` };
    const d = j.data;
    if (String(d.currency).toUpperCase() !== "USD" || Math.round(Number(d.amount) * 100) !== totalCents || (d.toAccountId ?? "").toLowerCase() !== c.account.toLowerCase())
      return { ok: false, reason: "MISMATCH", detail: `amount ${d.amount} ${d.currency} to ${d.toAccountId}` };
    return { ok: true, hash: d.hash };
  } catch (e) { return { ok: false, reason: "ERROR", detail: e instanceof Error ? e.message : "network error" }; }
}
/** Admin connection test: tells the shop owner exactly why automatic confirmation does (not) work. Never returns the token. */
export async function bakongDiagnose(): Promise<{ ok: boolean; steps: { label: string; ok: boolean; detail: string }[] }> {
  const c = cfg(); const steps: { label: string; ok: boolean; detail: string }[] = [];
  steps.push({ label: "BAKONG_ACCOUNT_ID", ok: !!c.account, detail: c.account ? `set (${c.account})` : "missing: add it in Vercel → Settings → Environment Variables, then redeploy" });
  steps.push({ label: "BAKONG_API_TOKEN", ok: !!c.token, detail: c.token ? "set" : "missing: get one at https://api-bakong.nbc.gov.kh/register, add it in Vercel, then redeploy" });
  if (!c.account || !c.token) return { ok: false, steps };
  try {
    const res = await fetch(`${c.api}/v1/check_transaction_by_md5`, { method: "POST", signal: AbortSignal.timeout(8000), headers: { Authorization: `Bearer ${c.token}`, "Content-Type": "application/json" }, body: JSON.stringify({ md5: "0".repeat(32) }) });
    const text = await res.text(); let j: { responseCode?: number; responseMessage?: string } | null = null; try { j = JSON.parse(text); } catch { /* not JSON */ }
    if (!j) steps.push({ label: "Reach Bakong API", ok: false, detail: `HTTP ${res.status}, not a Bakong reply. Bakong usually blocks servers outside Cambodia. Host the API on a Cambodian server/VPS, or set BAKONG_API_URL to a relay inside Cambodia.` });
    else if (res.status === 401 || res.status === 403 || j.responseCode === 3 || /token|unauthor|expired/i.test(j.responseMessage ?? "")) steps.push({ label: "Reach Bakong API", ok: false, detail: `Bakong answered HTTP ${res.status}: ${j.responseMessage ?? "rejected"}. The token is invalid or expired: renew it, or the request was blocked by region.` });
    else { steps.push({ label: "Reach Bakong API", ok: true, detail: `connected (HTTP ${res.status})` }); steps.push({ label: "Token accepted", ok: true, detail: j.responseMessage ?? "ok" }); }
  } catch (e) { steps.push({ label: "Reach Bakong API", ok: false, detail: `${e instanceof Error ? e.message : "network error"}. The server cannot connect to Bakong (often blocked outside Cambodia).` }); }
  return { ok: steps.every((s) => s.ok), steps };
}
