import type { Metadata } from "next";
import { db } from "@/lib/db";
import { KALLOR } from "@/lib/katalog";
import { PageHeader } from "@/components/Page";

export const metadata: Metadata = { title: "Källor och licenser" };
export const dynamic = "force-dynamic";

export default async function Kallor() {
  const per = await db.dryck.groupBy({ by: ["kalla"], _count: { _all: true } });
  const antal = new Map(per.map((p) => [p.kalla, p._count._all]));
  return (
    <>
      <PageHeader eyebrow="Mer" title="Källor och licenser">
        Katalogen byggs bara från öppna, lagliga källor. Varje dryck sparar sin källa och licens.
      </PageHeader>

      <section className="card p-5">
        <h2 className="display text-2xl">Katalogen just nu</h2>
        <ul className="mt-3 divide-y divide-line">
          {Object.entries(KALLOR).map(([id, k]) => (
            <li key={id} className="flex items-center justify-between gap-4 py-3">
              <span>
                {k.namn} <span className="text-sm text-muted">· {k.licens}</span>
              </span>
              <span className="num text-gold">{antal.get(id) ?? 0}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <section className="card p-5">
          <h2 className="display text-2xl">X-Wines</h2>
          <p className="mt-2 text-muted">
            Ett öppet forskningsdataset med cirka 100 000 viner. Licens CC0-1.0 (fri användning).
          </p>
          <p className="mt-3 text-sm">
            de Azambuja, R. X., Morais, A. J., &amp; Filipe, V. (2023). X-Wines: A Wine Dataset for Recommender Systems and Machine Learning.{" "}
            <em>Big Data and Cognitive Computing</em>, 7(1), 20.{" "}
            <a className="text-gold underline underline-offset-4" href="https://doi.org/10.3390/bdcc7010020">doi:10.3390/bdcc7010020</a>
          </p>
        </section>
        <section className="card p-5">
          <h2 className="display text-2xl">Open Food Facts</h2>
          <p className="mt-2 text-muted">
            Produktdata med streckkoder, tillgänglig under Open Database License (ODbL-1.0). Bilder från Open Food Facts har licensen CC BY-SA.
            Uppgifter från Open Food Facts i den här katalogen delas vidare under samma licens.
          </p>
          <p className="mt-3 text-sm">
            © Open Food Facts-bidragsgivare.{" "}
            <a className="text-gold underline underline-offset-4" href="https://world.openfoodfacts.org">world.openfoodfacts.org</a>
          </p>
        </section>
        <section className="card p-5 md:col-span-2">
          <h2 className="display text-2xl">Systembolaget</h2>
          <p className="mt-2 text-muted">
            Systembolaget har inget öppet API för sitt sortiment och tillåter inte att data hämtas från webbplatsen. Därför importeras
            inget från Systembolaget. Artikelnummer kan fyllas i manuellt, och appen kan länka till en sökning på systembolaget.se.
          </p>
        </section>
      </div>
    </>
  );
}
