export type TransactionKind = "income" | "expense" | "transfer" | "card";
export type TransactionStatus = "pending" | "paid" | "received" | "overdue" | "cancelled";

export type Account = {
  id: string;
  name: string;
  type: "Conta corrente" | "Poupança" | "Dinheiro" | "Carteira digital" | "Investimentos" | "Outros";
  institution?: string;
  color: string;
  initialBalance: number;
  includeInTotal: boolean;
  archived?: boolean;
};

export type Category = {
  id: string;
  name: string;
  kind: "income" | "expense";
  color: string;
  icon: string;
  archived?: boolean;
};

export type CreditCard = {
  id: string;
  name: string;
  brand: string;
  lastDigits?: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  color: string;
  accountId?: string;
  archived?: boolean;
};

export type Transaction = {
  id: string;
  kind: TransactionKind;
  description: string;
  amount: number;
  date: string;
  dueDate?: string;
  accountId?: string;
  destinationAccountId?: string;
  cardId?: string;
  categoryId?: string;
  status: TransactionStatus;
  note?: string;
  installment?: { current: number; total: number };
  recurring?: boolean;
  createdAt: string;
};

export type Budget = { id: string; categoryId: string; amount: number; month: string };
export type FinancialGoal = { id: string; name: string; target: number; saved: number; targetDate: string; color: string };

export type FinanceData = {
  accounts: Account[];
  categories: Category[];
  cards: CreditCard[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: FinancialGoal[];
  demoMode: boolean;
  hasSeenWelcome: boolean;
};

export const todayIso = () => new Date().toISOString().slice(0, 10);
export const currentMonth = () => todayIso().slice(0, 7);
export const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const formatMoney = (amount: number, hidden = false) =>
  hidden
    ? "R$ •••••"
    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount);

export const formatDate = (iso: string) => {
  const [year, month, day] = iso.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
};

export const formatMonth = (month: string) => {
  const date = new Date(`${month}-01T12:00:00`);
  const label = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
};

export const parseBrazilianDate = (value: string) => {
  const parts = value.trim().split("/");
  if (parts.length !== 3) return null;
  const [day, month, year] = parts;
  const parsed = new Date(`${year}-${month}-${day}T12:00:00`);
  if (Number.isNaN(parsed.getTime()) || parsed.getDate() !== Number(day)) return null;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

export function transactionIsRealized(transaction: Transaction) {
  return transaction.status === "paid" || transaction.status === "received";
}

export function calculateAccountBalance(account: Account, transactions: Transaction[]) {
  return transactions.reduce((balance, transaction) => {
    if (!transactionIsRealized(transaction)) return balance;
    if (transaction.kind === "income" && transaction.accountId === account.id) return balance + transaction.amount;
    if (transaction.kind === "expense" && transaction.accountId === account.id) return balance - transaction.amount;
    if (transaction.kind === "transfer") {
      if (transaction.accountId === account.id) return balance - transaction.amount;
      if (transaction.destinationAccountId === account.id) return balance + transaction.amount;
    }
    return balance;
  }, account.initialBalance);
}

export function getMonthTransactions(transactions: Transaction[], month: string) {
  return transactions.filter((transaction) => transaction.date.slice(0, 7) === month && transaction.status !== "cancelled");
}

export function getMonthlySummary(data: FinanceData, month: string) {
  const monthly = getMonthTransactions(data.transactions, month);
  const income = monthly.filter((item) => item.kind === "income").reduce((sum, item) => sum + item.amount, 0);
  const expenses = monthly
    .filter((item) => item.kind === "expense" || item.kind === "card")
    .reduce((sum, item) => sum + item.amount, 0);
  const realizedIncome = monthly
    .filter((item) => item.kind === "income" && transactionIsRealized(item))
    .reduce((sum, item) => sum + item.amount, 0);
  const realizedExpenses = monthly
    .filter((item) => (item.kind === "expense" || item.kind === "card") && transactionIsRealized(item))
    .reduce((sum, item) => sum + item.amount, 0);
  const balance = data.accounts
    .filter((account) => account.includeInTotal && !account.archived)
    .reduce((sum, account) => sum + calculateAccountBalance(account, data.transactions), 0);
  return {
    income,
    expenses,
    realizedIncome,
    realizedExpenses,
    result: income - expenses,
    balance,
    forecast: balance + (income - realizedIncome) - (expenses - realizedExpenses),
  };
}

export function getCategorySpending(data: FinanceData, month: string, categoryId: string) {
  return getMonthTransactions(data.transactions, month)
    .filter((transaction) => (transaction.kind === "expense" || transaction.kind === "card") && transaction.categoryId === categoryId)
    .reduce((sum, transaction) => sum + transaction.amount, 0);
}

export function getCardUsage(data: FinanceData, card: CreditCard, month: string) {
  return getMonthTransactions(data.transactions, month)
    .filter((transaction) => transaction.kind === "card" && transaction.cardId === card.id)
    .reduce((sum, transaction) => sum + transaction.amount, 0);
}

export function createDemoData(): FinanceData {
  const month = currentMonth();
  const date = (day: number) => `${month}-${String(Math.min(day, 28)).padStart(2, "0")}`;
  const accounts: Account[] = [
    { id: "acc-checking", name: "Conta do dia a dia", type: "Conta corrente", institution: "Banco Horizonte", color: "#0B6B62", initialBalance: 1840, includeInTotal: true },
    { id: "acc-reserve", name: "Reserva de segurança", type: "Poupança", institution: "Banco Horizonte", color: "#3777B4", initialBalance: 8200, includeInTotal: true },
  ];
  const categories: Category[] = [
    { id: "cat-salary", name: "Salário", kind: "income", color: "#159A6B", icon: "payments" },
    { id: "cat-services", name: "Serviços", kind: "income", color: "#3777B4", icon: "work" },
    { id: "cat-home", name: "Casa", kind: "expense", color: "#8D5FC0", icon: "home" },
    { id: "cat-food", name: "Alimentação", kind: "expense", color: "#D97B18", icon: "restaurant" },
    { id: "cat-transport", name: "Transporte", kind: "expense", color: "#3777B4", icon: "directions-car" },
    { id: "cat-leisure", name: "Lazer", kind: "expense", color: "#E35B74", icon: "local-movies" },
    { id: "cat-health", name: "Saúde", kind: "expense", color: "#18A28D", icon: "favorite" },
  ];
  const cards: CreditCard[] = [
    { id: "card-aurora", name: "Aurora Platinum", brand: "Visa", lastDigits: "4821", limit: 7000, closingDay: 25, dueDay: 5, accountId: "acc-checking", color: "#163C57" },
    { id: "card-viva", name: "Viva Essencial", brand: "Mastercard", lastDigits: "9032", limit: 3000, closingDay: 12, dueDay: 20, accountId: "acc-checking", color: "#7A4B3A" },
  ];
  const transactions: Transaction[] = [
    { id: "tx-salary", kind: "income", description: "Salário", amount: 6500, date: date(5), accountId: "acc-checking", categoryId: "cat-salary", status: "received", recurring: true, createdAt: date(5) },
    { id: "tx-rent", kind: "expense", description: "Aluguel", amount: 1650, date: date(7), dueDate: date(7), accountId: "acc-checking", categoryId: "cat-home", status: "paid", recurring: true, createdAt: date(7) },
    { id: "tx-market", kind: "expense", description: "Mercado Vila Verde", amount: 428.75, date: date(11), accountId: "acc-checking", categoryId: "cat-food", status: "paid", createdAt: date(11) },
    { id: "tx-fuel", kind: "expense", description: "Posto Rio Azul", amount: 180, date: date(14), accountId: "acc-checking", categoryId: "cat-transport", status: "paid", createdAt: date(14) },
    { id: "tx-stream", kind: "card", description: "Assinatura de filmes", amount: 39.9, date: date(15), cardId: "card-aurora", categoryId: "cat-leisure", status: "paid", recurring: true, createdAt: date(15) },
    { id: "tx-laptop", kind: "card", description: "Curso de especialização", amount: 289, date: date(18), cardId: "card-aurora", categoryId: "cat-services", status: "paid", installment: { current: 3, total: 8 }, createdAt: date(18) },
    { id: "tx-dinner", kind: "card", description: "Jantar com amigos", amount: 186.5, date: date(22), cardId: "card-viva", categoryId: "cat-food", status: "pending", createdAt: date(22) },
    { id: "tx-internet", kind: "expense", description: "Internet residencial", amount: 119.9, date: date(26), dueDate: date(26), accountId: "acc-checking", categoryId: "cat-home", status: "pending", recurring: true, createdAt: date(26) },
    { id: "tx-transfer", kind: "transfer", description: "Aporte na reserva", amount: 500, date: date(20), accountId: "acc-checking", destinationAccountId: "acc-reserve", status: "paid", createdAt: date(20) },
  ];
  return {
    accounts,
    categories,
    cards,
    transactions,
    budgets: [
      { id: "bud-food", categoryId: "cat-food", amount: 950, month },
      { id: "bud-leisure", categoryId: "cat-leisure", amount: 400, month },
      { id: "bud-transport", categoryId: "cat-transport", amount: 650, month },
    ],
    goals: [{ id: "goal-emergency", name: "Reserva de emergência", target: 25000, saved: 8700, targetDate: "2027-06-30", color: "#0B6B62" }],
    demoMode: true,
    hasSeenWelcome: false,
  };
}

export function createEmptyData(): FinanceData {
  const demo = createDemoData();
  return { ...demo, accounts: [], cards: [], transactions: [], budgets: [], goals: [], demoMode: false, hasSeenWelcome: true };
}
