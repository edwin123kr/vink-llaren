"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sparaProvningsbetyg } from "@/app/actions/provning";
import { parseBetyg } from "@/lib/format";

/** För in betygen från provningen (t.ex. gruppens snitt från protokollet) i historiken. */
export function ProvningBetyg({ provningId, viner, redanInfort }: { provningId: string; viner: string[]; redanInfort: number }) {
  const [varden, setVarden] = useState<string[]>(viner.map(() => ""));
  const [kommentarer, setKommentarer] = useState<string[]>(viner.map(() => ""));
  const [fel, setFel] = useState("");
  const [klart, setKlart] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const rader: { index: number; betyg: number; kommentar: string }[] = [];
        for (const [i, v] of varden.entries()) {
          if (!v.trim()) continue;
          const b = parseBetyg(v);
          if (b == null) return setFel(`Vin ${i + 1}: ange ett betyg mellan 0 och 10, t.ex. 7,5.`);
          rader.push({ index: i, betyg: b, kommentar: kommentarer[i] });
        }
        if (!rader.length) return setFel("Fyll i minst ett betyg.");
        start(async () => {
          setFel("");
          const r = await sparaProvningsbetyg(provningId, rader);
          if (!r.ok) return setFel(r.fel);
          setKlart(`${r.antal} betyg har förts in i historiken.`);
          setVarden(viner.map(() => ""));
          setKommentarer(viner.map(() => ""));
          router.refresh();
        });
      }}
    >
      {redanInfort > 0 && <p className="text-sm text-muted">{redanInfort} betyg från den här provningen finns redan i historiken.</p>}
      <ol className="flex flex-col gap-3">
        {viner.map((v, i) => (
          <li key={i} className="grid gap-2 rounded-xl border border-line p-3 sm:grid-cols-[1fr_7rem]">
            <label htmlFor={`pb-${i}`} className="text-sm font-medium sm:col-span-2"><span className="num text-gold">{i + 1}.</span> {v}</label>
            <input id={`pb-kom-${i}`} aria-label={`Kommentar till vin ${i + 1}`} className="input" value={kommentarer[i]} onChange={(e) => setKommentarer((k) => k.map((x, j) => (j === i ? e.target.value : x)))} placeholder="Kommentar (valfri)" />
            <input id={`pb-${i}`} className="input text-center" inputMode="decimal" value={varden[i]} onChange={(e) => setVarden((k) => k.map((x, j) => (j === i ? e.target.value : x)))} placeholder="Betyg" aria-describedby="pb-hjalp" />
          </li>
        ))}
      </ol>
      <p id="pb-hjalp" className="text-xs text-muted">Betyg 0–10 med en decimal, t.ex. 7,8. Tomma rader hoppas över.</p>
      {fel && <p role="alert" className="text-danger">{fel}</p>}
      <p role="status" aria-live="polite" className="text-ok">{klart}</p>
      <button type="submit" className="btn btn-gold self-start" disabled={pending}>{pending ? "Sparar …" : "För in i historiken"}</button>
    </form>
  );
}
