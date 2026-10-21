/** The ONLY account allowed into the admin area. Not configurable from env on purpose. */
export const ADMIN_EMAIL = "toyscloudy@gmail.com";
export function isAdminEmail(email: string | null | undefined, verified: boolean | undefined, allowlist: string = ADMIN_EMAIL): boolean {
  if (!email || !verified) return false;
  return allowlist.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean).includes(email.toLowerCase());
}
