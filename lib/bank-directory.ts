export type BankOption = {
  name: string;
  mark: string;
  color: string;
  foreground?: string;
};

// Catálogo local para identificação visual. Instituições fora da lista usam monograma automático.
export const BANKS: BankOption[] = [
  { name: "Banco do Brasil", mark: "BB", color: "#F8D117", foreground: "#1C3E7A" },
  { name: "Bradesco", mark: "b", color: "#CC092F" },
  { name: "Caixa", mark: "CA", color: "#005CA9" },
  { name: "Itaú", mark: "itaú", color: "#EC7000" },
  { name: "Santander", mark: "S", color: "#EC0000" },
  { name: "Nubank", mark: "nu", color: "#820AD1" },
  { name: "Inter", mark: "inter", color: "#FF7A00" },
  { name: "C6 Bank", mark: "C6", color: "#151515" },
  { name: "BTG Pactual", mark: "BTG", color: "#123B68" },
  { name: "Iti", mark: "iti", color: "#FF6200" },
  { name: "Neon", mark: "neon", color: "#00E4FF", foreground: "#0A2463" },
  { name: "Next", mark: "next", color: "#00B85A" },
  { name: "PicPay", mark: "P", color: "#21C25E" },
  { name: "Mercado Pago", mark: "MP", color: "#00B1EA" },
  { name: "PagBank", mark: "Pag", color: "#16A75D" },
  { name: "Will Bank", mark: "will", color: "#FFDF00", foreground: "#171717" },
  { name: "Sofisa Direto", mark: "S", color: "#004A80" },
  { name: "Banco Pan", mark: "pan", color: "#00AEEF" },
  { name: "Original", mark: "o", color: "#00A859" },
  { name: "Safra", mark: "S", color: "#163A71" },
  { name: "Sicredi", mark: "S", color: "#338E36" },
  { name: "Sicoob", mark: "S", color: "#008C95" },
  { name: "Banrisul", mark: "BR", color: "#0067B1" },
  { name: "Banco BV", mark: "bv", color: "#1735C8" },
  { name: "Banco BMG", mark: "BMG", color: "#FF5A00" },
  { name: "Banco ABC Brasil", mark: "ABC", color: "#0B4A70" },
  { name: "Banco Daycoval", mark: "D", color: "#E3292D" },
  { name: "Banco Pine", mark: "pine", color: "#123A61" },
  { name: "Banco Rendimento", mark: "R", color: "#E45519" },
  { name: "Banco Votorantim", mark: "BV", color: "#223A77" },
  { name: "Banese", mark: "B", color: "#008B4A" },
  { name: "Banestes", mark: "B", color: "#174C91" },
  { name: "BRB", mark: "BRB", color: "#004A98" },
  { name: "Cresol", mark: "C", color: "#F78B1F" },
  { name: "Unicred", mark: "U", color: "#006E5A" },
  { name: "Ailos", mark: "A", color: "#ED6D20" },
  { name: "Ame Digital", mark: "ame", color: "#EC2A87" },
  { name: "99Pay", mark: "99", color: "#FFC700", foreground: "#252525" },
  { name: "RecargaPay", mark: "RP", color: "#0062FF" },
  { name: "Stone", mark: "S", color: "#1D1D1B" },
  { name: "InfinitePay", mark: "∞", color: "#6D36E8" },
  { name: "Wise", mark: "wise", color: "#9FE870", foreground: "#163300" },
  { name: "Revolut", mark: "R", color: "#191C1F" },
  { name: "XP", mark: "XP", color: "#101010" },
  { name: "Rico", mark: "rico", color: "#6A2BBE" },
  { name: "Clear", mark: "clear", color: "#00A859" },
  { name: "Modal", mark: "modal", color: "#005CA8" },
  { name: "Genial", mark: "G", color: "#00A79D" },
  { name: "Órama", mark: "ó", color: "#F4A51C", foreground: "#172B4D" },
  { name: "Tesouro Direto", mark: "TD", color: "#174A87" },
];

export function bankForName(name?: string): BankOption | undefined {
  if (!name) return undefined;
  const normalized = name.trim().toLocaleLowerCase("pt-BR");
  return BANKS.find((bank) => bank.name.toLocaleLowerCase("pt-BR") === normalized);
}

export function initialsForBank(name?: string) {
  const words = (name || "Banco").trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]).join("").toUpperCase().slice(0, 3) || "BC";
}
