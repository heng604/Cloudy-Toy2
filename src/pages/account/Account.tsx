import { Link, useNavigate } from "react-router-dom";
import RequireUser from "@/components/RequireUser";
import { useAuth } from "@/lib/auth";
import { useTitle } from "@/lib/title";
export default function Account() {
  useTitle("My account"); const { signOut } = useAuth(); const navigate = useNavigate();
  return (<RequireUser>{(user) => (<div className="max-w-xl space-y-4"><h1 className="text-3xl font-extrabold">My account</h1>
    <p className="text-mute">Signed in as {user.email}</p>
    <div className="grid gap-3 sm:grid-cols-2"><Link to="/account/profile" className="rounded-xl2 border border-sky-border bg-white p-5 font-bold shadow-soft">Profile</Link><Link to="/account/orders" className="rounded-xl2 border border-sky-border bg-white p-5 font-bold shadow-soft">Order history</Link></div>
    <button onClick={async () => { await signOut(); navigate("/"); }} className="min-h-11 rounded-full border border-sky-border bg-white px-6 font-bold">Sign out</button></div>)}</RequireUser>);
}
