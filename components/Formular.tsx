"use client";

import { laggTillFranKatalog, laggTillNy, redigeraFlaska } from "@/app/actions/samling";
import { DryckForm } from "./DryckForm";
import type { DryckState, FlaskaState } from "@/lib/formstate";
import { AiIfyllning } from "./AiIfyllning";

export function NyFlaskaForm({ init, ai = false, osakra }: { init?: DryckState; ai?: boolean; osakra?: string[] }) {
  return (
    <DryckForm
      lage="ny"
      dryckInit={init}
      aiFran={ai}
      osakraInit={osakra}
      verktyg={ai ? undefined : (d, satt) => <AiIfyllning d={d} satt={satt} />}
      spara={(d, f, ai) => laggTillNy(d, f, ai ? "ai" : "manuell")}
    />
  );
}

export function KatalogFlaskaForm({ dryckId, sammanfattning, bildUrl, ean }: { dryckId: string; sammanfattning: React.ReactNode; bildUrl?: string | null; ean?: string | null }) {
  return <DryckForm lage="katalog" sammanfattning={sammanfattning} spara={(_d, f) => laggTillFranKatalog(dryckId, f, bildUrl, ean)} />;
}

export function RedigeraForm({ flaskaId, dryck, flaska }: { flaskaId: string; dryck: DryckState; flaska: FlaskaState }) {
  return <DryckForm lage="redigera" dryckInit={dryck} flaskaInit={flaska} sparaText="Spara ändringar" spara={(d, f) => redigeraFlaska(flaskaId, d, f)} />;
}
