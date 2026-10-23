import type { ReactNode } from "react";
import Image from "next/image";

/** Ram för inloggningssidorna: logotyp, rubrik och ett kort. */
export function AuthSkal({ titel, under, children }: { titel: string; under?: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-sm flex-col justify-center py-10">
      <div className="mb-8 text-center">
        <Image src="/ikoner/ikon.svg" alt="" width={64} height={64} unoptimized className="mx-auto mb-4 rounded-2xl" />
        <p className="display text-xl text-gold">Vinkällaren</p>
        <h1 className="display mt-2 text-4xl">{titel}</h1>
        {under && <p className="mt-2 text-muted">{under}</p>}
      </div>
      <div className="card p-5 sm:p-6">{children}</div>
    </div>
  );
}
