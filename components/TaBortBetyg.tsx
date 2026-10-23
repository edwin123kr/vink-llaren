"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { taBortBetyg } from "@/app/actions/samling";

export function TaBortBetyg({ id }: { id: string }) {
  const [fraga, setFraga] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  if (!fraga) return <button type="button" className="min-h-11 shrink-0 px-2 text-sm text-muted hover:text-danger" onClick={() => setFraga(true)}>Ta bort</button>;
  return (
    <span className="flex shrink-0 gap-1">
      <button type="button" className="min-h-11 px-2 text-sm text-danger" disabled={pending} onClick={() => start(async () => { await taBortBetyg(id); router.refresh(); })}>Bekräfta</button>
      <button type="button" className="min-h-11 px-2 text-sm text-muted" onClick={() => setFraga(false)}>Avbryt</button>
    </span>
  );
}
