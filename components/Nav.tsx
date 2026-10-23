"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./Icon";

const ITEMS: { href: string; label: string; icon: IconName; extra?: string }[] = [
  { href: "/", label: "Samling", icon: "samling" },
  { href: "/smakprofil", label: "Smakprofil", icon: "smak" },
  { href: "/provning", label: "Provning", icon: "glas" },
  { href: "/mer", label: "Mer", icon: "mer", extra: " verktyg och inställningar" },
];

function isActive(path: string, href: string) {
  return href === "/" ? path === "/" || path.startsWith("/flaska") : path.startsWith(href);
}

/** Mobil: bottenmeny med en upphöjd "+"-knapp i mitten. Desktop: toppmeny med knapp. */
export function Nav() {
  const path = usePathname();
  // ingen meny på inloggningssidorna
  if (path.startsWith("/logga-in") || path.startsWith("/skapa-konto")) return null;
  const left = ITEMS.slice(0, 2);
  const right = ITEMS.slice(2);
  const link = (i: (typeof ITEMS)[number]) => {
    const active = isActive(path, i.href);
    return (
      <Link
        key={i.href}
        href={i.href}
        aria-current={active ? "page" : undefined}
        className={`flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl text-[0.75rem] font-medium transition-colors ${
          active ? "text-gold" : "text-muted hover:text-text"
        }`}
      >
        <Icon name={i.icon} size={22} />
        {i.label}{i.extra && <span className="sr-only">{i.extra}</span>}
      </Link>
    );
  };

  return (
    <>
      {/* desktop */}
      <header className="sticky top-0 z-40 hidden border-b border-line bg-bg/85 backdrop-blur-md md:block">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="display text-2xl text-text">
            Vinkällaren
          </Link>
          <nav aria-label="Huvudmeny" className="flex items-center gap-1">
            {ITEMS.map((i) => {
              const active = isActive(path, i.href);
              return (
                <Link
                  key={i.href}
                  href={i.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors ${
                    active ? "bg-surface-2 text-gold" : "text-muted hover:text-text"
                  }`}
                >
                  <Icon name={i.icon} size={18} />
                  {i.label}{i.extra && <span className="sr-only">{i.extra}</span>}
                </Link>
              );
            })}
          </nav>
          <Link href="/lagg-till" className="btn btn-gold">
            <Icon name="plus" size={20} /> Lägg till flaska
          </Link>
        </div>
      </header>

      {/* mobil */}
      <nav
        aria-label="Huvudmeny"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/92 backdrop-blur-md md:hidden"
        style={{ paddingBottom: "var(--safe-b)" }}
      >
        <div className="mx-auto flex h-[var(--nav-h)] max-w-lg items-stretch px-2">
          {left.map(link)}
          <div className="flex flex-1 items-start justify-center">
            <Link
              href="/lagg-till"
              aria-label="Lägg till flaska"
              className="-mt-6 grid h-16 w-16 place-items-center rounded-full bg-gold text-on-gold shadow-[0_8px_24px_rgba(217,172,85,0.35)] ring-4 ring-bg transition-transform active:scale-95"
            >
              <Icon name="plus" size={30} />
            </Link>
          </div>
          {right.map(link)}
        </div>
      </nav>
    </>
  );
}
