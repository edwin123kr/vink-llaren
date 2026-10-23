"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { skapaProvning } from "@/app/actions/provning";
import { kalkyl } from "@/lib/provning";
import { kr } from "@/lib/format";
import { Icon } from "./Icon";

const TEMAN = ["Italien", "Druvan Pinot Noir", "Blindprovning", "Gamla världen mot nya", "Bubbel", "Sommarviner"];

function Steg({ id, label, value, setValue, min, max, steg = 1, suffix }: { id: string; label: string; value: number; setValue: (n: number) => void; min: number; max: number; steg?: number; suffix?: string }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">{label}</label>
      <div className="flex items-center gap-2">
        <button type="button" className="btn !min-h-12 !w-12 !px-0 text-xl" aria-label={`Minska ${label.toLowerCase()}`} onClick={() => setValue(Math.max(min, value - steg))}>−</button>
        <div className="relative flex-1">
          <input id={id} className="input text-center" inputMode="numeric" value={value} onChange={(e) => setValue(Math.max(min, Math.min(max, Number(e.target.value.replace(/\D/g, "")) || min)))} />
          {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">{suffix}</span>}
        </div>
        <button type="button" className="btn !min-h-12 !w-12 !px-0 text-xl" aria-label={`Öka ${label.toLowerCase()}`} onClick={() => setValue(Math.min(max, value + steg))}>+</button>
      </div>
    </div>
  );
}

export function ProvningForm() {
  const [deltagare, setDeltagare] = useState(8);
  const [antalViner, setAntalViner] = useState(4);
  const [budget, setBudget] = useState(250);
  const [tema, setTema] = useState("");
  const [titel, setTitel] = useState("");
  const [datum, setDatum] = useState("");
  const [fel, setFel] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const router = useRouter();
  const k = useMemo(() => kalkyl({ deltagare, antalViner, budgetPerPerson: budget }), [deltagare, antalViner, budget]);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          setFel({});
          const r = await skapaProvning({ deltagare, antalViner, budgetPerPerson: budget, tema, titel, datum });
          if (!r.ok) return setFel(r.fel);
          router.push(`/provning/${r.id}`);
        });
      }}
    >
      <fieldset className="card grid gap-4 p-5 sm:grid-cols-3">
        <legend className="display px-1 text-2xl">Upplägg</legend>
        <Steg id="p-deltagare" label="Deltagare" value={deltagare} setValue={setDeltagare} min={1} max={100} />
        <Steg id="p-viner" label="Antal viner" value={antalViner} setValue={setAntalViner} min={1} max={12} />
        <Steg id="p-budget" label="Budget per person" value={budget} setValue={setBudget} min={0} max={100000} steg={50} suffix="kr" />
        <div className="sm:col-span-3">
          <label htmlFor="p-tema" className="mb-1.5 block text-sm font-medium">Tema (valfritt)</label>
          <input id="p-tema" className="input" value={tema} onChange={(e) => setTema(e.target.value)} placeholder="T.ex. Italien, druvan Pinot Noir, blindprovning" list="teman" />
          <datalist id="teman">{TEMAN.map((t) => <option key={t} value={t} />)}</datalist>
          <div className="mt-2 flex flex-wrap gap-2">
            {TEMAN.map((t) => (
              <button key={t} type="button" className={`chip !min-h-9 ${tema === t ? "!border-gold !text-gold" : ""}`} aria-pressed={tema === t} onClick={() => setTema(tema === t ? "" : t)}>{t}</button>
            ))}
          </div>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="p-titel" className="mb-1.5 block text-sm font-medium">Namn (valfritt)</label>
          <input id="p-titel" className="input" value={titel} onChange={(e) => setTitel(e.target.value)} placeholder="T.ex. Fredagsprovning hos Anna" />
        </div>
        <div>
          <label htmlFor="p-datum" className="mb-1.5 block text-sm font-medium">Datum (valfritt)</label>
          <input id="p-datum" type="date" className="input" value={datum} onChange={(e) => setDatum(e.target.value)} />
        </div>
      </fieldset>

      <section className="card p-5" aria-labelledby="kalkyl" aria-live="polite">
        <h2 id="kalkyl" className="display text-2xl">Beräkning</h2>
        <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Flaskor totalt", String(k.flaskorTotalt)],
            ["Per glas och vin", `${k.mlPerGlas} ml`],
            ["Totalbudget", kr(k.totalbudget)],
            ["Snitt per flaska", kr(k.budgetPerFlaska)],
          ].map(([a, b]) => (
            <div key={a} className="rounded-xl bg-surface-2/60 p-3">
              <dt className="text-xs text-muted">{a}</dt>
              <dd className="num mt-0.5 text-xl font-semibold">{b}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-sm text-muted">
          Ca 0,5 flaska (375 ml) per person: ceil({deltagare} × 0,5) = {k.flaskorBerakning} {k.flaskorBerakning === 1 ? "flaska" : "flaskor"}
          {k.flaskorTotalt > k.flaskorBerakning ? `, uppjusterat till ${k.flaskorTotalt} så att varje vin får minst en flaska` : ""}. Fördelning: {k.flaskorPerVin.join(" + ")}.
        </p>
      </section>

      {Object.keys(fel).length > 0 && <p role="alert" className="text-danger">{Object.values(fel)[0]}</p>}
      <button type="submit" className="btn btn-gold" disabled={pending}>
        <Icon name="glas" size={20} /> {pending ? "Claude planerar provningen …" : "Föreslå viner"}
      </button>
    </form>
  );
}
