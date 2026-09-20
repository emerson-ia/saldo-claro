import type { ImportedTransaction } from "./csv-import";
import type { Transaction } from "./finance-domain";

export type ImportCandidate = ImportedTransaction & { importFingerprint: string };
export type ImportReview = { newItems: ImportCandidate[]; skipped: number };

const normalizeDescription = (value: string) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .trim()
  .replace(/\s+/g, " ")
  .toLocaleLowerCase("pt-BR");

const amountInCents = (amount: number) => Math.round(amount * 100);

type TransactionIdentity = Pick<Transaction, "date" | "description" | "amount" | "kind">;

const transactionKey = (transaction: TransactionIdentity, accountId: string) => [
  accountId,
  transaction.date,
  transaction.kind,
  normalizeDescription(transaction.description),
  amountInCents(transaction.amount),
].join("|");

// Duas passagens FNV-1a independentes geram uma chave curta e estável, sem
// depender de APIs criptográficas que não estão disponíveis em todos os aparelhos.
const stableHash = (value: string) => {
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    first = Math.imul(first ^ code, 0x01000193);
    second = Math.imul(second ^ (code + index), 0x85ebca6b);
  }
  return `${(first >>> 0).toString(16).padStart(8, "0")}${(second >>> 0).toString(16).padStart(8, "0")}`;
};

const fingerprintFor = (item: ImportedTransaction, accountId: string, occurrence: number) => {
  if (item.sourceTransactionId?.trim()) {
    return `ofx:${stableHash(`${accountId}|${item.sourceTransactionId.trim()}`)}`;
  }
  return `file:${stableHash(transactionKey(item, accountId))}:${occurrence}`;
};

/**
 * Mantém tudo que já está salvo e só devolve as linhas que ainda não existem.
 * Para registros antigos, sem fingerprint, a comparação é feita por conta, data,
 * tipo, descrição normalizada e valor. Isso evita que uma reimportação crie uma
 * terceira cópia, sem apagar as duplicidades históricas.
 */
export function reviewImportedTransactions(items: ImportedTransaction[], existing: Transaction[], accountId: string): ImportReview {
  const existingFingerprints = new Set(existing.flatMap((transaction) => transaction.importFingerprint ? [transaction.importFingerprint] : []));
  const legacyCounts = new Map<string, number>();
  for (const transaction of existing) {
    if (transaction.importFingerprint || transaction.accountId !== accountId) continue;
    const key = transactionKey(transaction, accountId);
    legacyCounts.set(key, (legacyCounts.get(key) ?? 0) + 1);
  }

  const occurrences = new Map<string, number>();
  const consumedLegacy = new Map<string, number>();
  const pendingFingerprints = new Set<string>();
  const newItems: ImportCandidate[] = [];
  let skipped = 0;

  for (const item of items) {
    const key = transactionKey(item, accountId);
    const occurrence = occurrences.get(key) ?? 0;
    occurrences.set(key, occurrence + 1);
    const importFingerprint = fingerprintFor(item, accountId, occurrence);

    if (existingFingerprints.has(importFingerprint) || pendingFingerprints.has(importFingerprint)) {
      skipped += 1;
      continue;
    }

    const legacyCount = legacyCounts.get(key) ?? 0;
    const alreadyMatched = consumedLegacy.get(key) ?? 0;
    if (alreadyMatched < legacyCount) {
      consumedLegacy.set(key, alreadyMatched + 1);
      skipped += 1;
      continue;
    }

    pendingFingerprints.add(importFingerprint);
    newItems.push({ ...item, importFingerprint });
  }

  return { newItems, skipped };
}
