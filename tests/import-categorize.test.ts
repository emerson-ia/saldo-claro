import { describe, expect, it } from "vitest";
import { suggestImportedCategory } from "../lib/import-categorize";

const categories = [
  { id: "food", name: "Alimentação", kind: "expense" as const, color: "#D97B18", icon: "restaurant" },
  { id: "transport", name: "Transporte", kind: "expense" as const, color: "#3777B4", icon: "directions-car" },
  { id: "salary", name: "Salário", kind: "income" as const, color: "#159A6B", icon: "payments" },
];

describe("sugestões na importação", () => {
  it("prefere a categoria informada no arquivo quando ela já existe", () => {
    expect(suggestImportedCategory({ date: "2026-09-10", description: "Compra qualquer", amount: 40, kind: "expense", categoryName: "Transporte" }, categories)?.id).toBe("transport");
  });

  it("reconhece descrições comuns sem criar uma categoria escondida", () => {
    expect(suggestImportedCategory({ date: "2026-09-10", description: "IFOOD *PEDIDO", amount: 40, kind: "expense" }, categories)?.id).toBe("food");
    expect(suggestImportedCategory({ date: "2026-09-10", description: "UBER *TRIP", amount: 40, kind: "expense" }, categories)?.id).toBe("transport");
  });

  it("não inventa categoria quando não há evidência suficiente", () => {
    expect(suggestImportedCategory({ date: "2026-09-10", description: "PAGAMENTO 8F02", amount: 40, kind: "expense" }, categories)).toBeUndefined();
  });
});
