"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";

const prenumerera = (cb: () => void) => {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
};

/** Registrerar service workern (bara i produktionsbygget) och visar en rad när nätet saknas. */
export function Pwa() {
  const online = useSyncExternalStore(prenumerera, () => navigator.onLine, () => true);
  const path = usePathname();

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  // Förvärm offlinecachen med sidorna som länkas från den här sidan (t.ex. alla flaskor i samlingen).
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator) || !navigator.onLine) return;
    const t = window.setTimeout(async () => {
      const reg = await navigator.serviceWorker.ready;
      const urls = [...document.querySelectorAll<HTMLAnchorElement>('main a[href^="/flaska/"]')].map((a) => a.getAttribute("href")!).filter((h) => !h.endsWith("/redigera"));
      reg.active?.postMessage({ typ: "forvarma", urls });
    }, 2500);
    return () => window.clearTimeout(t);
  }, [path]);

  // Offline kan Next inte hämta sidan som data vid klientnavigering. Gör då vanliga sidladdningar,
  // så att service workern kan svara med den sparade sidan.
  useEffect(() => {
    if (online) return;
    const klick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target || a.hasAttribute("download") || a.origin !== location.origin) return;
      e.preventDefault();
      e.stopPropagation();
      location.assign(a.href);
    };
    window.addEventListener("click", klick, true);
    return () => window.removeEventListener("click", klick, true);
  }, [online]);

  if (online) return null;
  return (
    <div role="status" className="fixed inset-x-0 top-0 z-50 bg-wine px-4 py-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] text-center text-sm text-text shadow-lg">
      Du är offline. Du kan bläddra i det som är sparat, men ändringar kräver anslutning.
    </div>
  );
}
