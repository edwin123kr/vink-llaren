"use client";

import { useState } from "react";
import { tillDryckState, type DryckState } from "@/lib/formstate";
import { Icon } from "./Icon";

/**
 * "Låt Claude fylla i": skickar namn, producent och årgång till servern och fyller i tomma fält.
 * Fält du redan har fyllt i skrivs aldrig över. Allt går att ändra innan du sparar.
 */
export function AiIfyllning({ d, satt }: { d: DryckState; satt: (p: Partial<DryckState>) => void }) {
  const [status, setStatus] = useState<"" | "laddar" | "klar" | "fel">("");
  const [meddelande, setMeddelande] = useState("");
  const [lage, setLage] = useState<"mock" | "live" | null>(null);

  const kor = async () => {
    const beskrivning = [d.producent, d.namn, d.argang].filter(Boolean).join(" ").trim();
    if (beskrivning.length < 2) {
      setStatus("fel");
      setMeddelande("Skriv åtminstone namnet först.");
      return;
    }
    setStatus("laddar");
    setMeddelande("");
    try {
      const res = await fetch("/api/ai/fyll", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ beskrivning }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.fel ?? "AI-ifyllningen misslyckades.");
      const forslag = tillDryckState(j);
      const patch: Partial<DryckState> = {};
      (Object.keys(forslag) as (keyof DryckState)[]).forEach((k) => {
        if (k === "namn" || k === "prisUppskattat") return;
        const nu = d[k];
        const ny = forslag[k];
        if ((nu === "" || (k === "volymMl" && nu === "750")) && typeof ny === "string" && ny !== "") (patch as Record<string, unknown>)[k] = ny;
      });
      if (patch.prisCa) patch.prisUppskattat = true;
      satt(patch);
      setLage(j.lage);
      setStatus("klar");
      const n = Object.keys(patch).filter((k) => k !== "prisUppskattat").length;
      setMeddelande(n ? `Claude fyllde i ${n} fält. Granska och ändra innan du sparar.` : "Inga tomma fält att fylla i.");
    } catch (e) {
      setStatus("fel");
      setMeddelande(e instanceof Error ? e.message : "Något gick fel.");
    }
  };

  return (
    <section className="card flex flex-col gap-3 border-gold/40 p-5" aria-labelledby="ai-titel">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-2 text-gold"><Icon name="smak" size={20} /></span>
        <div>
          <h2 id="ai-titel" className="font-semibold">Låt Claude fylla i resten</h2>
          <p className="text-sm text-muted">Skriv namn (och gärna producent och årgång), så föreslår Claude druva, smakprofil, dofter och mat. Fält du redan fyllt i ändras inte.</p>
        </div>
      </div>
      <button type="button" className="btn self-start" onClick={kor} disabled={status === "laddar"}>
        {status === "laddar" ? "Claude tänker …" : "Fyll i med AI"}
      </button>
      <p role="status" aria-live="polite" className={`text-sm ${status === "fel" ? "text-danger" : "text-muted"}`}>
        {meddelande}
        {status === "klar" && lage === "mock" && <span className="ml-1 text-gold">Låtsasläge: svaret är ett exempel, inte riktiga uppgifter.</span>}
      </p>
    </section>
  );
}
