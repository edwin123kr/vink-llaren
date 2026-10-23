import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { kategori } from "@/lib/kategorier";
import { betygText, datum } from "@/lib/format";
import { PageHeader } from "@/components/Page";
import { TaBortBetyg } from "@/components/TaBortBetyg";

export const metadata: Metadata = { title: "Historik" };
export const dynamic = "force-dynamic";

export default async function Historik() {
  const betyg = await db.betyg.findMany({
    orderBy: { datum: "desc" },
    include: { dryck: { select: { namn: true, kategori: true, producent: true } }, flaska: { select: { id: true } } },
    take: 500,
  });
  return (
    <>
      <PageHeader eyebrow="Betyg" title="Historik">Allt du har druckit och betygsatt, senast först.</PageHeader>
      {betyg.length === 0 ? (
        <div className="card p-6 text-muted">Inga betyg än. Tryck på &quot;Drack den&quot; på en flaska för att börja.</div>
      ) : (
        <ol className="card divide-y divide-line">
          {betyg.map((b) => (
            <li key={b.id} className="flex items-start gap-4 p-4">
              <span className="num w-12 shrink-0 pt-0.5 text-xl font-semibold text-gold">{betygText(b.betyg)}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {b.flaska ? <Link href={`/flaska/${b.flaska.id}`} className="hover:underline">{b.dryck.namn}</Link> : b.dryck.namn}
                </p>
                <p className="text-sm text-muted">{[kategori(b.dryck.kategori)?.namn, datum(b.datum), b.tillfalle].filter(Boolean).join(" · ")}</p>
                {b.kommentar && <p className="mt-1">{b.kommentar}</p>}
              </div>
              <TaBortBetyg id={b.id} />
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
