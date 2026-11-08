/**
 * Minimal PDF 1.4 writer: one full-page JPEG image per page. Pages are
 * rendered with the browser's text engine (canvas), so Persian shaping and
 * RTL work offline without embedding font subsets.
 */

export interface PdfPageImage {
  /** Baseline JPEG bytes (as produced by `canvas.toBlob(…, "image/jpeg")`). */
  jpeg: Uint8Array;
  widthPx: number;
  heightPx: number;
}

/** A4 in PDF points (1/72 inch). */
export const A4_POINTS = { width: 595.28, height: 841.89 } as const;

const encoder = new TextEncoder();

/** PDF text string; non-ASCII text is written as UTF-16BE hex with BOM. */
function pdfString(text: string): string {
  if (/^[\x20-\x7e]*$/.test(text)) return `(${text.replace(/[\\()]/g, (c) => `\\${c}`)})`;
  let hex = "FEFF";
  for (let i = 0; i < text.length; i += 1)
    hex += text.charCodeAt(i).toString(16).padStart(4, "0").toUpperCase();
  return `<${hex}>`;
}

export function buildImagePdf(
  pages: readonly PdfPageImage[],
  options: { title?: string; pageSize?: { width: number; height: number } } = {},
): Uint8Array {
  const { width, height } = options.pageSize ?? A4_POINTS;
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let length = 0;
  const push = (data: string | Uint8Array) => {
    const bytes = typeof data === "string" ? encoder.encode(data) : data;
    chunks.push(bytes);
    length += bytes.length;
  };
  const object = (id: number, body: () => void) => {
    offsets[id] = length;
    push(`${id} 0 obj\n`);
    body();
    push("\nendobj\n");
  };

  // Object ids: 1 catalog, 2 pages, 3 info, then 3 per page (page, content, image).
  const pageId = (i: number) => 4 + i * 3;
  const size = 4 + pages.length * 3;
  const w = width.toFixed(2);
  const h = height.toFixed(2);

  push("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
  object(1, () => push("<< /Type /Catalog /Pages 2 0 R >>"));
  object(2, () =>
    push(
      `<< /Type /Pages /Kids [${pages.map((_, i) => `${pageId(i)} 0 R`).join(" ")}] /Count ${pages.length} >>`,
    ),
  );
  object(3, () =>
    push(
      `<< /Producer (Heimkasse)${options.title ? ` /Title ${pdfString(options.title)}` : ""} >>`,
    ),
  );
  pages.forEach((page, i) => {
    const id = pageId(i);
    const content = `q ${w} 0 0 ${h} 0 0 cm /Im0 Do Q`;
    object(id, () =>
      push(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Im0 ${id + 2} 0 R >> >> /Contents ${id + 1} 0 R >>`,
      ),
    );
    object(id + 1, () => push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`));
    object(id + 2, () => {
      push(
        `<< /Type /XObject /Subtype /Image /Width ${page.widthPx} /Height ${page.heightPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.jpeg.length} >>\nstream\n`,
      );
      push(page.jpeg);
      push("\nendstream");
    });
  });

  const xrefOffset = length;
  push(`xref\n0 ${size}\n0000000000 65535 f \n`);
  for (let id = 1; id < size; id += 1) push(`${String(offsets[id]).padStart(10, "0")} 00000 n \n`);
  push(`trailer\n<< /Size ${size} /Root 1 0 R /Info 3 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);

  const out = new Uint8Array(length);
  let pos = 0;
  for (const chunk of chunks) {
    out.set(chunk, pos);
    pos += chunk.length;
  }
  return out;
}
