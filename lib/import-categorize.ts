import type { ImportedTransaction } from "./csv-import";
import type { Category } from "./finance-domain";

const normalize = (value: string) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLocaleLowerCase("pt-BR");

const expenseSignals: Record<string, string[]> = {
  food: ["mercado", "supermercado", "ifood", "restaurante", "lanchonete", "padaria", "hortifruti", "acougue", "uber eats", "rappi"],
  transport: ["uber", "99 app", "posto", "combustivel", "gasolina", "estacionamento", "metro", "onibus", "taxi"],
  home: ["aluguel", "condominio", "energia", "luz", "agua", "internet", "gas", "vivo", "claro", "tim", "oi fibra"],
  health: ["farmacia", "drogaria", "hospital", "clinica", "consulta", "academia", "laboratorio"],
  leisure: ["netflix", "spotify", "cinema", "steam", "show", "viagem", "hbo", "disney"],
  education: ["curso", "udemy", "alura", "escola", "faculdade", "livro"],
};
const incomeSignals = ["salario", "pagamento", "pro labore", "freela", "pix recebido", "rendimento", "dividendo"];

const categoryMatches = (category: Category, group: keyof typeof expenseSignals) => {
  const name = normalize(category.name);
  const aliases: Record<keyof typeof expenseSignals, string[]> = {
    food: ["aliment", "comida", "mercado", "refeicao"],
    transport: ["transporte", "mobilidade", "carro", "combustivel"],
    home: ["casa", "moradia", "lar", "resid"],
    health: ["saude", "bem estar", "fitness"],
    leisure: ["lazer", "entretenimento", "diversao"],
    education: ["educacao", "estudo", "curso"],
  };
  return aliases[group].some((alias) => name.includes(alias));
};

/** Suggests a registered category without creating new categories or hiding the choice from the user. */
export function suggestImportedCategory(item: ImportedTransaction, categories: Category[]) {
  const candidates = categories.filter((category) => category.kind === item.kind && !category.archived);
  const sourceCategory = normalize(item.categoryName ?? "");
  const exactSource = candidates.find((category) => sourceCategory && normalize(category.name) === sourceCategory);
  if (exactSource) return exactSource;

  const description = normalize(item.description);
  const explicitName = candidates.find((category) => {
    const name = normalize(category.name);
    return name.length >= 4 && description.includes(name);
  });
  if (explicitName) return explicitName;

  if (item.kind === "income") {
    if (!incomeSignals.some((signal) => description.includes(signal))) return undefined;
    return candidates.find((category) => /salario|receita|renda|trabalho/.test(normalize(category.name))) ?? candidates[0];
  }

  for (const group of Object.keys(expenseSignals) as (keyof typeof expenseSignals)[]) {
    if (!expenseSignals[group].some((signal) => description.includes(signal))) continue;
    const match = candidates.find((category) => categoryMatches(category, group));
    if (match) return match;
  }
  return undefined;
}
