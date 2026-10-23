"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { KATEGORIER, SMAK, typFor } from "@/lib/kategorier";
import { parseDecimal } from "@/lib/format";
import type { FaltFel } from "@/lib/validering";
import type { Resultat } from "@/app/actions/samling";

import {
  dryckPayload,
  flaskaPayload,
  tomDryck,
  tomFlaska,
  type DryckState,
  type FlaskaState,
} from "@/lib/formstate";

export type { DryckState, FlaskaState };

const int = (s: string) => {
  const v = parseDecimal(s);
  return v == null ? null : Math.round(v);
};

/* ---------------- fältkomponenter ---------------- */
function Falt({ id, label, fel, hjalp, children, className = "" }: { id: string; label: string; fel?: string; hjalp?: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
      {hjalp && !fel && <p id={`${id}-hjalp`} className="mt-1 text-xs text-muted">{hjalp}</p>}
      {fel && <p id={`${id}-fel`} className="mt-1 text-sm text-danger">{fel}</p>}
    </div>
  );
}

function aria(id: string, fel?: string, hjalp?: boolean) {
  return { id, "aria-invalid": fel ? true : undefined, "aria-describedby": fel ? `${id}-fel` : hjalp ? `${id}-hjalp` : undefined };
}

/* ---------------- formuläret ---------------- */
export function DryckForm({
  lage,
  dryckInit = tomDryck,
  flaskaInit,
  spara,
  sammanfattning,
  verktyg,
  sparaText = "Spara flaskan",
  aiFran = false,
}: {
  /** ny: dryck + flaska · katalog: bara flaska · redigera: båda, ifyllda */
  lage: "ny" | "katalog" | "redigera";
  dryckInit?: DryckState;
  flaskaInit?: FlaskaState;
  /** tredje argumentet är sant om AI har fyllt i något */
  spara: (dryck: ReturnType<typeof dryckPayload> | null, flaska: ReturnType<typeof flaskaPayload>, ai: boolean) => Promise<Resultat>;
  /** formuläret startar med AI-uppgifter (t.ex. från ett etikettfoto) */
  aiFran?: boolean;
  sammanfattning?: ReactNode;
  /** t.ex. AI-ifyllning; får ett sätt att uppdatera drycken */
  verktyg?: (d: DryckState, satt: (patch: Partial<DryckState>) => void) => ReactNode;
  sparaText?: string;
}) {
  const [d, setD] = useState<DryckState>(dryckInit);
  const [f, setF] = useState<FlaskaState>(flaskaInit ?? tomFlaska());
  const [fel, setFel] = useState<FaltFel>({});
  const [ai, setAi] = useState(aiFran);
  const [pending, start] = useTransition();
  const router = useRouter();
  const felRuta = useRef<HTMLDivElement>(null);
  const visaDryck = lage !== "katalog";
  const sprit = typFor(d.kategori) === "sprit";

  const sd = (patch: Partial<DryckState>) => setD((p) => ({ ...p, ...patch }));
  const sf = (patch: Partial<FlaskaState>) => setF((p) => ({ ...p, ...patch }));

  const skicka = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const res = await spara(visaDryck ? dryckPayload(d) : null, flaskaPayload(f), ai);
      if (res.ok) {
        router.push(`/flaska/${res.id}`);
        router.refresh();
        return;
      }
      setFel(res.fel);
    });
  };

  // flytta fokus till felsummeringen när den har ritats ut (för skärmläsare och tangentbord)
  useEffect(() => {
    if (Object.keys(fel).length) felRuta.current?.focus();
  }, [fel]);

  const felLista = Object.entries(fel);
  const inp = (k: keyof DryckState, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <input {...aria(`d-${k}`, fel[k], Boolean(props["aria-describedby"]))} className="input" value={String(d[k])} onChange={(e) => sd({ [k]: e.target.value } as Partial<DryckState>)} {...props} />
  );
  const finp = (k: keyof FlaskaState, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <input {...aria(`f-${k}`, fel[`flaska.${k}`])} className="input" value={f[k]} onChange={(e) => sf({ [k]: e.target.value } as Partial<FlaskaState>)} {...props} />
  );

  return (
    <form onSubmit={skicka} noValidate className="flex flex-col gap-6">
      {felLista.length > 0 && (
        <div ref={felRuta} tabIndex={-1} role="alert" className="rounded-2xl border border-danger/60 bg-danger/10 p-4 outline-none">
          <p className="font-semibold">Kontrollera {felLista.length === 1 ? "ett fält" : `${felLista.length} fält`}:</p>
          <ul className="mt-1 list-disc pl-5 text-sm">
            {felLista.map(([k, v]) => (
              <li key={k}>
                {k === "_" ? v : <a className="underline" href={`#${k.startsWith("flaska.") ? `f-${k.slice(7)}` : `d-${k}`}`}>{v}</a>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {sammanfattning}

      {visaDryck && (
        <>
          {verktyg?.(d, (p) => {
            setAi(true);
            sd(p);
          })}
          <fieldset className="card grid gap-4 p-5 sm:grid-cols-2">
            <legend className="display px-1 text-2xl">Drycken</legend>
            <Falt id="d-namn" label="Namn *" fel={fel.namn} className="sm:col-span-2">{inp("namn", { required: true, autoComplete: "off" })}</Falt>
            <Falt id="d-producent" label="Producent" fel={fel.producent}>{inp("producent")}</Falt>
            <Falt id="d-kategori" label="Kategori *" fel={fel.kategori}>
              <select {...aria("d-kategori", fel.kategori)} className="input" value={d.kategori} onChange={(e) => sd({ kategori: e.target.value })}>
                <optgroup label="Vin">{KATEGORIER.filter((k) => k.typ === "vin").map((k) => <option key={k.id} value={k.id}>{k.namn}</option>)}</optgroup>
                <optgroup label="Sprit">{KATEGORIER.filter((k) => k.typ === "sprit").map((k) => <option key={k.id} value={k.id}>{k.namn}</option>)}</optgroup>
              </select>
            </Falt>
            <Falt id="d-druvor" label={sprit ? "Råvara" : "Druva eller druvor"} fel={fel.druvor} hjalp="Separera med kommatecken" className="sm:col-span-2">
              {inp("druvor", { placeholder: sprit ? "T.ex. mältat korn" : "T.ex. Cabernet Sauvignon, Merlot", "aria-describedby": "d-druvor-hjalp" })}
            </Falt>
            <Falt id="d-land" label="Land" fel={fel.land}>{inp("land")}</Falt>
            <Falt id="d-region" label="Region" fel={fel.region}>{inp("region")}</Falt>
            <Falt id="d-argang" label="Årgång" fel={fel.argang}>{inp("argang", { inputMode: "numeric", placeholder: "T.ex. 2019" })}</Falt>
            <Falt id="d-alkoholhalt" label="Alkoholhalt (%)" fel={fel.alkoholhalt}>{inp("alkoholhalt", { inputMode: "decimal", placeholder: "T.ex. 13,5" })}</Falt>
            <Falt id="d-volymMl" label="Volym" fel={fel.volymMl}>
              <select {...aria("d-volymMl", fel.volymMl)} className="input" value={d.volymMl} onChange={(e) => sd({ volymMl: e.target.value })}>
                <option value="">Okänd</option>
                {[["187", "18,7 cl"], ["375", "37,5 cl"], ["500", "50 cl"], ["700", "70 cl"], ["750", "75 cl"], ["1000", "1 l"], ["1500", "1,5 l (magnum)"], ["3000", "3 l"]].map(([v, t]) => <option key={v} value={v}>{t}</option>)}
                {d.volymMl && !["187", "375", "500", "700", "750", "1000", "1500", "3000"].includes(d.volymMl) && <option value={d.volymMl}>{d.volymMl} ml</option>}
              </select>
            </Falt>
            <Falt id="d-prisCa" label="Ungefärligt pris (kr)" fel={fel.prisCa} hjalp={d.prisUppskattat ? "Uppskattat av AI. Ändra om du vet bättre." : undefined}>
              {inp("prisCa", { inputMode: "numeric", onChange: (e) => sd({ prisCa: e.target.value, prisUppskattat: false }) })}
            </Falt>
          </fieldset>

          <fieldset className="card grid gap-5 p-5">
            <legend className="display px-1 text-2xl">Smak</legend>
            <p className="-mt-2 text-sm text-muted">Skala 0–12, som Systembolagets smakklockor. Lämna tomt om du inte vet.</p>
            {SMAK.filter((s) => s.key !== "rokighet" || sprit || d.rokighet !== "").map((s) => {
              const v = d[s.key];
              return (
                <div key={s.key} className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-3">
                  <label htmlFor={`d-${s.key}`} className="text-sm">{s.namn}</label>
                  <input
                    id={`d-${s.key}`}
                    type="range"
                    min={0}
                    max={12}
                    step={1}
                    value={v === "" ? 0 : Number(v)}
                    onChange={(e) => sd({ [s.key]: e.target.value } as Partial<DryckState>)}
                    className={`w-full accent-[var(--color-gold)] ${v === "" ? "opacity-40" : ""}`}
                    aria-valuetext={v === "" ? "Okänd" : `${v} av 12`}
                  />
                  <span className="flex items-center gap-1">
                    <span className="num w-10 text-right text-sm">{v === "" ? "–" : `${v}/12`}</span>
                    {v !== "" && (
                      <button type="button" className="grid h-9 w-9 place-items-center rounded-full text-muted hover:text-text" aria-label={`Rensa ${s.namn.toLowerCase()}`} onClick={() => sd({ [s.key]: "" } as Partial<DryckState>)}>×</button>
                    )}
                  </span>
                </div>
              );
            })}
            <Falt id="d-aromer" label="Dofter och aromer" hjalp="Separera med kommatecken">{inp("aromer", { placeholder: "T.ex. körsbär, vanilj, tobak", "aria-describedby": "d-aromer-hjalp" })}</Falt>
            <Falt id="d-mat" label="Passar till" hjalp="Separera med kommatecken">{inp("mat", { placeholder: "T.ex. lamm, svamp", "aria-describedby": "d-mat-hjalp" })}</Falt>
            <Falt id="d-beskrivning" label="Beskrivning" fel={fel.beskrivning}>
              <textarea {...aria("d-beskrivning", fel.beskrivning)} className="input min-h-24" value={d.beskrivning} onChange={(e) => sd({ beskrivning: e.target.value })} />
            </Falt>
          </fieldset>

          <details className="card p-5">
            <summary className="display cursor-pointer text-2xl">Streckkod och artikelnummer</summary>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Falt id="d-ean" label="Streckkod (EAN)" fel={fel.ean}>{inp("ean", { inputMode: "numeric" })}</Falt>
              <Falt id="d-sbArtikelnr" label="Systembolagets artikelnummer" fel={fel.sbArtikelnr}>{inp("sbArtikelnr", { inputMode: "numeric" })}</Falt>
            </div>
          </details>
        </>
      )}

      <fieldset className="card grid gap-4 p-5 sm:grid-cols-2">
        <legend className="display px-1 text-2xl">Min flaska</legend>
        <Falt id="f-antal" label="Antal *" fel={fel["flaska.antal"]}>
          <div className="flex items-center gap-2">
            <button type="button" className="btn !min-h-12 !w-12 !px-0 text-xl" aria-label="En färre" onClick={() => sf({ antal: String(Math.max(1, (int(f.antal) ?? 1) - 1)) })}>−</button>
            {finp("antal", { inputMode: "numeric", className: "input text-center" })}
            <button type="button" className="btn !min-h-12 !w-12 !px-0 text-xl" aria-label="En till" onClick={() => sf({ antal: String((int(f.antal) ?? 0) + 1) })}>+</button>
          </div>
        </Falt>
        <Falt id="f-inkopspris" label="Inköpspris per flaska (kr)" fel={fel["flaska.inkopspris"]}>{finp("inkopspris", { inputMode: "numeric" })}</Falt>
        <Falt id="f-inkopsdatum" label="Inköpsdatum" fel={fel["flaska.inkopsdatum"]}>{finp("inkopsdatum", { type: "date" })}</Falt>
        <Falt id="f-inkopsstalle" label="Inköpsställe" fel={fel["flaska.inkopsstalle"]}>{finp("inkopsstalle", { placeholder: "T.ex. Systembolaget" })}</Falt>
        <Falt id="f-plats" label="Förvaringsplats" fel={fel["flaska.plats"]} className="sm:col-span-2">{finp("plats", { placeholder: "T.ex. Källaren, hylla 2" })}</Falt>
        <Falt id="f-drickFran" label="Drick från (år)" fel={fel["flaska.drickFran"]}>{finp("drickFran", { inputMode: "numeric", placeholder: String(new Date().getFullYear()) })}</Falt>
        <Falt id="f-drickTill" label="Drick till (år)" fel={fel["flaska.drickTill"]}>{finp("drickTill", { inputMode: "numeric" })}</Falt>
        <Falt id="f-anteckningar" label="Egna anteckningar" className="sm:col-span-2">
          <textarea id="f-anteckningar" className="input min-h-20" value={f.anteckningar} onChange={(e) => sf({ anteckningar: e.target.value })} />
        </Falt>
      </fieldset>

      <div className="sticky bottom-[calc(var(--nav-h)+var(--safe-b)+12px)] z-10 md:bottom-4">
        <button type="submit" className="btn btn-gold w-full shadow-[0_8px_30px_rgba(0,0,0,0.5)]" disabled={pending}>
          {pending ? "Sparar …" : sparaText}
        </button>
      </div>
    </form>
  );
}
