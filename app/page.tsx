import { Suspense } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { betygText, kr, lista } from "@/lib/format";
import { Icon } from "@/components/Icon";
import { PageHeader } from "@/components/Page";
import { SamlingVy, type SamlingRad } from "@/components/SamlingVy";

export const dynamic = "force-dynamic";

export default async function Samling() {
  const [flaskor, betyg] = await Promise.all([
    db.flaska.findMany({
      where: { antal: { gt: 0 } },
      include: { dryck: { select: { namn: true, producent: true, kategori: true, typ: true, land: true, region: true, argang: true, druvor: true, bildUrl: true, kalla: true, prisCa: true } } },
      orderBy: { skapad: "desc" },
    }),
    db.betyg.groupBy({ by: ["dryckId"], _avg: { betyg: true } }),
  ]);
  const snitt = new Map(betyg.map((b) => [b.dryckId, b._avg.betyg == null ? null : Math.round(b._avg.betyg)]));
  const rader: SamlingRad[] = flaskor.map((f) => ({
    id: f.id,
    antal: f.antal,
    inkopspris: f.inkopspris,
    plats: f.plats,
    drickFran: f.drickFran,
    drickTill: f.drickTill,
    skapad: f.skapad.toISOString(),
    snitt: snitt.get(f.dryckId) ?? null,
    dryck: { ...f.dryck, druvor: lista(f.dryck.druvor) },
  }));
  const antal = rader.reduce((a, f) => a + f.antal, 0);
  const varde = rader.reduce((a, f) => a + f.antal * (f.inkopspris ?? f.dryck.prisCa ?? 0), 0);
  const betygade = rader.filter((r) => r.snitt != null);
  const snittAlla = betygade.length ? Math.round(betygade.reduce((a, r) => a + (r.snitt ?? 0), 0) / betygade.length) : null;

  return (
    <>
      <PageHeader eyebrow="Din källare" title="Samlingen" />

      {rader.length === 0 ? (
        <div className="card flex flex-col items-start gap-4 p-6">
          <p className="display text-2xl">Källaren är tom.</p>
          <p className="text-muted">Lägg till din första flaska för att komma igång.</p>
          <Link href="/lagg-till" className="btn btn-gold"><Icon name="plus" size={20} /> Lägg till flaska</Link>
        </div>
      ) : (
        <>
          <section aria-label="Översikt" className="mb-6 grid grid-cols-3 gap-3">
            {[
              ["Flaskor", String(antal)],
              ["Värde", kr(varde)],
              ["Snitt", betygText(snittAlla)],
            ].map(([k, v]) => (
              <div key={k} className="card min-w-0 p-3 md:p-4">
                <p className="eyebrow truncate !text-[0.6875rem] !tracking-[0.08em]">{k}</p>
                <p className="num mt-1 text-xl font-semibold md:text-3xl">{v}</p>
              </div>
            ))}
          </section>
          <Suspense>
            <SamlingVy rader={rader} />
          </Suspense>
        </>
      )}
    </>
  );
}
