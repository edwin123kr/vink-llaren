"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { andraAntal, taBortFlaska } from "@/app/actions/samling";
import { Icon } from "./Icon";

/** Antal (−/+), redigera och ta bort (med bekräftelse). */
export function FlaskAtgarder({ id, antal }: { id: string; antal: number }) {
  const [pending, start] = useTransition();
  const [fraga, setFraga] = useState(false);
  const router = useRouter();
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted">Antal</span>
        <div className="inline-flex items-center rounded-full border border-line bg-surface-2" role="group" aria-label="Antal flaskor">
          <button type="button" className="grid h-11 w-11 place-items-center text-xl" aria-label="En flaska färre" disabled={pending || antal < 1} onClick={() => start(async () => { await andraAntal(id, -1); router.refresh(); })}>−</button>
          <span className="num min-w-8 text-center text-lg font-semibold" aria-live="polite">{antal}</span>
          <button type="button" className="grid h-11 w-11 place-items-center text-xl" aria-label="En flaska till" disabled={pending} onClick={() => start(async () => { await andraAntal(id, 1); router.refresh(); })}>+</button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href={`/flaska/${id}/redigera`} className="btn"><Icon name="penna" size={18} /> Redigera</Link>
        {!fraga ? (
          <button type="button" className="btn text-danger" onClick={() => setFraga(true)}>Ta bort ur samlingen</button>
        ) : (
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-danger/50 p-2" role="alertdialog" aria-label="Bekräfta borttagning">
            <span className="px-2 text-sm">Ta bort posten? Betygshistoriken finns kvar.</span>
            <button type="button" className="btn !min-h-11 !border-danger text-danger" disabled={pending} onClick={() => start(async () => { await taBortFlaska(id); router.push("/"); })}>Ja, ta bort</button>
            <button type="button" className="btn !min-h-11" onClick={() => setFraga(false)}>Avbryt</button>
          </div>
        )}
      </div>
    </div>
  );
}
