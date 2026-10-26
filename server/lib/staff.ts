// Admin staff (table public.staff_members). The owner emails in shared/admin.ts always have access, even if this table is missing or empty.
import { db, must } from "./db";
import { ADMIN_EMAILS, isAdminEmail } from "../../shared/admin";
import { isRole, type Role } from "../../shared/roles";
export type Staff = { email: string; name: string; role: Role; active: boolean; lastActiveAt: string | null; createdAt: string; fixed: boolean };
type Row = { email: string; name: string | null; role: string; active: boolean; last_active_at: string | null; created_at: string };
const toStaff = (r: Row): Staff => ({ email: r.email, name: r.name ?? "", role: isRole(r.role) ? r.role : "editor", active: r.active, lastActiveAt: r.last_active_at, createdAt: r.created_at, fixed: ADMIN_EMAILS.includes(r.email) });
const COLS = "email,name,role,active,last_active_at,created_at";
const cache = new Map<string, { at: number; row: Row | null }>(); const seen = new Map<string, number>();
const key = (e: string) => e.trim().toLowerCase();
async function rowFor(email: string): Promise<Row | null> {
  const k = key(email), hit = cache.get(k); if (hit && Date.now() - hit.at < 30_000) return hit.row;
  const row = must(await db().from("staff_members").select(COLS).eq("email", k).maybeSingle()) as Row | null;
  cache.set(k, { at: Date.now(), row }); return row;
}
/** The role this signed-in account has in the admin area, or null (not staff, inactive, or e-mail not verified). */
export async function roleFor(email: string | null | undefined, verified: boolean): Promise<Role | null> {
  if (!email || !verified) return null;
  if (isAdminEmail(email, true)) return "owner";
  try { const r = await rowFor(email); return r && r.active && isRole(r.role) ? r.role : null; } catch { return null; }
}
/** Remembers "last active" (at most once a minute per person). Never throws. */
export async function touchStaff(email: string | null | undefined, name?: string) {
  if (!email) return; const k = key(email); if (Date.now() - (seen.get(k) ?? 0) < 60_000) return; seen.set(k, Date.now());
  try {
    const now = new Date().toISOString();
    if (isAdminEmail(k, true)) must(await db().from("staff_members").upsert({ email: k, role: "owner", last_active_at: now, ...(name ? { name } : {}) }, { onConflict: "email" }).select("email"));
    else must(await db().from("staff_members").update({ last_active_at: now }).eq("email", k).select("email"));
    cache.delete(k);
  } catch { /* table missing or offline: ignore */ }
}
/** `ready` is false when the staff table has not been created yet (owners are still listed and still have access). */
export async function listStaff(): Promise<{ staff: Staff[]; ready: boolean }> {
  let rows: Staff[] = [], ready = true;
  try { rows = (must(await db().from("staff_members").select(COLS).order("created_at", { ascending: true })) as Row[]).map(toStaff); } catch (e) { ready = false; console.error("[staff list]", e instanceof Error ? e.message : e); }
  const have = new Set(rows.map((r) => r.email));
  const owners = ADMIN_EMAILS.filter((e) => !have.has(e)).map((email): Staff => ({ email, name: "", role: "owner", active: true, lastActiveAt: null, createdAt: "", fixed: true }));
  const staff = [...rows.map((r) => (r.fixed ? { ...r, role: "owner" as Role, active: true } : r)), ...owners].sort((a, b) => Number(b.role === "owner") - Number(a.role === "owner") || a.createdAt.localeCompare(b.createdAt));
  return { staff, ready };
}
const SETUP = "The staff table is missing. Open Supabase > SQL Editor, paste supabase/setup_all.sql and click Run (safe to run again), then reload.";
const missing = (e: unknown) => /does not exist|schema cache|could not find the table|relation .* does not exist/i.test(e instanceof Error ? e.message : String(e));
/** Runs a staff write; a missing table becomes a plain-language message instead of a server error. */
async function guarded(fn: () => Promise<string | null>): Promise<string | null> { try { return await fn(); } catch (e) { if (missing(e)) return SETUP; throw e; } }
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export type StaffInput = { email?: unknown; name?: unknown; role?: unknown; active?: unknown };
const cleanName = (v: unknown) => String(v ?? "").trim().slice(0, 80);
export const addStaff = (i: StaffInput) => guarded(() => addStaffRaw(i));
async function addStaffRaw(i: StaffInput): Promise<string | null> {
  const email = key(String(i.email ?? "")); if (!EMAIL.test(email) || email.length > 200) return "Enter a valid email address";
  if (ADMIN_EMAILS.includes(email)) return "That email is already a founding owner";
  if (!isRole(i.role)) return "Choose a role: Owner, Admin or Editor";
  if (await rowFor(email).catch(() => null)) { cache.delete(email); return "That email is already on the team"; }
  must(await db().from("staff_members").insert({ email, name: cleanName(i.name), role: i.role, active: true }).select("email")); cache.delete(email); return null;
}
export const updateStaff = (i: StaffInput) => guarded(() => updateStaffRaw(i));
async function updateStaffRaw(i: StaffInput): Promise<string | null> {
  const email = key(String(i.email ?? "")); const fixed = ADMIN_EMAILS.includes(email); const patch: Record<string, unknown> = {};
  if (i.name !== undefined) patch.name = cleanName(i.name);
  if (i.role !== undefined) { if (fixed) return "Founding owners always keep the Owner role"; if (!isRole(i.role)) return "Choose a role: Owner, Admin or Editor"; patch.role = i.role; }
  if (i.active !== undefined) { if (fixed) return "Founding owners cannot be made inactive"; patch.active = i.active === true; }
  if (fixed) { must(await db().from("staff_members").upsert({ email, role: "owner", ...patch }, { onConflict: "email" }).select("email")); cache.delete(email); return null; }
  const rows = must(await db().from("staff_members").update(patch).eq("email", email).select("email")) as unknown[];
  cache.delete(email); return rows.length ? null : "Staff member not found";
}
export const deleteStaff = (emailIn: string) => guarded(() => deleteStaffRaw(emailIn));
async function deleteStaffRaw(emailIn: string): Promise<string | null> {
  const email = key(emailIn); if (ADMIN_EMAILS.includes(email)) return "Founding owners cannot be removed";
  must(await db().from("staff_members").delete().eq("email", email).select("email")); cache.delete(email); return null;
}
