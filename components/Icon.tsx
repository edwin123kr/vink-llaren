/** Egna linjeikoner (24×24, 1,75 px streck). Dekorativa som standard; ge `label` när ikonen bär mening själv. */
const PATHS = {
  samling: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  smak: "M12 3l2.4 5.6L20 9.3l-4.4 3.9 1.3 5.8L12 16l-4.9 3 1.3-5.8L4 9.3l5.6-.7z",
  glas: "M7 3h10l-1 7a4 4 0 0 1-8 0zM12 14v7M8 21h8",
  mer: "M5 12h.01M12 12h.01M19 12h.01",
  plus: "M12 5v14M5 12h14",
  sok: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-3.5-3.5",
  kamera: "M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  streckkod: "M4 5v14M7 5v14M10 5v14M14 5v14M17 5v14M20 5v14",
  penna: "M4 20h4L19 9l-4-4L4 16zM13 7l4 4",
  hjarta: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z",
  stapel: "M5 20V10M12 20V4M19 20v-7",
  export: "M12 4v11M7 9l5-5 5 5M5 20h14",
  bok: "M5 4h10a4 4 0 0 1 4 4v12H9a4 4 0 0 1-4-4zM5 16a4 4 0 0 1 4-4h10",
  pil: "M9 6l6 6-6 6",
  person: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  prata: "M4 5h16v11H10l-5 4v-4H4zM8 9h8M8 12h5",
  skicka: "M4 12l16-8-6 16-2-7z",
  flaska: "M10 3h4v4l2 3v11H8V10l2-3zM8 14h8",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 22, label, className = "" }: { name: IconName; size?: number; label?: string; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
