"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";

export function BackupVy() {
  const [lage, setLage] = useState<"slaihop" | "ersatt">("slaihop");
  const [fil, setFil] = useState<File | null>(null);
  const [status, setStatus] = useState<"" | "laddar" | "klar" | "fel">("");
  const [meddelande, setMeddelande] = useState<string[]>([]);
  const router = useRouter();

  const lasIn = async () => {
    if (!fil) return;
    if (lage === "ersatt" && !window.confirm("Ersätt betyder att dina flaskor, betyg, önskningar och provningar raderas innan säkerhetskopian läses in. Fortsätta?")) return;
    setStatus("laddar");
    const fd = new FormData();
    fd.append("fil", fil);
    fd.append("lage", lage);
    try {
      const r = await fetch("/api/import", { method: "POST", body: fd });
      const j = await r.json();
      if (!j.ok) throw new Error(j.fel ?? "Importen misslyckades.");
      const delar = Object.entries(j.antal as Record<string, number>).filter(([, n]) => n > 0).map(([k, n]) => `${n} ${k}`);
      setMeddelande([`Inläst: ${delar.join(", ") || "inget nytt"}.`, ...(j.antalFel ? [`${j.antalFel} rader hoppades över:`, ...(j.fel as string[])] : [])]);
      setStatus("klar");
      router.refresh();
    } catch (e) {
      setStatus("fel");
      setMeddelande([e instanceof Error ? e.message : "Något gick fel."]);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="card flex flex-col gap-3 p-5" aria-labelledby="exp">
        <h2 id="exp" className="display text-2xl">Exportera</h2>
        <p className="text-sm text-muted">Spara en säkerhetskopia regelbundet. JSON innehåller allt (även dina foton) och kan läsas in igen. CSV öppnas i Excel eller Numbers.</p>
        <a href="/api/export?format=json" className="btn btn-gold" download><Icon name="export" size={18} /> Säkerhetskopia (JSON)</a>
        <a href="/api/export?format=csv" className="btn" download>Samlingen (CSV)</a>
        <a href="/api/export?format=csv&typ=historik" className="btn" download>Betygshistorik (CSV)</a>
      </section>

      <section className="card flex flex-col gap-3 p-5" aria-labelledby="imp">
        <h2 id="imp" className="display text-2xl">Importera</h2>
        <p className="text-sm text-muted">Läs in en säkerhetskopia (JSON) eller en samling som CSV med samma kolumner som exporten.</p>
        <label htmlFor="fil" className="text-sm font-medium">Fil</label>
        <input id="fil" type="file" accept=".json,.csv,application/json,text/csv" className="input file:mr-3 file:rounded-full file:border-0 file:bg-surface file:px-3 file:py-1.5 file:text-text" onChange={(e) => setFil(e.target.files?.[0] ?? null)} />
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">Vid JSON-import</legend>
          <label className="flex min-h-11 items-center gap-3"><input type="radio" name="lage" checked={lage === "slaihop"} onChange={() => setLage("slaihop")} className="h-5 w-5 accent-[var(--color-gold)]" /> Slå ihop med det som redan finns</label>
          <label className="flex min-h-11 items-center gap-3"><input type="radio" name="lage" checked={lage === "ersatt"} onChange={() => setLage("ersatt")} className="h-5 w-5 accent-[var(--color-gold)]" /> Ersätt mina data (katalogen behålls)</label>
        </fieldset>
        <button type="button" className="btn btn-gold" disabled={!fil || status === "laddar"} onClick={lasIn}>{status === "laddar" ? "Läser in …" : "Läs in"}</button>
        <div role="status" aria-live="polite" className={status === "fel" ? "text-danger" : "text-sm"}>
          {meddelande.map((m, i) => <p key={i} className={i > 1 ? "text-xs text-muted" : ""}>{m}</p>)}
        </div>
      </section>
    </div>
  );
}
