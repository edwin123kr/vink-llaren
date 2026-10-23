import type { Metadata } from "next";
import { EtikettFoto } from "@/components/EtikettFoto";
import { PageHeader } from "@/components/Page";

export const metadata: Metadata = { title: "Fota etiketten" };

export default function Foto() {
  return (
    <>
      <PageHeader eyebrow="Lägg till" title="Fota etiketten" />
      <EtikettFoto />
    </>
  );
}
