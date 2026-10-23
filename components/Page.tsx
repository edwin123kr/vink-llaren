import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <header className="pb-6 pt-6 md:pt-10">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="display mt-1 text-[2.5rem] md:text-5xl">{title}</h1>
      {children && <div className="mt-3 max-w-2xl text-muted">{children}</div>}
    </header>
  );
}

/** Tom yta för funktioner som byggs i en senare fas. */
export function Kommer({ fas, icon, title, children }: { fas: number; icon: IconName; title: string; children: ReactNode }) {
  return (
    <section className="card flex flex-col items-start gap-3 p-6">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-gold">
        <Icon name={icon} />
      </span>
      <h2 className="display text-2xl">{title}</h2>
      <div className="text-muted">{children}</div>
      <span className="chip mt-1">Byggs i fas {fas}</span>
    </section>
  );
}
