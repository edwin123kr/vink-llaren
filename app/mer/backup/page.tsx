import type { Metadata } from "next";
import { BackupVy } from "@/components/BackupVy";
import { PageHeader } from "@/components/Page";

export const metadata: Metadata = { title: "Export och import" };

export default function Backup() {
  return (
    <>
      <PageHeader eyebrow="Mer" title="Export och import">Allt sparas lokalt i databasen. Ta en säkerhetskopia innan du byter dator eller databas.</PageHeader>
      <BackupVy />
    </>
  );
}
