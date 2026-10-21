// Dependency-free PDF table writer (A4 landscape, Courier). Latin-1 text only: other characters (e.g. Khmer) print as "?". Use CSV for full Unicode.
export type PdfCol = { header: string; chars: number; right?: boolean };
const W = 842, H = 595, M = 30, FS = 8, LH = 11, TOP = 512, BOTTOM = 40;
const ROWS_PER_PAGE = Math.floor((TOP - BOTTOM) / LH);
const clean = (s: string) => s.replace(/[\r\n\t]+/g, " ").replace(/[^\x20-\x7e\xa0-\xff]/g, "?");
const esc = (s: string) => clean(s).replace(/[\\()]/g, (c) => "\\" + c).replace(/[\x80-\xff]/g, (c) => "\\" + c.charCodeAt(0).toString(8).padStart(3, "0"));
const fit = (s: string, n: number, right?: boolean) => { let t = clean(s); if (t.length > n) t = t.slice(0, Math.max(1, n - 1)) + "."; return right ? t.padStart(n) : t.padEnd(n); };
export function buildPdf(o: { title: string; subtitle?: string; cols: PdfCol[]; rows: string[][] }): Buffer {
  const line = (cells: string[]) => cells.map((c, i) => fit(c, o.cols[i].chars, o.cols[i].right)).join("  ");
  const header = line(o.cols.map((c) => c.header));
  const pages: string[][][] = []; for (let i = 0; i < o.rows.length || i === 0; i += ROWS_PER_PAGE) pages.push(o.rows.slice(i, i + ROWS_PER_PAGE));
  const objs: string[] = [];
  const add = (s: string) => { objs.push(s); return objs.length; };
  add("<< /Type /Catalog /Pages 2 0 R >>"); add("PAGES");
  add("<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>");
  add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
  add("<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold /Encoding /WinAnsiEncoding >>");
  const kids: number[] = [];
  pages.forEach((rows, pi) => {
    let c = `BT /F2 14 Tf ${M} 560 Td (${esc(o.title)}) Tj ET\n`;
    if (o.subtitle) c += `BT /F1 8 Tf ${M} 546 Td (${esc(o.subtitle)}) Tj ET\n`;
    c += `BT /F3 ${FS} Tf ${M} 526 Td (${esc(header)}) Tj ET\n0.5 w ${M} 522 m ${W - M} 522 l S\n`;
    c += `BT /F1 ${FS} Tf ${LH} TL ${M} ${TOP} Td\n` + rows.map((r) => `(${esc(line(r))}) '`).join("\n") + `\nET\n`;
    c += `BT /F1 7 Tf ${M} 20 Td (${esc(`Page ${pi + 1} of ${pages.length}  -  Cloudy-Toy`)}) Tj ET\n`;
    const content = add(`<< /Length ${c.length} >>\nstream\n${c}endstream`);
    kids.push(add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents ${content} 0 R >>`));
  });
  objs[1] = `<< /Type /Pages /Count ${kids.length} /Kids [${kids.map((k) => `${k} 0 R`).join(" ")}] >>`;
  let out = "%PDF-1.4\n"; const offsets: number[] = [];
  objs.forEach((b, i) => { offsets.push(out.length); out += `${i + 1} 0 obj\n${b}\nendobj\n`; });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offsets.map((x) => `${String(x).padStart(10, "0")} 00000 n \n`).join("") + `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(out, "latin1");
}
