import type { Metadata } from "next";
import { NyFlaskaForm } from "@/components/Formular";
import { tomDryck } from "@/lib/formstate";
import { PageHeader } from "@/components/Page";

export const metadata: Metadata = { title: "Ny flaska" };

export default async function Ny({ searchParams }: PageProps<"/lagg-till/ny">) {
  const sp = await searchParams;
  const namn = typeof sp.namn === "string" ? sp.namn : "";
  const ean = typeof sp.ean === "string" ? sp.ean.replace(/\D/g, "") : "";
  return (
    <>
      <PageHeader eyebrow="Lägg till" title="Ny flaska">Finns flaskan inte i katalogen? Fyll i det du vet, så hjälper vår sommelier till med resten.</PageHeader>
      <NyFlaskaForm init={namn || ean ? { ...tomDryck, namn, ean } : undefined} />
    </>
  );
}
