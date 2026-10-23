import type { Metadata } from "next";
import { kravAnvandare } from "@/lib/auth";
import { PageHeader } from "@/components/Page";
import { BytLosenordForm, LoggaUtKnapp, RaderaKontoForm } from "@/components/KontoFormular";

export const metadata: Metadata = { title: "Mitt konto" };
export const dynamic = "force-dynamic";

export default async function Konto() {
  const anv = await kravAnvandare();
  return (
    <>
      <PageHeader eyebrow="Mer" title="Mitt konto">Inloggad som {anv.namn} ({anv.epost}).</PageHeader>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card flex flex-col gap-3 p-5" aria-labelledby="k-ut">
          <h2 id="k-ut" className="display text-2xl">Logga ut</h2>
          <p className="text-sm text-muted">Sidor som sparats för offlinebruk på den här enheten tas bort.</p>
          <LoggaUtKnapp />
        </section>
        <section className="card flex flex-col gap-3 p-5" aria-labelledby="k-pw">
          <h2 id="k-pw" className="display text-2xl">Byt lösenord</h2>
          <BytLosenordForm />
        </section>
        <section className="card flex flex-col gap-3 p-5 lg:col-span-2" aria-labelledby="k-rad">
          <h2 id="k-rad" className="display text-2xl">Radera konto</h2>
          <p className="text-sm text-muted">Allt i kontot raderas för gott. Ta gärna en säkerhetskopia först under Export och import.</p>
          <RaderaKontoForm />
        </section>
      </div>
    </>
  );
}
