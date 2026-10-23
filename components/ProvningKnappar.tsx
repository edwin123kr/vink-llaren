"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { taBortProvning } from "@/app/actions/provning";

export function SkrivUt({ text = "Skriv ut" }: { text?: string }) {
  return <button type="button" className="btn btn-gold no-print" onClick={() => window.print()}>{text}</button>;
}

export function TaBortProvning({ id }: { id: string }) {
  const [fraga, setFraga] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  if (!fraga) return <button type="button" className="btn text-danger" onClick={() => setFraga(true)}>Ta bort provningen</button>;
  return (
    <span className="flex flex-wrap items-center gap-2" role="alertdialog" aria-label="Bekräfta borttagning">
      <span className="text-sm">Ta bort? Betyg som redan förts in finns kvar.</span>
      <button type="button" className="btn !min-h-11 !border-danger text-danger" disabled={pending} onClick={() => start(async () => { await taBortProvning(id); router.push("/provning"); })}>Ja, ta bort</button>
      <button type="button" className="btn !min-h-11" onClick={() => setFraga(false)}>Avbryt</button>
    </span>
  );
}
