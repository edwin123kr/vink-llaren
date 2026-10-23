import type { Metadata } from "next";
import { aiMode, aiModel } from "@/lib/ai";
import { db } from "@/lib/db";
import { Icon, type IconName } from "@/components/Icon";
import { PageHeader } from "@/components/Page";

export const metadata: Metadata = { title: "Mer" };
export const dynamic = "force-dynamic";

const RADER: { icon: IconName; title: string; text: string; fas: number }[] = [
  { icon: "hjarta", title: "Önskelista", text: "Flaskor du vill köpa", fas: 4 },
  { icon: "stapel", title: "Statistik", text: "Värde, snittbetyg och mest prisvärda", fas: 6 },
  { icon: "export", title: "Export och import", text: "Säkerhetskopia som JSON eller CSV", fas: 6 },
  { icon: "bok", title: "Källor och licenser", text: "X-Wines (CC0) och Open Food Facts (ODbL)", fas: 1 },
];

export default async function Mer() {
  const lage = aiMode();
  const katalog = await db.dryck.count();
  return (
    <>
      <PageHeader eyebrow="Inställningar och verktyg" title="Mer" />
      <ul className="grid gap-3">
        {RADER.map((r) => (
          <li key={r.title} className="card flex min-h-20 items-center gap-4 p-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface-2 text-gold"><Icon name={r.icon} /></span>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold">{r.title}</h2>
              <p className="text-sm text-muted">{r.text}</p>
            </div>
            <span className="chip shrink-0">Fas {r.fas}</span>
          </li>
        ))}
      </ul>

      <section className="card mt-6 p-5" aria-labelledby="status-title">
        <h2 id="status-title" className="display text-2xl">Status</h2>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-muted">AI-läge</dt>
          <dd>{lage === "live" ? `Live (${aiModel()})` : "Låtsasläge: inga riktiga AI-anrop"}</dd>
          <dt className="text-muted">Drycker i katalogen</dt>
          <dd className="num">{katalog}</dd>
          <dt className="text-muted">Databas</dt>
          <dd>SQLite (lokal fil)</dd>
        </dl>
      </section>
    </>
  );
}
