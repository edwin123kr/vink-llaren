import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hamtaAnvandare } from "@/lib/auth";
import { AuthSkal } from "@/components/AuthSkal";
import { SkapaKontoForm } from "@/components/KontoFormular";

export const metadata: Metadata = { title: "Skapa konto" };

export default async function SkapaKonto({ searchParams }: PageProps<"/skapa-konto">) {
  if (await hamtaAnvandare()) redirect("/");
  const nasta = (await searchParams).nasta;
  return (
    <AuthSkal titel="Skapa konto" under="Gratis. Din samling syns bara för dig.">
      <SkapaKontoForm nasta={typeof nasta === "string" ? nasta : undefined} kravKod={Boolean(process.env.REGISTRERINGSKOD?.trim())} />
    </AuthSkal>
  );
}
