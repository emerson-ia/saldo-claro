import { describe, expect, it } from "vitest";
import {
  calculateAccountBalance,
  createDemoData,
  currentMonth,
  getMonthlySummary,
  type Account,
  type FinanceData,
  type Transaction,
} from "../lib/finance-domain";

const accountA: Account = { id: "a", name: "Conta A", type: "Conta corrente", color: "#0B6B62", initialBalance: 1000, includeInTotal: true };
const accountB: Account = { id: "b", name: "Conta B", type: "Poupança", color: "#3777B4", initialBalance: 0, includeInTotal: true };
const month = currentMonth();

function makeData(transactions: Transaction[]): FinanceData {
  return { accounts: [accountA, accountB], categories: [], cards: [], transactions, budgets: [], goals: [], demoMode: false, hasSeenWelcome: true };
}

describe("regras de cálculo financeiro", () => {
  it("calcula transferências nos saldos sem tratá-las como receita ou despesa", () => {
    const transfer: Transaction = { id: "t1", kind: "transfer", description: "Reserva", amount: 300, date: `${month}-10`, accountId: "a", destinationAccountId: "b", status: "paid", createdAt: `${month}-10` };
    const data = makeData([transfer]);
    expect(calculateAccountBalance(accountA, data.transactions)).toBe(700);
    expect(calculateAccountBalance(accountB, data.transactions)).toBe(300);
    expect(getMonthlySummary(data, month).income).toBe(0);
    expect(getMonthlySummary(data, month).expenses).toBe(0);
  });

  it("inclui lançamentos pendentes na previsão, mas não no saldo realizado", () => {
    const pendingExpense: Transaction = { id: "t2", kind: "expense", description: "Internet", amount: 120, date: `${month}-20`, accountId: "a", status: "pending", createdAt: `${month}-20` };
    const data = makeData([pendingExpense]);
    const summary = getMonthlySummary(data, month);
    expect(calculateAccountBalance(accountA, data.transactions)).toBe(1000);
    expect(summary.balance).toBe(1000);
    expect(summary.forecast).toBe(880);
    expect(summary.expenses).toBe(120);
  });

  it("não altera o saldo da conta com compra no cartão", () => {
    const cardPurchase: Transaction = { id: "t3", kind: "card", description: "Curso", amount: 250, date: `${month}-12`, cardId: "card-1", status: "paid", createdAt: `${month}-12` };
    const data = makeData([cardPurchase]);
    const summary = getMonthlySummary(data, month);
    expect(calculateAccountBalance(accountA, data.transactions)).toBe(1000);
    expect(summary.expenses).toBe(250);
  });

  it("entrega dados demonstrativos separados com contas, cartões e planejamento", () => {
    const demo = createDemoData();
    expect(demo.demoMode).toBe(true);
    expect(demo.accounts).toHaveLength(2);
    expect(demo.cards).toHaveLength(2);
    expect(demo.budgets.length).toBeGreaterThan(0);
    expect(demo.goals).toHaveLength(1);
  });
});
