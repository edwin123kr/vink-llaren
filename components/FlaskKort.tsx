import { kategori } from "@/lib/kategorier";
import { betygText, drickfonster, kr } from "@/lib/format";
import { Icon } from "./Icon";

export interface FlaskKortData {
  id: string;
  antal: number;
  inkopspris: number | null;
  plats: string | null;
  drickFran: number | null;
  drickTill: number | null;
  dryck: { namn: string; producent: string | null; kategori: string; land: string | null; region: string | null; argang: number | null; kalla: string };
  snittbetyg: number | null;
}

const FONSTER: Record<string, { text: string; cls: string }> = {
  redo: { text: "Redo att drickas", cls: "text-ok" },
  "drick-snart": { text: "Drick snart", cls: "text-gold" },
  vanta: { text: "Vänta", cls: "text-muted" },
  passerat: { text: "Passerat", cls: "text-danger" },
};

/** Kategorifärg som liten "etikett" till vänster. Färg är aldrig enda bäraren av information. */
function swatch(kat: string) {
  switch (kat) {
    case "rott": return "bg-[#7d1f35]";
    case "vitt": return "bg-[#d9c27a]";
    case "rose": return "bg-[#e3909f]";
    case "mousserande": return "bg-[#e8dcae]";
    case "sott": case "starkvin": return "bg-[#a0522d]";
    default: return "bg-[#b07a3c]";
  }
}

export function FlaskKort({ f }: { f: FlaskKortData }) {
  const d = f.dryck;
  const fonster = drickfonster(f.drickFran, f.drickTill);
  const st = FONSTER[fonster.status];
  return (
    <article className="card flex gap-4 p-4">
      <div className={`w-1.5 shrink-0 rounded-full ${swatch(d.kategori)}`} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="eyebrow !text-[0.6875rem]">{kategori(d.kategori)?.namn ?? d.kategori}{d.argang ? ` · ${d.argang}` : ""}</p>
            <h2 className="display mt-0.5 line-clamp-2 text-[1.4rem] leading-tight">{d.namn}</h2>
            <p className="truncate text-sm text-muted">{[d.producent, d.region, d.land].filter(Boolean).join(" · ")}</p>
          </div>
          <span className="chip num shrink-0" aria-label={`${f.antal} ${f.antal === 1 ? "flaska" : "flaskor"}`}>
            <Icon name="flaska" size={14} /> {f.antal}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {f.snittbetyg != null && (
            <span className="num text-gold">
              <span aria-hidden="true">★ </span>
              <span className="sr-only">Snittbetyg </span>
              {betygText(f.snittbetyg)}
            </span>
          )}
          {st && (
            <span className={st.cls}>
              {st.text} <span className="text-muted">({fonster.text})</span>
            </span>
          )}
          {f.inkopspris != null && <span className="num text-muted">{kr(f.inkopspris)}</span>}
          {d.kalla === "demo" && <span className="chip !min-h-6 !text-[0.6875rem] text-muted">Exempeldata</span>}
        </div>
      </div>
    </article>
  );
}
