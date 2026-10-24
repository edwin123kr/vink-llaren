import { betygText, datum } from "@/lib/format";
import type { Recension } from "@/lib/gemenskap";

/** Vinkällarens betyg: snitt från alla användare och de senaste kommentarerna. */
export function GemenskapBetyg({ snitt, recensioner }: { snitt: { snitt: number; antal: number } | undefined; recensioner: Recension[] }) {
  return (
    <section className="card p-5" aria-labelledby="gemenskap">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="gemenskap" className="display text-2xl">Vinkällarens betyg</h2>
        {snitt ? (
          <p className="text-sm text-muted">
            <span className="num mr-1 text-2xl font-semibold text-gold">★ {betygText(snitt.snitt)}</span>
            {snitt.antal} {snitt.antal === 1 ? "betyg" : "betyg"} från användare
          </p>
        ) : (
          <p className="text-sm text-muted">Ingen har betygsatt det här vinet än.</p>
        )}
      </div>
      {recensioner.length > 0 && (
        <ol className="mt-3 divide-y divide-line">
          {recensioner.map((r) => (
            <li key={r.id} className="flex gap-4 py-3">
              <span className="num w-12 shrink-0 text-lg font-semibold text-gold">{betygText(r.betyg)}</span>
              <div className="min-w-0">
                <p className="text-sm text-muted">{r.egen ? "Du" : r.namn} · {datum(r.datum)}</p>
                <p className="mt-0.5">{r.kommentar}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
