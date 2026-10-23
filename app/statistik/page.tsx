import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { kravAnvandare } from "@/lib/auth";
import { kategori } from "@/lib/kategorier";
import { betygText, drickfonster, kr, lista } from "@/lib/format";
import { perKategori, prisvardast, samlingsvarde, snittPer, type StatBetyg } from "@/lib/statistik";
import { PageHeader } from "@/components/Page";

export const metadata: Metadata = { title: "Statistik" };
export const dynamic = "force-dynamic";

/** Enkel horisontell stapel med värdet i text (en serie, ingen förklaring behövs). */
function Stapel({ andel, etikett, varde }: { andel: number; etikett: string; varde: string }) {
  return (
    <li className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 py-1.5">
      <span className="truncate text-sm">{etikett}</span>
      <span className="h-2.5 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
        <span className="block h-full rounded-full bg-gold" style={{ width: `${Math.max(2, andel * 100)}%` }} />
      </span>
      <span className="num w-14 text-right text-sm">{varde}</span>
    </li>
  );
}

export default async function Statistik() {
  const anv = await kravAnvandare();
  const [flaskor, betygRader] = await Promise.all([
    db.flaska.findMany({ where: { anvandareId: anv.id, antal: { gt: 0 } }, include: { dryck: { select: { id: true, namn: true, kategori: true, prisCa: true } } } }),
    db.betyg.findMany({ where: { anvandareId: anv.id }, include: { dryck: { select: { id: true, namn: true, druvor: true, land: true, prisCa: true, flaskor: { where: { anvandareId: anv.id }, select: { inkopspris: true }, take: 1, orderBy: { skapad: "desc" } } } } } }),
  ]);
  const sf = flaskor.map((f) => ({ antal: f.antal, inkopspris: f.inkopspris, prisCa: f.dryck.prisCa, kategori: f.dryck.kategori, drickFran: f.drickFran, drickTill: f.drickTill }));
  const v = samlingsvarde(sf);
  const kat = perKategori(sf);
  const sb: StatBetyg[] = betygRader.map((b) => ({
    dryckId: b.dryckId,
    namn: b.dryck.namn,
    betyg: b.betyg,
    druvor: lista(b.dryck.druvor),
    land: b.dryck.land,
    pris: b.dryck.flaskor[0]?.inkopspris ?? b.dryck.prisCa,
  }));
  const druvor = snittPer(sb, (b) => b.druvor);
  const lander = snittPer(sb, (b) => (b.land ? [b.land] : []));
  const prisv = prisvardast(sb);
  const snart = flaskor
    .map((f) => ({ f, s: drickfonster(f.drickFran, f.drickTill) }))
    .filter(({ s }) => s.status === "drick-snart" || s.status === "passerat")
    .sort((a, b) => (a.f.drickTill ?? 9999) - (b.f.drickTill ?? 9999));
  const maxKat = Math.max(1, ...kat.map((k) => k.antal));

  return (
    <>
      <PageHeader eyebrow="Mer" title="Statistik" />
      <section aria-label="Nyckeltal" className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Samlingens värde", kr(v.totalt), v.uppskattat ? `varav ${kr(v.uppskattat)} uppskattat` : "efter inköpspris"],
          ["Flaskor", String(v.antal), `${v.poster} poster`],
          ["Betyg", String(sb.length), sb.length ? `snitt ${betygText(Math.round(sb.reduce((a, b) => a + b.betyg, 0) / sb.length))}` : "inga än"],
          ["Utan pris", String(v.utanPris), "flaskor"],
        ].map(([a, b, c]) => (
          <div key={a} className="card min-w-0 p-4">
            <p className="eyebrow truncate !text-[0.6875rem]">{a}</p>
            <p className="num mt-1 text-2xl font-semibold">{b}</p>
            <p className="text-xs text-muted">{c}</p>
          </div>
        ))}
      </section>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="card p-5" aria-labelledby="s-kat">
          <h2 id="s-kat" className="display text-2xl">Flaskor per kategori</h2>
          {kat.length ? (
            <ul className="mt-3">{kat.map((k) => <Stapel key={k.kategori} andel={k.antal / maxKat} etikett={kategori(k.kategori)?.namn ?? k.kategori} varde={String(k.antal)} />)}</ul>
          ) : <p className="mt-3 text-muted">Inga flaskor i samlingen.</p>}
        </section>

        <section className="card p-5" aria-labelledby="s-prisv">
          <h2 id="s-prisv" className="display text-2xl">Mest prisvärda</h2>
          <p className="mt-1 text-sm text-muted">Betyg per krona: betygspoäng per 100 kr. Kräver både betyg och pris.</p>
          {prisv.length ? (
            <ol className="mt-3 divide-y divide-line">
              {prisv.map((p, i) => (
                <li key={p.dryckId} className="flex items-center gap-3 py-2.5">
                  <span className="num w-6 text-muted">{i + 1}.</span>
                  <span className="min-w-0 flex-1 truncate">{p.namn}</span>
                  <span className="num shrink-0 text-sm text-muted">{betygText(p.snitt)} · {kr(p.pris)}</span>
                  <span className="num w-14 shrink-0 text-right font-semibold text-gold">{p.per100kr.toLocaleString("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </li>
              ))}
            </ol>
          ) : <p className="mt-3 text-muted">Betygsätt flaskor med pris för att se vilka som ger mest för pengarna.</p>}
        </section>

        {[
          ["s-druva", "Snittbetyg per druva", druvor],
          ["s-land", "Snittbetyg per land", lander],
        ].map(([id, rubrik, grupper]) => (
          <section key={id as string} className="card p-5" aria-labelledby={id as string}>
            <h2 id={id as string} className="display text-2xl">{rubrik as string}</h2>
            {(grupper as typeof druvor).length ? (
              <ul className="mt-3">
                {(grupper as typeof druvor).slice(0, 10).map((g) => <Stapel key={g.namn} andel={g.snitt / 100} etikett={`${g.namn.charAt(0).toUpperCase()}${g.namn.slice(1)} (${g.antal})`} varde={betygText(g.snitt)} />)}
              </ul>
            ) : <p className="mt-3 text-muted">Inga betyg än.</p>}
          </section>
        ))}

        <section className="card p-5 lg:col-span-2" aria-labelledby="s-snart">
          <h2 id="s-snart" className="display text-2xl">Drick snart</h2>
          {snart.length ? (
            <ul className="mt-3 divide-y divide-line">
              {snart.map(({ f, s }) => (
                <li key={f.id} className="flex items-center justify-between gap-3 py-2.5">
                  <Link href={`/flaska/${f.id}`} className="min-w-0 truncate hover:underline">{f.dryck.namn}</Link>
                  <span className={`shrink-0 text-sm ${s.status === "passerat" ? "text-danger" : "text-gold"}`}>{s.status === "passerat" ? "Passerat" : "Drick snart"} · {s.text}</span>
                </li>
              ))}
            </ul>
          ) : <p className="mt-3 text-muted">Inga flaskor behöver drickas snart.</p>}
        </section>
      </div>
    </>
  );
}
