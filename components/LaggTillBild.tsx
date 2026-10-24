"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { forminska } from "@/lib/forminska";
import { Icon } from "./Icon";

/** "Fota etiketten" för en flaska utan bild. Fotot blir vinets bild i katalogen, även för andra. */
export function LaggTillBild({ flaskaId }: { flaskaId: string }) {
  const fil = useRef<HTMLInputElement>(null);
  const [laddar, setLaddar] = useState(false);
  const [fel, setFel] = useState("");
  const router = useRouter();

  const valj = async (f: File | undefined) => {
    if (!f) return;
    setLaddar(true);
    setFel("");
    try {
      const fd = new FormData();
      fd.append("bild", await forminska(f), "etikett.jpg");
      const r = await fetch(`/api/flaska/${flaskaId}/bild`, { method: "POST", body: fd });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.fel ?? "Det gick inte att spara bilden.");
      router.refresh();
    } catch (e) {
      setFel(e instanceof Error ? e.message : "Något gick fel.");
    } finally {
      setLaddar(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <input ref={fil} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => valj(e.target.files?.[0])} />
      <button type="button" className="chip !min-h-11 gap-2" disabled={laddar} onClick={() => fil.current?.click()}>
        <Icon name="kamera" size={16} /> {laddar ? "Sparar bilden …" : "Fota etiketten"}
      </button>
      {fel && <p role="alert" className="text-center text-xs text-danger">{fel}</p>}
    </div>
  );
}
