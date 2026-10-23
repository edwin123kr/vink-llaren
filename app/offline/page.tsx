import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Offline" };

/** Visas av service workern när en sida inte finns sparad och nätet saknas. */
export default function Offline() {
  return (
    <section className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
      <p className="eyebrow">Ingen anslutning</p>
      <h1 className="display text-4xl">Du är offline</h1>
      <p className="text-muted">
        Den här sidan har inte sparats för offlinebruk än. Sidor du redan har besökt, som samlingen, går att bläddra i. Ändringar kräver anslutning.
      </p>
      <Link href="/" className="btn btn-gold">Till samlingen</Link>
    </section>
  );
}
