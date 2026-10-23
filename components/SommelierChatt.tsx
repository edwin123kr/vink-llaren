"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { Svar } from "./Svar";

export type ChattMeddelande = { roll: "user" | "assistant"; text: string; kallor?: { titel: string; url: string }[] | null; fel?: boolean };

const FORSLAG = [
  "Vad ska jag dricka till lax i kväll?",
  "Vilken av mina flaskor bör jag öppna först?",
  "Vad är skillnaden mellan Barolo och Barbaresco?",
  "Tips på en whisky för en nybörjare?",
];

export function SommelierChatt({ samtalId: startId, meddelanden, startFraga }: { samtalId: string | null; meddelanden: ChattMeddelande[]; startFraga?: string }) {
  const [msgs, setMsgs] = useState<ChattMeddelande[]>(meddelanden);
  const [samtalId, setSamtalId] = useState(startId);
  const [text, setText] = useState(startFraga ?? "");
  const [laddar, setLaddar] = useState(false);
  const [sok, setSok] = useState<string | null>(null);
  const slut = useRef<HTMLDivElement>(null);
  const falt = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    slut.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [msgs, sok]);

  const uppdateraSista = (f: (m: ChattMeddelande) => ChattMeddelande) => setMsgs((ms) => [...ms.slice(0, -1), f(ms[ms.length - 1])]);

  const skicka = async (fraga: string) => {
    const q = fraga.trim();
    if (!q || laddar) return;
    setText("");
    setLaddar(true);
    setSok(null);
    setMsgs((ms) => [...ms, { roll: "user", text: q }, { roll: "assistant", text: "" }]);
    try {
      const res = await fetch("/api/sommelier", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ samtalId, fraga: q }) });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.fel ?? (navigator.onLine ? "Sommeliern svarar inte just nu." : "Du är offline. Sommeliern kräver anslutning."));
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const rader = buf.split("\n");
        buf = rader.pop() ?? "";
        for (const r of rader) {
          if (!r.trim()) continue;
          const h = JSON.parse(r);
          if (h.typ === "samtal" && h.id !== samtalId) {
            setSamtalId(h.id);
            window.history.replaceState(null, "", `/sommelier?samtal=${h.id}`);
            window.dispatchEvent(new CustomEvent("vk:samtal", { detail: { id: h.id, titel: q.slice(0, 80) } }));
          } else if (h.typ === "text") {
            setSok(null);
            uppdateraSista((m) => ({ ...m, text: m.text + h.text }));
          } else if (h.typ === "sok") setSok(h.fraga || "");
          else if (h.typ === "kallor") uppdateraSista((m) => ({ ...m, kallor: h.lista }));
          else if (h.typ === "fel") throw new Error(h.text);
        }
      }
    } catch (e) {
      uppdateraSista((m) => ({ ...m, fel: true, text: (m.text ? m.text + "\n\n" : "") + (e instanceof Error ? e.message : "Något gick fel.") }));
    } finally {
      setLaddar(false);
      setSok(null);
      falt.current?.focus();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {msgs.length === 0 && (
        <section aria-labelledby="forslag-rubrik" className="card p-5">
          <h2 id="forslag-rubrik" className="display text-2xl">Fråga vad du vill om vin och sprit</h2>
          <p className="mt-1 text-sm text-muted">Sommeliern känner till din samling och dina betyg, och söker på nätet när den behöver aktuella uppgifter.</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {FORSLAG.map((f) => (
              <li key={f}><button type="button" className="chip !min-h-11 text-left" onClick={() => skicka(f)}>{f}</button></li>
            ))}
          </ul>
        </section>
      )}

      <div role="log" aria-live="polite" aria-busy={laddar} aria-label="Samtal med sommeliern" className="flex flex-col gap-4">
        {msgs.map((m, i) =>
          m.roll === "user" ? (
            <div key={i} className="ml-auto max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-wine px-4 py-3 text-text">{m.text}</div>
          ) : (
            <article key={i} className={`card max-w-full p-4 ${m.fel ? "!border-danger/60" : ""}`} aria-label="Sommelierns svar">
              <p className="eyebrow mb-2 flex items-center gap-2 !text-[0.6875rem]"><Icon name="glas" size={14} /> Sommeliern</p>
              {m.text ? <Svar text={m.text} /> : laddar && i === msgs.length - 1 ? <p className="text-muted">{sok !== null ? `Söker på nätet${sok ? `: ”${sok}”` : " …"}` : "Tänker …"}</p> : null}
              {m.kallor && m.kallor.length > 0 && (
                <div className="mt-3 border-t border-line pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">Källor</p>
                  <ul className="mt-1 flex flex-col gap-1 text-sm">
                    {m.kallor.map((k) => (
                      <li key={k.url} className="truncate"><a href={k.url} target="_blank" rel="noopener noreferrer" className="text-gold underline underline-offset-2">{k.titel}</a></li>
                    ))}
                  </ul>
                </div>
              )}
              {laddar && i === msgs.length - 1 && m.text && sok !== null && <p className="mt-2 text-sm text-muted">Söker på nätet{sok ? `: ”${sok}”` : " …"}</p>}
            </article>
          ),
        )}
      </div>
      <div ref={slut} />

      <form
        className="sticky bottom-[calc(var(--nav-h)+var(--safe-b)+8px)] z-30 mt-2 flex items-end gap-2 rounded-3xl border border-line bg-surface/95 p-2 shadow-lg backdrop-blur md:bottom-4"
        onSubmit={(e) => {
          e.preventDefault();
          skicka(text);
        }}
      >
        <label htmlFor="fraga" className="sr-only">Din fråga till sommeliern</label>
        <textarea
          id="fraga"
          ref={falt}
          rows={1}
          value={text}
          maxLength={2000}
          placeholder="Fråga sommeliern …"
          className="max-h-40 min-h-12 flex-1 resize-none bg-transparent px-3 py-3 text-base text-text placeholder:text-muted focus:outline-none"
          onChange={(e) => {
            setText(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              skicka(text);
            }
          }}
        />
        <button type="submit" className="btn btn-gold !h-12 !min-h-12 !w-12 shrink-0 !p-0" disabled={laddar || !text.trim()} aria-label="Skicka frågan">
          <Icon name="skicka" size={20} />
        </button>
      </form>
    </div>
  );
}
