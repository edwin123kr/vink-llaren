import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { kravAnvandare } from "@/lib/auth";
import type { Provningsforslag } from "@/lib/ai";
import { kalkyl } from "@/lib/provning";
import { datum } from "@/lib/format";
import { SkrivUt } from "@/components/ProvningKnappar";

export const metadata: Metadata = { title: "Provningsprotokoll" };
export const dynamic = "force-dynamic";

/** Utskrivbart protokoll: en sida per deltagare med plats för anteckningar och poäng. */
export default async function Protokoll({ params, searchParams }: PageProps<"/provning/[id]/protokoll">) {
  const anv = await kravAnvandare();
  const p = await db.provning.findFirst({ where: { id: (await params).id, anvandareId: anv.id } });
  if (!p) notFound();
  const sp = await searchParams;
  const blind = typeof sp.blind === "string" ? sp.blind === "1" : /blind/i.test(p.tema ?? "");
  const viner = (p.forslag as Provningsforslag | null)?.viner ?? [];
  const k = kalkyl({ deltagare: p.deltagare, antalViner: p.antalViner, budgetPerPerson: p.budgetPerPerson });
  const under = [p.tema, p.datum ? datum(p.datum) : null, `${p.antalViner} viner · ${k.mlPerGlas} ml per glas`].filter(Boolean).join(" · ");

  return (
    <div className="protokoll py-6">
      <div className="no-print mb-6 flex flex-wrap items-center gap-2">
        <Link href={`/provning/${p.id}`} className="btn">Tillbaka</Link>
        <SkrivUt text="Skriv ut protokollet" />
        <Link href={`/provning/${p.id}/protokoll?blind=${blind ? "0" : "1"}`} className="btn">{blind ? "Visa vinernas namn" : "Dölj namnen (blindprovning)"}</Link>
        <p className="w-full text-sm text-muted">Tips: välj &quot;Spara som PDF&quot; i utskriftsdialogen. Ett ark per deltagare skrivs ut.</p>
      </div>

      <Ark titel={p.titel} under={under} viner={viner} blind={blind} />
      <p className="no-print mt-3 text-sm text-muted">Skrivs ut i {p.deltagare} exemplar, ett per deltagare.</p>
      {Array.from({ length: Math.max(0, p.deltagare - 1) }, (_, i) => (
        <div key={i} className="print-only" aria-hidden="true">
          <Ark titel={p.titel} under={under} viner={viner} blind={blind} />
        </div>
      ))}
    </div>
  );
}

function Ark({ titel, under, viner, blind }: { titel: string; under: string; viner: Provningsforslag["viner"]; blind: boolean }) {
  return (
  <article className="print-sida card bg-white p-6 text-black">
    <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-black/30 pb-3">
      <div>
        <h1 className="display text-3xl">{titel}</h1>
        <p className="text-sm">{under}</p>
      </div>
      <p className="text-sm">Namn: ______________________</p>
    </header>
    <table className="mt-4 w-full border-collapse text-sm">
      <thead>
        <tr className="text-left">
          <th scope="col" className="w-8 border border-black/40 p-2">#</th>
          <th scope="col" className="border border-black/40 p-2">Vin</th>
          <th scope="col" className="border border-black/40 p-2">Doft</th>
          <th scope="col" className="border border-black/40 p-2">Smak</th>
          <th scope="col" className="w-20 border border-black/40 p-2">Poäng (0–10)</th>
        </tr>
      </thead>
      <tbody>
        {viner.map((v, i) => (
          <tr key={i} className="align-top">
            <td className="border border-black/40 p-2 font-semibold">{i + 1}</td>
            <td className="border border-black/40 p-2">
              {blind ? <span className="text-black/60">Vin {i + 1}<br />Gissning: ____________</span> : <><strong>{v.namn}</strong><br /><span className="text-black/70">{[v.druvor.join(", "), v.region, v.land].filter(Boolean).join(" · ")}</span><br /><span className="text-black/70">{v.serverTemp}</span></>}
            </td>
            <td className="h-24 border border-black/40 p-2 text-black/60">{blind ? "" : <span className="text-xs">Leta efter: {v.doft.join(", ")}</span>}</td>
            <td className="h-24 border border-black/40 p-2 text-black/60">{blind ? "" : <span className="text-xs">Leta efter: {v.smak.join(", ")}</span>}</td>
            <td className="border border-black/40 p-2" />
          </tr>
        ))}
      </tbody>
    </table>
    <p className="mt-4 text-sm">Kvällens favorit: ______________________________</p>
  </article>
  );
}
