"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { kategori } from "@/lib/kategorier";
import { betygText, kr } from "@/lib/format";
import { FlaskBild } from "./FlaskBild";
import { Icon } from "./Icon";

interface Traff { id: string; namn: string; producent: string | null; kategori: string; land: string | null; region: string | null; argang: number | null; prisCa: number | null; bildUrl: string | null; kalla: string; betyg: { snitt: number; antal: number } | null }

export function KatalogSok({ initial = "" }: { initial?: string }) {
  const [q, setQ] = useState(initial);
  const [traffar, setTraffar] = useState<Traff[]>([]);
  const [laddar, setLaddar] = useState(false);
  const [sokt, setSokt] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => input.current?.focus(), []);

  useEffect(() => {
    if (q.trim().length < 2) return;
    const ctrl = new AbortController();
    const t = window.setTimeout(async () => {
      setLaddar(true);
      try {
        const r = await fetch(`/api/katalog?q=${encodeURIComponent(q)}&limit=30`, { signal: ctrl.signal });
        setTraffar((await r.json()).traffar);
        setSokt(true);
      } catch {
        /* avbruten */
      } finally {
        setLaddar(false);
      }
    }, 250);
    return () => {
      window.clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  const visade = q.trim().length < 2 ? [] : traffar;

  return (
    <div>
      <label className="relative block">
        <span className="sr-only">Sök i katalogen</span>
        <Icon name="sok" size={20} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input ref={input} type="search" className="input !pl-11" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Namn, producent, druva, region …" enterKeyHint="search" />
      </label>
      <p className="mt-3 text-sm text-muted" role="status" aria-live="polite">
        {q.trim().length < 2 ? "Skriv minst två tecken." : laddar ? "Söker …" : sokt ? `${visade.length} träffar` : ""}
      </p>
      <ul className="mt-2 grid gap-2">
        {visade.map((t) => (
          <li key={t.id}>
            <Link href={`/lagg-till/katalog/${t.id}`} className="card flex items-center gap-3 p-3 transition-colors hover:border-muted">
              <span className="flex h-16 w-10 shrink-0 items-center justify-center"><FlaskBild kategori={t.kategori} bildUrl={t.bildUrl} /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{t.namn}{t.argang ? ` ${t.argang}` : ""}</span>
                <span className="block truncate text-sm text-muted">{[kategori(t.kategori)?.namn, t.producent, t.region, t.land].filter(Boolean).join(" · ")}</span>
              </span>
              <span className="flex shrink-0 flex-col items-end">
                {t.betyg && <span className="num text-sm font-semibold text-gold" aria-label={`Snittbetyg ${betygText(t.betyg.snitt)} av ${t.betyg.antal}`}>★ {betygText(t.betyg.snitt)} <span className="font-normal text-muted">({t.betyg.antal})</span></span>}
                {t.prisCa != null && <span className="num text-sm text-muted">{kr(t.prisCa)}</span>}
              </span>
              <Icon name="pil" className="shrink-0 text-muted" />
            </Link>
          </li>
        ))}
      </ul>
      {sokt && q.trim().length >= 2 && !laddar && (
        <div className="card mt-4 flex flex-col items-start gap-3 p-5">
          <p className="font-semibold">{visade.length ? "Hittar du inte rätt flaska?" : "Ingen träff i katalogen."}</p>
          <p className="text-sm text-muted">Lägg till den själv, så fyller vår sommelier i druva, smakprofil och mat.</p>
          <Link href={`/lagg-till/ny?namn=${encodeURIComponent(q)}`} className="btn btn-gold"><Icon name="plus" size={18} /> Lägg till &quot;{q.trim()}&quot;</Link>
        </div>
      )}
    </div>
  );
}
