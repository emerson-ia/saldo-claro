export type CsvRow = Record<string, string>;

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
const aliases = {
  date: ["data", "date", "data lancamento", "data do lancamento", "data da transacao"],
  description: ["descricao", "description", "historico", "lancamento", "nome", "detalhe"],
  amount: ["valor", "amount", "value", "valor (r$)", "valor r$"],
  debit: ["debito", "debitos", "saidas", "despesa"],
  credit: ["credito", "creditos", "entradas", "receita"],
  type: ["tipo", "type", "natureza"],
  category: ["categoria", "category"],
};

export function parseCsv(text: string): CsvRow[] {
  const delimiter = text.split("\n").slice(0, 3).join("\n").split(";").length > text.split("\n").slice(0, 3).join("\n").split(",").length ? ";" : ",";
  const values: string[][] = []; let row: string[] = []; let cell = ""; let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]; const next = text[index + 1];
    if (char === '"' && quoted && next === '"') { cell += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === delimiter && !quoted) { row.push(cell.trim()); cell = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) { if (char === "\r" && next === "\n") index += 1; row.push(cell.trim()); if (row.some(Boolean)) values.push(row); row = []; cell = ""; }
    else cell += char;
  }
  row.push(cell.trim()); if (row.some(Boolean)) values.push(row);
  if (values.length < 2) return [];
  const headers = values[0].map(normalize);
  return values.slice(1).map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""])));
}

const valueFor = (row: CsvRow, keys: string[]) => Object.entries(row).find(([key]) => keys.includes(normalize(key)))?.[1]?.trim() ?? "";
export const parseBrazilianMoney = (value: string) => {
  const normalized = value.replace(/R\$|\s/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  const amount = Number(normalized.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(amount) ? amount : 0;
};
export const parseBrazilianDate = (value: string) => {
  const match = value.trim().match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
  if (match) return `${match[3].length === 2 ? `20${match[3]}` : match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  const iso = value.trim().match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  return iso ?? "";
};

export type ImportedTransaction = {
  date: string;
  description: string;
  amount: number;
  kind: "income" | "expense";
  categoryName?: string;
  /** Identificador estável fornecido pelo banco, como o FITID de um OFX. */
  sourceTransactionId?: string;
};
export function mapCsvTransactions(rows: CsvRow[]): ImportedTransaction[] {
  return rows.flatMap((row) => {
    const date = parseBrazilianDate(valueFor(row, aliases.date));
    const description = valueFor(row, aliases.description);
    const rawAmount = valueFor(row, aliases.amount);
    const credit = parseBrazilianMoney(valueFor(row, aliases.credit)); const debit = parseBrazilianMoney(valueFor(row, aliases.debit));
    const parsed = parseBrazilianMoney(rawAmount); const type = normalize(valueFor(row, aliases.type));
    const amount = credit || debit || Math.abs(parsed); const kind = credit > 0 || type.includes("receita") || type.includes("credito") || parsed > 0 ? "income" : "expense";
    if (!date || !description || !amount) return [];
    return [{ date, description, amount, kind, categoryName: valueFor(row, aliases.category) || undefined }];
  });
}
