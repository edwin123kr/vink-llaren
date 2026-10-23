import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { kravAnvandare } from "@/lib/auth";
import { tillDryckState, tillFlaskaState } from "@/lib/formstate";
import { RedigeraForm } from "@/components/Formular";
import { PageHeader } from "@/components/Page";

export const metadata: Metadata = { title: "Redigera" };
export const dynamic = "force-dynamic";

export default async function Redigera({ params }: PageProps<"/flaska/[id]/redigera">) {
  const anv = await kravAnvandare();
  const f = await db.flaska.findFirst({ where: { id: (await params).id, anvandareId: anv.id }, include: { dryck: true } });
  if (!f) notFound();
  return (
    <>
      <PageHeader eyebrow="Redigera" title={f.dryck.namn} />
      <RedigeraForm flaskaId={f.id} dryck={tillDryckState(f.dryck)} flaska={tillFlaskaState(f)} />
    </>
  );
}
