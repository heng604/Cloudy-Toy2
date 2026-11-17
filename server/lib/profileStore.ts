// Customer profile (table public.profiles): name, phone, address, Facebook, Telegram and a profile photo. Read / written by the server only (service role),
// so a customer can never change anything but these fields, and the admin can look a customer up by email.
import { db } from "./db";
import type { ProfileInfo } from "../../shared/profile";
const COLS = "id, email, display_name, phone, address, facebook, telegram, avatar_url";
type Row = { id: string; email: string | null; display_name: string | null; phone: string | null; address: string | null; facebook: string | null; telegram: string | null; avatar_url: string | null };
const info = (r: Partial<Row> | null | undefined, fallbackName = ""): ProfileInfo => ({ name: r?.display_name ?? fallbackName, phone: r?.phone ?? "", address: r?.address ?? "", facebook: r?.facebook ?? "", telegram: r?.telegram ?? "", avatar: r?.avatar_url ?? "" });
export async function getProfile(id: string, fallbackName = ""): Promise<ProfileInfo> {
  const { data } = await db().from("profiles").select(COLS).eq("id", id).maybeSingle(); return info(data as Row | null, fallbackName);
}
export async function saveProfile(id: string, email: string | undefined, v: { display_name: string; phone: string; address: string; facebook: string; telegram: string }) {
  const { error } = await db().from("profiles").upsert({ id, ...(email ? { email: email.toLowerCase() } : {}), ...v, updated_at: new Date().toISOString() }); if (error) throw new Error(error.message);
}
/** Returns the old photo address (so the caller can delete the file). */
export async function setAvatar(id: string, email: string | undefined, url: string): Promise<string> {
  const old = ((await db().from("profiles").select("avatar_url").eq("id", id).maybeSingle()).data as { avatar_url: string | null } | null)?.avatar_url ?? "";
  const { error } = await db().from("profiles").upsert({ id, ...(email ? { email: email.toLowerCase() } : {}), avatar_url: url || null, updated_at: new Date().toISOString() }); if (error) throw new Error(error.message);
  return old;
}
/** Every profile that has an email, keyed by lowercase email (the admin Membership list joins members to this). Empty when the migration is not applied yet. */
export async function profilesByEmail(): Promise<Map<string, ProfileInfo>> {
  const out = new Map<string, ProfileInfo>();
  try { const { data, error } = await db().from("profiles").select(COLS).not("email", "is", null).limit(5000); if (error) throw error; for (const r of (data ?? []) as Row[]) if (r.email) out.set(r.email.toLowerCase(), info(r)); } catch { /* column missing (migration 0018 not applied): members just show without a photo */ }
  return out;
}
