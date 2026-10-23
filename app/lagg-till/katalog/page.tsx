import type { Metadata } from "next";
import { KatalogSok } from "@/components/KatalogSok";
import { PageHeader } from "@/components/Page";

export const metadata: Metadata = { title: "Sök i katalogen" };

export default async function Katalog({ searchParams }: PageProps<"/lagg-till/katalog">) {
  const q = (await searchParams).q;
  return (
    <>
      <PageHeader eyebrow="Lägg till" title="Sök i katalogen" />
      <KatalogSok initial={typeof q === "string" ? q : ""} />
    </>
  );
}
