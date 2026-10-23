import type { Metadata } from "next";
import { Kommer, PageHeader } from "@/components/Page";

export const metadata: Metadata = { title: "Smakprofil" };

export default function Smakprofil() {
  return (
    <>
      <PageHeader eyebrow="AI-analys" title="Smakprofil">
        En sammanfattning av vad du gillar, byggd på dina betyg. Uppdelad på vin och sprit.
      </PageHeader>
      <div className="grid gap-3 md:grid-cols-2">
        <Kommer fas={4} icon="smak" title="Din smak i ord och radardiagram">Fyllighet, sötma, syra, strävhet och rökighet, med en sammanfattning från Claude.</Kommer>
        <Kommer fas={4} icon="hjarta" title="Rekommendationer, utforska och undvik">Flaskor som liknar dina favoriter, nya druvor och regioner, och stilar du brukar betygsätta lågt.</Kommer>
      </div>
    </>
  );
}
