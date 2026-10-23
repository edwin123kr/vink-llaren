"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sparaOnskning } from "@/app/actions/smak";
import { parseDecimal } from "@/lib/format";

export function OnskeForm() {
  const [namn, setNamn] = useState("");
  const [motivering, setMotivering] = useState("");
  const [pris, setPris] = useState("");
  const [fel, setFel] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <form
      className="card grid gap-3 p-5 sm:grid-cols-[2fr_1fr_auto] sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const p = parseDecimal(pris);
          const r = await sparaOnskning({ namn, motivering: motivering || null, prisCa: p == null ? null : Math.round(p), kalla: "manuell" });
          if (!r.ok) return setFel(r.fel);
          setNamn(""); setMotivering(""); setPris(""); setFel("");
          router.refresh();
        });
      }}
    >
      <div>
        <label htmlFor="o-namn" className="mb-1.5 block text-sm font-medium">Vad vill du köpa? *</label>
        <input id="o-namn" className="input" value={namn} onChange={(e) => setNamn(e.target.value)} aria-invalid={fel ? true : undefined} aria-describedby={fel ? "o-fel" : undefined} />
      </div>
      <div>
        <label htmlFor="o-pris" className="mb-1.5 block text-sm font-medium">Ca pris (kr)</label>
        <input id="o-pris" className="input" inputMode="numeric" value={pris} onChange={(e) => setPris(e.target.value)} />
      </div>
      <button type="submit" className="btn btn-gold" disabled={pending}>Lägg till</button>
      <div className="sm:col-span-3">
        <label htmlFor="o-mot" className="mb-1.5 block text-sm font-medium">Anteckning</label>
        <input id="o-mot" className="input" value={motivering} onChange={(e) => setMotivering(e.target.value)} placeholder="T.ex. tips från en vän" />
      </div>
      {fel && <p id="o-fel" role="alert" className="text-sm text-danger sm:col-span-3">{fel}</p>}
    </form>
  );
}
