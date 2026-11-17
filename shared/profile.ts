import { z } from "zod";
/** Only these fields are editable by a customer. Role, totals, payment status are never accepted. */
export const ProfileInput = z.object({
  display_name: z.string().trim().max(80),
  phone: z.string().trim().max(30).regex(/^[0-9+\-\s()]*$/, "Use digits, spaces, + or - only"),
  address: z.string().trim().max(300).default(""),
  facebook: z.string().trim().max(100).default(""),
  telegram: z.string().trim().max(100).default(""),
});
/** What the profile page and the admin Membership list show for one customer. `avatar` is "" when no photo. */
export type ProfileInfo = { name: string; phone: string; address: string; facebook: string; telegram: string; avatar: string };
