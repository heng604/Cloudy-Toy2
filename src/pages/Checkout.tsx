import CheckoutForm from "@/components/CheckoutForm";
import RequireUser from "@/components/RequireUser";
import Skeleton from "@/components/Skeleton";
import { useProducts, useSettings } from "@/lib/store";
import { useTitle } from "@/lib/title";
export default function Checkout() {
  useTitle("Checkout");
  const { data: all } = useProducts(); const { settings: s } = useSettings();
  if (!all) return <Skeleton />;
  const products = all.map(({ id, name, price, salePrice }) => ({ id, name, price, salePrice }));
  return <RequireUser>{() => <CheckoutForm fees={{ pp: s.shipPhnomPenhCents, prov: s.shipProvinceCents }} products={products} telegram={s.telegramUrl} facebook={s.facebookUrl} />}</RequireUser>;
}
