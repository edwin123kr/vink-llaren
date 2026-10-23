import { decimal, parseDecimal } from "@/lib/format";

/* ---------------- tillstånd (strängar så att decimalkomma och tomma fält fungerar) ---------------- */
export interface DryckState {
  namn: string; producent: string; kategori: string; druvor: string; land: string; region: string; argang: string;
  alkoholhalt: string; volymMl: string; fyllighet: string; sotma: string; syra: string; stravhet: string; rokighet: string;
  aromer: string; mat: string; beskrivning: string; bildUrl: string; ean: string; sbArtikelnr: string; prisCa: string; prisUppskattat: boolean;
}
export interface FlaskaState {
  antal: string; inkopspris: string; inkopsdatum: string; inkopsstalle: string; plats: string; drickFran: string; drickTill: string; anteckningar: string;
}

export const tomDryck: DryckState = {
  namn: "", producent: "", kategori: "rott", druvor: "", land: "", region: "", argang: "", alkoholhalt: "", volymMl: "750",
  fyllighet: "", sotma: "", syra: "", stravhet: "", rokighet: "", aromer: "", mat: "", beskrivning: "", bildUrl: "", ean: "", sbArtikelnr: "", prisCa: "", prisUppskattat: false,
};
export const tomFlaska = (): FlaskaState => ({
  antal: "1", inkopspris: "", inkopsdatum: new Date().toISOString().slice(0, 10), inkopsstalle: "", plats: "", drickFran: "", drickTill: "", anteckningar: "",
});

const str = (v: unknown) => (v == null ? "" : String(v));
const listaStr = (v: unknown) => (Array.isArray(v) ? v.join(", ") : "");

/** Databasrad/AI-förslag → formulärtillstånd */
export function tillDryckState(d: Record<string, unknown>): DryckState {
  return {
    ...tomDryck,
    namn: str(d.namn), producent: str(d.producent), kategori: str(d.kategori) || "rott", druvor: listaStr(d.druvor), land: str(d.land),
    region: str(d.region), argang: str(d.argang), alkoholhalt: d.alkoholhalt == null ? "" : decimal(Number(d.alkoholhalt)),
    volymMl: str(d.volymMl), fyllighet: str(d.fyllighet), sotma: str(d.sotma), syra: str(d.syra), stravhet: str(d.stravhet), rokighet: str(d.rokighet),
    aromer: listaStr(d.aromer), mat: listaStr(d.mat), beskrivning: str(d.beskrivning), bildUrl: str(d.bildUrl), ean: str(d.ean),
    sbArtikelnr: str(d.sbArtikelnr), prisCa: str(d.prisCa), prisUppskattat: Boolean(d.prisUppskattat),
  };
}
export function tillFlaskaState(f: Record<string, unknown>): FlaskaState {
  const dat = f.inkopsdatum ? new Date(f.inkopsdatum as string).toISOString().slice(0, 10) : "";
  return { antal: str(f.antal) || "1", inkopspris: str(f.inkopspris), inkopsdatum: dat, inkopsstalle: str(f.inkopsstalle), plats: str(f.plats), drickFran: str(f.drickFran), drickTill: str(f.drickTill), anteckningar: str(f.anteckningar) };
}

const int = (s: string) => {
  const v = parseDecimal(s);
  return v == null ? null : Math.round(v);
};
const splitLista = (s: string) => s.split(/[,;\n]/).map((x) => x.trim()).filter(Boolean);

export function dryckPayload(d: DryckState) {
  return {
    namn: d.namn, producent: d.producent, kategori: d.kategori, druvor: splitLista(d.druvor), land: d.land, region: d.region,
    argang: int(d.argang), alkoholhalt: parseDecimal(d.alkoholhalt), volymMl: int(d.volymMl),
    fyllighet: int(d.fyllighet), sotma: int(d.sotma), syra: int(d.syra), stravhet: int(d.stravhet), rokighet: int(d.rokighet),
    aromer: splitLista(d.aromer), mat: splitLista(d.mat), beskrivning: d.beskrivning, bildUrl: d.bildUrl, ean: d.ean.replace(/\s/g, ""),
    sbArtikelnr: d.sbArtikelnr, prisCa: int(d.prisCa), prisUppskattat: d.prisUppskattat,
  };
}
export function flaskaPayload(f: FlaskaState) {
  return { antal: int(f.antal) ?? 0, inkopspris: int(f.inkopspris), inkopsdatum: f.inkopsdatum, inkopsstalle: f.inkopsstalle, plats: f.plats, drickFran: int(f.drickFran), drickTill: int(f.drickTill), anteckningar: f.anteckningar };
}
