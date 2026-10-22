import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
/** English / Khmer. The English text IS the key: t("Shop"). Missing Khmer text falls back to English. */
export type Lang = "en" | "km";
type Vars = Record<string, string | number>;
const KM: Record<string, string> = {
  // shop
  "Home": "ទំព័រដើម", "Shop": "ហាង", "Account": "គណនី", "Cart": "កន្ត្រក", "Search products": "ស្វែងរកផលិតផល", "Open search": "បើកការស្វែងរក", "Close search": "បិទការស្វែងរក", "Open menu": "បើកម៉ឺនុយ", "Close menu": "បិទម៉ឺនុយ",
  "All Product": "ផលិតផលទាំងអស់", "My account": "គណនីរបស់ខ្ញុំ", "Company": "ក្រុមហ៊ុន", "About": "អំពីយើង", "Contact": "ទំនាក់ទំនង", "Admin login": "ចូលជាអ្នកគ្រប់គ្រង", "All rights reserved.": "រក្សាសិទ្ធិគ្រប់យ៉ាង។",
  "Collect a little happiness": "ប្រមូលក្ដីសុខតូចៗរបស់អ្នក",
  "Handpicked toys from our heart, bringing a little smile to your world.": "ប្រដាប់ក្មេងលេងដែលជ្រើសរើសដោយក្ដីស្រឡាញ់ នាំយកស្នាមញញឹមតូចមួយមកកាន់ពិភពលោករបស់អ្នកពី Cloudy Toys។",
  "Shop Now": "ទិញឥឡូវនេះ", "Explore product": "ស្វែងរកផលិតផល", "Featured products": "ផលិតផលពិសេស", "All": "ទាំងអស់", "Price ↑": "តម្លៃ ↑", "Price ↓": "តម្លៃ ↓", "No products match.": "មិនមានផលិតផលត្រូវគ្នាទេ។", "Clear filters": "សម្អាតជ្រើសរើស",
  "Choose province": "ជ្រើសរើសខេត្ត", "Select your province": "សូមជ្រើសរើសខេត្តរបស់អ្នក", "New": "ថ្មី", "Add to cart": "ដាក់ចូលកន្ត្រក", "Out of stock": "អស់ស្តុក", "Your cart": "កន្ត្រករបស់អ្នក", "Clear cart": "សម្អាតកន្ត្រក", "Your cart is empty": "កន្ត្រករបស់អ្នកទទេ", "Browse toys": "មើលផលិតផល", "Remove": "ដកចេញ",
  "Order summary": "សង្ខេបការបញ្ជាទិញ", "Delivery": "ដឹកជញ្ជូន", "Calculated at checkout": "គណនានៅពេលទូទាត់", "Subtotal": "សរុបរង", "Checkout": "ទូទាត់", "← Continue shopping": "← បន្តទិញទំនិញ", "You save": "អ្នកសន្សំបាន", "Total": "សរុប",
  "Full name": "ឈ្មោះពេញ", "Email": "អ៊ីមែល", "Phone": "លេខទូរស័ព្ទ", "Delivery area": "តំបន់ដឹកជញ្ជូន", "Phnom Penh": "ភ្នំពេញ", "Province": "ខេត្ត", "Delivery address": "អាសយដ្ឋានដឹកជញ្ជូន",
  "Delivery instructions": "ការណែនាំអំពីការដឹកជញ្ជូន", "Payment": "ការទូទាត់", "Discount code": "កូដបញ្ចុះតម្លៃ", "Takes 10% to 50% off your subtotal.": "បញ្ចុះតម្លៃពី ១០% ដល់ ៥០% លើសរុបរងរបស់អ្នក។",
  "Apply": "អនុវត្ត", "I have paid": "ខ្ញុំបានបង់ប្រាក់ហើយ", "Place order": "បញ្ជាទិញ", "Sending…": "កំពុងផ្ញើ…", "Facebook name": "ឈ្មោះ Facebook", "Telegram username": "ឈ្មោះ Telegram ",
  "Language": "ភាសា",
  // admin shell
  "Dashboard": "ផ្ទាំងគ្រប់គ្រង", "Orders": "ការបញ្ជាទិញ", "Transactions": "ប្រតិបត្តិការ", "Products": "ផលិតផល", "Discounts": "បញ្ចុះតម្លៃ", "Stock": "ស្តុក", "Pages": "ទំព័រ", "Settings": "ការកំណត់",
  "Sign out": "ចាកចេញ", "View shop": "មើលហាង", "Search orders…": "ស្វែងរកការបញ្ជាទិញ…", "Search": "ស្វែងរក", "Delete": "លុប", "Edit": "កែសម្រួល", "Filter": "ជ្រើសរើស", "Reset": "កំណត់ឡើងវិញ", "Try again": "សាកល្បងម្តងទៀត",
  "Export CSV": "នាំចេញ CSV", "Export PDF": "នាំចេញ PDF", "+ New product": "+ ផលិតផលថ្មី", "Product": "ផលិតផល", "Category": "ប្រភេទ", "Price": "តម្លៃ", "Store settings": "ការកំណត់ហាង", "Delete product": "លុបផលិតផល",
  "Mark as paid (I verified it)": "សម្គាល់ថាបានបង់ (ខ្ញុំបានផ្ទៀងផ្ទាត់)", "PAID": "បានបង់", "PENDING": "រង់ចាំ", "Saved": "បានរក្សាទុក", "Live": "ផ្ទាល់", "Connecting…": "កំពុងភ្ជាប់…",
  // dashboard
  "Paid revenue": "ចំណូលដែលទទួលបានពីការទូទាត់", "Waiting for payment": "រង់ចាំការបង់ប្រាក់", "All orders": "ការបញ្ជាទិញទាំងអស់", "Stock value": "តម្លៃស្តុក", "{n} paid orders": "ការបញ្ជាទិញបានបង់ {n}", "{n} pending orders": "កំពុងរង់ចាំ {n}",
  "Average {v}": "ជាមធ្យម {v}", "{n} products": "ផលិតផល {n}", "Paid revenue, last 14 days": "ចំណូលដែលទទួលបានពីការទូទាត់រយះពេល១៤ ថ្ងៃចុងក្រោយ", "Highest transactions": "ប្រតិបត្តិការខ្ពស់បំផុត", "Lowest transactions": "ប្រតិបត្តិការទាបបំផុត", "See all": "មើលទាំងអស់",
  "Stock alerts": "ការជូនដំណឹងស្តុក", "Manage stock": "គ្រប់គ្រងស្តុក", "All products have healthy stock.": "ផលិតផលទាំងអស់មានស្តុកគ្រប់គ្រាន់។", "Best sellers": "លក់ដាច់បំផុត", "No sales yet.": "មិនទាន់មានការលក់។", "No orders yet.": "មិនទាន់មានការបញ្ជាទិញ។",
  "Export all data": "នាំចេញទិន្នន័យទាំងអស់", "{n} left": "នៅសល់ {n}", "{n} sold": "លក់បាន {n}", "Paid share": "ភាគរយបានបង់", "In stock": "មានស្តុក", "Orders per day": "ការបញ្ជាទិញក្នុងមួយថ្ងៃ", "Revenue": "ចំណូល", "Orders ": "ការបញ្ជាទិញ",
  "Calendar": "ប្រតិទិន", "Days with orders are marked.": "ថ្ងៃដែលមានការបញ្ជាទិញត្រូវបានសម្គាល់។", "Today": "ថ្ងៃនេះ", "orders": "ការបញ្ជាទិញ", "paid": "បានបង់", "pending": "រង់ចាំ", "Healthy stock": "ស្តុកល្អ", "{a} of {b} products": "{a} ក្នុងចំណោម {b} ផលិតផល",
  // discounts
  "Discount codes": "កូដបញ្ចុះតម្លៃ", "Create a code": "បង្កើតកូដ", "Create code": "បង្កើតកូដ", "Generate": "បង្កើតស្វ័យប្រវត្តិ", "Code": "កូដ", "Discount % (off the subtotal)": "បញ្ចុះតម្លៃ % (លើសរុបរង)", "{n}% off the subtotal": "បញ្ចុះ {n}% លើសរុបរង",
  "Your codes ({n})": "កូដរបស់អ្នក ({n})", "No codes yet. Create one above.": "មិនទាន់មានកូដទេ។ បង្កើតមួយនៅខាងលើ។", "Saving…": "កំពុងរក្សាទុក…", "3 to 30 letters, numbers, - or _": "អក្សរ លេខ - ឬ _ ចំនួន ៣ ដល់ ៣០",
  "Make a code worth 10% to 50% off the cart subtotal and give it to your customers. They type it at checkout. Delivery is never discounted. There are no discounts on single items.": "បង្កើតកូដបញ្ចុះតម្លៃពី ១០% ដល់ ៥០% លើសរុបរងនៃកន្ត្រក ហើយផ្តល់ឱ្យអតិថិជន។ ពួកគេវាយកូដនៅពេលទូទាត់។ ថ្លៃដឹកជញ្ជូនមិនត្រូវបានបញ្ចុះទេ។ មិនមានការបញ្ចុះតម្លៃលើទំនិញនីមួយៗទេ។",
};
const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: "en", setLang: () => {} });
const initial = (): Lang => { try { const s = localStorage.getItem("lang"); if (s === "en" || s === "km") return s; } catch { /* storage blocked */ } return typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("km") ? "km" : "en"; };
export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, set] = useState<Lang>(initial);
  const setLang = useCallback((l: Lang) => { set(l); try { localStorage.setItem("lang", l); } catch { /* ignore */ } }, []);
  useEffect(() => { document.documentElement.lang = lang; document.documentElement.classList.toggle("lang-km", lang === "km"); }, [lang]);
  const v = useMemo(() => ({ lang, setLang }), [lang, setLang]);
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}
export function useI18n() {
  const { lang, setLang } = useContext(Ctx);
  const t = useCallback((s: string, vars?: Vars) => { let r = lang === "km" ? (KM[s] ?? s) : s; if (vars) r = r.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? "")); return r; }, [lang]);
  return { lang, setLang, t, locale: lang === "km" ? "km-KH" : "en-US" };
}
/** Pill switch: EN | ខ្មែរ */
export function LangSwitch({ className = "" }: { className?: string }) {
  const { lang, setLang, t } = useI18n();
  const b = (l: Lang, label: string, aria: string) => <button type="button" lang={l} aria-pressed={lang === l} aria-label={aria} onClick={() => setLang(l)} className={`rounded-full px-2.5 py-1 text-xs font-extrabold transition sm:px-3 sm:text-sm ${lang === l ? "bg-sky text-ink shadow-soft" : "text-mute hover:text-ink"}`}>{label}</button>;
  return <span role="group" aria-label={t("Language")} className={`inline-flex items-center gap-0.5 rounded-full border border-sky-border bg-white p-0.5 ${className}`}>{b("en", "EN", "English")}{b("km", "ខ្មែរ", "ភាសាខ្មែរ")}</span>;
}
