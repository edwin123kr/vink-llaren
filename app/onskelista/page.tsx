import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { datum, kr } from "@/lib/format";
import { OnskeForm } from "@/components/OnskeForm";
import { PageHeader } from "@/components/Page";
import { TaBortOnskning } from "@/components/SmakKnappar";

export const metadata: Metadata = { title: "Önskelista" };
export const dynamic = "force-dynamic";

export default async function Onskelista() {
  const lista = await db.onskning.findMany({ orderBy: { skapad: "desc" }, include: { dryck: { select: { id: true, producent: true, region: true, land: true } } } });
  const summa = lista.reduce((a, o) => a + (o.prisCa ?? 0), 0);
  return (
    <>
      <PageHeader eyebrow="Vill köpa" title="Önskelista">Spara flaskor du vill köpa, själv eller från smakprofilens rekommendationer.</PageHeader>
      <OnskeForm />
      {lista.length === 0 ? (
        <p className="card mt-4 p-6 text-muted">Önskelistan är tom. Spara rekommendationer från <Link href="/smakprofil" className="text-gold underline underline-offset-4">smakprofilen</Link>.</p>
      ) : (
        <>
          <p className="mt-6 text-sm text-muted">{lista.length} på listan{summa ? ` · ca ${kr(summa)} totalt` : ""}</p>
          <ul className="mt-2 grid gap-3 md:grid-cols-2">
            {lista.map((o) => (
              <li key={o.id} className="card flex flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="display text-xl">{o.namn}</h2>
                    {o.dryck && <p className="text-sm text-muted">{[o.dryck.producent, o.dryck.region, o.dryck.land].filter(Boolean).join(" · ")}</p>}
                  </div>
                  {o.prisCa != null && <span className="num shrink-0 text-sm text-muted">ca {kr(o.prisCa)}</span>}
                </div>
                {o.motivering && <p className="text-sm">{o.motivering}</p>}
                <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                  <Link href={o.dryck ? `/lagg-till/katalog/${o.dryck.id}` : `/lagg-till/ny?namn=${encodeURIComponent(o.namn)}`} className="btn !min-h-11 text-sm">Köpt, lägg till i samlingen</Link>
                  <a href={`https://www.systembolaget.se/sok/?textQuery=${encodeURIComponent(o.namn)}`} target="_blank" rel="noopener noreferrer" className="btn !min-h-11 text-sm">Systembolaget ↗</a>
                  <span className="ml-auto text-xs text-muted">{o.kalla === "ai-rekommendation" ? "AI-förslag" : "Egen"} · {datum(o.skapad)}</span>
                  <TaBortOnskning id={o.id} namn={o.namn} />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
