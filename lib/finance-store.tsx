import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
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

const STORAGE_KEY = "saldo-claro.finance-data.v1";

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
  addCard: (card: Omit<CreditCard, "id">) => void;
  addCategory: (category: Omit<Category, "id">) => void;
  setBudget: (categoryId: string, amount: number, month: string) => void;
  addGoal: (goal: Omit<FinancialGoal, "id">) => void;
};

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: PropsWithChildren) {
  const [data, setData] = useState<FinanceData>(createDemoData());
  const [ready, setReady] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved) setData(JSON.parse(saved) as FinanceData);
      })
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => undefined);
  }, [data, ready]);

  const completeWelcome = useCallback((mode: "demo" | "fresh") => {
    setData((previous) => {
      const next = mode === "demo" ? createDemoData() : createEmptyData();
      return { ...next, hasSeenWelcome: true, demoMode: mode === "demo" };
    });
  }, []);

  const addTransaction = useCallback((transaction: NewTransaction) => {
    if (transaction.kind === "transfer" && transaction.accountId === transaction.destinationAccountId) {
      throw new Error("Escolha contas diferentes para realizar uma transferência.");
    }
    if (transaction.amount <= 0 || Number.isNaN(transaction.amount)) {
      throw new Error("Informe um valor maior que zero.");
    }
    setData((previous) => ({
      ...previous,
      transactions: [{ ...transaction, id: makeId("tx"), createdAt: new Date().toISOString() }, ...previous.transactions],
    }));
  }, []);

  const updateTransactionStatus = useCallback((id: string, status: TransactionStatus) => {
    setData((previous) => ({ ...previous, transactions: previous.transactions.map((item) => (item.id === id ? { ...item, status } : item)) }));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setData((previous) => ({ ...previous, transactions: previous.transactions.filter((item) => item.id !== id) }));
  }, []);

  const addAccount = useCallback((account: Omit<Account, "id">) => {
    setData((previous) => ({ ...previous, accounts: [...previous.accounts, { ...account, id: makeId("acc") }] }));
  }, []);

  const addCard = useCallback((card: Omit<CreditCard, "id">) => {
    setData((previous) => ({ ...previous, cards: [...previous.cards, { ...card, id: makeId("card") }] }));
  }, []);

  const addCategory = useCallback((category: Omit<Category, "id">) => {
    setData((previous) => ({ ...previous, categories: [...previous.categories, { ...category, id: makeId("cat") }] }));
  }, []);

  const setBudget = useCallback((categoryId: string, amount: number, month: string) => {
    setData((previous) => {
      const existing = previous.budgets.find((budget) => budget.categoryId === categoryId && budget.month === month);
      const budgets: Budget[] = existing
        ? previous.budgets.map((budget) => (budget.id === existing.id ? { ...budget, amount } : budget))
        : [...previous.budgets, { id: makeId("budget"), categoryId, amount, month }];
      return { ...previous, budgets };
    });
  }, []);

  const addGoal = useCallback((goal: Omit<FinancialGoal, "id">) => {
    setData((previous) => ({ ...previous, goals: [...previous.goals, { ...goal, id: makeId("goal") }] }));
  }, []);

  const value = useMemo(
    () => ({ ...data, ready, privacyMode, setPrivacyMode, completeWelcome, addTransaction, updateTransactionStatus, deleteTransaction, addAccount, addCard, addCategory, setBudget, addGoal }),
    [data, ready, privacyMode, completeWelcome, addTransaction, updateTransactionStatus, deleteTransaction, addAccount, addCard, addCategory, setBudget, addGoal],
  );
  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) throw new Error("useFinance deve ser usado dentro de FinanceProvider.");
  return context;
}

export const transactionKindLabel: Record<TransactionKind, string> = {
  income: "Receita",
  expense: "Despesa",
  transfer: "Transferência",
  card: "Compra no cartão",
};
