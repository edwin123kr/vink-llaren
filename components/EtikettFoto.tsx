"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { kategori } from "@/lib/kategorier";
import { tillDryckState, type DryckState } from "@/lib/formstate";
import { NyFlaskaForm } from "./Formular";
import { Icon } from "./Icon";

interface Svar {
  lage: "mock" | "live";
  sakerhet: "hog" | "medel" | "lag";
  lastText: string;
  bildUrl: string;
  traffar: { id: string; namn: string; producent: string | null; kategori: string; argang: number | null }[];
  [k: string]: unknown;
}

const SAKERHET = { hog: "Hög säkerhet", medel: "Medelsäker", lag: "Osäker: kontrollera noga" };

/** Förminskar bilden i webbläsaren (max 1568 px) så att uppladdningen går snabbt och kostar färre tokens. */
async function forminska(fil: File): Promise<Blob> {
  const bmp = await createImageBitmap(fil);
  const skala = Math.min(1, 1568 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * skala);
  c.height = Math.round(bmp.height * skala);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("Kunde inte läsa bilden."))), "image/jpeg", 0.85));
}

export function EtikettFoto() {
  const kamera = useRef<HTMLInputElement>(null);
  const galleri = useRef<HTMLInputElement>(null);
  const [forhand, setForhand] = useState<string | null>(null);
  const [status, setStatus] = useState<"" | "laddar" | "klar" | "fel">("");
  const [fel, setFel] = useState("");
  const [svar, setSvar] = useState<Svar | null>(null);
  const [init, setInit] = useState<DryckState | null>(null);

  const valj = async (fil: File | undefined) => {
    if (!fil) return;
    setStatus("laddar");
    setFel("");
    setSvar(null);
    setInit(null);
    try {
      const blob = await forminska(fil);
      setForhand(URL.createObjectURL(blob));
      const fd = new FormData();
      fd.append("bild", blob, "etikett.jpg");
      const res = await fetch("/api/ai/etikett", { method: "POST", body: fd });
      const j = await res.json();
      if (!res.ok) throw new Error(j.fel ?? "Identifieringen misslyckades.");
      setSvar(j);
      setInit({ ...tillDryckState(j), bildUrl: j.bildUrl, prisUppskattat: j.prisCa != null });
      setStatus("klar");
    } catch (e) {
      setStatus("fel");
      setFel(e instanceof Error ? e.message : "Något gick fel.");
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <input ref={kamera} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => valj(e.target.files?.[0])} />
      <input ref={galleri} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => valj(e.target.files?.[0])} />

      {status !== "klar" && (
        <div className="card flex flex-col items-center gap-4 p-6 text-center">
          {forhand ? (
            // eslint-disable-next-line @next/next/no-img-element -- lokal förhandsvisning (blob-URL)
            <img src={forhand} alt="Ditt foto av etiketten" className="max-h-64 rounded-2xl object-contain" />
          ) : (
            <span className="grid h-20 w-20 place-items-center rounded-full bg-surface-2 text-gold"><Icon name="kamera" size={36} /></span>
          )}
          <p className="max-w-sm text-muted">Fota framsidan av etiketten rakt och nära, i bra ljus. Vår sommelier läser namn, producent och årgång och fyller i resten.</p>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <button type="button" className="btn btn-gold" onClick={() => kamera.current?.click()} disabled={status === "laddar"}>
              <Icon name="kamera" size={20} /> {status === "laddar" ? "Läser etiketten …" : "Ta foto"}
            </button>
            <button type="button" className="btn" onClick={() => galleri.current?.click()} disabled={status === "laddar"}>Välj bild</button>
          </div>
          <p role="status" aria-live="polite" className={status === "fel" ? "text-danger" : "text-sm text-muted"}>
            {status === "laddar" ? "Vår sommelier tittar på bilden …" : fel}
          </p>
          {status === "fel" && (
            <div className="flex flex-wrap justify-center gap-2">
              <Link href="/lagg-till/katalog" className="btn !min-h-11">Sök i katalogen</Link>
              <Link href="/lagg-till/ny" className="btn !min-h-11">Fyll i själv</Link>
            </div>
          )}
        </div>
      )}

      {status === "klar" && svar && init && (
        <>
          <section className="card flex flex-col gap-3 p-5" aria-label="Resultat">
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip">{SAKERHET[svar.sakerhet]}</span>
              <button type="button" className="ml-auto text-sm text-gold underline-offset-4 hover:underline" onClick={() => { setStatus(""); setForhand(null); }}>Ta nytt foto</button>
            </div>
            {svar.lastText && <p className="text-sm text-muted">Läst på etiketten: <q>{svar.lastText}</q></p>}
            {svar.traffar.length > 0 && (
              <div>
                <p className="font-semibold">Finns redan i katalogen?</p>
                <ul className="mt-2 grid gap-2">
                  {svar.traffar.map((t) => (
                    <li key={t.id}>
                      <Link href={`/lagg-till/katalog/${t.id}`} className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-line px-3 hover:border-muted">
                        <span className="truncate">{t.namn}{t.argang ? ` ${t.argang}` : ""} <span className="text-sm text-muted">· {[kategori(t.kategori)?.namn, t.producent].filter(Boolean).join(" · ")}</span></span>
                        <Icon name="pil" className="shrink-0 text-muted" />
                      </Link>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-sm text-muted">Annars: granska förslaget nedan och spara.</p>
              </div>
            )}
          </section>
          <NyFlaskaForm init={init} ai />
        </>
      )}
    </div>
  );
}
