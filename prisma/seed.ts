/**
 * Exempeldata för utveckling. Allt märks kalla="demo" och kan tas bort med `npm run db:demo:rensa`.
 * Namnen är medvetet generiska (inga riktiga produkter, priser eller betyg hittas på).
 */
import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../lib/generated/prisma/client";

const db = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" }) });

type D = Parameters<typeof db.dryck.create>[0]["data"];
const drycker: (D & { flaska?: { antal: number; inkopspris: number; plats: string; drickFran?: number; drickTill?: number }; betyg?: number[] })[] = [
  { namn: "Exempel Nebbiolo", producent: "Demoproducent", typ: "vin", kategori: "rott", druvor: ["Nebbiolo"], land: "Italien", region: "Piemonte", argang: 2019, alkoholhalt: 14, volymMl: 750, fyllighet: 9, sotma: 1, syra: 9, stravhet: 10, aromer: ["körsbär", "ros", "tjära"], mat: ["vilt", "svamp"], kalla: "demo", flaska: { antal: 2, inkopspris: 389, plats: "Källaren, hylla 1", drickFran: 2024, drickTill: 2034 }, betyg: [84] },
  { namn: "Exempel Pinot Noir", producent: "Demoproducent", typ: "vin", kategori: "rott", druvor: ["Pinot Noir"], land: "Frankrike", region: "Bourgogne", argang: 2021, alkoholhalt: 13, volymMl: 750, fyllighet: 6, sotma: 1, syra: 8, stravhet: 5, aromer: ["hallon", "jord", "svamp"], mat: ["anka", "kyckling"], kalla: "demo", flaska: { antal: 3, inkopspris: 249, plats: "Vinkylen", drickFran: 2023, drickTill: 2027 }, betyg: [76, 81] },
  { namn: "Exempel Riesling Kabinett", producent: "Demoproducent", typ: "vin", kategori: "vitt", druvor: ["Riesling"], land: "Tyskland", region: "Mosel", argang: 2022, alkoholhalt: 9, volymMl: 750, fyllighet: 4, sotma: 5, syra: 10, stravhet: 0, aromer: ["grönt äpple", "lime", "petroleum"], mat: ["asiatiskt", "skaldjur"], kalla: "demo", flaska: { antal: 4, inkopspris: 169, plats: "Vinkylen", drickFran: 2023, drickTill: 2032 }, betyg: [72] },
  { namn: "Exempel Champagne Brut", producent: "Demohuset", typ: "vin", kategori: "mousserande", druvor: ["Chardonnay", "Pinot Noir"], land: "Frankrike", region: "Champagne", alkoholhalt: 12, volymMl: 750, fyllighet: 6, sotma: 2, syra: 9, stravhet: 0, aromer: ["brioche", "citrus", "mandel"], mat: ["ostron", "aperitif"], kalla: "demo", flaska: { antal: 1, inkopspris: 499, plats: "Källaren, hylla 3" } },
  { namn: "Exempel Tempranillo Crianza", producent: "Demobodega", typ: "vin", kategori: "rott", druvor: ["Tempranillo"], land: "Spanien", region: "Rioja", argang: 2020, alkoholhalt: 13.5, volymMl: 750, fyllighet: 7, sotma: 2, syra: 6, stravhet: 7, aromer: ["vanilj", "plommon", "läder"], mat: ["lamm", "grillat"], kalla: "demo", betyg: [58] },
  { namn: "Exempel Islay Single Malt", producent: "Demodestilleri", typ: "sprit", kategori: "whisky", druvor: ["mältat korn"], land: "Skottland", region: "Islay", alkoholhalt: 46, volymMl: 700, fyllighet: 9, sotma: 3, rokighet: 11, aromer: ["torvrök", "jod", "citrus"], mat: ["rökt lax", "blåmögelost"], kalla: "demo", flaska: { antal: 1, inkopspris: 649, plats: "Barskåpet" }, betyg: [88] },
  { namn: "Exempel Rhum Agricole", producent: "Demodestilleri", typ: "sprit", kategori: "rom", druvor: ["sockerrör"], land: "Martinique", alkoholhalt: 50, volymMl: 700, fyllighet: 7, sotma: 2, rokighet: 1, aromer: ["gräs", "banan", "peppar"], mat: ["mörk choklad"], kalla: "demo", flaska: { antal: 1, inkopspris: 459, plats: "Barskåpet" } },
  { namn: "Exempel London Dry Gin", producent: "Demodestilleri", typ: "sprit", kategori: "gin", druvor: ["säd", "enbär"], land: "England", alkoholhalt: 43, volymMl: 700, fyllighet: 5, sotma: 1, rokighet: 0, aromer: ["enbär", "koriander", "citrusskal"], mat: ["drinkar"], kalla: "demo", flaska: { antal: 1, inkopspris: 329, plats: "Barskåpet" }, betyg: [69] },
];

async function main() {
  await db.dryck.deleteMany({ where: { kalla: "demo" } });
  for (const { flaska, betyg, ...d } of drycker) {
    const dryck = await db.dryck.create({ data: d });
    if (flaska) await db.flaska.create({ data: { ...flaska, dryckId: dryck.id, inkopsdatum: new Date("2026-03-01") } });
    for (const [i, b] of (betyg ?? []).entries()) {
      await db.betyg.create({ data: { dryckId: dryck.id, betyg: b, datum: new Date(2026, 4 + i, 10) } });
    }
  }
  console.log(`Exempeldata: ${await db.dryck.count({ where: { kalla: "demo" } })} drycker, ${await db.flaska.count()} flaskposter, ${await db.betyg.count()} betyg.`);
}

main().finally(() => db.$disconnect());
