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
