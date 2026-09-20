import type { ImportedTransaction } from "@/lib/csv-import";

const textIn = (block: string, tag: string) => block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>\\s*([^<\\r\\n]+)`, "i"))?.[1]?.trim() ?? "";
const ofxDate = (value: string) => {
  const match = value.match(/^(\d{4})(\d{2})(\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : "";
};

const ofxAmount = (value: string) => {
  const normalized = value.replace(/[\s\u00a0]/g, "");
  const comma = normalized.lastIndexOf(",");
  const dot = normalized.lastIndexOf(".");
  if (comma !== -1 && dot !== -1) {
    const decimalSeparator = comma > dot ? "," : ".";
    const thousandsSeparator = decimalSeparator === "," ? /\./g : /,/g;
    return Number(normalized.replace(thousandsSeparator, "").replace(decimalSeparator, "."));
  }
  if (comma !== -1) {
    const decimalDigits = normalized.length - comma - 1;
    return Number(decimalDigits <= 2 ? normalized.replace(",", ".") : normalized.replace(/,/g, ""));
  }
  return Number(normalized);
};

const creditTypes = new Set(["CREDIT", "DEP", "DIRECTDEP", "INT", "DIV"]);
const debitTypes = new Set(["DEBIT", "PAYMENT", "CASH", "ATM", "FEE", "CHECK", "DIRECTDEBIT", "POS", "XFER"]);
const kindFor = (type: string, amount: number): ImportedTransaction["kind"] => {
  // Alguns bancos exportam débitos como valores positivos. TRNTYPE tem prioridade
  // sobre o sinal para não transformar uma despesa em receita durante a importação.
  if (creditTypes.has(type)) return "income";
  if (debitTypes.has(type)) return "expense";
  return amount > 0 ? "income" : "expense";
};

export function parseOfxTransactions(content: string): ImportedTransaction[] {
  // File.text() may expose UTF-16 OFX content with NULs on web and mobile. Removing
  // them restores the SGML/XML tags without changing normal UTF-8/Windows-1252 files.
  const normalizedContent = content.replace(/^\uFEFF/, "").replace(/\u0000/g, "");
  const blocks = normalizedContent.match(/<STMTTRN(?:\s[^>]*)?>[\s\S]*?(?=<STMTTRN(?:\s[^>]*)?>|<\/BANKTRANLIST\s*>|$)/gi) ?? [];
  return blocks.flatMap((block) => {
    const date = ofxDate(textIn(block, "DTPOSTED"));
    const signedAmount = ofxAmount(textIn(block, "TRNAMT"));
    const description = textIn(block, "NAME") || textIn(block, "MEMO") || textIn(block, "FITID") || "Lançamento importado";
    const type = textIn(block, "TRNTYPE").toUpperCase();
    const sourceTransactionId = textIn(block, "FITID");
    if (!date || !Number.isFinite(signedAmount) || signedAmount === 0) return [];
    return [{ date, description, amount: Math.abs(signedAmount), kind: kindFor(type, signedAmount), sourceTransactionId: sourceTransactionId || undefined }];
  });
}
