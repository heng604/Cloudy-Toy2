import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { Product } from "@shared/products";
import ProductForm from "@/components/admin/ProductForm";
import DeleteButton from "@/components/admin/DeleteButton";
import NotFound from "@/components/NotFound";
import Skeleton from "@/components/Skeleton";
import { api } from "@/lib/api";
import { useTitle } from "@/lib/title";
import { useAdmin, refreshAdmin } from "./hooks";
function New() {
  useTitle("New product", true);
  const { data } = useAdmin<{ categories: string[] }>("/admin/product-form-meta");
  if (!data) return <Skeleton />;
  return (<div className="space-y-4"><h1 className="text-2xl font-extrabold sm:text-3xl">New product</h1><ProductForm categories={data.categories} /></div>);
}
function Edit({ id }: { id: string }) {
  useTitle("Edit product", true); const navigate = useNavigate(); const [sp] = useSearchParams();
  const { data, error } = useAdmin<{ product: Product; categories: string[] }>(`/admin/products/${id}`);
  if (error) return <NotFound />;
  if (!data) return <Skeleton />;
  const p = data.product;
  const del = async () => { await api(`/admin/products/${p.id}`, { method: "DELETE" }); refreshAdmin(); navigate("/admin/products?deleted=1"); };
  return (<div className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-extrabold sm:text-3xl">Edit: {p.name}</h1>
      <DeleteButton action={del} label="Delete product" message={`Delete "${p.name}" permanently? Past orders keep their own copy of the item.`} /></div>
    <ProductForm key={p.id + (sp.get("error") ?? "")} p={p} error={sp.get("error") ?? undefined} categories={data.categories} /></div>);
}
export default function ProductEdit() { const { id } = useParams(); return id ? <Edit id={id} /> : <New />; }
