// Editable site pages (About, Contact). Stored in public.site_settings, key = "pages".
export const PAGE_DEFS = [
  { slug: "about", title: "About", deletable: false },
  { slug: "contact", title: "Contact", deletable: true },
  { slug: "shipping", title: "Shipping Policy", deletable: true },
  { slug: "preorder", title: "Pre-Order FAQ", deletable: true },
] as const;
export type BuiltinSlug = (typeof PAGE_DEFS)[number]["slug"];
export type PageSlug = string;
/** `custom` pages are created by the admin (Admin > Pages > New page); they have their own title and show as a footer link. */
export type PageData = { content: string; deleted: boolean; title: string; custom: boolean };
export const isBuiltin = (s: string): s is BuiltinSlug => PAGE_DEFS.some((p) => p.slug === s);
/** Web address of a custom page: lowercase letters, digits and dashes (e.g. "gift-guide"). Words the shop already uses are blocked. */
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const RESERVED_SLUGS = ["admin", "api", "shop", "cart", "checkout", "payment", "login", "auth", "account", "product", "offer", "about", "contact", "shipping", "preorder", "assets", "img", "public"];
export const MAX_TITLE = 60;
export const MAX_CUSTOM_PAGES = 30;
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
export const DEFAULT_SHIPPING = `## Delivery across Cambodia\n\nWe deliver to Phnom Penh and to the provinces. The delivery fee for your area is shown at checkout before you pay.\n\n## When we send your order\n\nWe pack and send your order after your payment is confirmed. If you have a question about your delivery, message us on Telegram or Facebook with your order number.`;
export const DEFAULT_PREORDER = `## How pre-orders work\n\nA pre-order item is a toy we order for you before it is in our shop. Pay the deposit at checkout to reserve your spot, and pay the rest when we dispatch your order.\n\n## Questions\n\nMessage us on Telegram or Facebook with your order number and we will help.`;
export const PAGE_DEFAULTS: Record<BuiltinSlug, string> = { about: DEFAULT_ABOUT, contact: DEFAULT_CONTACT, shipping: DEFAULT_SHIPPING, preorder: DEFAULT_PREORDER };
export type PageEntry = Partial<PageData>;
export type PagesStore = Record<string, PageEntry>;
export type PageDef = { slug: string; title: string; deletable: boolean; custom: boolean };
const isCustomEntry = (slug: string, e: PageEntry | undefined) => !isBuiltin(slug) && !!e?.custom && typeof e.title === "string";
/** Built-in pages first, then the admin's custom pages (oldest first, as saved). */
export const allDefs = (s: PagesStore): PageDef[] => [
  ...PAGE_DEFS.map((d) => ({ slug: d.slug as string, title: d.title as string, deletable: d.deletable, custom: false })),
  ...Object.keys(s).filter((k) => isCustomEntry(k, s[k])).map((k) => ({ slug: k, title: String(s[k].title), deletable: true, custom: true })),
];
export const isSlug = (s: string, store: PagesStore = {}): boolean => isBuiltin(s) || isCustomEntry(s, store[s]);
export const resolvePage = (s: PagesStore, slug: string): PageData => ({ content: s[slug]?.content ?? (isBuiltin(slug) ? PAGE_DEFAULTS[slug] : ""), deleted: !!s[slug]?.deleted, title: isBuiltin(slug) ? String(PAGE_DEFS.find((d) => d.slug === slug)!.title) : String(s[slug]?.title ?? slug), custom: !isBuiltin(slug) && !!s[slug]?.custom });
export const hiddenFrom = (s: PagesStore): string[] => PAGE_DEFS.filter((d) => d.deletable && s[d.slug]?.deleted).map((d) => d.slug);
/** Custom pages that are live: shown as extra footer links. */
export const customLinks = (s: PagesStore): { slug: string; title: string }[] => allDefs(s).filter((d) => d.custom && !s[d.slug]?.deleted).map((d) => ({ slug: d.slug, title: d.title }));
