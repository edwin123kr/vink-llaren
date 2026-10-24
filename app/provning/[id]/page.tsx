import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { kravAnvandare } from "@/lib/auth";
import type { Provningsforslag } from "@/lib/ai";
import { kategori } from "@/lib/kategorier";
import { inkopslista, kalkyl } from "@/lib/provning";
import { datum, kr } from "@/lib/format";
import { Icon } from "@/components/Icon";
import { PageHeader } from "@/components/Page";
import { ProvningBetyg } from "@/components/ProvningBetyg";
import { TaBortProvning } from "@/components/ProvningKnappar";
import { OnskeKnapp } from "@/components/SmakKnappar";

export const metadata: Metadata = { title: "Vinprovning" };
export const dynamic = "force-dynamic";

export default async function ProvningSida({ params }: PageProps<"/provning/[id]">) {
  const anv = await kravAnvandare();
  const p = await db.provning.findFirst({ where: { id: (await params).id, anvandareId: anv.id }, include: { _count: { select: { betyg: true } } } });
  if (!p) notFound();
  const f = p.forslag as (Provningsforslag & { lage?: "mock" | "live" }) | null;
  const k = kalkyl({ deltagare: p.deltagare, antalViner: p.antalViner, budgetPerPerson: p.budgetPerPerson });
  const viner = f?.viner ?? [];
  const lista = inkopslista(viner, k);

  return (
    <>
      <Link href="/provning" className="inline-flex min-h-11 items-center gap-1 pt-4 text-sm text-muted hover:text-text"><Icon name="pil" size={16} className="rotate-180" /> Vinprovning</Link>
      <PageHeader eyebrow={`${p.deltagare} deltagare · ${p.antalViner} viner · ${kr(p.budgetPerPerson)} per person${p.datum ? ` · ${datum(p.datum)}` : ""}`} title={p.titel}>
        {f?.inledning}
      </PageHeader>

      <section className="card mb-4 grid grid-cols-2 gap-3 p-5 sm:grid-cols-4" aria-label="Beräkning">
        {[
          ["Flaskor totalt", String(k.flaskorTotalt)],
          ["Per glas och vin", `${k.mlPerGlas} ml`],
          ["Totalbudget", kr(k.totalbudget)],
          ["Beräknad kostnad", lista.komplett ? kr(lista.total) : `${kr(lista.total)}+`],
        ].map(([a, b]) => (
          <div key={a}><p className="text-xs text-muted">{a}</p><p className="num text-xl font-semibold">{b}</p></div>
        ))}
      </section>

      <section aria-labelledby="ordning">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="ordning" className="display text-2xl">Provningsordning</h2>
          {f?.ordningMotivering && <p className="text-sm text-muted">{f.ordningMotivering}</p>}
        </div>
        <ol className="mt-3 grid gap-3 md:grid-cols-2">
          {viner.map((v, i) => (
            <li key={i} className="card flex flex-col gap-3 p-5">
              <div className="flex items-start gap-3">
                <span className="num grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold font-semibold text-on-gold">{i + 1}</span>
                <div className="min-w-0">
                  <p className="eyebrow !text-[0.6875rem]">{kategori(v.kategori)?.namn} · {v.stil}</p>
                  <h3 className="display text-xl leading-tight">{v.namn}</h3>
                  <p className="text-sm text-muted">{[v.producent, v.druvor.join(", "), v.region, v.land].filter(Boolean).join(" · ")}</p>
                </div>
              </div>
              <p className="text-sm">{v.varfor}</p>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                <dt className="text-muted">Dofta efter</dt><dd>{v.doft.join(", ")}</dd>
                <dt className="text-muted">Smaka efter</dt><dd>{v.smak.join(", ")}</dd>
                <dt className="text-muted">Servera</dt><dd>{v.serverTemp}</dd>
                <dt className="text-muted">Mat</dt><dd>{v.mat}</dd>
                <dt className="text-muted">Mängd</dt><dd className="num">{k.flaskorPerVin[i]} {k.flaskorPerVin[i] === 1 ? "flaska" : "flaskor"} · {k.mlPerGlas} ml per glas</dd>
              </dl>
              <div className="mt-auto flex flex-wrap gap-2 pt-1">
                <a href={`https://www.systembolaget.se/sok/?textQuery=${encodeURIComponent([v.producent, v.namn].filter(Boolean).join(" "))}`} target="_blank" rel="noopener noreferrer" className="btn !min-h-11 text-sm">Sök på Systembolaget ↗</a>
                <OnskeKnapp namn={v.namn} motivering={`Från provningen "${p.titel}". ${v.stil}.`} prisCa={v.prisCa} />
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-2 text-xs text-muted">Förslagen bygger på vår sommeliers kunskap. Kontrollera att vinerna finns i lager och välj ett likvärdigt alternativ om inte.</p>
      </section>

      <section className="card mt-6 p-5" aria-labelledby="inkop">
        <h2 id="inkop" className="display text-2xl">Inköpslista</h2>
        <ol className="mt-3 flex flex-col sm:hidden">
          {lista.rader.map((r, i) => (
            <li key={i} className="border-t border-line py-2.5 first:border-t-0">
              <p>{i + 1}. {r.namn}</p>
              <p className="num text-sm text-muted">{r.flaskor} × {r.prisPerFlaska == null ? "okänt pris" : kr(r.prisPerFlaska)} = <span className="text-text">{r.delsumma == null ? "–" : kr(r.delsumma)}</span></p>
            </li>
          ))}
          <li className="flex justify-between border-t-2 border-line pt-2.5 font-semibold"><span>Totalt ({k.flaskorTotalt} flaskor)</span><span className="num">{kr(lista.total)}{lista.komplett ? "" : "+"}</span></li>
          <li className="flex justify-between text-sm text-muted"><span>Per person</span><span className="num">{kr(lista.perPerson)}</span></li>
        </ol>
        <table className="mt-3 hidden w-full text-sm sm:table">
          <thead className="text-left text-muted">
            <tr><th scope="col" className="py-2 font-normal">Vin</th><th scope="col" className="py-2 text-right font-normal">Antal</th><th scope="col" className="py-2 text-right font-normal">Pris/flaska</th><th scope="col" className="py-2 text-right font-normal">Delsumma</th></tr>
          </thead>
          <tbody>
            {lista.rader.map((r, i) => (
              <tr key={i} className="border-t border-line">
                <td className="py-2 pr-3">{i + 1}. {r.namn}</td>
                <td className="num py-2 text-right">{r.flaskor}</td>
                <td className="num py-2 text-right">{r.prisPerFlaska == null ? "okänt" : kr(r.prisPerFlaska)}</td>
                <td className="num py-2 text-right">{r.delsumma == null ? "–" : kr(r.delsumma)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-line font-semibold"><td className="py-2">Totalt</td><td className="num py-2 text-right">{k.flaskorTotalt}</td><td /><td className="num py-2 text-right">{kr(lista.total)}{lista.komplett ? "" : "+"}</td></tr>
            <tr><td className="py-1 text-muted" colSpan={3}>Kostnad per person</td><td className="num py-1 text-right">{kr(lista.perPerson)}</td></tr>
          </tfoot>
        </table>
        {lista.overBudget && <p className="mt-3 text-sm text-danger">Över budget ({kr(k.totalbudget)}). Byt något vin mot ett billigare alternativ.</p>}
        {!lista.komplett && <p className="mt-3 text-sm text-muted">Några priser saknas, så totalen är ett minimum.</p>}
        <p className="mt-2 text-xs text-muted">Priserna är ungefärliga uppskattningar.</p>
      </section>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link href={`/provning/${p.id}/protokoll`} className="btn btn-gold">Utskrivbart protokoll</Link>
        <TaBortProvning id={p.id} />
      </div>

      <section className="card mt-6 p-5" aria-labelledby="infor">
        <h2 id="infor" className="display text-2xl">För in betyg</h2>
        <p className="mt-1 text-sm text-muted">Efter provningen: skriv in betygen så hamnar de i din historik och smakprofil.</p>
        <div className="mt-4">
          <ProvningBetyg provningId={p.id} viner={viner.map((v) => v.namn)} redanInfort={p._count.betyg} />
        </div>
      </section>
    </>
  );
}
