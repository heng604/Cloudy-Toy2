import { Link } from "react-router-dom";
import { useResource } from "@/lib/data";
import { apiJson } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useMembership } from "@/lib/membership";
import { pointsOf } from "@shared/membership";
import type { StoredOrder } from "@shared/types";
const usd = (c: number) => `$${(c / 100).toFixed(2)}`;
/** "Order History - points earned with every order". Points per order = how many more points the running total of paid goods gives after that order. */
export default function PointsHistory() {
  const { t, locale } = useI18n(); const { user } = useAuth(); const { tiers, pointCents } = useMembership();
  const { data } = useResource<{ orders: StoredOrder[] }>(user ? `account:orders:${user.email ?? user.id}` : null, () => apiJson("/account/orders"));
  const paid = (data?.orders ?? []).filter((o) => o.paymentStatus === "PAID").sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  let run = 0; const rows = paid.map((o) => { const goods = Math.max(0, o.totalCents - o.shippingCents), before = pointsOf(run, tiers, pointCents); run += goods; return { o, goods, pts: pointsOf(run, tiers, pointCents) - before }; }).reverse().slice(0, 8);
  return (<section aria-label={t("Order history")} className="rounded-3xl border border-white bg-white/90 p-4 shadow-soft sm:p-5">
    <div className="flex items-start justify-between gap-2"><div><h2 className="flex items-center gap-2 font-display text-2xl font-extrabold text-[#2B1A8F]"><span aria-hidden="true">⭐</span>{t("Order history")}</h2><p className="text-sm text-mute">{t("Points earned with every order.")}</p></div><Link to="/account/orders" className="text-sm font-bold text-[#4A86D8] underline">{t("View all")}</Link></div>
    {rows.length === 0 ? <p className="mt-3 rounded-2xl bg-sky-pale p-4 text-sm">{t("No orders yet.")} <Link to="/shop" className="underline">{t("Browse toys")}</Link></p>
      : <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[34rem] text-left text-sm"><thead className="text-[11px] font-extrabold uppercase tracking-wide text-mute"><tr><th className="py-2 pr-2">{t("Order")}</th><th className="pr-2">{t("Date")}</th><th className="pr-2">{t("Perks used")}</th><th className="pr-2">{t("Total")}</th><th className="pr-2">{t("Counts toward level")}</th><th className="text-right">{t("Points")}</th></tr></thead>
        <tbody className="divide-y divide-sky-border">{rows.map(({ o, goods, pts }) => <tr key={o.orderNumber}><td className="py-2.5 pr-2 font-extrabold text-[#2B1A8F]">{o.orderNumber}</td><td className="pr-2 text-mute">{new Date(o.createdAt).toLocaleDateString(locale, { dateStyle: "medium" })}</td><td className="pr-2 text-mute">{o.memberPerks?.length ? o.memberPerks.join(", ") : "—"}</td><td className="pr-2 font-semibold">{usd(o.totalCents)}</td><td className="pr-2 font-semibold">{usd(goods)}</td><td className={`text-right font-extrabold ${pts > 0 ? "text-green-600" : "text-mute"}`}>{pts > 0 ? `+${pts} ${t("pts")}` : `0 ${t("pts")}`}</td></tr>)}</tbody></table></div>}
  </section>);
}
