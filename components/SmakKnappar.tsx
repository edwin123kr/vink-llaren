"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { korSmakanalys, sparaOnskning, taBortOnskning } from "@/app/actions/smak";
import { Icon } from "./Icon";

export function AnalysKnapp({ typ, text }: { typ: "vin" | "sprit"; text: string }) {
  const [pending, start] = useTransition();
  const [fel, setFel] = useState("");
  const router = useRouter();
  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        className="btn btn-gold"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setFel("");
            const r = await korSmakanalys(typ);
            if (!r.ok) setFel(r.fel);
            router.refresh();
          })
        }
      >
        <Icon name="smak" size={18} /> {pending ? "Claude analyserar …" : text}
      </button>
      <p role="status" aria-live="polite" className="text-sm text-danger">{fel}</p>
    </div>
  );
}

export function OnskeKnapp({ namn, motivering, prisCa, dryckId, kalla = "ai-rekommendation", sparad = false }: { namn: string; motivering?: string | null; prisCa?: number | null; dryckId?: string | null; kalla?: "ai-rekommendation" | "manuell"; sparad?: boolean }) {
  const [klar, setKlar] = useState(sparad);
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className={`btn !min-h-11 text-sm ${klar ? "!border-gold text-gold" : ""}`}
      disabled={pending || klar}
      aria-pressed={klar}
      onClick={() =>
        start(async () => {
          const r = await sparaOnskning({ namn, motivering, prisCa: prisCa ?? null, dryckId: dryckId ?? null, kalla });
          if (r.ok) setKlar(true);
        })
      }
    >
      <Icon name="hjarta" size={16} /> {klar ? "På önskelistan" : "Spara till önskelistan"}
    </button>
  );
}

export function TaBortOnskning({ id, namn }: { id: string; namn: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button type="button" className="min-h-11 px-2 text-sm text-muted hover:text-danger" disabled={pending} aria-label={`Ta bort ${namn} från önskelistan`} onClick={() => start(async () => { await taBortOnskning(id); router.refresh(); })}>
      Ta bort
    </button>
  );
}
