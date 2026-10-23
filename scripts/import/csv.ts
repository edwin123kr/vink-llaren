/** Minimal RFC 4180-tolkare (citattecken, kommatecken och radbrytningar i fält). */
export function* parseCsv(text: string, sep = ","): Generator<string[]> {
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
    } else if (c === '"' && field === "") quoted = true;
    else if (c === sep) {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.length > 1 || row[0] !== "") yield row;
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length) {
    row.push(field);
    yield row;
  }
}

/** Rader som objekt med rubrikraden som nycklar. */
export function* csvObjects(text: string, sep = ","): Generator<Record<string, string>> {
  let header: string[] | null = null;
  for (const r of parseCsv(text, sep)) {
    if (!header) {
      header = r.map((h) => h.replace(/^﻿/, "").trim());
      continue;
    }
    const o: Record<string, string> = {};
    header.forEach((h, i) => (o[h] = r[i] ?? ""));
    yield o;
  }
}

/** Pythons listlitteral "['Merlot', \"Nero d'Avola\"]" → ["Merlot", "Nero d'Avola"] */
export function pyList(s: string | undefined): string[] {
  if (!s) return [];
  const out: string[] = [];
  const re = /'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"|(-?\d+(?:\.\d+)?)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) out.push((m[1] ?? m[2] ?? m[3]).replace(/\\(.)/g, "$1"));
  return out;
}
