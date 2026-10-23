import "server-only";
import { db } from "@/lib/db";
import { betygText, lista } from "@/lib/format";
import { kategori as katNamn, type Typ } from "@/lib/kategorier";
import { DIM, GILLAR, GILLAR_MINDRE, grupper, kandidater, medelprofil, otestade, undvikKandidater, type BetygadDryck, type KatalogDryck } from "@/lib/smak";
import type { SmakUnderlag } from "@/lib/ai";

const PROFIL = { fyllighet: true, sotma: true, syra: true, stravhet: true, rokighet: true } as const;

/** Allt betygsatt, med snittbetyg per dryck. */
export async function hamtaBetygade(): Promise<BetygadDryck[]> {
  const rader = await db.betyg.groupBy({ by: ["dryckId"], _avg: { betyg: true }, _count: { _all: true } });
  if (!rader.length) return [];
  const drycker = await db.dryck.findMany({
    where: { id: { in: rader.map((r) => r.dryckId) } },
    select: { id: true, namn: true, typ: true, kategori: true, druvor: true, land: true, region: true, ...PROFIL },
  });
  const per = new Map(rader.map((r) => [r.dryckId, r]));
  return drycker.map((d) => ({
    dryckId: d.id,
    namn: d.namn,
    typ: d.typ as Typ,
    kategori: d.kategori,
    druvor: lista(d.druvor),
    land: d.land,
    region: d.region,
    profil: { fyllighet: d.fyllighet, sotma: d.sotma, syra: d.syra, stravhet: d.stravhet, rokighet: d.rokighet },
    snitt: Math.round(per.get(d.id)!._avg.betyg ?? 0),
    antal: per.get(d.id)!._count._all,
  }));
}

export async function hamtaKatalog(typ: Typ): Promise<KatalogDryck[]> {
  const d = await db.dryck.findMany({
    where: { typ },
    select: { id: true, namn: true, producent: true, typ: true, kategori: true, druvor: true, land: true, region: true, prisCa: true, ...PROFIL },
    take: 20000,
  });
  return d.map((x) => ({ ...x, typ: x.typ as Typ, druvor: lista(x.druvor), profil: { fyllighet: x.fyllighet, sotma: x.sotma, syra: x.syra, stravhet: x.stravhet, rokighet: x.rokighet } }));
}

/** Lokala siffror för sidan och underlaget till AI:n. */
export async function smakdata(typ: Typ) {
  const [alla, katalog] = await Promise.all([hamtaBetygade(), hamtaKatalog(typ)]);
  const egna = alla.filter((d) => d.typ === typ);
  const dims = DIM[typ];
  const gillar = egna.filter((d) => d.snitt >= GILLAR);
  const mindre = egna.filter((d) => d.snitt < GILLAR_MINDRE);
  const antalBetyg = egna.reduce((a, d) => a + d.antal, 0);
  const druvor = grupper(egna, (d) => d.druvor);
  const regioner = grupper(egna, (d) => (d.region ? [d.region] : []));
  const lander = grupper(egna, (d) => (d.land ? [d.land] : []));
  const kategorier = grupper(egna, (d) => [katNamn(d.kategori)?.namn ?? d.kategori]);
  const kand = kandidater(katalog, alla, typ);
  const otest = otestade(katalog, alla, typ);
  const undvik = undvikKandidater(egna).map((g) => ({ ...g, namn: katNamn(g.namn)?.namn ?? g.namn }));

  const underlag: SmakUnderlag = {
    typ,
    antalBetyg,
    profilGillar: medelprofil(gillar.length ? gillar : egna, dims),
    profilMindre: medelprofil(mindre, dims),
    favoriter: {
      druvor: druvor.filter((g) => g.snitt >= GILLAR).slice(0, 5).map((g) => g.namn),
      regioner: regioner.filter((g) => g.snitt >= GILLAR).slice(0, 5).map((g) => g.namn),
      kategorier: kategorier.filter((g) => g.snitt >= GILLAR).slice(0, 3).map((g) => g.namn),
    },
    lagaBetyg: undvik.map((g) => ({ namn: g.namn, snitt: betygText(g.snitt), antal: g.antal })),
    betyg: egna.slice(0, 80).map((d) => ({ namn: d.namn, kategori: katNamn(d.kategori)?.namn ?? d.kategori, druvor: d.druvor, region: d.region, land: d.land, betyg: betygText(d.snitt) })),
    kandidater: kand.map((k) => ({ id: k.id, namn: k.namn, producent: k.producent, kategori: katNamn(k.kategori)?.namn ?? k.kategori, druvor: k.druvor, region: k.region, land: k.land, prisCa: k.prisCa })),
    otestade: { ...otest, kategorier: otest.kategorier.map((k) => katNamn(k)?.namn ?? k) },
  };

  return {
    typ,
    dims,
    antalBetyg,
    antalDrycker: egna.length,
    profilGillar: medelprofil(gillar, dims),
    profilMindre: medelprofil(mindre, dims),
    antalGillar: gillar.length,
    antalMindre: mindre.length,
    druvor,
    regioner,
    lander,
    kandidater: kand,
    underlag,
  };
}
