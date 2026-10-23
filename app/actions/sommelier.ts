"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { kravAnvandare } from "@/lib/auth";

export async function taBortSamtal(id: string) {
  const anv = await kravAnvandare();
  await db.samtal.deleteMany({ where: { id, anvandareId: anv.id } });
  revalidatePath("/sommelier");
}
