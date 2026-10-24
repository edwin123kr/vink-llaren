import "server-only";
import { db } from "@/lib/db";

/** Egna foton sparas i databasen och visas via /api/bild/<id>. */
const TYPER = ["image/jpeg", "image/png", "image/webp"];

export async function sparaBild(data: Buffer, mediaType: string, agareId: string): Promise<string> {
  if (!TYPER.includes(mediaType)) throw new Error("Bildformatet stöds inte.");
  const b = await db.bild.create({ data: { typ: mediaType, data: new Uint8Array(data), agareId } });
  return `/api/bild/${b.id}`;
}

export async function lasBild(id: string): Promise<{ data: Uint8Array; typ: string } | null> {
  if (!/^[a-z0-9]{20,40}$/.test(id)) return null;
  const b = await db.bild.findUnique({ where: { id } });
  return b ? { data: b.data, typ: b.typ } : null;
}

/**
 * Ger en dryck en etikettbild om den saknar en (gemensam katalog) eller om drycken är användarens egen.
 * Bilden måste vara uppladdad av samma användare. Så växer katalogens bilder fram av användarnas foton.
 */
export async function satBildOmSaknas(dryckId: string, bildUrl: string, anvandareId: string): Promise<boolean> {
  const id = bildUrl.match(/^\/api\/bild\/([a-z0-9]{20,40})$/)?.[1];
  if (!id || !(await db.bild.findFirst({ where: { id, agareId: anvandareId }, select: { id: true } }))) return false;
  const r = await db.dryck.updateMany({
    where: { id: dryckId, OR: [{ agareId: anvandareId }, { agareId: null, bildUrl: null }] },
    data: { bildUrl },
  });
  return r.count > 0;
}
