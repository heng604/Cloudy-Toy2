// Editable site pages (About, Contact). Stored in public.site_settings, key = "pages".
export const PAGE_DEFS = [
  { slug: "about", title: "About", deletable: false },
  { slug: "contact", title: "Contact", deletable: true },
] as const;
export type PageSlug = (typeof PAGE_DEFS)[number]["slug"];
export type PageData = { content: string; deleted: boolean };
export const isSlug = (s: string): s is PageSlug => PAGE_DEFS.some((p) => p.slug === s);
export const MAX_CONTENT = 20000;
/** Starter text for About. Written without invented facts (no dates or names): the owner edits it in Admin > Pages. */
export const DEFAULT_ABOUT = `## Our story

Cloudy-Toy started with one simple idea: little toys can bring big happiness.

We choose toys that are fun, safe and worth giving, and we deliver them across Cambodia, from Phnom Penh to the provinces.

## What we believe

Every child deserves a moment of joy, and every parent deserves a shop they can trust. That is why we keep our prices clear, our delivery simple, and our team easy to reach on Telegram and Facebook.

## Thank you

Thank you for being part of the Cloudy-Toy story.`;
export const DEFAULT_CONTACT = `## Contact our admin

Have a question about an order or a toy? Message our admin and we will reply as soon as we can.

Please include your order number so we can help you faster.`;
export const PAGE_DEFAULTS: Record<PageSlug, string> = { about: DEFAULT_ABOUT, contact: DEFAULT_CONTACT };
export type PagesStore = Partial<Record<PageSlug, Partial<PageData>>>;
export const resolvePage = (s: PagesStore, slug: PageSlug): PageData => ({ content: s[slug]?.content ?? PAGE_DEFAULTS[slug], deleted: !!s[slug]?.deleted });
export const hiddenFrom = (s: PagesStore): PageSlug[] => PAGE_DEFS.filter((d) => d.deletable && s[d.slug]?.deleted).map((d) => d.slug);
