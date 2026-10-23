import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Vinkällaren",
    short_name: "Vinkällaren",
    description: "Håll koll på din vin- och spritsamling, din smakprofil och dina vinprovningar.",
    lang: "sv",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#120e0f",
    theme_color: "#120e0f",
    categories: ["food", "lifestyle"],
    icons: [
      { src: "/ikoner/ikon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/ikoner/ikon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/ikoner/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/ikoner/ikon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
    shortcuts: [
      { name: "Lägg till flaska", url: "/lagg-till", icons: [{ src: "/ikoner/ikon-192.png", sizes: "192x192" }] },
      { name: "Vinprovning", url: "/provning", icons: [{ src: "/ikoner/ikon-192.png", sizes: "192x192" }] },
      { name: "Smakprofil", url: "/smakprofil", icons: [{ src: "/ikoner/ikon-192.png", sizes: "192x192" }] },
    ],
  };
}
