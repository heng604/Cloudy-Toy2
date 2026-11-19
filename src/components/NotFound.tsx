import { useTitle } from "@/lib/title";
import { useI18n } from "@/lib/i18n";
export default function NotFound() {
  const { t } = useI18n(); useTitle("Not found");
  return <div className="grid min-h-[40vh] place-items-center text-center"><div><h1 className="text-5xl font-extrabold">404</h1><p className="mt-2 text-mute">{t("Oops, we cannot find that page. Let us get you back to the toys!")}</p></div></div>;
}
