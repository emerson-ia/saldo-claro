import { describe, expect, it } from "vitest";
import type { Transaction } from "../lib/finance-domain";
import { reviewImportedTransactions } from "../lib/import-dedup";

const imported = { date: "2026-09-18", description: "Mercado Central", amount: 84.9, kind: "expense" as const };
const legacyTransaction = (id: string): Transaction => ({
  id,
  ...imported,
  accountId: "account-1",
  status: "paid",
  createdAt: "2026-09-18T12:00:00Z",
});

describe("import review", () => {
  it("ignora uma linha que já existe, sem remover o histórico", () => {
    const existing = [legacyTransaction("old-1")];
    const review = reviewImportedTransactions([imported], existing, "account-1");

    expect(review).toMatchObject({ skipped: 1, newItems: [] });
    expect(existing).toHaveLength(1);
  });

  it("preserva duplicidades históricas e não adiciona uma terceira cópia", () => {
    const existing = [legacyTransaction("old-1"), legacyTransaction("old-2")];
    const review = reviewImportedTransactions([imported], existing, "account-1");

    expect(review).toMatchObject({ skipped: 1, newItems: [] });
    expect(existing).toHaveLength(2);
  });

  it("importa somente a ocorrência que ainda falta quando duas linhas idênticas são legítimas", () => {
    const review = reviewImportedTransactions([imported, imported], [legacyTransaction("old-1")], "account-1");

    expect(review.skipped).toBe(1);
    expect(review.newItems).toHaveLength(1);
    expect(review.newItems[0]?.importFingerprint).toMatch(/^file:/);
  });

  it("reconhece novamente uma linha OFX pelo FITID", () => {
    const first = reviewImportedTransactions([{ ...imported, sourceTransactionId: "bank-fitid-42" }], [], "account-1");
    const existing: Transaction = { ...legacyTransaction("imported-1"), importFingerprint: first.newItems[0]?.importFingerprint };
    const second = reviewImportedTransactions([{ ...imported, description: "Mercado Central LTDA", sourceTransactionId: "bank-fitid-42" }], [existing], "account-1");

    expect(second).toMatchObject({ skipped: 1, newItems: [] });
  });
});
