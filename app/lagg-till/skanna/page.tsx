import type { Metadata } from "next";
import { PageHeader } from "@/components/Page";
import { Skanner } from "@/components/Skanner";

export const metadata: Metadata = { title: "Skanna streckkod" };

export default function Skanna() {
  return (
    <>
      <PageHeader eyebrow="Lägg till" title="Skanna streckkod">
        Vi letar först i din katalog och sedan hos Open Food Facts.
      </PageHeader>
      <Skanner />
    </>
  );
}
