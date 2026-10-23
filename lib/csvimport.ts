import { KATEGORIER } from "./kategorier";
import { parseDecimal } from "./format";

/**
 * Importera en samling från CSV (samma kolumner som exporten, semikolon eller kommatecken).
 * Returnerar rader redo för validering; kategori kan anges som namn ("Rött vin") eller id ("rott").
 */
const KOL: Record<string, string> = {
  namn: "namn", producent: "producent", kategori: "kategori", druvor: "druvor", druva: "druvor", land: "land", region: "region",
  "årgång": "argang", argang: "argang", alkoholhalt: "alkoholhalt", "volym (ml)": "volymMl", volym: "volymMl", antal: "antal",
  "inköpspris": "inkopspris", inkopspris: "inkopspris", pris: "inkopspris", "inköpsdatum": "inkopsdatum", "inköpsställe": "inkopsstalle",
  "förvaringsplats": "plats", plats: "plats", "drick från": "drickFran", "drick till": "drickTill", ean: "ean",
  "systembolaget artikelnr": "sbArtikelnr", anteckningar: "anteckningar",
};

export function kategoriId(v: string): string | null {
  const s = v.trim().toLowerCase();
  if (!s) return null;
  const k = KATEGORIER.find((x) => x.id === s || x.namn.toLowerCase() === s || x.namn.toLowerCase().replace(/ vin$/, "") === s);
  if (k) return k.id;
  if (/^röd|^rött/.test(s)) return "rott";
  if (/^vit/.test(s)) return "vitt";
  if (/^ros/.test(s)) return "rose";
  if (/mousser|champagne|cava|prosecco/.test(s)) return "mousserande";
  return null;
}

export function csvRader(text: string, parse: (t: string, sep: string) => Generator<string[]>) {
  const forsta = text.replace(/^﻿/, "").split(/\r?\n/)[0] ?? "";
  const sep = (forsta.match(/;/g)?.length ?? 0) >= (forsta.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows = [...parse(text.replace(/^﻿/, ""), sep)];
  const head = (rows.shift() ?? []).map((h) => KOL[h.trim().toLowerCase()] ?? null);
  const tal = (s: string | undefined) => {
    const v = parseDecimal(s ?? "");
    return v == null ? null : v;
  };
  return rows.map((r, i) => {
    const o: Record<string, string> = {};
    head.forEach((h, j) => {
      if (h) o[h] = (r[j] ?? "").trim();
    });
    const kat = kategoriId(o.kategori ?? "");
    return {
      rad: i + 2,
      dryck: {
        namn: o.namn ?? "", producent: o.producent ?? "", kategori: kat ?? "", druvor: (o.druvor ?? "").split(",").map((x) => x.trim()).filter(Boolean),
        land: o.land ?? "", region: o.region ?? "", argang: tal(o.argang) == null ? null : Math.round(tal(o.argang)!), alkoholhalt: tal(o.alkoholhalt),
        volymMl: tal(o.volymMl) == null ? null : Math.round(tal(o.volymMl)!), aromer: [], mat: [], ean: o.ean ?? "", sbArtikelnr: o.sbArtikelnr ?? "",
      },
      flaska: {
        antal: tal(o.antal) == null ? 1 : Math.round(tal(o.antal)!), inkopspris: tal(o.inkopspris) == null ? null : Math.round(tal(o.inkopspris)!),
        inkopsdatum: o.inkopsdatum ?? "", inkopsstalle: o.inkopsstalle ?? "", plats: o.plats ?? "",
        drickFran: tal(o.drickFran) == null ? null : Math.round(tal(o.drickFran)!), drickTill: tal(o.drickTill) == null ? null : Math.round(tal(o.drickTill)!),
        anteckningar: o.anteckningar ?? "",
      },
    };
  });
}
