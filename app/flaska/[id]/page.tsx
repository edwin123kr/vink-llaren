import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { kravAnvandare } from "@/lib/auth";
import { kategori } from "@/lib/kategorier";
import { KALLOR } from "@/lib/katalog";
import { betygText, datum, decimal, drickfonster, kr, lista, procent } from "@/lib/format";
import { DrackDenKnapp } from "@/components/DrackDenKnapp";
import { FlaskAtgarder } from "@/components/FlaskAtgarder";
import { FlaskBild } from "@/components/FlaskBild";
import { Icon } from "@/components/Icon";
import { SmakStaplar } from "@/components/SmakStaplar";

export const dynamic = "force-dynamic";

async function hamta(id: string) {
  const anv = await kravAnvandare();
  return db.flaska.findFirst({
    where: { id, anvandareId: anv.id },
    include: { dryck: { include: { betyg: { where: { anvandareId: anv.id }, orderBy: { datum: "desc" } } } } },
  });
}

export async function generateMetadata({ params }: PageProps<"/flaska/[id]">): Promise<Metadata> {
  const f = await hamta((await params).id);
  return { title: f?.dryck.namn ?? "Flaska" };
}

const FONSTER: Record<string, [string, string]> = {
  redo: ["Redo att drickas", "text-ok"],
  "drick-snart": ["Drick snart", "text-gold"],
  vanta: ["Vänta", "text-muted"],
  passerat: ["Drickfönstret har passerat", "text-danger"],
  okand: ["Inget drickfönster angivet", "text-muted"],
};

export default async function FlaskSida({ params }: PageProps<"/flaska/[id]">) {
  const f = await hamta((await params).id);
  if (!f) notFound();
  const d = f.dryck;
  const druvor = lista(d.druvor);
  const aromer = lista(d.aromer);
  const mat = lista(d.mat);
  const snitt = d.betyg.length ? Math.round(d.betyg.reduce((a, b) => a + b.betyg, 0) / d.betyg.length) : null;
  const fonster = drickfonster(f.drickFran, f.drickTill);
  const sb = `https://www.systembolaget.se/sok/?textQuery=${encodeURIComponent(d.sbArtikelnr || [d.producent, d.namn].filter(Boolean).join(" "))}`;

  const fakta: [string, string | null][] = [
    ["Producent", d.producent],
    [d.typ === "sprit" ? "Råvara" : druvor.length > 1 ? "Druvor" : "Druva", druvor.join(", ") || null],
    ["Land", d.land],
    ["Region", d.region],
    ["Årgång", d.argang ? String(d.argang) : null],
    ["Alkoholhalt", d.alkoholhalt != null ? procent(d.alkoholhalt) : null],
    ["Volym", d.volymMl ? (d.volymMl >= 1000 ? `${decimal(d.volymMl / 1000)} l` : `${d.volymMl} ml`) : null],
    ["Ungefärligt pris", d.prisCa != null ? `${kr(d.prisCa)}${d.prisUppskattat ? " (uppskattat)" : ""}` : null],
    ["Streckkod (EAN)", d.ean],
    ["Systembolagets artikelnr", d.sbArtikelnr],
  ];

  return (
    <article className="pb-6 pt-4 md:pt-8">
      <Link href="/" className="inline-flex min-h-11 items-center gap-1 text-sm text-muted hover:text-text">
        <Icon name="pil" size={16} className="rotate-180" /> Samlingen
      </Link>

      <div className="mt-2 grid gap-6 md:grid-cols-[220px_1fr] md:gap-10">
        <div className="flex h-56 items-center justify-center rounded-[var(--radius-card)] border border-line bg-surface-2/50 p-4 md:h-80">
          <FlaskBild kategori={d.kategori} bildUrl={d.bildUrl} />
        </div>

        <div>
          <p className="eyebrow">{kategori(d.kategori)?.namn}{d.argang ? ` · ${d.argang}` : ""}</p>
          <h1 className="display mt-1 text-4xl md:text-5xl">{d.namn}</h1>
          <p className="mt-1 text-muted">{[d.producent, d.region, d.land].filter(Boolean).join(" · ")}</p>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="num text-2xl text-gold">{snitt != null ? `★ ${betygText(snitt)}` : <span className="text-base text-muted">Ej betygsatt</span>}</span>
            {d.betyg.length > 0 && <span className="text-sm text-muted">{d.betyg.length} {d.betyg.length === 1 ? "betyg" : "betyg"}</span>}
            <span className={`text-sm ${FONSTER[fonster.status][1]}`}>{FONSTER[fonster.status][0]}{fonster.status !== "okand" ? ` · ${fonster.text}` : ""}</span>
          </div>

          <div className="mt-5 flex flex-col gap-4">
            <DrackDenKnapp flaskaId={f.id} namn={d.namn} antal={f.antal} />
            <Link
              href={`/sommelier?fraga=${encodeURIComponent(`Berätta om ${d.namn}${d.argang ? ` ${d.argang}` : ""}${d.producent ? ` från ${d.producent}` : ""}: vad passar till, hur ska den serveras och när är den som bäst?`)}`}
              className="btn"
            >
              <Icon name="prata" size={18} /> Fråga sommeliern om flaskan
            </Link>
            <FlaskAtgarder id={f.id} antal={f.antal} />
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <section className="card p-5" aria-labelledby="min-flaska">
          <h2 id="min-flaska" className="display text-2xl">Min flaska</h2>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-muted">Inköpspris</dt><dd className="num">{kr(f.inkopspris)}</dd>
            <dt className="text-muted">Inköpt</dt><dd>{f.inkopsdatum ? datum(f.inkopsdatum) : "–"}{f.inkopsstalle ? ` · ${f.inkopsstalle}` : ""}</dd>
            <dt className="text-muted">Förvaring</dt><dd>{f.plats ?? "–"}</dd>
            <dt className="text-muted">Drickfönster</dt><dd>{fonster.text}</dd>
          </dl>
          {f.anteckningar && <p className="mt-4 whitespace-pre-line border-t border-line pt-4">{f.anteckningar}</p>}
        </section>

        <section className="card p-5" aria-labelledby="smak">
          <h2 id="smak" className="display text-2xl">Smakprofil</h2>
          <div className="mt-4">
            <SmakStaplar kategori={d.kategori} profil={d} />
          </div>
          {aromer.length > 0 && (
            <>
              <h3 className="mt-5 text-sm font-semibold text-muted">Dofter och aromer</h3>
              <ul className="mt-2 flex flex-wrap gap-2">{aromer.map((a) => <li key={a} className="chip">{a}</li>)}</ul>
            </>
          )}
          {mat.length > 0 && (
            <>
              <h3 className="mt-4 text-sm font-semibold text-muted">Passar till</h3>
              <ul className="mt-2 flex flex-wrap gap-2">{mat.map((a) => <li key={a} className="chip">{a}</li>)}</ul>
            </>
          )}
        </section>

        <section className="card p-5" aria-labelledby="fakta">
          <h2 id="fakta" className="display text-2xl">Fakta</h2>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            {fakta.filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="contents"><dt className="text-muted">{k}</dt><dd className="num">{v}</dd></div>
            ))}
          </dl>
          {d.beskrivning && <p className="mt-4 border-t border-line pt-4">{d.beskrivning}</p>}
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4 text-sm">
            <a href={sb} target="_blank" rel="noopener noreferrer" className="btn !min-h-11">Sök på Systembolaget ↗</a>
            <span className="text-muted">Källa: {KALLOR[d.kalla]?.namn ?? d.kalla}{d.licens ? ` (${d.licens})` : ""}</span>
          </div>
        </section>

        <section className="card p-5" aria-labelledby="historik">
          <div className="flex items-center justify-between">
            <h2 id="historik" className="display text-2xl">Historik</h2>
            <Link href="/historik" className="text-sm text-gold underline-offset-4 hover:underline">Alla betyg</Link>
          </div>
          {d.betyg.length === 0 ? (
            <p className="mt-3 text-muted">Inga betyg än. Tryck på &quot;Drack den&quot; när du öppnar en flaska.</p>
          ) : (
            <ol className="mt-3 divide-y divide-line">
              {d.betyg.map((b) => (
                <li key={b.id} className="flex gap-4 py-3">
                  <span className="num w-12 shrink-0 text-lg font-semibold text-gold">{betygText(b.betyg)}</span>
                  <div className="min-w-0">
                    <p className="text-sm text-muted">{datum(b.datum)}{b.tillfalle ? ` · ${b.tillfalle}` : ""}</p>
                    {b.kommentar && <p className="mt-0.5">{b.kommentar}</p>}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </article>
  );
}
