import { describe, expect, it } from "vitest";
import {
  accountFromRow,
  accountToRow,
  budgetFromRow,
  budgetToRow,
  fromCents,
  transactionFromRow,
  transactionToRow,
} from "../lib/finance-repository";

describe("finance repository mapping", () => {
  it("converte dinheiro em centavos inteiros na borda do banco", () => {
    expect(accountToRow({ name: "Conta", type: "Conta corrente", color: "#0B6B62", initialBalance: 12.34, includeInTotal: true }, "user-1").initial_balance_cents).toBe(1234);
    const transaction = transactionToRow({ kind: "expense", status: "paid", description: "Café", amount: 0.1 + 0.2, date: "2026-09-06", importFingerprint: "ofx:abc" }, "user-1");
    expect(transaction.amount_cents).toBe(30);
    expect(transaction.import_fingerprint).toBe("ofx:abc");
    expect(fromCents("1234")).toBe(12.34);
  });

  it("mapeia account type e campos de arquivamento", () => {
    const account = accountFromRow({ id: "a", name: "Reserva", account_type: "savings", color: "#3777B4", initial_balance_cents: "999", include_in_total: true, archived_at: "2026-09-01T00:00:00Z" });
    expect(account).toMatchObject({ type: "Poupança", initialBalance: 9.99, archived: true });
  });

  it("normaliza mês de orçamento e parcelas de lançamento", () => {
    expect(budgetToRow({ categoryId: "cat", amount: 50, month: "2026-09" }, "user-1").month).toBe("2026-09-01");
    expect(budgetFromRow({ id: "b", category_id: "cat", amount_cents: 5000, month: "2026-09-01" })).toMatchObject({ month: "2026-09", amount: 50 });
    const transaction = transactionFromRow({ id: "t", kind: "card", status: "paid", description: "Curso", amount_cents: 10000, transaction_date: "2026-09-06", recurring: false, installment_current: 2, installment_total: 8, import_fingerprint: "ofx:abc", created_at: "2026-09-06T12:00:00Z" });
    expect(transaction.installment).toEqual({ current: 2, total: 8 });
    expect(transaction.importFingerprint).toBe("ofx:abc");
  });
});
