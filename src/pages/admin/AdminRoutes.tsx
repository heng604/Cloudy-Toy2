import { Link, Navigate, Outlet, Route, Routes, useNavigate } from "react-router-dom";
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
import Transactions from "./Transactions";
import Products from "./Products";
import ProductEdit from "./ProductEdit";
import Stock from "./Stock";
import Pages from "./Pages";
import Settings from "./Settings";

function Layout() {
  const { user, ready, isAdmin, signOut } = useAuth(); const { settings } = useSettings(); const navigate = useNavigate();
  if (!ready) return <Skeleton />;
  if (!isAdmin) return <NotFound />; // unauthorized => branded 404, no data revealed
  return (<div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl2 border border-sky-border bg-white p-4 shadow-soft">
      <Link to="/admin" className="flex items-center gap-3 font-extrabold"><img src={settings.logoUrl} alt="" className="h-10 w-auto rounded-lg" />Cloudy-Toy Admin</Link>
      <div className="flex flex-wrap items-center gap-3 text-sm"><RealtimeRefresh tables={["orders", "products", "site_settings", "product_discounts"]} onChange={refreshAdmin} indicator pollMs={60000} /><span className="text-mute">{user?.email}</span><Link to="/" className="underline">View shop</Link>
        <button onClick={async () => { await signOut(); navigate("/"); }} className="rounded-full border border-sky-border px-4 py-2 font-bold hover:bg-sky-pale">Sign out</button></div></div>
    <AdminNav /><AdminErrorBanner /><Outlet /></div>);
}
export default function AdminRoutes() {
  return (<Routes>
    <Route path="/admin/login" element={<AdminLogin />} />
    <Route path="/admin" element={<Layout />}>
      <Route index element={<Dashboard />} />
      <Route path="orders" element={<Orders />} />
      <Route path="transactions" element={<Transactions />} />
      <Route path="products" element={<Products />} />
      <Route path="products/new" element={<ProductEdit />} />
      <Route path="products/:id" element={<ProductEdit />} />
      <Route path="stock" element={<Stock />} />
      <Route path="pages" element={<Pages />} />
      <Route path="settings" element={<Settings />} />
      <Route path="discounts" element={<Navigate to="/admin/products" replace />} />
      <Route path="*" element={<NotFound />} />
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>);
}
