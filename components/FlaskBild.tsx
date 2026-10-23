import { typFor } from "@/lib/kategorier";

/** Färg per kategori för silhuetten. Färgen bär aldrig ensam information: kategorin står alltid i text bredvid. */
export function kategoriFarg(kat: string): string {
  switch (kat) {
    case "rott": return "#8e2a42";
    case "vitt": return "#d8c275";
    case "rose": return "#e3909f";
    case "mousserande": return "#e7dba9";
    case "sott": return "#c7853c";
    case "starkvin": return "#8a4a2a";
    case "gin": case "vodka": case "akvavit": return "#b9cfd6";
    case "tequila": case "mezcal": return "#d9c48f";
    default: return "#b0763a";
  }
}

/**
 * Bild på flaskan: fotot om det finns, annars en ritad silhuett (vinflaska eller spritflaska).
 * Dekorativ: namnet står alltid i text bredvid.
 */
export function FlaskBild({ kategori, bildUrl, className = "" }: { kategori: string; bildUrl?: string | null; className?: string }) {
  if (bildUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- bilder kommer från flera källor (egna foton och Open Food Facts)
    return <img src={bildUrl} alt="" loading="lazy" decoding="async" className={`h-full w-full object-contain ${className}`} />;
  }
  const farg = kategoriFarg(kategori);
  const sprit = typFor(kategori) === "sprit";
  return (
    <svg viewBox="0 0 60 160" className={`h-full w-auto ${className}`} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`g-${kategori}`} x1="0" x2="1">
          <stop offset="0" stopColor={farg} stopOpacity="0.55" />
          <stop offset="0.35" stopColor={farg} />
          <stop offset="1" stopColor={farg} stopOpacity="0.45" />
        </linearGradient>
      </defs>
      {sprit ? (
        <path d="M24 6h12v22l6 8v116a4 4 0 0 1-4 4H22a4 4 0 0 1-4-4V36l6-8z" fill={`url(#g-${kategori})`} />
      ) : (
        <path d="M25 4h10v38c0 10 13 16 13 32v78a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4V74c0-16 13-22 13-32z" fill={`url(#g-${kategori})`} />
      )}
      <rect x={sprit ? 19 : 13} y="88" width={sprit ? 22 : 34} height="34" rx="2" fill="#f4ede4" opacity="0.85" />
      <rect x={sprit ? 23 : 18} y="96" width={sprit ? 14 : 24} height="3" rx="1.5" fill="#1b1517" opacity="0.5" />
      <rect x={sprit ? 23 : 18} y="104" width={sprit ? 10 : 16} height="2.5" rx="1.25" fill="#1b1517" opacity="0.35" />
    </svg>
  );
}
