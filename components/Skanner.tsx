"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";

type Resultat =
  | { status: "katalog" | "openfoodfacts"; dryckId: string; namn: string }
  | { status: "inte-dryck"; namn: string | null; ean: string }
  | { status: "saknas"; ean: string }
  | { status: "fel" | "ogiltig"; meddelande: string; ean?: string };

interface Detektor {
  detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>;
}

/**
 * Streckkodsskanner: BarcodeDetector där webbläsaren har den (t.ex. Chrome på Android),
 * annars ZXing. Manuell inmatning finns alltid som alternativ.
 */
export function Skanner() {
  const video = useRef<HTMLVideoElement>(null);
  const stoppa = useRef<() => void>(() => {});
  const [kor, setKor] = useState(false);
  const [info, setInfo] = useState("");
  const [manuell, setManuell] = useState("");
  const [res, setRes] = useState<Resultat | null>(null);
  const [laddar, setLaddar] = useState(false);
  const router = useRouter();

  useEffect(() => () => stoppa.current(), []);

  const slaUpp = async (kod: string) => {
    stoppa.current();
    setKor(false);
    setLaddar(true);
    setRes(null);
    try {
      const r = await fetch(`/api/streckkod/${encodeURIComponent(kod)}`);
      const j = (await r.json()) as Resultat;
      if (j.status === "katalog" || j.status === "openfoodfacts") {
        router.push(`/lagg-till/katalog/${j.dryckId}`);
        return;
      }
      setRes(j);
    } catch {
      setRes({ status: "fel", meddelande: "Kunde inte slå upp streckkoden.", ean: kod });
    } finally {
      setLaddar(false);
    }
  };

  const starta = async () => {
    setRes(null);
    setInfo("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setInfo("Kameran är inte tillgänglig i den här webbläsaren. Skriv in streckkoden nedan.");
      return;
    }
    try {
      const v = video.current!;
      const BD = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => Detektor }).BarcodeDetector;
      if (BD) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        v.srcObject = stream;
        await v.play();
        setKor(true);
        const det = new BD({ formats: ["ean_13", "ean_8", "upc_a", "upc_e"] });
        let aktiv = true;
        stoppa.current = () => {
          aktiv = false;
          stream.getTracks().forEach((t) => t.stop());
        };
        const loop = async () => {
          if (!aktiv) return;
          try {
            const hit = await det.detect(v);
            if (hit[0]?.rawValue) return slaUpp(hit[0].rawValue);
          } catch {
            /* ram utan kod */
          }
          window.setTimeout(loop, 200);
        };
        loop();
      } else {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const reader = new BrowserMultiFormatReader();
        setKor(true);
        const ctrl = await reader.decodeFromConstraints({ video: { facingMode: "environment" } }, v, (r) => {
          if (r) slaUpp(r.getText());
        });
        stoppa.current = () => ctrl.stop();
      }
    } catch (e) {
      setKor(false);
      const namn = e instanceof DOMException ? e.name : "";
      setInfo(namn === "NotAllowedError" ? "Du behöver tillåta kameran för att skanna. Du kan också skriva in koden nedan." : "Kunde inte starta kameran. Skriv in streckkoden nedan i stället.");
    }
  };

  const ean = (res && "ean" in res ? res.ean : undefined) ?? manuell;

  return (
    <div className="flex flex-col gap-5">
      <div className="card overflow-hidden">
        <div className={`relative aspect-[4/3] bg-black ${kor ? "" : "hidden"}`}>
          <video ref={video} className="h-full w-full object-cover" muted playsInline aria-label="Kamerabild" />
          <div className="pointer-events-none absolute inset-x-10 top-1/2 h-24 -translate-y-1/2 rounded-xl border-2 border-gold/80" aria-hidden="true" />
        </div>
        <div className="flex flex-col items-center gap-3 p-5 text-center">
          {!kor ? (
            <>
              <span className="grid h-16 w-16 place-items-center rounded-full bg-surface-2 text-gold"><Icon name="streckkod" size={30} /></span>
              <button type="button" className="btn btn-gold" onClick={starta} disabled={laddar}>
                <Icon name="kamera" size={20} /> Starta kameran
              </button>
            </>
          ) : (
            <>
              <p className="text-muted">Håll streckkoden inom ramen.</p>
              <button type="button" className="btn" onClick={() => { stoppa.current(); setKor(false); }}>Stoppa</button>
            </>
          )}
          <p role="status" aria-live="polite" className="text-sm text-muted">{laddar ? "Slår upp …" : info}</p>
        </div>
      </div>

      <form
        className="card flex flex-col gap-3 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (manuell.replace(/\D/g, "").length >= 8) slaUpp(manuell.replace(/\D/g, ""));
          else setRes({ status: "ogiltig", meddelande: "En streckkod har 8–14 siffror." });
        }}
      >
        <label htmlFor="ean" className="font-semibold">Eller skriv in streckkoden</label>
        <div className="flex gap-2">
          <input id="ean" className="input" inputMode="numeric" autoComplete="off" value={manuell} onChange={(e) => setManuell(e.target.value)} placeholder="T.ex. 7312040017683" />
          <button type="submit" className="btn shrink-0" disabled={laddar}>Sök</button>
        </div>
      </form>

      {res && (
        <section className="card flex flex-col gap-3 p-5" role="alert">
          <p className="font-semibold">
            {res.status === "saknas" && "Vi hittade inte streckkoden. Lägg till flaskan själv, så finns den nästa gång."}
            {res.status === "inte-dryck" && `Hittade ${res.namn ? `"${res.namn}"` : "produkten"}, men det verkar inte vara vin eller sprit.`}
            {(res.status === "fel" || res.status === "ogiltig") && res.meddelande}
          </p>
          {res.status !== "ogiltig" && (
            <>
              <p className="text-sm text-muted">Lägg till flaskan på ett annat sätt. Streckkoden sparas så att nästa skanning hittar den.</p>
              <div className="flex flex-wrap gap-2">
                <Link href="/lagg-till/foto" className="btn btn-gold !min-h-11"><Icon name="kamera" size={18} /> Fota etiketten</Link>
                <Link href={`/lagg-till/ny?ean=${encodeURIComponent(ean)}`} className="btn !min-h-11">Fyll i själv</Link>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
