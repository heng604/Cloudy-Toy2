import { useParams } from "react-router-dom";
import ContentPage from "@/components/ContentPage";
import type { PageSlug } from "@shared/pages";
/** Built-in pages pass their slug; a custom page made in Admin > Pages is read from the web address (/gift-guide). */
export default function ContentRoute({ slug, title }: { slug?: PageSlug; title?: string }) { const p = useParams(); const s = slug ?? p.slug ?? ""; return <ContentPage key={s} slug={s} title={title} />; }
