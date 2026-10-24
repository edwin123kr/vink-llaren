import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { kravAnvandare } from "@/lib/auth";
import { smakdata } from "@/lib/smakdata";
import type { Smakanalys } from "@/lib/ai";
import { betygText, datum, kr } from "@/lib/format";
import { kategori } from "@/lib/kategorier";
import { PageHeader } from "@/components/Page";
import { Radar, RADAR_FARG } from "@/components/Radar";
import { AnalysKnapp, OnskeKnapp } from "@/components/SmakKnappar";

export const metadata: Metadata = { title: "Smakprofil" };
export const dynamic = "force-dynamic";

const UTFORSKA_TYP = { druva: "Druva", region: "Region", spritsort: "Spritsort" };

export default async function Smakprofil({ searchParams }: PageProps<"/smakprofil">) {
  const anv = await kravAnvandare();
  const typ = (await searchParams).typ === "sprit" ? "sprit" : "vin";
  const [data, senaste, onskade] = await Promise.all([
    smakdata(anv.id, typ),
    db.smakanalys.findFirst({ where: { anvandareId: anv.id, typ }, orderBy: { skapad: "desc" } }),
    db.onskning.findMany({ where: { anvandareId: anv.id }, select: { dryckId: true, namn: true } }),
  ]);
  const analys = senaste?.resultat as (Smakanalys & { lage?: "mock" | "live" }) | undefined;
  const pasLista = new Set(onskade.map((o) => o.dryckId ?? o.namn));
  const kandidatMap = new Map(data.kandidater.map((k) => [k.id, k]));
  const nyaBetyg = senaste ? data.antalBetyg - senaste.antalBetyg : 0;

  return (
    <>
      <PageHeader eyebrow="AI-analys" title="Smakprofil">Vad du gillar, byggt på dina betyg.</PageHeader>

      <div className="mb-6 inline-flex rounded-full border border-line bg-surface p-1" role="tablist" aria-label="Typ">
        {(["vin", "sprit"] as const).map((t) => (
          <Link key={t} href={t === "vin" ? "/smakprofil" : "/smakprofil?typ=sprit"} role="tab" aria-selected={typ === t} className={`flex min-h-11 items-center rounded-full px-6 font-semibold transition-colors ${typ === t ? "bg-gold text-on-gold" : "text-muted hover:text-text"}`}>
            {t === "vin" ? "Vin" : "Sprit"}
          </Link>
        ))}
      </div>

      {data.antalBetyg < 3 ? (
        <section className="card flex flex-col items-start gap-3 p-6">
          <h2 className="display text-2xl">Betygsätt några {typ === "vin" ? "viner" : "spritsorter"} först</h2>
          <p className="text-muted">Smakprofilen behöver minst tre betyg. Du har {data.antalBetyg}. Tryck på &quot;Drack den&quot; när du öppnar en flaska.</p>
          <Link href="/" className="btn">Till samlingen</Link>
        </section>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
          <section className="card flex flex-col gap-4 p-5" aria-labelledby="sammanfattning">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="sammanfattning" className="display text-2xl">Din smak</h2>
              <span className="text-sm text-muted">{data.antalBetyg} betyg på {data.antalDrycker} {typ === "vin" ? "viner" : "sorter"}</span>
            </div>
            {analys ? (
              <>
                <p className="text-lg leading-relaxed">{analys.sammanfattning}</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-semibold text-muted">Du gillar</h3>
                    <ul className="mt-2 flex flex-col gap-1.5">{analys.gillar.map((g) => <li key={g} className="flex gap-2"><span className="text-ok" aria-hidden="true">+</span>{g}</li>)}</ul>
                  </div>
                  {analys.mindreForstjust.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-muted">Mindre förtjust i</h3>
                      <ul className="mt-2 flex flex-col gap-1.5">{analys.mindreForstjust.map((g) => <li key={g} className="flex gap-2"><span className="text-danger" aria-hidden="true">−</span>{g}</li>)}</ul>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4 text-sm text-muted">
                  <span>Analyserad {datum(senaste!.skapad)}{nyaBetyg > 0 ? ` · ${nyaBetyg} nya betyg sedan dess` : ""}</span>
                </div>
                <AnalysKnapp typ={typ} text={nyaBetyg > 0 ? "Uppdatera analysen" : "Analysera igen"} />
              </>
            ) : (
              <>
                <p className="text-muted">Låt vår sommelier läsa dina betyg och sammanfatta din smak, föreslå flaskor ur katalogen och tipsa om sådant du aldrig har testat.</p>
                <AnalysKnapp typ={typ} text="Analysera min smak" />
              </>
            )}
          </section>

          <section className="card p-5" aria-labelledby="profil">
            <h2 id="profil" className="display text-2xl">Smakprofil</h2>
            <p className="mt-1 text-sm text-muted">Snittprofil för det du gett minst 7,0 jämfört med under 6,0.</p>
            <div className="mt-4">
              <Radar
                titel={`Smakprofil för ${typ === "vin" ? "vin" : "sprit"}`}
                dims={data.dims}
                serier={[
                  { namn: `Gillar (${data.antalGillar})`, farg: RADAR_FARG.gillar, profil: data.profilGillar },
                  { namn: `Gillar mindre (${data.antalMindre})`, farg: RADAR_FARG.mindre, profil: data.profilMindre, streckad: true },
                ]}
              />
            </div>
          </section>

          <section className="card p-5" aria-labelledby="favoriter">
            <h2 id="favoriter" className="display text-2xl">Högst betyg</h2>
            <div className="mt-3 grid gap-5 sm:grid-cols-2">
              {[
                [typ === "vin" ? "Druvor" : "Råvaror", data.druvor],
                ["Regioner", data.regioner],
              ].map(([rubrik, grupper]) => (
                <div key={rubrik as string}>
                  <h3 className="text-sm font-semibold text-muted">{rubrik as string}</h3>
                  <ol className="mt-2 flex flex-col">
                    {(grupper as typeof data.druvor).slice(0, 5).map((g) => (
                      <li key={g.namn} className="flex items-center justify-between gap-3 border-t border-line py-2 first:border-t-0">
                        <span className="truncate">{g.namn}</span>
                        <span className="num shrink-0 text-sm"><span className="text-gold">{betygText(g.snitt)}</span> <span className="text-muted">({g.antal})</span></span>
                      </li>
                    ))}
                    {(grupper as typeof data.druvor).length === 0 && <li className="text-sm text-muted">Inga uppgifter än.</li>}
                  </ol>
                </div>
              ))}
            </div>
          </section>

          {analys && analys.undvik.length > 0 && (
            <section className="card p-5" aria-labelledby="undvik">
              <h2 id="undvik" className="display text-2xl">Undvik</h2>
              <p className="mt-1 text-sm text-muted">Stilar du konsekvent har gett lågt betyg.</p>
              <ul className="mt-3 flex flex-col gap-3">
                {analys.undvik.map((u) => (
                  <li key={u.stil} className="rounded-xl border border-line p-3"><p className="font-semibold">{u.stil}</p><p className="text-sm text-muted">{u.varfor}</p></li>
                ))}
              </ul>
            </section>
          )}

          {analys && (
            <section className="card p-5 lg:col-span-2" aria-labelledby="rek">
              <h2 id="rek" className="display text-2xl">Rekommenderat för dig</h2>
              <p className="mt-1 text-sm text-muted">Ur katalogen, valt för att likna det du gett högt betyg.</p>
              {analys.rekommendationer.length === 0 ? (
                <p className="mt-3 text-muted">Inga passande flaskor i katalogen ännu. Importera fler med importskriptet.</p>
              ) : (
                <ul className="mt-4 grid gap-3 md:grid-cols-2">
                  {analys.rekommendationer.map((r) => {
                    const k = kandidatMap.get(r.id);
                    if (!k) return null;
                    return (
                      <li key={r.id} className="flex flex-col gap-3 rounded-2xl border border-line bg-surface-2/40 p-4">
                        <div>
                          <p className="eyebrow !text-[0.6875rem]">{kategori(k.kategori)?.namn}</p>
                          <h3 className="display text-xl">{k.namn}</h3>
                          <p className="text-sm text-muted">{[k.producent, k.region, k.land].filter(Boolean).join(" · ")}</p>
                        </div>
                        <p>{r.motivering}</p>
                        <p className="num text-sm text-muted">{k.prisCa != null ? `Ca ${kr(k.prisCa)}` : "Pris okänt"}</p>
                        <div className="flex flex-wrap gap-2">
                          <OnskeKnapp namn={k.namn} motivering={r.motivering} prisCa={k.prisCa} dryckId={k.id} sparad={pasLista.has(k.id)} />
                          <Link href={`/lagg-till/katalog/${k.id}`} className="btn !min-h-11 text-sm">Jag har köpt den</Link>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}

          {analys && analys.utforska.length > 0 && (
            <section className="card p-5 lg:col-span-2" aria-labelledby="utforska">
              <h2 id="utforska" className="display text-2xl">Utforska</h2>
              <p className="mt-1 text-sm text-muted">Sådant du aldrig har betygsatt, med en flaska att börja med.</p>
              <ul className="mt-4 grid gap-3 md:grid-cols-3">
                {analys.utforska.map((u) => (
                  <li key={u.namn} className="flex flex-col gap-2 rounded-2xl border border-line bg-surface-2/40 p-4">
                    <p className="eyebrow !text-[0.6875rem]">{UTFORSKA_TYP[u.typ]}</p>
                    <h3 className="display text-xl">{u.namn}</h3>
                    <p className="text-sm">{u.varfor}</p>
                    <p className="text-sm"><span className="text-muted">Börja med:</span> {u.instegsflaska}{u.ungefarligtPris != null ? ` · ca ${kr(u.ungefarligtPris)}` : ""}</p>
                    <div className="mt-auto pt-1">
                      <OnskeKnapp namn={u.instegsflaska} motivering={`${UTFORSKA_TYP[u.typ]}: ${u.namn}. ${u.varfor}`} prisCa={u.ungefarligtPris} sparad={pasLista.has(u.instegsflaska)} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </>
  );
}
