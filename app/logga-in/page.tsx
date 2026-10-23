import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hamtaAnvandare } from "@/lib/auth";
import { AuthSkal } from "@/components/AuthSkal";
import { LoggaInForm } from "@/components/KontoFormular";

export const metadata: Metadata = { title: "Logga in" };

export default async function LoggaIn({ searchParams }: PageProps<"/logga-in">) {
  if (await hamtaAnvandare()) redirect("/");
  const sp = await searchParams;
  const nasta = typeof sp.nasta === "string" ? sp.nasta : undefined;
  return (
    <AuthSkal titel="Logga in" under={sp.raderat ? "Ditt konto är raderat." : "Din vin- och spritsamling, din smakprofil och dina provningar."}>
      <LoggaInForm nasta={nasta} />
    </AuthSkal>
  );
}
