import type { Metadata } from "next";
import { EtikettFoto } from "@/components/EtikettFoto";
import { PageHeader } from "@/components/Page";

export const metadata: Metadata = { title: "Fota etiketten" };

export default async function Foto({ searchParams }: PageProps<"/lagg-till/foto">) {
  const e = (await searchParams).ean;
  const ean = typeof e === "string" && /^\d{8,14}$/.test(e) ? e : undefined;
  return (
    <>
      <PageHeader eyebrow="Lägg till" title="Fota etiketten">{ean ? "Vi hittade inte streckkoden. Fota etiketten, så sparas streckkoden och hittas direkt nästa gång." : null}</PageHeader>
      <EtikettFoto ean={ean} />
    </>
  );
}
