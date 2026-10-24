import type { Metadata } from "next";
import Link from "next/link";
import { Icon, type IconName } from "@/components/Icon";
import { PageHeader } from "@/components/Page";

export const metadata: Metadata = { title: "Lägg till flaska" };

const VAGAR: { icon: IconName; title: string; text: string; href: string }[] = [
  { icon: "kamera", title: "Fota etiketten", text: "Vår sommelier känner igen flaskan och fyller i fälten.", href: "/lagg-till/foto" },
  { icon: "streckkod", title: "Skanna streckkod", text: "Använd mobilkameran.", href: "/lagg-till/skanna" },
  { icon: "sok", title: "Sök i katalogen", text: "Hitta drycken och välj den.", href: "/lagg-till/katalog" },
  { icon: "penna", title: "Fyll i själv", text: "Vår sommelier kan föreslå druva, smakprofil och mat.", href: "/lagg-till/ny" },
];

export default function LaggTill() {
  return (
    <>
      <PageHeader eyebrow="Ny flaska" title="Lägg till">
        Välj det enklaste sättet. Du kan alltid granska och ändra innan du sparar.
      </PageHeader>
      <ul className="grid gap-3 sm:grid-cols-2">
        {VAGAR.map((v) => (
          <li key={v.title}>
            <Link href={v.href} className="card flex min-h-24 items-center gap-4 p-5 transition-colors hover:border-muted">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-surface-2 text-gold"><Icon name={v.icon} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-semibold">{v.title}</span>
                <span className="block text-sm text-muted">{v.text}</span>
              </span>
              <Icon name="pil" className="shrink-0 text-muted" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
