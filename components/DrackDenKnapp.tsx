"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { drackDen } from "@/app/actions/samling";
import { BetygDialog, type BetygSvar } from "./BetygDialog";
import { Icon } from "./Icon";

/** Knappen "Drack den" öppnar popupen "Betygsätt flaskan". */
export function DrackDenKnapp({ flaskaId, namn, antal, kompakt = false }: { flaskaId: string; namn: string; antal: number; kompakt?: boolean }) {
  const [open, setOpen] = useState(false);
  const [fel, setFel] = useState<string | null>(null);
  const [kvitto, setKvitto] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  const kor = (svar: BetygSvar | null) =>
    start(async () => {
      setFel(null);
      const res = await drackDen(flaskaId, svar);
      if (!res.ok) return setFel(Object.values(res.fel)[0] ?? "Något gick fel.");
      setOpen(false);
      setKvitto(svar ? "Betyget är sparat och flaskan är avbockad." : "Flaskan är avbockad.");
      router.refresh();
    });

  return (
    <>
      <button
        type="button"
        className={`btn btn-gold ${kompakt ? "!min-h-11 !px-4 text-sm" : "w-full sm:w-auto"}`}
        onClick={() => {
          setFel(null);
          setOpen(true);
        }}
        disabled={antal < 1}
      >
        <Icon name="glas" size={kompakt ? 18 : 20} /> Drack den
      </button>
      <p className="sr-only" role="status">{kvitto}</p>
      <BetygDialog
        open={open}
        titel="Betygsätt flaskan"
        undertitel={namn}
        upptagen={pending}
        fel={fel}
        onSpara={(s) => kor(s)}
        onHoppaOver={() => kor(null)}
        onStang={() => setOpen(false)}
      />
    </>
  );
}
