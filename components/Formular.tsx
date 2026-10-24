"use client";

import { laggTillFranKatalog, laggTillNy, redigeraFlaska } from "@/app/actions/samling";
import { DryckForm } from "./DryckForm";
import type { DryckState, FlaskaState } from "@/lib/formstate";
import { AiIfyllning } from "./AiIfyllning";

export function NyFlaskaForm({ init, ai = false }: { init?: DryckState; ai?: boolean }) {
  return (
    <DryckForm
      lage="ny"
      dryckInit={init}
      aiFran={ai}
      verktyg={ai ? undefined : (d, satt) => <AiIfyllning d={d} satt={satt} />}
      spara={(d, f, ai) => laggTillNy(d, f, ai ? "ai" : "manuell")}
    />
  );
}

export function KatalogFlaskaForm({ dryckId, sammanfattning, bildUrl }: { dryckId: string; sammanfattning: React.ReactNode; bildUrl?: string | null }) {
  return <DryckForm lage="katalog" sammanfattning={sammanfattning} spara={(_d, f) => laggTillFranKatalog(dryckId, f, bildUrl)} />;
}

export function RedigeraForm({ flaskaId, dryck, flaska }: { flaskaId: string; dryck: DryckState; flaska: FlaskaState }) {
  return <DryckForm lage="redigera" dryckInit={dryck} flaskaInit={flaska} sparaText="Spara ändringar" spara={(d, f) => redigeraFlaska(flaskaId, d, f)} />;
}
