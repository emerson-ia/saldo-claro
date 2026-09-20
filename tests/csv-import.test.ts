import { describe, expect, it } from "vitest";
import { mapCsvTransactions, parseCsv } from "../lib/csv-import";

describe("CSV import", () => {
  it("imports Brazilian CSV with debit and credit columns", () => {
    const rows = parseCsv("Data;Descrição;Débito;Crédito\n01/09/2026;Mercado;125,40;\n02/09/2026;Salário;;3000,00");
    expect(mapCsvTransactions(rows)).toEqual([
      { date: "2026-09-01", description: "Mercado", amount: 125.4, kind: "expense", categoryName: undefined },
      { date: "2026-09-02", description: "Salário", amount: 3000, kind: "income", categoryName: undefined },
    ]);
  });

  it("imports CSV with a signed value column", () => {
    const rows = parseCsv("date,description,amount\n2026-09-03,Assinatura,-29.90");
    expect(mapCsvTransactions(rows)).toEqual([{ date: "2026-09-03", description: "Assinatura", amount: 29.9, kind: "expense", categoryName: undefined }]);
  });
});
