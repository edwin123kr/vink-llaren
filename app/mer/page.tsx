import type { Metadata } from "next";
import Link from "next/link";
import { kravAnvandare } from "@/lib/auth";
import { Icon, type IconName } from "@/components/Icon";
import { PageHeader } from "@/components/Page";

export const metadata: Metadata = { title: "Mer" };
export const dynamic = "force-dynamic";

const RADER: { icon: IconName; title: string; text: string; fas: number; href?: string }[] = [
  { icon: "glas", title: "Vinprovning", text: "Planera en provning med inköpslista och protokoll", fas: 5, href: "/provning" },
  { icon: "person", title: "Mitt konto", text: "Logga ut, byt lösenord eller radera kontot", fas: 0, href: "/mer/konto" },
  { icon: "hjarta", title: "Önskelista", text: "Flaskor du vill köpa", fas: 4, href: "/onskelista" },
  { icon: "bok", title: "Historik", text: "Alla betyg, senast först", fas: 2, href: "/historik" },
  { icon: "stapel", title: "Statistik", text: "Värde, snittbetyg och mest prisvärda", fas: 6, href: "/statistik" },
  { icon: "export", title: "Export och import", text: "Säkerhetskopia som JSON eller CSV", fas: 6, href: "/mer/backup" },
];

export default async function Mer() {
  const anv = await kravAnvandare();
  return (
    <>
      <PageHeader eyebrow="Inställningar och verktyg" title="Mer">Inloggad som {anv.namn}.</PageHeader>
      <ul className="grid gap-3">
        {RADER.map((r) => {
          const inner = (
            <>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface-2 text-gold"><Icon name={r.icon} /></span>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold">{r.title}</h2>
                <p className="text-sm text-muted">{r.text}</p>
              </div>
              {r.href ? <Icon name="pil" className="text-muted" /> : <span className="chip shrink-0">Fas {r.fas}</span>}
            </>
          );
          return (
            <li key={r.title}>
              {r.href ? (
                <Link href={r.href} className="card flex min-h-20 items-center gap-4 p-4 transition-colors hover:border-muted">{inner}</Link>
              ) : (
                <div className="card flex min-h-20 items-center gap-4 p-4">{inner}</div>
              )}
            </li>
          );
        })}
      </ul>

      <p className="mt-8 text-center text-xs leading-relaxed text-muted">
        Vinkällaren · Vindata från{" "}
        <a href="https://github.com/rogerioxavier/X-Wines" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">X-Wines</a>{" "}
        och{" "}
        <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">Open Food Facts</a>{" "}
        (ODbL, © Open Food Facts-bidragsgivare) samt från appens användare.
      </p>
    </>
  );
}
