import Link from "next/link";

export default function SidanFinnsInte() {
  return (
    <section className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
      <p className="eyebrow">404</p>
      <h1 className="display text-4xl">Sidan finns inte</h1>
      <p className="text-muted">Flaskan eller sidan kan ha tagits bort.</p>
      <Link href="/" className="btn btn-gold">Till samlingen</Link>
    </section>
  );
}
