"use client";

import { laggTillFranKatalog, laggTillNy, redigeraFlaska } from "@/app/actions/samling";
import { DryckForm } from "./DryckForm";
import type { DryckState, FlaskaState } from "@/lib/formstate";
import { AiIfyllning } from "./AiIfyllning";

export function NyFlaskaForm({ init }: { init?: DryckState }) {
  return (
    <DryckForm
      lage="ny"
      dryckInit={init}
      verktyg={(d, satt) => <AiIfyllning d={d} satt={satt} />}
      spara={(d, f) => laggTillNy(d, f, init?.namn ? "ai" : "manuell")}
    />
  );
}

export function KatalogFlaskaForm({ dryckId, sammanfattning }: { dryckId: string; sammanfattning: React.ReactNode }) {
  return <DryckForm lage="katalog" sammanfattning={sammanfattning} spara={(_d, f) => laggTillFranKatalog(dryckId, f)} />;
}

export function RedigeraForm({ flaskaId, dryck, flaska }: { flaskaId: string; dryck: DryckState; flaska: FlaskaState }) {
  return <DryckForm lage="redigera" dryckInit={dryck} flaskaInit={flaska} sparaText="Spara ändringar" spara={(d, f) => redigeraFlaska(flaskaId, d, f)} />;
}
