"use client";

import Link from "next/link";

/** Fångar fel i sidor och i åtgärder (t.ex. när man försöker spara utan anslutning). */
export default function Fel({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const offline = typeof navigator !== "undefined" && !navigator.onLine;
  return (
    <section className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center" role="alert">
      <p className="eyebrow">{offline ? "Ingen anslutning" : "Något gick fel"}</p>
      <h1 className="display text-4xl">{offline ? "Det här kräver anslutning" : "Hoppsan"}</h1>
      <p className="text-muted">
        {offline
          ? "Du verkar vara offline. Ändringar sparas på servern, så försök igen när du har anslutning. Sidor du redan har besökt går att bläddra i."
          : "Ett oväntat fel uppstod. Försök igen, och om det fortsätter: starta om appen."}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" className="btn btn-gold" onClick={reset}>Försök igen</button>
        <Link href="/" className="btn">Till samlingen</Link>
      </div>
    </section>
  );
}
