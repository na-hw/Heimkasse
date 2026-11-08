import { describe, expect, it } from "vitest";
import { buildImagePdf } from "./pdf";

const decode = (bytes: Uint8Array) => new TextDecoder("latin1").decode(bytes);
const fakeJpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 0xff, 0xd9]);

describe("buildImagePdf", () => {
  const pdf = buildImagePdf(
    [
      { jpeg: fakeJpeg, widthPx: 10, heightPx: 14 },
      { jpeg: fakeJpeg, widthPx: 10, heightPx: 14 },
    ],
    { title: "Bericht – März" },
  );
  const text = decode(pdf);

  it("writes a PDF with one page per image", () => {
    expect(text.startsWith("%PDF-1.4")).toBe(true);
    expect(text.trimEnd().endsWith("%%EOF")).toBe(true);
    expect(text).toContain("/Count 2");
    expect(text.match(/\/Subtype \/Image/g)).toHaveLength(2);
  });

  it("has a correct cross-reference table", () => {
    const startxref = Number(/startxref\n(\d+)/.exec(text)?.[1]);
    expect(text.slice(startxref, startxref + 4)).toBe("xref");
    const entries = [...text.slice(startxref).matchAll(/(\d{10}) 00000 n/g)].map((m) =>
      Number(m[1]),
    );
    expect(entries).toHaveLength(9);
    entries.forEach((offset, i) => expect(text.startsWith(`${i + 1} 0 obj\n`, offset)).toBe(true));
  });

  it("encodes non-ASCII titles as UTF-16", () => {
    expect(text).toContain("/Title <FEFF");
  });
});
