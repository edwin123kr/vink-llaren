import "server-only";
import { fromOff, type OffProduct } from "@/scripts/import/normalize";

/**
 * Uppslag av en streckkod i Open Food Facts (ODbL). Respekterar deras villkor:
 * egen User-Agent, ett anrop per skanning, bara nödvändiga fält.
 */
const FALT = "code,product_name,product_name_sv,product_name_en,brands,categories_tags,origins_tags,quantity,nutriments,image_front_url,image_url";

export type OffSvar =
  | { status: "hittad"; dryck: NonNullable<ReturnType<typeof fromOff>> }
  | { status: "inte-dryck"; namn: string | null }
  | { status: "saknas" }
  | { status: "fel"; meddelande: string };

export async function slaUppOff(ean: string): Promise<OffSvar> {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${ean}.json?fields=${FALT}`, {
      headers: { "User-Agent": "Vinkallaren/1.0 (personlig vinsamling; https://github.com/edwin123kr/vink-llaren)" },
      signal: AbortSignal.timeout(6000),
      cache: "no-store",
    });
    if (res.status === 404) return { status: "saknas" };
    if (!res.ok) return { status: "fel", meddelande: `Open Food Facts svarade ${res.status}.` };
    const j = (await res.json()) as { status?: number; product?: OffProduct };
    if (!j.product || j.status === 0) return { status: "saknas" };
    const d = fromOff({ ...j.product, code: j.product.code ?? ean });
    if (!d) return { status: "inte-dryck", namn: j.product.product_name ?? null };
    return { status: "hittad", dryck: d };
  } catch {
    return { status: "fel", meddelande: "Kunde inte nå Open Food Facts just nu." };
  }
}
