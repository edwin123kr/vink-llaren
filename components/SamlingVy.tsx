"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { KATEGORIER, kategori as kat } from "@/lib/kategorier";
import { betygText, drickfonster, kr } from "@/lib/format";
import { normalisera } from "@/lib/sok";
import { FlaskBild } from "./FlaskBild";
import { Icon } from "./Icon";

export interface SamlingRad {
  id: string;
  antal: number;
  inkopspris: number | null;
  plats: string | null;
  drickFran: number | null;
  drickTill: number | null;
  skapad: string;
  snitt: number | null;
  dryck: { namn: string; producent: string | null; kategori: string; typ: string; land: string | null; region: string | null; argang: number | null; druvor: string[]; bildUrl: string | null; kalla: string; prisCa: number | null };
}

const FONSTER = [
  { id: "redo", namn: "Redo att drickas" },
  { id: "drick-snart", namn: "Drick snart" },
  { id: "vanta", namn: "Vänta" },
  { id: "passerat", namn: "Passerat" },
  { id: "okand", namn: "Inget drickfönster" },
] as const;

const FONSTER_STIL: Record<string, string> = { redo: "text-ok", "drick-snart": "text-gold", vanta: "text-muted", passerat: "text-danger", okand: "text-muted" };

const SORT = [
  { id: "senast", namn: "Senast tillagd" },
  { id: "namn", namn: "Namn A–Ö" },
  { id: "betyg", namn: "Högst betyg" },
  { id: "pris-ner", namn: "Dyrast först" },
  { id: "pris-upp", namn: "Billigast först" },
  { id: "drickfonster", namn: "Drick snart först" },
];

const flaskText = (n: number) => `${n} ${n === 1 ? "flaska" : "flaskor"}`;

function pris(r: SamlingRad) {
  return r.inkopspris ?? r.dryck.prisCa;
}

export function SamlingVy({ rader }: { rader: SamlingRad[] }) {
  const sp = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const [visaFilter, setVisaFilter] = useState(false);

  const [q, setQ] = useState(sp.get("q") ?? "");
  const timer = useRef<number | undefined>(undefined);
  const typ = sp.get("typ") ?? "";
  const kategori = sp.get("kategori") ?? "";
  const druva = sp.get("druva") ?? "";
  const land = sp.get("land") ?? "";
  const prisMax = Number(sp.get("prisMax")) || 0;
  const fonster = sp.get("fonster") ?? "";
  const sort = sp.get("sort") ?? "senast";
  const vy = sp.get("vy") === "rutnat" ? "rutnat" : "lista";

  const satt = (k: string, v: string) => {
    const n = new URLSearchParams(sp.toString());
    if (v) n.set(k, v);
    else n.delete(k);
    if (k === "typ") n.delete("kategori");
    router.replace(`${path}${n.size ? `?${n}` : ""}`, { scroll: false });
  };

  // sökningen filtrerar direkt i webbläsaren; adressen uppdateras först när man slutat skriva
  useEffect(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      if ((sp.get("q") ?? "") === q) return;
      const n = new URLSearchParams(sp.toString());
      if (q) n.set("q", q);
      else n.delete("q");
      window.history.replaceState(null, "", `${path}${n.size ? `?${n}` : ""}`);
    }, 400);
    return () => window.clearTimeout(timer.current);
  }, [q, sp, path]);

  const val = useMemo(() => {
    const druvor = new Set<string>();
    const lander = new Set<string>();
    let maxPris = 0;
    for (const r of rader) {
      r.dryck.druvor.forEach((d) => druvor.add(d));
      if (r.dryck.land) lander.add(r.dryck.land);
      maxPris = Math.max(maxPris, pris(r) ?? 0);
    }
    const sv = (a: string, b: string) => a.localeCompare(b, "sv");
    return { druvor: [...druvor].sort(sv), lander: [...lander].sort(sv), maxPris: Math.ceil(maxPris / 100) * 100 };
  }, [rader]);

  const lista = useMemo(() => {
    const ord = normalisera(q).split(" ").filter(Boolean);
    let r = rader.filter((x) => {
      const d = x.dryck;
      if (typ && d.typ !== typ) return false;
      if (kategori && d.kategori !== kategori) return false;
      if (druva && !d.druvor.includes(druva)) return false;
      if (land && d.land !== land) return false;
      if (prisMax && (pris(x) ?? 0) > prisMax) return false;
      if (fonster && drickfonster(x.drickFran, x.drickTill).status !== fonster) return false;
      if (ord.length) {
        const hay = normalisera([d.namn, d.producent, d.region, d.land, d.druvor.join(" "), x.plats, d.argang].join(" "));
        if (!ord.every((w) => hay.includes(w))) return false;
      }
      return true;
    });
    const ordning: Record<string, number> = { passerat: 0, "drick-snart": 1, redo: 2, vanta: 3, okand: 4 };
    r = [...r].sort((a, b) => {
      switch (sort) {
        case "namn": return a.dryck.namn.localeCompare(b.dryck.namn, "sv");
        case "betyg": return (b.snitt ?? -1) - (a.snitt ?? -1);
        case "pris-ner": return (pris(b) ?? -1) - (pris(a) ?? -1);
        case "pris-upp": return (pris(a) ?? Infinity) - (pris(b) ?? Infinity);
        case "drickfonster": return ordning[drickfonster(a.drickFran, a.drickTill).status] - ordning[drickfonster(b.drickFran, b.drickTill).status];
        default: return b.skapad.localeCompare(a.skapad);
      }
    });
    return r;
  }, [rader, q, typ, kategori, druva, land, prisMax, fonster, sort]);

  const aktiva = [typ, kategori, druva, land, prisMax ? "x" : "", fonster].filter(Boolean).length;
  const kategorier = KATEGORIER.filter((k) => (!typ || k.typ === typ) && rader.some((r) => r.dryck.kategori === k.id));
  const flaskor = lista.reduce((a, r) => a + r.antal, 0);

  return (
    <section aria-label="Flaskor">
      <div className="flex flex-col gap-3">
        <label className="relative block">
          <span className="sr-only">Sök i samlingen</span>
          <Icon name="sok" size={20} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            className="input !pl-11"
            placeholder="Sök namn, producent, druva, plats …"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            enterKeyHint="search"
          />
        </label>

        <div className="flex items-center gap-2 overflow-x-auto pb-1" role="group" aria-label="Typ">
          {[["", "Alla"], ["vin", "Vin"], ["sprit", "Sprit"]].map(([id, namn]) => (
            <button key={id} type="button" className={`chip shrink-0 !min-h-10 !px-4 ${typ === id ? "!border-gold !text-gold" : ""}`} aria-pressed={typ === id} onClick={() => satt("typ", id)}>
              {namn}
            </button>
          ))}
          <span className="mx-1 h-6 w-px shrink-0 bg-line" aria-hidden="true" />
          <button type="button" className={`chip shrink-0 !min-h-10 !px-4 ${aktiva ? "!border-gold !text-gold" : ""}`} aria-expanded={visaFilter} aria-controls="filterpanel" onClick={() => setVisaFilter((v) => !v)}>
            Filter{aktiva ? ` (${aktiva})` : ""}
          </button>
          <button
            type="button"
            className="chip shrink-0 !min-h-10 !px-4"
            onClick={() => satt("vy", vy === "lista" ? "rutnat" : "")}
            aria-label={vy === "lista" ? "Visa som rutnät" : "Visa som lista"}
          >
            <Icon name={vy === "lista" ? "samling" : "mer"} size={16} /> {vy === "lista" ? "Rutnät" : "Lista"}
          </button>
        </div>

        {visaFilter && (
          <div id="filterpanel" className="card grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
            <Valj label="Kategori" value={kategori} onChange={(v) => satt("kategori", v)} alla="Alla kategorier" options={kategorier.map((k) => [k.id, k.namn])} />
            <Valj label="Druva eller råvara" value={druva} onChange={(v) => satt("druva", v)} alla="Alla" options={val.druvor.map((d) => [d, d])} />
            <Valj label="Land" value={land} onChange={(v) => satt("land", v)} alla="Alla länder" options={val.lander.map((l) => [l, l])} />
            <Valj label="Drickfönster" value={fonster} onChange={(v) => satt("fonster", v)} alla="Alla" options={FONSTER.map((f) => [f.id, f.namn])} />
            <label className="block">
              <span className="mb-1.5 block text-sm text-muted">Maxpris: {prisMax ? kr(prisMax) : "inget"}</span>
              <input
                type="range"
                min={0}
                max={val.maxPris || 1000}
                step={50}
                value={prisMax || val.maxPris || 1000}
                onChange={(e) => satt("prisMax", Number(e.target.value) >= val.maxPris ? "" : e.target.value)}
                className="w-full accent-[var(--color-gold)]"
                aria-valuetext={prisMax ? kr(prisMax) : "Inget maxpris"}
              />
            </label>
            <Valj label="Sortera" value={sort === "senast" ? "" : sort} onChange={(v) => satt("sort", v)} alla={SORT[0].namn} options={SORT.slice(1).map((s) => [s.id, s.namn])} />
            {aktiva > 0 && (
              <button type="button" className="btn sm:col-span-2 lg:col-span-3" onClick={() => {
                  setQ("");
                  router.replace(path, { scroll: false });
                }}>
                Rensa alla filter
              </button>
            )}
          </div>
        )}
      </div>

      <p className="mt-4 text-sm text-muted" role="status" aria-live="polite">
        {lista.length === rader.length ? flaskText(flaskor) : `${lista.length} av ${rader.length} poster · ${flaskText(flaskor)}`}
      </p>

      {lista.length === 0 ? (
        <div className="card mt-3 p-6">
          <p className="display text-2xl">Inga flaskor matchar.</p>
          <p className="mt-1 text-muted">Ändra sökningen eller rensa filtren.</p>
        </div>
      ) : vy === "rutnat" ? (
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {lista.map((r) => (
            <li key={r.id} className="min-w-0">
              <Link href={`/flaska/${r.id}`} className="card group flex h-full flex-col overflow-hidden transition-colors hover:border-muted">
                <div className="relative flex h-40 items-center justify-center bg-surface-2/60 p-3">
                  <FlaskBild kategori={r.dryck.kategori} bildUrl={r.dryck.bildUrl} />
                  <span className="chip num absolute right-2 top-2 !min-h-6">×{r.antal}</span>
                </div>
                <div className="flex flex-1 flex-col p-3">
                  <p className="eyebrow !text-[0.625rem]">{kat(r.dryck.kategori)?.namn}{r.dryck.argang ? ` · ${r.dryck.argang}` : ""}</p>
                  <h3 className="display mt-0.5 line-clamp-2 text-lg leading-tight">{r.dryck.namn}</h3>
                  <p className="mt-auto pt-2 text-sm">
                    {r.snitt != null ? <span className="num text-gold">★ {betygText(r.snitt)}</span> : <span className="text-muted">Ej betygsatt</span>}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          {lista.map((r) => {
            const f = drickfonster(r.drickFran, r.drickTill);
            return (
              <li key={r.id} className="min-w-0">
                <Link href={`/flaska/${r.id}`} className="card flex gap-4 p-3 pr-4 transition-colors hover:border-muted">
                  <div className="flex h-24 w-14 shrink-0 items-center justify-center rounded-xl bg-surface-2/60 p-1.5">
                    <FlaskBild kategori={r.dryck.kategori} bildUrl={r.dryck.bildUrl} />
                  </div>
                  <div className="min-w-0 flex-1 py-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="eyebrow !text-[0.6875rem]">{kat(r.dryck.kategori)?.namn}{r.dryck.argang ? ` · ${r.dryck.argang}` : ""}</p>
                      <span className="chip num shrink-0 !min-h-6" aria-label={`${r.antal} ${r.antal === 1 ? "flaska" : "flaskor"}`}>×{r.antal}</span>
                    </div>
                    <h3 className="display line-clamp-2 text-[1.35rem] leading-tight">{r.dryck.namn}</h3>
                    <p className="truncate text-sm text-muted">{[r.dryck.producent, r.dryck.region, r.dryck.land].filter(Boolean).join(" · ")}</p>
                    <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-sm">
                      {r.snitt != null && <span className="num text-gold">★ {betygText(r.snitt)}</span>}
                      {f.status !== "okand" && <span className={FONSTER_STIL[f.status]}>{FONSTER.find((x) => x.id === f.status)?.namn} <span className="text-muted">{f.text}</span></span>}
                      {pris(r) != null && <span className="num text-muted">{kr(pris(r))}</span>}
                      {r.dryck.kalla === "demo" && <span className="text-muted">· Exempeldata</span>}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function Valj({ label, value, onChange, options, alla }: { label: string; value: string; onChange: (v: string) => void; options: string[][]; alla: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-muted">{label}</span>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{alla}</option>
        {options.map(([v, n]) => (
          <option key={v} value={v}>{n}</option>
        ))}
      </select>
    </label>
  );
}
