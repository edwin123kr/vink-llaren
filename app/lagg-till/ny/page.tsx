import type { Metadata } from "next";
import { NyFlaskaForm } from "@/components/Formular";
import { tomDryck } from "@/lib/formstate";
import { PageHeader } from "@/components/Page";

export const metadata: Metadata = { title: "Ny flaska" };

export default async function Ny({ searchParams }: PageProps<"/lagg-till/ny">) {
  const namn = (await searchParams).namn;
  return (
    <>
      <PageHeader eyebrow="Lägg till" title="Ny flaska">Finns flaskan inte i katalogen? Fyll i det du vet, så kan Claude hjälpa till med resten.</PageHeader>
      <NyFlaskaForm init={typeof namn === "string" ? { ...tomDryck, namn } : undefined} />
    </>
  );
}
