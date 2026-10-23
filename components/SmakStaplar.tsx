import { SMAK, SMAK_MAX, typFor } from "@/lib/kategorier";

type Profil = Partial<Record<(typeof SMAK)[number]["key"], number | null>>;

/** Smakprofil som staplar på skalan 0–12. Värdet står också i text (inte bara som stapellängd). */
export function SmakStaplar({ profil, kategori }: { profil: Profil; kategori: string }) {
  const sprit = typFor(kategori) === "sprit";
  const rader = SMAK.filter((s) => (s.key === "rokighet" ? sprit || profil.rokighet != null : !(sprit && s.key === "stravhet" && profil.stravhet == null)));
  if (rader.every((r) => profil[r.key] == null)) return <p className="text-muted">Ingen smakprofil ännu.</p>;
  return (
    <dl className="grid gap-3">
      {rader.map((r) => {
        const v = profil[r.key];
        return (
          <div key={r.key} className="grid grid-cols-[6.5rem_1fr_2.5rem] items-center gap-3">
            <dt className="text-sm text-muted">{r.namn}</dt>
            <dd className="h-2 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
              {v != null && <div className="h-full rounded-full bg-gold" style={{ width: `${(v / SMAK_MAX) * 100}%` }} />}
            </dd>
            <dd className="num text-right text-sm">{v == null ? "–" : `${v}/12`}</dd>
          </div>
        );
      })}
    </dl>
  );
}
