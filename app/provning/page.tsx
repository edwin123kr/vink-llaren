import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { kravAnvandare } from "@/lib/auth";
import { datum } from "@/lib/format";
import { Icon } from "@/components/Icon";
import { PageHeader } from "@/components/Page";
import { ProvningForm } from "@/components/ProvningForm";

export const metadata: Metadata = { title: "Vinprovning" };
export const dynamic = "force-dynamic";

export default async function Provning() {
  const anv = await kravAnvandare();
  const tidigare = await db.provning.findMany({ where: { anvandareId: anv.id }, orderBy: { skapad: "desc" }, take: 30 });
  return (
    <>
      <PageHeader eyebrow="Planera" title="Vinprovning">
        Ange deltagare, antal viner och budget. Appen räknar flaskor och vår sommelier föreslår viner i rätt ordning.
      </PageHeader>
      <ProvningForm />
      {tidigare.length > 0 && (
        <section className="mt-8" aria-labelledby="tidigare">
          <h2 id="tidigare" className="display text-2xl">Tidigare provningar</h2>
          <ul className="mt-3 grid gap-2">
            {tidigare.map((p) => (
              <li key={p.id}>
                <Link href={`/provning/${p.id}`} className="card flex min-h-16 items-center gap-4 p-4 hover:border-muted">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{p.titel}</span>
                    <span className="block text-sm text-muted">{p.deltagare} deltagare · {p.antalViner} viner · {datum(p.datum ?? p.skapad)}</span>
                  </span>
                  <Icon name="pil" className="text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
