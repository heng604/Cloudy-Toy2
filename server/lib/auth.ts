import type { NextFunction, Request, Response } from "express";
import type { User } from "@supabase/supabase-js";
import { db } from "./db";
import { can, type Perm, type Role } from "../../shared/roles";
import { roleFor, touchStaff } from "./staff";
/** Verifies the Supabase access token sent by the browser (Authorization: Bearer ...). Returns the user or null. */
export async function userFromReq(req: Request): Promise<User | null> {
  const h = String(req.headers.authorization ?? ""); const token = h.startsWith("Bearer ") ? h.slice(7).trim() : "";
  if (!token) return null;
  try { const { data, error } = await db().auth.getUser(token); return error ? null : data.user; } catch { return null; }
}
/** Signed-in staff member (owner, admin or editor) with their role, or null. */
export const adminOrNull = async (req: Request) => { const u = await userFromReq(req); if (!u) return null; const role = await roleFor(u.email, !!u.email_confirmed_at); return role ? { user: u, role } : null; };
/** Unauthorized => plain 404, no data revealed (same as the old branded 404). */
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const a = await adminOrNull(req);
  if (!a) return res.status(404).json({ error: "Not found" });
  Object.assign(req, { admin: a.user, role: a.role });
  const m = (a.user.user_metadata ?? {}) as { full_name?: string; name?: string };
  await touchStaff(a.user.email, m.full_name || m.name); next();
}
/** 403 when the staff member's role does not allow this area (the browser also hides those pages). */
export const needs = (p: Perm) => (req: Request, res: Response, next: NextFunction) => (can(roleOf(req), p) ? next() : res.status(403).json({ error: "Your role cannot do this." }));
export async function requireUser(req: Request, res: Response, next: NextFunction) {
  const u = await userFromReq(req);
  if (!u) return res.status(401).json({ error: "Sign in required" });
  (req as Request & { user: User }).user = u; next();
}
export const adminOf = (req: Request) => (req as Request & { admin: User }).admin;
export const userOf = (req: Request) => (req as Request & { user: User }).user;
export const roleOf = (req: Request) => (req as Request & { role: Role }).role;
