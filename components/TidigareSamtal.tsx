"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { taBortSamtal } from "@/app/actions/sommelier";

type S = { id: string; titel: string; datum: string };

/** Listan med tidigare samtal. Ett nytt samtal läggs till direkt när chatten skapar det. */
export function TidigareSamtal({ initial, valtId }: { initial: S[]; valtId: string | null }) {
  const [lista, setLista] = useState(initial);
  const [aktiv, setAktiv] = useState(valtId);
  const [pending, start] = useTransition();
  const router = useRouter();

  useEffect(() => {
    const ny = (e: Event) => {
      const { id, titel } = (e as CustomEvent<{ id: string; titel: string }>).detail;
      setAktiv(id);
      setLista((l) => [{ id, titel, datum: "I dag" }, ...l.filter((s) => s.id !== id)]);
    };
    window.addEventListener("vk:samtal", ny);
    return () => window.removeEventListener("vk:samtal", ny);
  }, []);

  return (
    <details className="card p-4">
      <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-2 font-semibold">
        <span id="tidigare-rubrik">Tidigare samtal ({lista.length})</span>
        <Link href="/sommelier" className="chip !min-h-10">Nytt samtal</Link>
      </summary>
      {lista.length ? (
        <ul className="mt-2 divide-y divide-line">
          {lista.map((s) => (
            <li key={s.id} className="flex items-center gap-2 py-2">
              <Link href={`/sommelier?samtal=${s.id}`} aria-current={s.id === aktiv ? "page" : undefined} className={`min-w-0 flex-1 ${s.id === aktiv ? "text-gold" : ""}`}>
                <span className="block truncate text-sm">{s.titel}</span>
                <span className="text-xs text-muted">{s.datum}</span>
              </Link>
              <button
                type="button"
                className="grid h-11 w-11 shrink-0 place-items-center text-muted hover:text-danger"
                aria-label={`Ta bort samtalet ${s.titel}`}
                disabled={pending}
                onClick={() => {
                  if (!window.confirm("Ta bort samtalet?")) return;
                  start(async () => {
                    await taBortSamtal(s.id);
                    setLista((l) => l.filter((x) => x.id !== s.id));
                    if (s.id === aktiv) router.push("/sommelier");
                  });
                }}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted">Inga sparade samtal än.</p>
      )}
    </details>
  );
}
