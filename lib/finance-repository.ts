import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createEmptyData,
  type Account,
  type Budget,
  type Category,
  type CreditCard,
  type FinanceData,
  type FinancialGoal,
  type Transaction,
} from "./finance-domain";

/** Database boundary: the app uses BRL numbers, while Postgres receives integer centavos. */
export function toCents(value: number) {
  if (!Number.isFinite(value) || !Number.isSafeInteger(Math.round(value * 100))) {
    throw new Error("O valor monetário informado não pode ser salvo com segurança.");
  }
  return Math.round(value * 100);
}

export function fromCents(value: number | string) {
  const cents = typeof value === "string" ? Number(value) : value;
  if (!Number.isSafeInteger(cents)) throw new Error("O valor monetário retornado pelo banco é inválido.");
  return cents / 100;
}

const accountTypes: Record<Account["type"], string> = {
  "Conta corrente": "checking",
  Poupança: "savings",
  Dinheiro: "cash",
  "Carteira digital": "digital_wallet",
  Investimentos: "investment",
  Outros: "other",
};
const domainAccountTypes: Record<string, Account["type"]> = {
  checking: "Conta corrente",
  savings: "Poupança",
  cash: "Dinheiro",
  digital_wallet: "Carteira digital",
  investment: "Investimentos",
  other: "Outros",
};

type Row = Record<string, unknown>;
const optionalString = (value: unknown) => (typeof value === "string" && value.length > 0 ? value : undefined);
const requiredString = (value: unknown, field: string) => {
  if (typeof value !== "string") throw new Error(`Registro financeiro inválido: ${field}.`);
  return value;
};
const archived = (row: Row) => Boolean(row.archived_at);

export function accountToRow(account: Omit<Account, "id">, userId: string) {
  return { user_id: userId, name: account.name, account_type: accountTypes[account.type], institution: account.institution ?? null, color: account.color, initial_balance_cents: toCents(account.initialBalance), include_in_total: account.includeInTotal, archived_at: account.archived ? new Date().toISOString() : null };
}
export function accountFromRow(row: Row): Account {
  const type = domainAccountTypes[requiredString(row.account_type, "account_type")];
  if (!type) throw new Error("Registro financeiro inválido: account_type.");
  return { id: requiredString(row.id, "id"), name: requiredString(row.name, "name"), type, institution: optionalString(row.institution), color: requiredString(row.color, "color"), initialBalance: fromCents(row.initial_balance_cents as number | string), includeInTotal: Boolean(row.include_in_total), archived: archived(row) || undefined };
}
export function categoryToRow(category: Omit<Category, "id">, userId: string) {
  return { user_id: userId, name: category.name, kind: category.kind, color: category.color, icon: category.icon, archived_at: category.archived ? new Date().toISOString() : null };
}
export function categoryFromRow(row: Row): Category {
  return { id: requiredString(row.id, "id"), name: requiredString(row.name, "name"), kind: requiredString(row.kind, "kind") as Category["kind"], color: requiredString(row.color, "color"), icon: requiredString(row.icon, "icon"), archived: archived(row) || undefined };
}
export function cardToRow(card: Omit<CreditCard, "id">, userId: string) {
  return { user_id: userId, account_id: card.accountId ?? null, name: card.name, brand: card.brand, last_digits: card.lastDigits ?? null, limit_cents: toCents(card.limit), closing_day: card.closingDay, due_day: card.dueDay, color: card.color, archived_at: card.archived ? new Date().toISOString() : null };
}
export function cardFromRow(row: Row): CreditCard {
  return { id: requiredString(row.id, "id"), name: requiredString(row.name, "name"), brand: requiredString(row.brand, "brand"), lastDigits: optionalString(row.last_digits), limit: fromCents(row.limit_cents as number | string), closingDay: Number(row.closing_day), dueDay: Number(row.due_day), color: requiredString(row.color, "color"), accountId: optionalString(row.account_id), archived: archived(row) || undefined };
}
export function transactionToRow(transaction: Omit<Transaction, "id" | "createdAt">, userId: string) {
  return { user_id: userId, kind: transaction.kind, status: transaction.status, description: transaction.description, amount_cents: toCents(transaction.amount), transaction_date: transaction.date, due_date: transaction.dueDate ?? null, account_id: transaction.accountId ?? null, destination_account_id: transaction.destinationAccountId ?? null, card_id: transaction.cardId ?? null, category_id: transaction.categoryId ?? null, note: transaction.note ?? null, installment_current: transaction.installment?.current ?? null, installment_total: transaction.installment?.total ?? null, recurring: transaction.recurring ?? false, import_fingerprint: transaction.importFingerprint ?? null };
}
export function transactionFromRow(row: Row): Transaction {
  const current = row.installment_current == null ? undefined : Number(row.installment_current);
  const total = row.installment_total == null ? undefined : Number(row.installment_total);
  return { id: requiredString(row.id, "id"), kind: requiredString(row.kind, "kind") as Transaction["kind"], status: requiredString(row.status, "status") as Transaction["status"], description: requiredString(row.description, "description"), amount: fromCents(row.amount_cents as number | string), date: requiredString(row.transaction_date, "transaction_date"), dueDate: optionalString(row.due_date), accountId: optionalString(row.account_id), destinationAccountId: optionalString(row.destination_account_id), cardId: optionalString(row.card_id), categoryId: optionalString(row.category_id), note: optionalString(row.note), installment: current && total ? { current, total } : undefined, recurring: Boolean(row.recurring), importFingerprint: optionalString(row.import_fingerprint), createdAt: requiredString(row.created_at, "created_at") };
}
export function budgetToRow(budget: Omit<Budget, "id">, userId: string) { return { user_id: userId, category_id: budget.categoryId, amount_cents: toCents(budget.amount), month: `${budget.month}-01` }; }
export function budgetFromRow(row: Row): Budget { return { id: requiredString(row.id, "id"), categoryId: requiredString(row.category_id, "category_id"), amount: fromCents(row.amount_cents as number | string), month: requiredString(row.month, "month").slice(0, 7) }; }
export function goalToRow(goal: Omit<FinancialGoal, "id">, userId: string) { return { user_id: userId, name: goal.name, target_cents: toCents(goal.target), saved_cents: toCents(goal.saved), target_date: goal.targetDate || null, color: goal.color }; }
export function goalFromRow(row: Row): FinancialGoal { return { id: requiredString(row.id, "id"), name: requiredString(row.name, "name"), target: fromCents(row.target_cents as number | string), saved: fromCents(row.saved_cents as number | string), targetDate: optionalString(row.target_date) ?? "", color: requiredString(row.color, "color") }; }

export type FinanceRepositoryIssue = "unavailable" | "schema_missing" | "request_failed" | "invalid_data";
export type RepositoryResult<T> = { ok: true; data: T } | { ok: false; issue: FinanceRepositoryIssue; error: Error };
function failure(error: unknown): RepositoryResult<never> {
  const candidate = error as { code?: string; message?: string } | null;
  const message = candidate?.message ?? "Não foi possível sincronizar os dados financeiros.";
  const issue: FinanceRepositoryIssue = candidate?.code === "42P01" || candidate?.code === "PGRST205" || /relation .* does not exist|Could not find the table/i.test(message) ? "schema_missing" : "request_failed";
  return { ok: false, issue, error: new Error(message) };
}
function rows(result: { data: Row[] | null; error: unknown }): RepositoryResult<Row[]> { return result.error ? failure(result.error) : { ok: true, data: result.data ?? [] }; }

export class FinanceRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async hydrate(userId: string): Promise<RepositoryResult<FinanceData>> {
    const [preferences, accounts, categories, cards, transactions, budgets, goals] = await Promise.all([
      this.supabase.from("finance_preferences").select("*").eq("user_id", userId).maybeSingle(),
      this.supabase.from("finance_accounts").select("*").eq("user_id", userId).is("deleted_at", null),
      this.supabase.from("finance_categories").select("*").eq("user_id", userId).is("deleted_at", null),
      this.supabase.from("finance_cards").select("*").eq("user_id", userId).is("deleted_at", null),
      this.supabase.from("finance_transactions").select("*").eq("user_id", userId).is("deleted_at", null).order("transaction_date", { ascending: false }),
      this.supabase.from("finance_budgets").select("*").eq("user_id", userId),
      this.supabase.from("finance_goals").select("*").eq("user_id", userId).is("deleted_at", null),
    ]);
    const results = [preferences, accounts, categories, cards, transactions, budgets, goals];
    const failed = results.find((result) => result.error);
    if (failed?.error) return failure(failed.error);
    try {
      const preference = preferences.data as Row | null;
      return { ok: true, data: { accounts: (accounts.data as Row[]).map(accountFromRow), categories: (categories.data as Row[]).map(categoryFromRow), cards: (cards.data as Row[]).map(cardFromRow), transactions: (transactions.data as Row[]).map(transactionFromRow), budgets: (budgets.data as Row[]).map(budgetFromRow), goals: (goals.data as Row[]).map(goalFromRow), demoMode: Boolean(preference?.demo_mode), hasSeenWelcome: Boolean(preference?.has_seen_welcome) } };
    } catch (error) { return { ok: false, issue: "invalid_data", error: error instanceof Error ? error : new Error("Dados financeiros inválidos.") }; }
  }

  async savePreferences(userId: string, data: Pick<FinanceData, "demoMode" | "hasSeenWelcome">) { return rows(await this.supabase.from("finance_preferences").upsert({ user_id: userId, demo_mode: data.demoMode, has_seen_welcome: data.hasSeenWelcome }, { onConflict: "user_id" }).select("user_id")); }
  async addAccount(userId: string, account: Account) { return rows(await this.supabase.from("finance_accounts").insert({ id: account.id, ...accountToRow(account, userId) }).select("*")); }
  async updateAccount(userId: string, id: string, account: Omit<Account, "id">) { return rows(await this.supabase.from("finance_accounts").update(accountToRow(account, userId)).eq("id", id).eq("user_id", userId).select("*")); }
  async deleteAccount(userId: string, id: string) { return rows(await this.supabase.from("finance_accounts").update({ deleted_at: new Date().toISOString() }).eq("id", id).eq("user_id", userId).select("id")); }
  async addCard(userId: string, card: CreditCard) { return rows(await this.supabase.from("finance_cards").insert({ id: card.id, ...cardToRow(card, userId) }).select("*")); }
  async updateCard(userId: string, id: string, card: Omit<CreditCard, "id">) { return rows(await this.supabase.from("finance_cards").update(cardToRow(card, userId)).eq("id", id).eq("user_id", userId).select("*")); }
  async deleteCard(userId: string, id: string) { return rows(await this.supabase.from("finance_cards").update({ deleted_at: new Date().toISOString() }).eq("id", id).eq("user_id", userId).select("id")); }
  async addCategory(userId: string, category: Category) { return rows(await this.supabase.from("finance_categories").insert({ id: category.id, ...categoryToRow(category, userId) }).select("*")); }
  async updateCategory(userId: string, id: string, category: Omit<Category, "id">) { return rows(await this.supabase.from("finance_categories").update(categoryToRow(category, userId)).eq("id", id).eq("user_id", userId).select("*")); }
  async addTransaction(userId: string, transaction: Transaction) { return rows(await this.supabase.from("finance_transactions").insert({ id: transaction.id, ...transactionToRow(transaction, userId) }).select("*")); }
  async updateTransactionStatus(userId: string, id: string, status: Transaction["status"]) { return rows(await this.supabase.from("finance_transactions").update({ status }).eq("id", id).eq("user_id", userId).select("*")); }
  async deleteTransaction(userId: string, id: string) { return rows(await this.supabase.from("finance_transactions").update({ deleted_at: new Date().toISOString() }).eq("id", id).eq("user_id", userId).select("id")); }
  async setBudget(userId: string, budget: Budget) { return rows(await this.supabase.from("finance_budgets").upsert({ id: budget.id, ...budgetToRow(budget, userId) }, { onConflict: "user_id,category_id,month" }).select("*")); }
  async addGoal(userId: string, goal: FinancialGoal) { return rows(await this.supabase.from("finance_goals").insert({ id: goal.id, ...goalToRow(goal, userId) }).select("*")); }
}

export function createFinanceRepository(supabase: SupabaseClient | null) { return supabase ? new FinanceRepository(supabase) : null; }
export { createEmptyData };
