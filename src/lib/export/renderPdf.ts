import type { ExportDocument, ExportTable } from "./document";
import { A4_POINTS, buildImagePdf, type PdfPageImage } from "./pdf";

/**
 * Renders an export document onto A4 canvases and packs them into a PDF.
 * Browser-only (uses canvas + document.fonts); the layout is in PDF points.
 */

const SCALE = 2; // canvas pixels per point (~144 dpi)
const MARGIN = 40;
const FOOTER = 24;
const ROW = 18;
const HEAD_ROW = 20;
const COLORS = {
  text: "#17201c",
  muted: "#5f6a65",
  rule: "#d5dbd7",
  zebra: "#f3f5f4",
  bar: "#1d6b58",
};

type Op = (ctx: CanvasRenderingContext2D) => void;

export interface RenderOptions {
  /** Localized "page i of n" label. */
  pageLabel: (page: number, total: number) => string;
}

function fontFamily(language: string): string {
  return language === "fa"
    ? '"Vazirmatn Variable", "Inter Variable", sans-serif'
    : '"Inter Variable", "Vazirmatn Variable", sans-serif';
}

async function loadFonts(family: string): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  const samples = ["Aa 0123 €", "آب ۱۲۳"];
  await Promise.all(
    [400, 600].flatMap((weight) =>
      samples.map((text) => document.fonts.load(`${weight} 12px ${family}`, text).catch(() => [])),
    ),
  );
}

function fit(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxWidth) cut = cut.slice(0, -1);
  return `${cut}…`;
}

class Layout {
  readonly pages: Op[][] = [[]];
  y = MARGIN;
  private readonly width = A4_POINTS.width - 2 * MARGIN;

  constructor(
    private readonly rtl: boolean,
    private readonly family: string,
  ) {}

  /** x coordinate of a position measured from the start (reading) edge. */
  x(offsetFromStart: number): number {
    return this.rtl ? A4_POINTS.width - MARGIN - offsetFromStart : MARGIN + offsetFromStart;
  }

  get contentWidth() {
    return this.width;
  }

  private get page(): Op[] {
    return this.pages[this.pages.length - 1] as Op[];
  }

  draw(op: Op) {
    this.page.push(op);
  }

  /** Starts a new page if `height` doesn't fit; returns true when it did. */
  ensure(height: number): boolean {
    if (this.y + height <= A4_POINTS.height - MARGIN - FOOTER) return false;
    this.pages.push([]);
    this.y = MARGIN;
    return true;
  }

  text(
    value: string,
    opts: {
      size: number;
      weight?: number;
      color?: string;
      offset?: number;
      width?: number;
      align?: "start" | "end";
    },
  ) {
    const {
      size,
      weight = 400,
      color = COLORS.text,
      offset = 0,
      width = this.width,
      align = "start",
    } = opts;
    const y = this.y;
    const anchor = this.x(align === "start" ? offset : offset + width);
    const font = `${weight} ${size}px ${this.family}`;
    this.draw((ctx) => {
      ctx.font = font;
      ctx.fillStyle = color;
      ctx.textAlign = align;
      ctx.fillText(fit(ctx, value, width - 4), anchor, y);
    });
  }

  rect(offset: number, top: number, width: number, height: number, color: string) {
    const x = this.rtl ? this.x(offset) - width : this.x(offset);
    this.draw((ctx) => {
      ctx.fillStyle = color;
      ctx.fillRect(x, top, width, height);
    });
  }
}

function layoutTable(layout: Layout, table: ExportTable) {
  const hasBars = Boolean(table.bars?.length);
  const weights = [...table.columns.map((c) => c.weight ?? 1), ...(hasBars ? [1.2] : [])];
  const total = weights.reduce((a, b) => a + b, 0);
  const widths = weights.map((w) => (w / total) * layout.contentWidth);
  const offsets = widths.map((_, i) => widths.slice(0, i).reduce((a, b) => a + b, 0));

  const header = () => {
    layout.y += HEAD_ROW - 6;
    table.columns.forEach((c, i) =>
      layout.text(c.header, {
        size: 9,
        weight: 600,
        color: COLORS.muted,
        offset: offsets[i],
        width: widths[i],
        align: c.align ?? "start",
      }),
    );
    layout.y += 6;
    layout.rect(0, layout.y - 1, layout.contentWidth, 0.75, COLORS.rule);
  };

  layout.ensure(26 + HEAD_ROW + ROW);
  layout.y += 22;
  layout.text(table.heading, { size: 13, weight: 600 });
  layout.y += 6;
  header();

  table.rows.forEach((row, r) => {
    if (layout.ensure(ROW)) header();
    const top = layout.y;
    if (r % 2 === 1) layout.rect(0, top, layout.contentWidth, ROW, COLORS.zebra);
    layout.y += ROW - 5;
    row.forEach((cell, i) =>
      layout.text(cell, {
        size: 10,
        offset: offsets[i],
        width: widths[i],
        align: table.columns[i]?.align ?? "start",
      }),
    );
    const ratio = table.bars?.[r];
    if (hasBars && ratio !== undefined) {
      const i = widths.length - 1;
      const max = (widths[i] ?? 0) - 8;
      layout.rect(
        (offsets[i] ?? 0) + 4,
        top + 5,
        Math.max(1, Math.min(1, ratio) * max),
        ROW - 10,
        COLORS.bar,
      );
    }
    layout.y = top + ROW;
  });
}

function layoutDocument(doc: ExportDocument, family: string): Layout {
  const layout = new Layout(doc.direction === "rtl", family);
  layout.y += 18;
  layout.text(doc.title, { size: 18, weight: 600 });
  if (doc.subtitle) {
    layout.y += 18;
    layout.text(doc.subtitle, { size: 11, color: COLORS.muted });
  }
  for (const table of doc.tables) layoutTable(layout, table);
  return layout;
}

async function canvasToJpeg(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.92),
  );
  if (!blob) throw new Error("Canvas export failed");
  return new Uint8Array(await blob.arrayBuffer());
}

/** Renders the document to a PDF (A4 portrait). */
export async function renderDocumentToPdf(
  doc: ExportDocument,
  options: RenderOptions,
): Promise<Uint8Array> {
  const family = fontFamily(doc.language);
  await loadFonts(family);
  const layout = layoutDocument(doc, family);
  const total = layout.pages.length;
  const images: PdfPageImage[] = [];

  for (const [index, ops] of layout.pages.entries()) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(A4_POINTS.width * SCALE);
    canvas.height = Math.round(A4_POINTS.height * SCALE);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(SCALE, SCALE);
    ctx.direction = doc.direction;
    ctx.textBaseline = "alphabetic";
    for (const op of ops) op(ctx);

    // Footer: note at the start edge, page number at the end edge.
    const footerY = A4_POINTS.height - MARGIN + 8;
    const start = doc.direction === "rtl" ? A4_POINTS.width - MARGIN : MARGIN;
    const end = doc.direction === "rtl" ? MARGIN : A4_POINTS.width - MARGIN;
    ctx.font = `400 8px ${family}`;
    ctx.fillStyle = COLORS.muted;
    if (doc.footnote) {
      ctx.textAlign = "start";
      ctx.fillText(doc.footnote, start, footerY);
    }
    ctx.textAlign = "end";
    ctx.fillText(options.pageLabel(index + 1, total), end, footerY);

    images.push({
      jpeg: await canvasToJpeg(canvas),
      widthPx: canvas.width,
      heightPx: canvas.height,
    });
  }
  return buildImagePdf(images, { title: doc.title });
}
