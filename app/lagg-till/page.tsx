import type { Metadata } from "next";
import { Icon, type IconName } from "@/components/Icon";
import { PageHeader } from "@/components/Page";

export const metadata: Metadata = { title: "Lägg till flaska" };

const VAGAR: { icon: IconName; title: string; text: string; fas: number }[] = [
  { icon: "sok", title: "Sök i katalogen", text: "Hitta drycken och välj den.", fas: 2 },
  { icon: "kamera", title: "Fota etiketten", text: "Claude känner igen flaskan och fyller i fälten.", fas: 3 },
  { icon: "streckkod", title: "Skanna streckkod", text: "Använd mobilkameran.", fas: 3 },
  { icon: "penna", title: "Fyll i själv", text: "Claude kan föreslå druva, smakprofil och mat.", fas: 2 },
];

export default function LaggTill() {
  return (
    <>
      <PageHeader eyebrow="Ny flaska" title="Lägg till">
        Välj det enklaste sättet. Du kan alltid redigera innan du sparar.
      </PageHeader>
      <ul className="grid gap-3 sm:grid-cols-2">
        {VAGAR.map((v) => (
          <li key={v.title} className="card flex min-h-24 items-center gap-4 p-5 opacity-80">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-surface-2 text-gold">
              <Icon name={v.icon} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold">{v.title}</h2>
              <p className="text-sm text-muted">{v.text}</p>
            </div>
            <span className="chip shrink-0">Fas {v.fas}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
