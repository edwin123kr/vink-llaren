"use client";

import { useEffect, useRef, useState } from "react";
import { betygText } from "@/lib/format";

export interface BetygSvar {
  betyg: number; // tiondelar
  kommentar: string;
  tillfalle: string;
}

/**
 * "Betygsätt flaskan": 10 stjärnor (tryck på vänster halva för halv stjärna), finjustering till en decimal
 * med reglage eller −/+, valfri kommentar och "Hoppa över". Bygger på <dialog> (fokusfälla och Escape ingår).
 */
export function BetygDialog({
  open,
  titel,
  undertitel,
  onSpara,
  onHoppaOver,
  onStang,
  upptagen,
  fel,
  hoppaOverText = "Hoppa över",
}: {
  open: boolean;
  titel: string;
  undertitel?: string;
  onSpara: (s: BetygSvar) => void;
  onHoppaOver?: () => void;
  onStang: () => void;
  upptagen?: boolean;
  fel?: string | null;
  hoppaOverText?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [betyg, setBetyg] = useState(70);
  const [kommentar, setKommentar] = useState("");
  const [tillfalle, setTillfalle] = useState("");

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const satt = (v: number) => setBetyg(Math.max(0, Math.min(100, Math.round(v))));

  const klickStjarna = (i: number, e: React.MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const halv = e.clientX - r.left < r.width / 2;
    satt((i + (halv ? 0.5 : 1)) * 10);
  };

  return (
    <dialog
      ref={ref}
      onClose={onStang}
      onCancel={(e) => {
        e.preventDefault();
        onStang();
      }}
      aria-labelledby="betyg-titel"
      className="m-0 mt-auto w-full max-w-none rounded-t-[28px] border border-line bg-surface p-0 text-text backdrop:bg-black/70 md:m-auto md:max-w-lg md:rounded-[28px]"
    >
      <form
        method="dialog"
        className="flex flex-col gap-5 p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]"
        onSubmit={(e) => {
          e.preventDefault();
          onSpara({ betyg, kommentar, tillfalle });
        }}
      >
        <div>
          <h2 id="betyg-titel" className="display text-3xl">{titel}</h2>
          {undertitel && <p className="mt-1 text-muted">{undertitel}</p>}
        </div>

        <div className="flex flex-col items-center gap-3">
          <p className="num display text-6xl text-gold" aria-live="polite" aria-atomic="true">
            {betygText(betyg)}
            <span className="sr-only"> av 10</span>
          </p>
          <div className="flex gap-0.5" aria-hidden="true">
            {Array.from({ length: 10 }, (_, i) => {
              const fyll = Math.max(0, Math.min(1, betyg / 10 - i));
              return (
                <button
                  key={i}
                  type="button"
                  tabIndex={-1}
                  onClick={(e) => klickStjarna(i, e)}
                  className="relative grid h-9 w-8 place-items-center text-2xl leading-none"
                >
                  <span className="text-line">★</span>
                  <span className="absolute inset-0 grid place-items-center overflow-hidden text-gold" style={{ clipPath: `inset(0 ${100 - fyll * 100}% 0 0)` }}>
                    ★
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex w-full items-center gap-3">
            <button type="button" className="btn !min-h-11 !w-11 !px-0" onClick={() => satt(betyg - 1)} aria-label="Sänk betyget 0,1">−</button>
            <label className="flex-1">
              <span className="sr-only">Betyg från 0 till 10</span>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={betyg}
                onChange={(e) => satt(Number(e.target.value))}
                aria-valuetext={`${betygText(betyg)} av 10`}
                className="w-full accent-[var(--color-gold)]"
              />
            </label>
            <button type="button" className="btn !min-h-11 !w-11 !px-0" onClick={() => satt(betyg + 1)} aria-label="Höj betyget 0,1">+</button>
          </div>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm text-muted">Kommentar (valfri)</span>
          <textarea className="input min-h-20" value={kommentar} onChange={(e) => setKommentar(e.target.value)} maxLength={1000} placeholder="Vad tyckte du?" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm text-muted">Tillfälle eller mat (valfritt)</span>
          <input className="input" value={tillfalle} onChange={(e) => setTillfalle(e.target.value)} maxLength={200} placeholder="T.ex. fredagsmiddag, lammstek" />
        </label>

        {fel && <p role="alert" className="text-danger">{fel}</p>}

        <div className="flex flex-col gap-2 sm:flex-row-reverse">
          <button type="submit" className="btn btn-gold flex-1" disabled={upptagen}>
            {upptagen ? "Sparar …" : "Spara betyg"}
          </button>
          {onHoppaOver && (
            <button type="button" className="btn flex-1" onClick={onHoppaOver} disabled={upptagen}>
              {hoppaOverText}
            </button>
          )}
          <button type="button" className="btn flex-1 !border-transparent !bg-transparent text-muted" onClick={onStang} disabled={upptagen}>
            Avbryt
          </button>
        </div>
      </form>
    </dialog>
  );
}
