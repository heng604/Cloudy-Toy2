import type { NextFunction, Request, Response } from "express";
import type { User } from "@supabase/supabase-js";
import { db } from "./db";
import { isAdminEmail } from "../../shared/admin";
/** Verifies the Supabase access token sent by the browser (Authorization: Bearer ...). Returns the user or null. */
export async function userFromReq(req: Request): Promise<User | null> {
  const h = String(req.headers.authorization ?? ""); const token = h.startsWith("Bearer ") ? h.slice(7).trim() : "";
  if (!token) return null;
  try { const { data, error } = await db().auth.getUser(token); return error ? null : data.user; } catch { return null; }
}
export const adminOrNull = async (req: Request) => { const u = await userFromReq(req); return u && isAdminEmail(u.email, !!u.email_confirmed_at) ? u : null; };
/** Unauthorized => plain 404, no data revealed (same as the old branded 404). */
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const u = await adminOrNull(req);
  if (!u) return res.status(404).json({ error: "Not found" });
  (req as Request & { admin: User }).admin = u; next();
}
export async function requireUser(req: Request, res: Response, next: NextFunction) {
  const u = await userFromReq(req);
  if (!u) return res.status(401).json({ error: "Sign in required" });
  (req as Request & { user: User }).user = u; next();
}
export const adminOf = (req: Request) => (req as Request & { admin: User }).admin;
export const userOf = (req: Request) => (req as Request & { user: User }).user;
