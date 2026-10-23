import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { kategori } from "@/lib/kategorier";
import { lista, procent } from "@/lib/format";
import { FlaskBild } from "@/components/FlaskBild";
import { KatalogFlaskaForm } from "@/components/Formular";
import { PageHeader } from "@/components/Page";

export const metadata: Metadata = { title: "Lägg till flaska" };
export const dynamic = "force-dynamic";

export default async function KatalogFlaska({ params }: PageProps<"/lagg-till/katalog/[id]">) {
  const d = await db.dryck.findUnique({ where: { id: (await params).id } });
  if (!d) notFound();
  const sammanfattning = (
    <section className="card flex gap-4 p-5" aria-label="Vald dryck">
      <span className="flex h-28 w-16 shrink-0 items-center justify-center"><FlaskBild kategori={d.kategori} bildUrl={d.bildUrl} /></span>
      <div className="min-w-0">
        <p className="eyebrow">{kategori(d.kategori)?.namn}</p>
        <h2 className="display text-2xl">{d.namn}</h2>
        <p className="text-sm text-muted">{[d.producent, d.region, d.land].filter(Boolean).join(" · ")}</p>
        <p className="mt-1 text-sm text-muted">{[lista(d.druvor).join(", "), d.alkoholhalt != null ? procent(d.alkoholhalt) : null].filter(Boolean).join(" · ")}</p>
      </div>
    </section>
  );
  return (
    <>
      <PageHeader eyebrow="Lägg till" title="Din flaska">Ange pris, antal och var du förvarar den.</PageHeader>
      <KatalogFlaskaForm dryckId={d.id} sammanfattning={sammanfattning} />
    </>
  );
}
