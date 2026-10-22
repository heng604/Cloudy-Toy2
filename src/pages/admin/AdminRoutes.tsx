import type { FormEvent } from "react";
import { Link, Outlet, Route, Routes, useNavigate } from "react-router-dom";
import Icon from "@/components/admin/Icons";
import { useI18n, LangSwitch } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useSettings } from "@/lib/store";
import RealtimeRefresh from "@/lib/realtime";
import AdminNav from "@/components/admin/AdminNav";
import NotFound from "@/components/NotFound";
import Skeleton from "@/components/Skeleton";
import { refreshAdmin, AdminErrorBanner } from "./hooks";
import AdminLogin from "./Login";
import Dashboard from "./Dashboard";
import Orders from "./Orders";
import Invoice from "./Invoice";
import Transactions from "./Transactions";
import Products from "./Products";
import ProductEdit from "./ProductEdit";
import Stock from "./Stock";
import Pages from "./Pages";
import Settings from "./Settings";
import Discounts from "./Discounts";

function Layout() {
  const { user, ready, isAdmin, signOut } = useAuth(); const { settings } = useSettings(); const navigate = useNavigate(); const { t } = useI18n();
  if (!ready) return <Skeleton />;
  if (!isAdmin) return <NotFound />; // unauthorized => branded 404, no data revealed
  const search = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const q = String(new FormData(e.currentTarget).get("q") ?? "").trim(); navigate(q ? `/admin/orders?q=${encodeURIComponent(q)}` : "/admin/orders"); };
  return (<div className="admin-shell mx-auto flex w-full max-w-[110rem] flex-col overflow-hidden rounded-[1.75rem] bg-[#EAF6FA] shadow-xl md:min-h-[calc(100vh-2rem)] md:flex-row">
    <AdminNav initial={(user?.email ?? "A").slice(0, 1)} onSignOut={async () => { await signOut(); navigate("/"); }} />
    <div className="admin-main min-w-0 flex-1 space-y-4 p-3 sm:p-5 lg:p-6">
      <header className="flex flex-wrap items-center gap-2 sm:gap-3">
        <Link to="/admin" className="flex items-center gap-2 font-extrabold"><img src={settings.logoUrl} alt="" className="h-9 w-auto rounded-lg" /><span className="hidden sm:inline">Cloudy-Toy Admin</span></Link>
        <form onSubmit={search} role="search" className="order-last flex min-w-0 basis-full items-center rounded-full bg-white p-1 pl-4 shadow-soft sm:order-none sm:ml-auto sm:basis-auto sm:w-72 lg:w-96">
          <input name="q" type="search" placeholder={t("Search orders…")} aria-label={t("Search orders…")} className="min-w-0 flex-1 bg-transparent py-1.5 outline-none" />
          <button aria-label={t("Search")} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#1FC2C8] text-white hover:opacity-90"><Icon name="search" size={18} /></button></form>
        <div className="ml-auto flex items-center gap-2 text-sm sm:ml-0"><RealtimeRefresh tables={["orders", "products", "site_settings", "store_discounts"]} onChange={refreshAdmin} indicator pollMs={60000} /><LangSwitch />
          <Link to="/" className="grid h-9 w-9 place-items-center rounded-full bg-white text-[#1FC2C8] shadow-soft hover:bg-sky-pale" title={t("View shop")} aria-label={t("View shop")}><Icon name="shop" size={18} /></Link></div></header>
      <AdminErrorBanner /><Outlet /></div></div>);
}
export default function AdminRoutes() {
  return (<Routes>
    <Route path="/admin/login" element={<AdminLogin />} />
    <Route path="/admin" element={<Layout />}>
      <Route index element={<Dashboard />} />
      <Route path="orders" element={<Orders />} />
      <Route path="invoice/:orderNumber" element={<Invoice />} />
      <Route path="transactions" element={<Transactions />} />
      <Route path="products" element={<Products />} />
      <Route path="products/new" element={<ProductEdit />} />
      <Route path="products/:id" element={<ProductEdit />} />
      <Route path="stock" element={<Stock />} />
      <Route path="pages" element={<Pages />} />
      <Route path="settings" element={<Settings />} />
      <Route path="discounts" element={<Discounts />} />
      <Route path="*" element={<NotFound />} />
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>);
}
