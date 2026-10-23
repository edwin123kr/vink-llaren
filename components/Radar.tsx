import { SMAK, type SmakKey } from "@/lib/kategorier";
import { decimal } from "@/lib/format";

/** Färger validerade mot mörk yta (dataviz-skillens validator, alla kontroller godkända). */
export const RADAR_FARG = { gillar: "#b98a30", mindre: "#5a93d4" } as const;

interface Serie {
  namn: string;
  farg: string;
  profil: Partial<Record<SmakKey, number | null>>;
  streckad?: boolean;
}

const namn = (k: SmakKey) => SMAK.find((s) => s.key === k)?.namn ?? k;

/**
 * Radardiagram (0–12) för en smakprofil. Förklaring ovanför, värden som tabell under (skärmläsare och den som vill läsa siffror),
 * och varje punkt har en tooltip.
 */
export function Radar({ dims, serier, titel }: { dims: SmakKey[]; serier: Serie[]; titel: string }) {
  const S = 300;
  const c = S / 2;
  const r = 105;
  const vinkel = (i: number) => -Math.PI / 2 + (i / dims.length) * Math.PI * 2;
  const pt = (i: number, v: number) => [c + Math.cos(vinkel(i)) * (r * v) / 12, c + Math.sin(vinkel(i)) * (r * v) / 12] as const;
  const synliga = serier.filter((s) => dims.some((k) => s.profil[k] != null));

  return (
    <figure className="flex flex-col gap-3">
      <figcaption className="sr-only">{titel}</figcaption>
      {synliga.length > 1 && (
        <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm" aria-label="Förklaring">
          {synliga.map((s) => (
            <li key={s.namn} className="flex items-center gap-2">
              <svg width="22" height="10" aria-hidden="true">
                <line x1="1" y1="5" x2="21" y2="5" stroke={s.farg} strokeWidth="2" strokeDasharray={s.streckad ? "4 3" : undefined} />
              </svg>
              {s.namn}
            </li>
          ))}
        </ul>
      )}
      <svg viewBox={`-56 -16 ${S + 112} ${S + 32}`} className="mx-auto w-full max-w-[400px]" role="img" aria-label={titel}>
        {[3, 6, 9, 12].map((v) => (
          <polygon key={v} points={dims.map((_, i) => pt(i, v).join(",")).join(" ")} fill="none" stroke="var(--color-line)" strokeWidth={v === 12 ? 1.2 : 0.8} />
        ))}
        {dims.map((k, i) => {
          const [x, y] = pt(i, 12);
          const [lx, ly] = pt(i, 14.6);
          return (
            <g key={k}>
              <line x1={c} y1={c} x2={x} y2={y} stroke="var(--color-line)" strokeWidth="0.8" />
              <text x={lx} y={ly} textAnchor={Math.abs(lx - c) < 8 ? "middle" : lx > c ? "start" : "end"} dominantBaseline="middle" fill="var(--color-muted)" fontSize="17">
                {namn(k)}
              </text>
            </g>
          );
        })}
        {synliga.map((s) => {
          const punkter = dims.map((k, i) => ({ k, v: s.profil[k], p: pt(i, s.profil[k] ?? 0) }));
          return (
            <g key={s.namn}>
              <polygon
                points={punkter.map((q) => q.p.join(",")).join(" ")}
                fill={s.farg}
                fillOpacity={s.streckad ? 0.06 : 0.16}
                stroke={s.farg}
                strokeWidth="2"
                strokeDasharray={s.streckad ? "5 4" : undefined}
                strokeLinejoin="round"
              />
              {punkter.map((q) =>
                q.v == null ? null : (
                  <g key={q.k}>
                    <circle cx={q.p[0]} cy={q.p[1]} r="4.5" fill={s.farg} stroke="var(--color-surface)" strokeWidth="2" />
                    <circle cx={q.p[0]} cy={q.p[1]} r="14" fill="transparent">
                      <title>{`${s.namn}: ${namn(q.k)} ${decimal(q.v)} av 12`}</title>
                    </circle>
                  </g>
                ),
              )}
            </g>
          );
        })}
      </svg>
      <table className="w-full text-sm">
        <caption className="sr-only">{titel} som tabell</caption>
        <thead>
          <tr className="text-left text-muted">
            <th scope="col" className="py-1 font-normal">Smak (0–12)</th>
            {synliga.map((s) => <th key={s.namn} scope="col" className="py-1 text-right font-normal">{s.namn}</th>)}
          </tr>
        </thead>
        <tbody>
          {dims.map((k) => (
            <tr key={k} className="border-t border-line">
              <th scope="row" className="py-1.5 text-left font-normal">{namn(k)}</th>
              {synliga.map((s) => <td key={s.namn} className="num py-1.5 text-right">{s.profil[k] == null ? "–" : decimal(s.profil[k])}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
