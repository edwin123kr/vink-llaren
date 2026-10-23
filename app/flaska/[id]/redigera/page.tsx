import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { tillDryckState, tillFlaskaState } from "@/lib/formstate";
import { RedigeraForm } from "@/components/Formular";
import { PageHeader } from "@/components/Page";

export const metadata: Metadata = { title: "Redigera" };
export const dynamic = "force-dynamic";

export default async function Redigera({ params }: PageProps<"/flaska/[id]/redigera">) {
  const f = await db.flaska.findUnique({ where: { id: (await params).id }, include: { dryck: true } });
  if (!f) notFound();
  return (
    <>
      <PageHeader eyebrow="Redigera" title={f.dryck.namn} />
      <RedigeraForm flaskaId={f.id} dryck={tillDryckState(f.dryck)} flaska={tillFlaskaState(f)} />
    </>
  );
}
