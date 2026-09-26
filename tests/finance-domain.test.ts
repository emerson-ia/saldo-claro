import { describe, expect, it } from "vitest";
import {
  calculateAccountBalance,
  createDemoData,
  currentMonth,
  getMonthlySummary,
  getEndOfMonthForecast,
  getFinancialAlerts,
  generateRecurringTransactions,
  getSafeToSpendSummary,
  isInMonth,
  shiftMonth,
  type Account,
  type FinanceData,
  type Transaction,
} from "../lib/finance-domain";

const accountA: Account = { id: "a", name: "Conta A", type: "Conta corrente", color: "#0B6B62", initialBalance: 1000, includeInTotal: true };
const accountB: Account = { id: "b", name: "Conta B", type: "Poupança", color: "#3777B4", initialBalance: 0, includeInTotal: true };
const month = currentMonth();

function makeData(transactions: Transaction[]): FinanceData {
  return { accounts: [accountA, accountB], categories: [], cards: [], transactions, budgets: [], goals: [], recurringRules: [], safetyBuffer: 0, demoMode: false, hasSeenWelcome: true };
}

describe("regras de cálculo financeiro", () => {
  it("navega entre meses sem quebrar na virada de ano", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(isInMonth("2026-09-06", "2026-09")).toBe(true);
    expect(isInMonth("2026-08-31", "2026-09")).toBe(false);
  });

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

  it("responde o quanto é seguro gastar, sem contar contas, cartão, metas e margem como livres", () => {
    const commitments: Transaction[] = [
      { id: "t4", kind: "expense", description: "Internet", amount: 120, date: `${month}-20`, dueDate: `${month}-20`, accountId: "a", status: "pending", createdAt: `${month}-01` },
      { id: "t5", kind: "card", description: "Mercado", amount: 180, date: `${month}-20`, cardId: "card-1", status: "paid", createdAt: `${month}-01` },
    ];
    const data = { ...makeData(commitments), goals: [{ id: "g1", name: "Viagem", target: 2000, saved: 250, targetDate: "", color: "#0B6B62" }], safetyBuffer: 100 };
    const summary = getSafeToSpendSummary(data, `${month}-01`);
    expect(summary.accountBalance).toBe(1000);
    expect(summary.scheduledExpenses).toBe(120);
    expect(summary.cardCommitments).toBe(180);
    expect(summary.goalReserve).toBe(250);
    expect(summary.available).toBe(350);
  });

  it("projeta o fim do mês sem tratar compra no cartão como saldo já debitado", () => {
    const forecastEntries: Transaction[] = [
      { id: "t6", kind: "income", description: "Freela", amount: 400, date: `${month}-24`, accountId: "a", status: "pending", createdAt: `${month}-01` },
      { id: "t7", kind: "expense", description: "Internet", amount: 120, date: `${month}-25`, accountId: "a", status: "pending", createdAt: `${month}-01` },
      { id: "t8", kind: "card", description: "Mercado", amount: 180, date: `${month}-12`, cardId: "card-1", status: "paid", createdAt: `${month}-01` },
    ];
    const forecast = getEndOfMonthForecast(makeData(forecastEntries), `${month}-10`);
    expect(forecast.accountBalance).toBe(1000);
    expect(forecast.expectedIncome).toBe(400);
    expect(forecast.expectedExpenses).toBe(120);
    expect(forecast.cardCommitments).toBe(180);
    expect(forecast.projectedBalance).toBe(1100);
  });

  it("gera alertas explicáveis para orçamento em risco, limite e fatura maior", () => {
    const alertData: FinanceData = {
      ...makeData([
        { id: "food-1", kind: "expense", description: "Mercado", amount: 450, date: "2026-09-10", accountId: "a", categoryId: "food", status: "paid", createdAt: "2026-09-10" },
        { id: "card-now", kind: "card", description: "Compras", amount: 310, date: "2026-09-12", cardId: "card-1", status: "paid", createdAt: "2026-09-12" },
        { id: "card-before", kind: "card", description: "Compras", amount: 200, date: "2026-08-12", cardId: "card-1", status: "paid", createdAt: "2026-08-12" },
      ]),
      categories: [{ id: "food", name: "Alimentação", kind: "expense", color: "#D97B18", icon: "restaurant" }],
      cards: [{ id: "card-1", name: "Cartão principal", brand: "Visa", limit: 350, closingDay: 25, dueDay: 5, color: "#163C57" }],
      budgets: [{ id: "food-budget", categoryId: "food", amount: 500, month: "2026-09" }],
    };
    const alerts = getFinancialAlerts(alertData, "2026-09-15");
    expect(alerts.map((alert) => alert.id)).toEqual(expect.arrayContaining(["budget-pace-food-budget", "card-limit-card-1", "card-increase-card-1"]));
    expect(alerts.find((alert) => alert.id === "card-increase-card-1")?.description).toContain("55% acima");
  });

  it("não avisa que orçamento vai estourar quando o ritmo cabe no limite", () => {
    const calmData: FinanceData = {
      ...makeData([{ id: "food-2", kind: "expense", description: "Mercado", amount: 100, date: "2026-09-10", accountId: "a", categoryId: "food", status: "paid", createdAt: "2026-09-10" }]),
      categories: [{ id: "food", name: "Alimentação", kind: "expense", color: "#D97B18", icon: "restaurant" }],
      budgets: [{ id: "food-budget", categoryId: "food", amount: 500, month: "2026-09" }],
    };
    expect(getFinancialAlerts(calmData, "2026-09-15")).toHaveLength(0);
  });

  it("gera ocorrências mensais sem duplicar a ocorrência já registrada", () => {
    const rule = { id: "rule-1", kind: "expense" as const, description: "Academia", amount: 99.9, startDate: `${month}-05`, dayOfMonth: 5, accountId: "a", active: true, createdAt: `${month}-01` };
    const existing: Transaction[] = [{ id: "existing", kind: "expense", description: "Academia", amount: 99.9, date: `${month}-05`, dueDate: `${month}-05`, accountId: "a", status: "pending", recurring: true, recurrenceId: "rule-1", createdAt: `${month}-01` }];
    const generated = generateRecurringTransactions([rule], existing, `${month}-01`);
    expect(generated).toHaveLength(2);
    expect(generated.map((item) => item.date)).toEqual([`${shiftMonth(month, 1)}-05`, `${shiftMonth(month, 2)}-05`]);
    expect(generated.every((item) => item.status === "pending" && item.recurrenceId === "rule-1")).toBe(true);
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
