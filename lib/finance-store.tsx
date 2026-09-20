import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { useAuth } from "@/lib/auth-provider";
import {
  createDemoData,
  createEmptyData,
  makeId,
  type Account,
  type Budget,
  type Category,
  type CreditCard,
  type FinanceData,
  type FinancialGoal,
  type Transaction,
  type TransactionKind,
  type TransactionStatus,
} from "@/lib/finance-domain";
import { createFinanceRepository, type RepositoryResult } from "@/lib/finance-repository";
import { getSupabase, hasSupabaseConfig } from "@/lib/supabase";

const STORAGE_KEY = "saldo-claro.finance.v2";
type NewTransaction = Omit<Transaction, "id" | "createdAt">;
type FinanceContextValue = FinanceData & {
  ready: boolean;
  privacyMode: boolean;
  setPrivacyMode: (value: boolean) => void;
  completeWelcome: (mode: "demo" | "fresh") => void;
  addTransaction: (transaction: NewTransaction) => void;
  updateTransactionStatus: (id: string, status: TransactionStatus) => void;
  deleteTransaction: (id: string) => void;
  addAccount: (account: Omit<Account, "id">) => void;
  updateAccount: (id: string, account: Omit<Account, "id">) => void;
  deleteAccount: (id: string) => void;
  addCard: (card: Omit<CreditCard, "id">) => void;
  updateCard: (id: string, card: Omit<CreditCard, "id">) => void;
  deleteCard: (id: string) => void;
  addCategory: (category: Omit<Category, "id">) => void;
  updateCategory: (id: string, category: Omit<Category, "id">) => void;
  setBudget: (categoryId: string, amount: number, month: string) => void;
  addGoal: (goal: Omit<FinancialGoal, "id">) => void;
};
const FinanceContext = createContext<FinanceContextValue | null>(null);

function reportSyncFailure(result: RepositoryResult<unknown>) {
  if (!result.ok) console.warn(`[finance-sync:${result.issue}] ${result.error.message}`);
}

export function FinanceProvider({ children }: PropsWithChildren) {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<FinanceData>(createEmptyData());
  const [ready, setReady] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);
  const storageKey = user ? `${STORAGE_KEY}:${user.id}` : null;

  const repository = useMemo(() => {
    if (!user || !hasSupabaseConfig()) return null;
    return createFinanceRepository(getSupabase());
  }, [user?.id]);
  const sync = useCallback((operation: () => Promise<RepositoryResult<unknown>>) => {
    operation().then(reportSyncFailure).catch((error: unknown) => reportSyncFailure({ ok: false, issue: "request_failed", error: error instanceof Error ? error : new Error("Falha inesperada ao sincronizar.") }));
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!storageKey || !user) { setReady(false); return; }
    let cancelled = false;
    setReady(false);
    setData(createEmptyData());
    (async () => {
      let cached: FinanceData | null = null;
      try {
        const saved = await AsyncStorage.getItem(storageKey);
        if (saved) cached = JSON.parse(saved) as FinanceData;
      } catch { /* AsyncStorage is a cache, never a hard dependency. */ }
      if (cancelled) return;
      if (cached) setData(cached);

      if (repository) {
        const remote = await repository.hydrate(user.id);
        if (cancelled) return;
        if (remote.ok) setData(remote.data);
        else reportSyncFailure(remote); // Missing schema/network leaves the cache as the active fallback.
      }
      if (!cancelled) setReady(true);
    })();
    return () => { cancelled = true; };
  }, [authLoading, repository, storageKey, user]);

  useEffect(() => {
    if (ready && storageKey) AsyncStorage.setItem(storageKey, JSON.stringify(data)).catch(() => undefined);
  }, [data, ready, storageKey]);

  const completeWelcome = useCallback((mode: "demo" | "fresh") => {
    const next = { ...(mode === "demo" ? createDemoData() : createEmptyData()), hasSeenWelcome: true, demoMode: mode === "demo" };
    setData(next);
    if (repository && user) sync(() => repository.savePreferences(user.id, next));
  }, [repository, sync, user]);
  const addTransaction = useCallback((transaction: NewTransaction) => {
    if (transaction.kind === "transfer" && transaction.accountId === transaction.destinationAccountId) throw new Error("Escolha contas diferentes para realizar uma transferência.");
    if (transaction.amount <= 0 || Number.isNaN(transaction.amount)) throw new Error("Informe um valor maior que zero.");
    const item: Transaction = { ...transaction, id: makeId("tx"), createdAt: new Date().toISOString() };
    setData((previous) => ({ ...previous, transactions: [item, ...previous.transactions] }));
    if (repository && user) sync(() => repository.addTransaction(user.id, item));
  }, [repository, sync, user]);
  const updateTransactionStatus = useCallback((id: string, status: TransactionStatus) => {
    setData((previous) => ({ ...previous, transactions: previous.transactions.map((item) => item.id === id ? { ...item, status } : item) }));
    if (repository && user) sync(() => repository.updateTransactionStatus(user.id, id, status));
  }, [repository, sync, user]);
  const deleteTransaction = useCallback((id: string) => {
    setData((previous) => ({ ...previous, transactions: previous.transactions.filter((item) => item.id !== id) }));
    if (repository && user) sync(() => repository.deleteTransaction(user.id, id));
  }, [repository, sync, user]);
  const addAccount = useCallback((account: Omit<Account, "id">) => {
    const item = { ...account, id: makeId("acc") };
    setData((previous) => ({ ...previous, accounts: [...previous.accounts, item] }));
    if (repository && user) sync(() => repository.addAccount(user.id, item));
  }, [repository, sync, user]);
  const updateAccount = useCallback((id: string, account: Omit<Account, "id">) => {
    setData((previous) => ({ ...previous, accounts: previous.accounts.map((item) => item.id === id ? { ...account, id } : item) }));
    if (repository && user) sync(() => repository.updateAccount(user.id, id, account));
  }, [repository, sync, user]);
  const deleteAccount = useCallback((id: string) => {
    setData((previous) => ({ ...previous, accounts: previous.accounts.filter((item) => item.id !== id) }));
    if (repository && user) sync(() => repository.deleteAccount(user.id, id));
  }, [repository, sync, user]);
  const addCard = useCallback((card: Omit<CreditCard, "id">) => {
    const item = { ...card, id: makeId("card") };
    setData((previous) => ({ ...previous, cards: [...previous.cards, item] }));
    if (repository && user) sync(() => repository.addCard(user.id, item));
  }, [repository, sync, user]);
  const updateCard = useCallback((id: string, card: Omit<CreditCard, "id">) => {
    setData((previous) => ({ ...previous, cards: previous.cards.map((item) => item.id === id ? { ...card, id } : item) }));
    if (repository && user) sync(() => repository.updateCard(user.id, id, card));
  }, [repository, sync, user]);
  const deleteCard = useCallback((id: string) => {
    setData((previous) => ({ ...previous, cards: previous.cards.filter((item) => item.id !== id) }));
    if (repository && user) sync(() => repository.deleteCard(user.id, id));
  }, [repository, sync, user]);
  const addCategory = useCallback((category: Omit<Category, "id">) => {
    const item = { ...category, id: makeId("cat") };
    setData((previous) => ({ ...previous, categories: [...previous.categories, item] }));
    if (repository && user) sync(() => repository.addCategory(user.id, item));
  }, [repository, sync, user]);
  const updateCategory = useCallback((id: string, category: Omit<Category, "id">) => {
    setData((previous) => ({ ...previous, categories: previous.categories.map((item) => item.id === id ? { ...category, id } : item) }));
    if (repository && user) sync(() => repository.updateCategory(user.id, id, category));
  }, [repository, sync, user]);
  const setBudget = useCallback((categoryId: string, amount: number, month: string) => {
    const existing = data.budgets.find((budget) => budget.categoryId === categoryId && budget.month === month);
    const nextBudget: Budget = existing ? { ...existing, amount } : { id: makeId("budget"), categoryId, amount, month };
    setData((previous) => ({ ...previous, budgets: existing ? previous.budgets.map((budget) => budget.id === existing.id ? nextBudget : budget) : [...previous.budgets, nextBudget] }));
    if (repository && user) sync(() => repository.setBudget(user.id, nextBudget));
  }, [data.budgets, repository, sync, user]);
  const addGoal = useCallback((goal: Omit<FinancialGoal, "id">) => {
    const item = { ...goal, id: makeId("goal") };
    setData((previous) => ({ ...previous, goals: [...previous.goals, item] }));
    if (repository && user) sync(() => repository.addGoal(user.id, item));
  }, [repository, sync, user]);

  const value = useMemo(() => ({ ...data, ready, privacyMode, setPrivacyMode, completeWelcome, addTransaction, updateTransactionStatus, deleteTransaction, addAccount, updateAccount, deleteAccount, addCard, updateCard, deleteCard, addCategory, updateCategory, setBudget, addGoal }), [data, ready, privacyMode, completeWelcome, addTransaction, updateTransactionStatus, deleteTransaction, addAccount, updateAccount, deleteAccount, addCard, updateCard, deleteCard, addCategory, updateCategory, setBudget, addGoal]);
  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}
export function useFinance() { const context = useContext(FinanceContext); if (!context) throw new Error("useFinance deve ser usado dentro de FinanceProvider."); return context; }
export const transactionKindLabel: Record<TransactionKind, string> = { income: "Receita", expense: "Despesa", transfer: "Transferência", card: "Compra no cartão" };
