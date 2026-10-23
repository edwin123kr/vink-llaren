import Link from "next/link";
import { db } from "@/lib/db";
import { kr, betygText } from "@/lib/format";
import { FlaskKort } from "@/components/FlaskKort";
import { Icon } from "@/components/Icon";
import { PageHeader } from "@/components/Page";

export const dynamic = "force-dynamic";

export default async function Samling() {
  const [flaskor, betyg] = await Promise.all([
    db.flaska.findMany({
      where: { antal: { gt: 0 } },
      include: { dryck: { select: { namn: true, producent: true, kategori: true, land: true, region: true, argang: true, kalla: true } } },
      orderBy: { skapad: "desc" },
    }),
    db.betyg.groupBy({ by: ["dryckId"], _avg: { betyg: true } }),
  ]);
  const snitt = new Map(betyg.map((b) => [b.dryckId, b._avg.betyg]));
  const antal = flaskor.reduce((a, f) => a + f.antal, 0);
  const varde = flaskor.reduce((a, f) => a + f.antal * (f.inkopspris ?? 0), 0);
  const alla = betyg.map((b) => b._avg.betyg ?? 0);
  const snittAlla = alla.length ? Math.round(alla.reduce((a, b) => a + b, 0) / alla.length) : null;

  return (
    <>
      <PageHeader eyebrow="Din källare" title="Samlingen" />

      <section aria-label="Översikt" className="grid grid-cols-3 gap-3">
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

      <div className="mt-8 flex items-center justify-between">
        <h2 className="display text-2xl">Flaskor</h2>
        <span className="text-sm text-muted">Filter kommer i fas 2</span>
      </div>

      {flaskor.length === 0 ? (
        <div className="card mt-4 flex flex-col items-start gap-4 p-6">
          <p className="display text-2xl">Källaren är tom.</p>
          <p className="text-muted">Lägg till din första flaska för att komma igång.</p>
          <Link href="/lagg-till" className="btn btn-gold"><Icon name="plus" size={20} /> Lägg till flaska</Link>
        </div>
      ) : (
        <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {flaskor.map((f) => (
            <li key={f.id} className="min-w-0">
              <FlaskKort f={{ ...f, snittbetyg: snitt.get(f.dryckId) ?? null }} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
