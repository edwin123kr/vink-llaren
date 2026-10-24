"use client";

import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import { bytLosenord, loggaIn, loggaUt, raderaKonto, sattDelaKommentarer, skapaKonto, type KontoState } from "@/app/actions/konto";

function Falt({ id, label, typ = "text", fel, ...rest }: { id: string; label: string; typ?: string; fel?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      <input id={id} name={id} type={typ} className="input" aria-invalid={fel ? true : undefined} aria-describedby={fel ? `${id}-fel` : undefined} {...rest} />
      {fel && <p id={`${id}-fel`} className="text-sm text-danger">{fel}</p>}
    </div>
  );
}

function Allmant({ state }: { state: KontoState }) {
  if (state?.fel?._) return <p role="alert" className="rounded-xl border border-danger/50 bg-danger/10 p-3 text-sm text-danger">{state.fel._}</p>;
  if (state?.ok) return <p role="status" className="rounded-xl border border-ok/50 bg-ok/10 p-3 text-sm text-ok">{state.ok}</p>;
  return null;
}

export function LoggaInForm({ nasta }: { nasta?: string }) {
  const [state, action, pending] = useActionState(loggaIn, undefined);
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="nasta" value={nasta ?? "/"} />
      <Allmant state={state} />
      <Falt id="epost" label="E-post" typ="email" autoComplete="email" inputMode="email" required defaultValue={state?.varden?.epost} />
      <Falt id="losenord" label="Lösenord" typ="password" autoComplete="current-password" required />
      <button type="submit" className="btn btn-gold" disabled={pending}>{pending ? "Loggar in …" : "Logga in"}</button>
      <p className="text-center text-sm text-muted">Inget konto? <Link href={`/skapa-konto${nasta && nasta !== "/" ? `?nasta=${encodeURIComponent(nasta)}` : ""}`} className="font-semibold text-gold underline-offset-4 hover:underline">Skapa ett</Link></p>
    </form>
  );
}

export function SkapaKontoForm({ nasta, kravKod }: { nasta?: string; kravKod: boolean }) {
  const [state, action, pending] = useActionState(skapaKonto, undefined);
  const f = state?.fel ?? {};
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="nasta" value={nasta ?? "/"} />
      <Allmant state={state} />
      <Falt id="namn" label="Namn" autoComplete="name" required fel={f.namn} defaultValue={state?.varden?.namn} />
      <Falt id="epost" label="E-post" typ="email" autoComplete="email" inputMode="email" required fel={f.epost} defaultValue={state?.varden?.epost} />
      <Falt id="losenord" label="Lösenord (minst 8 tecken)" typ="password" autoComplete="new-password" minLength={8} required fel={f.losenord} />
      {kravKod && <Falt id="kod" label="Inbjudningskod" autoComplete="off" required fel={f.kod} />}
      <button type="submit" className="btn btn-gold" disabled={pending}>{pending ? "Skapar konto …" : "Skapa konto"}</button>
      <p className="text-center text-sm text-muted">Har du redan ett konto? <Link href="/logga-in" className="font-semibold text-gold underline-offset-4 hover:underline">Logga in</Link></p>
    </form>
  );
}

/** Loggar ut och tömmer offlinecachen, så att nästa person på samma enhet inte ser dina sparade sidor. */
export function LoggaUtKnapp() {
  return (
    <form
      action={loggaUt}
      onSubmit={() => {
        if ("caches" in window) caches.keys().then((k) => k.filter((n) => n.startsWith("vk-")).forEach((n) => caches.delete(n))).catch(() => {});
      }}
    >
      <button type="submit" className="btn w-full">Logga ut</button>
    </form>
  );
}

export function BytLosenordForm() {
  const [state, action, pending] = useActionState(bytLosenord, undefined);
  const f = state?.fel ?? {};
  return (
    <form action={action} className="flex flex-col gap-4" noValidate key={state?.ok}>
      <Allmant state={state} />
      <Falt id="nuvarande" label="Nuvarande lösenord" typ="password" autoComplete="current-password" required fel={f.nuvarande} />
      <Falt id="nytt" label="Nytt lösenord (minst 8 tecken)" typ="password" autoComplete="new-password" minLength={8} required fel={f.nytt} />
      <button type="submit" className="btn" disabled={pending}>{pending ? "Sparar …" : "Byt lösenord"}</button>
    </form>
  );
}

export function RaderaKontoForm() {
  const [state, action, pending] = useActionState(raderaKonto, undefined);
  return (
    <form
      action={action}
      className="flex flex-col gap-4"
      noValidate
      onSubmit={(e) => {
        if (!window.confirm("Radera kontot och allt i det: flaskor, betyg, önskelista och provningar? Det går inte att ångra.")) e.preventDefault();
        else if ("caches" in window) caches.keys().then((k) => k.filter((n) => n.startsWith("vk-")).forEach((n) => caches.delete(n))).catch(() => {});
      }}
    >
      <Falt id="radera-losenord" name="losenord" label="Ditt lösenord" typ="password" autoComplete="current-password" required fel={state?.fel?.losenord} />
      <button type="submit" className="btn !border-danger text-danger" disabled={pending}>{pending ? "Raderar …" : "Radera mitt konto"}</button>
    </form>
  );
}

export function DelaKommentarer({ start: initial }: { start: boolean }) {
  const [dela, setDela] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <label className="flex min-h-11 items-center gap-3">
      <input
        type="checkbox"
        className="h-5 w-5 accent-[var(--color-gold)]"
        checked={dela}
        disabled={pending}
        onChange={(e) => {
          const v = e.target.checked;
          setDela(v);
          start(() => sattDelaKommentarer(v));
        }}
      />
      <span>Visa mina kommentarer för andra (med mitt förnamn)</span>
    </label>
  );
}
