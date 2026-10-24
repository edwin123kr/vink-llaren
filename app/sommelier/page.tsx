import type { Metadata } from "next";
import { db } from "@/lib/db";
import { kravAnvandare } from "@/lib/auth";
import { datum } from "@/lib/format";
import { PageHeader } from "@/components/Page";
import { SommelierChatt, type ChattMeddelande } from "@/components/SommelierChatt";
import { TidigareSamtal } from "@/components/TidigareSamtal";

export const metadata: Metadata = { title: "Sommeliern" };
export const dynamic = "force-dynamic";

export default async function Sommelier({ searchParams }: PageProps<"/sommelier">) {
  const anv = await kravAnvandare();
  const sp = await searchParams;
  const samtalId = typeof sp.samtal === "string" ? sp.samtal : null;
  const [tidigare, valt] = await Promise.all([
    db.samtal.findMany({ where: { anvandareId: anv.id }, orderBy: { uppdaterad: "desc" }, take: 20, select: { id: true, titel: true, uppdaterad: true } }),
    samtalId ? db.samtal.findFirst({ where: { id: samtalId, anvandareId: anv.id }, include: { meddelanden: { orderBy: { skapad: "asc" } } } }) : null,
  ]);
  const meddelanden: ChattMeddelande[] = (valt?.meddelanden ?? []).map((m) => ({ roll: m.roll as "user" | "assistant", text: m.text, kallor: m.kallor as ChattMeddelande["kallor"] }));
  const fraga = typeof sp.fraga === "string" ? sp.fraga.slice(0, 2000) : undefined;

  return (
    <>
      <PageHeader eyebrow="AI-sommelier" title="Fråga sommeliern">
        Mat och vin, servering, drickfönster, regioner och druvor.
      </PageHeader>
      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="min-w-0">
          <SommelierChatt key={valt?.id ?? "nytt"} samtalId={valt?.id ?? null} meddelanden={meddelanden} startFraga={fraga} />
        </div>
        <aside aria-labelledby="tidigare-rubrik" className="order-first lg:order-none">
          <TidigareSamtal key={valt?.id ?? "nytt"} valtId={valt?.id ?? null} initial={tidigare.map((t) => ({ id: t.id, titel: t.titel, datum: datum(t.uppdaterad) }))} />
        </aside>
      </div>
    </>
  );
}
