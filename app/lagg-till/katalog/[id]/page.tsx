import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { kravAnvandare, synligaDrycker } from "@/lib/auth";
import { kategori } from "@/lib/kategorier";
import { lista, procent } from "@/lib/format";
import { FlaskBild } from "@/components/FlaskBild";
import { KatalogFlaskaForm } from "@/components/Formular";
import { PageHeader } from "@/components/Page";
import { GemenskapBetyg } from "@/components/GemenskapBetyg";
import { gemensamtBetyg, recensioner } from "@/lib/gemenskap";
import { betygText } from "@/lib/format";

export const metadata: Metadata = { title: "Lägg till flaska" };
export const dynamic = "force-dynamic";

export default async function KatalogFlaska({ params, searchParams }: PageProps<"/lagg-till/katalog/[id]">) {
  const anv = await kravAnvandare();
  const bild = (await searchParams).bild;
  const egetFoto = typeof bild === "string" && /^\/api\/bild\/[a-z0-9]{20,40}$/.test(bild) ? bild : null;
  const d = await db.dryck.findFirst({ where: { id: (await params).id, ...synligaDrycker(anv.id) } });
  if (!d) notFound();
  const [gemensamt, andras] = await Promise.all([gemensamtBetyg([d.id]), recensioner(d.id, anv.id)]);
  const g = gemensamt.get(d.id);
  const sammanfattning = (
    <section className="card flex gap-4 p-5" aria-label="Vald dryck">
      <span className="flex h-28 w-16 shrink-0 items-center justify-center"><FlaskBild kategori={d.kategori} bildUrl={d.bildUrl ?? egetFoto} /></span>
      <div className="min-w-0">
        <p className="eyebrow">{kategori(d.kategori)?.namn}</p>
        <h2 className="display text-2xl">{d.namn}</h2>
        <p className="text-sm text-muted">{[d.producent, d.region, d.land].filter(Boolean).join(" · ")}</p>
        <p className="mt-1 text-sm text-muted">{[lista(d.druvor).join(", "), d.alkoholhalt != null ? procent(d.alkoholhalt) : null].filter(Boolean).join(" · ")}</p>
        {g && <p className="mt-1 text-sm"><span className="num font-semibold text-gold">★ {betygText(g.snitt)}</span> <span className="text-muted">· {g.antal} betyg i Vinkällaren</span></p>}
      </div>
    </section>
  );
  return (
    <>
      <PageHeader eyebrow="Lägg till" title="Din flaska">Ange pris, antal och var du förvarar den.</PageHeader>
      <KatalogFlaskaForm dryckId={d.id} sammanfattning={sammanfattning} bildUrl={d.bildUrl ? null : egetFoto} />
      {(g || andras.length > 0) && <div className="mt-6"><GemenskapBetyg snitt={g} recensioner={andras} /></div>}
    </>
  );
}
