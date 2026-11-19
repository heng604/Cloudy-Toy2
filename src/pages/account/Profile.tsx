import { useState, type FormEvent } from "react";
import RequireUser from "@/components/RequireUser";
import Avatar from "@/components/Avatar";
import ImageUpload from "@/components/admin/ImageUpload";
import { post } from "@/lib/api";
import { useProfile } from "@/lib/profile";
import { ProfileInput, type ProfileInfo } from "@shared/profile";
import { useTitle } from "@/lib/title";
import { useI18n } from "@/lib/i18n";
import type { User } from "@supabase/supabase-js";
const cls = "w-full rounded-xl border border-sky-border bg-white px-4 py-3";
function Form({ user, profile, refresh }: { user: User; profile: ProfileInfo; refresh: () => void }) {
  const { t } = useI18n();
  const [f, setF] = useState({ display_name: profile.name || (user.user_metadata?.full_name as string) || "", phone: profile.phone, address: profile.address, facebook: profile.facebook, telegram: profile.telegram });
  const [avatar, setAvatar] = useState(profile.avatar); const [busy, setBusy] = useState(false); const [s, setS] = useState<{ ok?: boolean; error?: string }>({});
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  async function save(e: FormEvent) {
    e.preventDefault(); if (busy) return; setS({});
    const p = ProfileInput.safeParse(f); if (!p.success) return setS({ error: t(p.error.issues[0]?.message ?? "Invalid input") });
    setBusy(true);
    try { const j = await (await post("/account/profile", p.data)).json().catch(() => ({})) as { ok?: boolean; error?: string }; if (j.ok) { setS({ ok: true }); refresh(); } else setS({ error: t(j.error ?? "Could not save. Please try again.") }); }
    catch { setS({ error: t("Oops, we couldn't connect. Please try again in a moment.") }); } finally { setBusy(false); }
  }
  return (<form onSubmit={save} className="space-y-3">
    <div className="flex items-center gap-4 rounded-xl2 border border-sky-border bg-white p-4"><Avatar src={avatar} name={f.display_name || user.email || ""} size={72} />
      <div className="min-w-0 flex-1"><p className="mb-1 text-sm font-bold">{t("Profile picture")}</p>
        <ImageUpload round value={avatar} path="/account/profile/avatar" removeFields={{ remove: "1" }} onChange={(u) => { setAvatar(u); refresh(); }} hint={t("A square photo works best. It is saved as soon as you choose it.")} fallback="🙂" /></div></div>
    <label className="block">{t("Display name")}<input name="display_name" value={f.display_name} onChange={set("display_name")} maxLength={80} className={cls} /></label>
    <label className="block">{t("Phone")}<input name="phone" type="tel" value={f.phone} onChange={set("phone")} maxLength={30} className={cls} /></label>
    <label className="block">{t("Address")}<textarea name="address" value={f.address} onChange={set("address")} maxLength={300} rows={3} placeholder={t("Example: House 12, Street 271, Sangkat Tuol Tumpung 1, Khan Chamkar Mon, Phnom Penh")} className={cls} /></label>
    <div className="grid gap-3 sm:grid-cols-2"><label className="block">{t("Facebook name")}<input name="facebook" value={f.facebook} onChange={set("facebook")} maxLength={100} placeholder={t("Example: Sok Dara")} className={cls} /></label>
      <label className="block">{t("Telegram username")}<input name="telegram" value={f.telegram} onChange={set("telegram")} maxLength={100} placeholder={t("Example: @sokdara")} className={cls} /></label></div>
    {s.error && <p role="alert" className="text-red-700">{s.error}</p>}{s.ok && <p role="status" className="text-green-700">{t("Saved")}</p>}
    <button disabled={busy} className="min-h-11 rounded-full bg-sky px-6 font-bold hover:bg-sky-hover disabled:opacity-50">{busy ? t("Saving…") : t("Save changes")}</button></form>);
}
function Loaded({ user }: { user: User }) {
  const { profile, refresh } = useProfile();
  if (!profile) return <div className="h-40 animate-pulse rounded-xl2 bg-sky-pale" aria-busy="true" />;
  return <Form user={user} profile={profile} refresh={refresh} />;
}
export default function Profile() {
  const { t } = useI18n(); useTitle("Profile");
  return <RequireUser>{(user) => (<div className="max-w-xl space-y-4"><h1 className="text-2xl font-extrabold sm:text-3xl">{t("Profile")}</h1><p className="text-mute">{t("Email: {email} (managed by Google)", { email: user.email ?? "" })}</p><Loaded user={user} /></div>)}</RequireUser>;
}
