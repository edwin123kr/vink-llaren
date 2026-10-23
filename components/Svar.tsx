import { Fragment, type ReactNode } from "react";

/**
 * Liten, säker markdown-tolk för sommelierns svar: stycken, punkt- och nummerlistor, ### rubriker,
 * **fetstil**, *kursiv* och länkar. Bygger React-element (ingen HTML injiceras).
 */
function inline(text: string, nyckel: string): ReactNode[] {
  const ut: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\*([^*\s][^*]*)\*|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
  let senast = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > senast) ut.push(text.slice(senast, m.index));
    const k = `${nyckel}-${i++}`;
    if (m[1]) ut.push(<strong key={k} className="font-semibold text-text">{m[1]}</strong>);
    else if (m[2]) ut.push(<em key={k}>{m[2]}</em>);
    else ut.push(<a key={k} href={m[4]} target="_blank" rel="noopener noreferrer" className="text-gold underline underline-offset-2">{m[3]}</a>);
    senast = m.index + m[0].length;
  }
  if (senast < text.length) ut.push(text.slice(senast));
  return ut;
}

export function Svar({ text }: { text: string }) {
  const block: ReactNode[] = [];
  let lista: { typ: "ul" | "ol"; rader: string[] } | null = null;
  let stycke: string[] = [];
  const flushStycke = () => {
    if (stycke.length) block.push(<p key={`p${block.length}`}>{stycke.map((r, i) => <Fragment key={i}>{i > 0 && <br />}{inline(r, `p${block.length}-${i}`)}</Fragment>)}</p>);
    stycke = [];
  };
  const flushLista = () => {
    if (lista) {
      const L = lista.typ;
      const items = lista.rader.map((r, i) => <li key={i}>{inline(r, `l${block.length}-${i}`)}</li>);
      block.push(L === "ul" ? <ul key={`l${block.length}`} className="list-disc space-y-1 pl-5">{items}</ul> : <ol key={`l${block.length}`} className="list-decimal space-y-1 pl-5">{items}</ol>);
    }
    lista = null;
  };
  for (const rad of text.replace(/\r/g, "").split("\n")) {
    const ul = rad.match(/^\s*[-*•]\s+(.*)$/);
    const ol = rad.match(/^\s*\d+[.)]\s+(.*)$/);
    const h = rad.match(/^#{1,4}\s+(.*)$/);
    if (ul || ol) {
      flushStycke();
      const typ = ul ? "ul" : "ol";
      if (lista && lista.typ !== typ) flushLista();
      lista ??= { typ, rader: [] };
      lista.rader.push((ul ?? ol)![1]);
    } else if (h) {
      flushStycke();
      flushLista();
      block.push(<h3 key={`h${block.length}`} className="font-semibold text-text">{inline(h[1], `h${block.length}`)}</h3>);
    } else if (!rad.trim()) {
      flushStycke();
      flushLista();
    } else {
      flushLista();
      stycke.push(rad);
    }
  }
  flushStycke();
  flushLista();
  return <div className="flex flex-col gap-3 leading-relaxed">{block}</div>;
}
