import { describe, it, expect } from "vitest";
import { buildPdf } from "../server/lib/pdf";
import { buildXlsx } from "../server/lib/xlsx";
import { contactsOf, makeMeta } from "../server/lib/report";
const meta = makeMeta({ telegramUrl: "https://t.me/cloudytoys", instagramUrl: "https://instagram.com/cloudytoys", facebookUrl: "" }, "2026-10-25", { intro: "Hello!", summary: [["Orders", "2"]] });
describe("branded reports", () => {
  it("contact lines list only the links the admin has set", () => { expect(contactsOf({ telegramUrl: "https://t.me/x", facebookUrl: "" })).toEqual(["Telegram: t.me/x"]); expect(meta.contacts).toHaveLength(2); });
  it("PDF has the shop name, copyright and one page per ~25 rows", () => {
    const rows = Array.from({ length: 60 }, (_, i) => [`R${i}`, "x"]);
    const pdf = buildPdf({ title: "Orders", cols: [{ header: "A", chars: 5 }, { header: "B", chars: 5, right: true }], rows, meta }).toString("latin1");
    expect(pdf.startsWith("%PDF-1.4")).toBe(true); expect(pdf).toContain("(Cloudy Toys)"); expect(pdf).toContain("All rights reserved."); expect(pdf).toMatch(/\/Count [3-9]/);
  });
  it("PDF works for an empty report", () => { expect(buildPdf({ title: "Orders", cols: [{ header: "A", chars: 5 }], rows: [], meta }).length).toBeGreaterThan(500); });
  it("Excel file is a zip with a sheet and keeps numbers as numbers", () => {
    const x = buildXlsx({ title: "Orders", sheet: "Orders", cols: [{ header: "Order number" }, { header: "Total Sale" }], rows: [["CT-1", "12.50"], ["CT-2", 3]], meta });
    expect(x.subarray(0, 2).toString()).toBe("PK"); expect(x.includes(Buffer.from("xl/worksheets/sheet1.xml"))).toBe(true);
  });
});
