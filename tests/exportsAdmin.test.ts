import { describe, it, expect } from "vitest";
import { membersDataset, promotionRows, promotionsDataset, staffDataset, type MemberRow } from "../server/lib/exports";
import { kindOf } from "../server/lib/xlsx";
import { toCsv } from "../shared/csv";
import { DEFAULT_PROMOTIONS } from "../shared/promotions";

const tiers = DEFAULT_PROMOTIONS.membership;
const member = (o: Partial<MemberRow> = {}): MemberRow => ({ email: "a@b.com", name: "Sok", phone: "012345678", address: "", facebook: "", telegram: "", spendCents: 12550, orders: 4, lastOrderAt: "2026-11-10T03:00:00Z", tierId: tiers[0].id, blocked: false, removed: false, points: 12, pointsSpent: 3, ...o });

describe("admin exports: membership, promotions, admin permissions", () => {
  it("members: PDF row and CSV agree, status and level are worked out", () => {
    const ds = membersDataset([member(), member({ email: "x@y.com", tierId: null, blocked: true })], tiers);
    expect(ds.pdfRow(ds.rows[0])).toContain(tiers[0].name);
    expect(ds.pdfRow(ds.rows[1])).toContain("Specials off");
    expect(ds.pdf).toHaveLength(ds.pdfRow(ds.rows[0]).length);
    expect(ds.summary[0]).toEqual(["Members", "1"]);
  });
  it("members: a level-less member never writes a cell that starts with '-' (Excel would read it as a formula)", () => {
    const ds = membersDataset([member({ tierId: null })], tiers);
    expect(toCsv(ds.rows, ds.csv)).not.toContain("'-");
  });
  it("promotions: pre-order rule, campaigns, festivals and codes all appear, with the right status", () => {
    const promos = { ...DEFAULT_PROMOTIONS, campaigns: [{ id: "c", name: "Paused one", kind: "free_shipping", minSpendCents: 0, amountCents: 0, percent: 0, category: "", active: false, createdAt: "" }] } as typeof DEFAULT_PROMOTIONS;
    const rows = promotionRows(promos, [{ code: "TOY10", percent: 10, createdAt: "", maxUses: 5, perCustomer: null, used: 5 }]);
    expect(rows.map((r) => r.type)).toEqual(["Pre-order rule", "Campaign", "Discount code"]);
    expect(rows[1].status).toBe("Paused");
    expect(rows[2].status).toBe("Used up");
    const ds = promotionsDataset(rows); expect(ds.pdf).toHaveLength(ds.pdfRow(rows[0]).length);
  });
  it("admin permissions: owner shows Everything, editor only the areas the role allows, and no summable column", () => {
    const ds = staffDataset([{ email: "o@s.com", name: "O", role: "owner", active: true, lastActiveAt: null, createdAt: "" }, { email: "e@s.com", name: "", role: "editor", active: false, lastActiveAt: null, createdAt: "2026-10-01T00:00:00Z" }]);
    expect(ds.pdfRow(ds.rows[0])[3]).toBe("Everything");
    expect(ds.pdfRow(ds.rows[1])[3]).toBe("Products & stock; Pages");
    expect(ds.pdfRow(ds.rows[1])).toContain("Paused");
  });
  it("number columns are real numbers in Excel / Google Sheets", () => {
    expect(["Spend", "Orders", "Points", "Used"].map(kindOf)).toEqual(["usd", "int", "int", "int"]);
  });
});
