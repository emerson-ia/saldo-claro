import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as DocumentPicker from "expo-document-picker";
import { documentDirectory, readAsStringAsync, writeAsStringAsync } from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { useMemo, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { AppHeader, Surface } from "@/components/finance-ui";
import { mapCsvTransactions, parseCsv, type ImportedTransaction } from "@/lib/csv-import";
import { reviewImportedTransactions } from "@/lib/import-dedup";
import { parseOfxTransactions } from "@/lib/ofx-import";
import { useFinance } from "@/lib/finance-store";
import { useFinanceTheme } from "@/lib/finance-theme";

const ofxTagScore = (text: string) => (text.match(/<\s*\/?(?:STMTTRN|DTPOSTED|TRNAMT)\b/gi) ?? []).length;
const decodeOfxFile = async (file: File) => {
  const bytes = await file.arrayBuffer();
  const candidates = ["utf-8", "windows-1252", "utf-16le", "utf-16be"].map((encoding) => new TextDecoder(encoding).decode(bytes));
  return candidates.sort((left, right) => ofxTagScore(right) - ofxTagScore(left))[0] ?? "";
};

export default function ImportCsvScreen() {
  const finance = useFinance(); const { colors } = useFinanceTheme();
  const [items, setItems] = useState<ImportedTransaction[]>([]); const [fileName, setFileName] = useState(""); const [accountId, setAccountId] = useState(""); const [loading, setLoading] = useState(false); const [importError, setImportError] = useState(""); const [importSummary, setImportSummary] = useState<{ added: number; skipped: number } | null>(null);
  const review = useMemo(() => accountId ? reviewImportedTransactions(items, finance.transactions, accountId) : { newItems: [], skipped: 0 }, [accountId, finance.transactions, items]);
  const loadFile = (name: string, content: string) => {
    const isOfx = name.toLocaleLowerCase("pt-BR").endsWith(".ofx") || /<OFX>|<STMTTRN>/i.test(content);
    const parsed = isOfx ? parseOfxTransactions(content) : mapCsvTransactions(parseCsv(content));
    if (!parsed.length) {
      setItems([]); setFileName("");
      setImportError(isOfx ? "O arquivo OFX foi lido, mas não encontramos lançamentos válidos. Tente exportar novamente pelo Nubank." : "Não encontramos colunas de data, descrição e valor nesse CSV.");
      return;
    }
    setImportError(""); setImportSummary(null); setItems(parsed); setFileName(name); setAccountId((current) => current || finance.accounts[0]?.id || "");
  };
  const pickFile = async () => {
    setImportError(""); setLoading(true);
    try {
      // Em Chrome mobile, o input precisa entrar no DOM para disparar onchange de forma confiável.
      if (Platform.OS === "web") {
        const input = document.createElement("input");
        input.type = "file"; input.accept = ".csv,.ofx,text/csv,application/x-ofx,application/ofx,application/octet-stream,application/xml,text/xml,text/plain";
        input.style.display = "none";
        document.body.appendChild(input);
        input.onchange = async () => {
          const file = input.files?.[0];
          input.remove();
          if (!file) { setLoading(false); return; }
          try { loadFile(file.name, file.name.toLowerCase().endsWith(".ofx") ? await decodeOfxFile(file) : await file.text()); } catch { setImportError("Não foi possível ler esse arquivo. Baixe o OFX novamente pelo Nubank e tente outra vez."); } finally { setLoading(false); }
        };
        input.click();
        return;
      }
      // Alguns gerenciadores de arquivo Android marcam OFX como octet-stream ou XML,
      // não como application/x-ofx. A lista explícita evita que esses arquivos fiquem cinza.
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/x-ofx", "application/ofx", "application/octet-stream", "application/xml", "text/xml", "text/ofx", "text/plain", "text/csv"],
        copyToCacheDirectory: true,
        base64: false,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0]; const content = asset.file ? await asset.file.text() : await readAsStringAsync(asset.uri);
      loadFile(asset.name, content);
    } catch { setImportError("Não foi possível abrir esse arquivo. Verifique as permissões do aparelho e tente novamente."); } finally { if (Platform.OS !== "web") setLoading(false); }
  };
  const finishImport = () => {
    if (!accountId) { setImportError("Cadastre ou selecione a conta onde esses lançamentos aconteceram."); return; }
    review.newItems.forEach((item) => { const category = finance.categories.find((value) => value.kind === item.kind && value.name.trim().toLocaleLowerCase("pt-BR") === item.categoryName?.trim().toLocaleLowerCase("pt-BR")); finance.addTransaction({ kind: item.kind, description: item.description, amount: item.amount, date: item.date, accountId, categoryId: category?.id, status: item.kind === "income" ? "received" : "paid", importFingerprint: item.importFingerprint }); });
    setImportSummary({ added: review.newItems.length, skipped: review.skipped }); setItems([]); setFileName("");
  };
  const exportCsv = async () => {
    if (!finance.transactions.length) return Alert.alert("Ainda não há lançamentos", "Cadastre ao menos um lançamento para gerar o CSV.");
    const cell = (value: string | number | undefined) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const rows = finance.transactions.map((item) => [item.date, item.description, item.kind, item.status, item.amount.toFixed(2).replace(".", ","), finance.accounts.find((account) => account.id === item.accountId)?.name, finance.categories.find((category) => category.id === item.categoryId)?.name, item.note]);
    const csv = `\uFEFF${["Data", "Descrição", "Tipo", "Situação", "Valor (R$)", "Conta", "Categoria", "Observação"].map(cell).join(";")}\n${rows.map((row) => row.map(cell).join(";")).join("\n")}`;
    const name = `financas-em-dia-${new Date().toISOString().slice(0, 10)}.csv`;
    try {
      if (Platform.OS === "web") {
        const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
        const link = document.createElement("a"); link.href = url; link.download = name; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
        return;
      }
      const uri = `${documentDirectory}${name}`;
      await writeAsStringAsync(uri, csv, { encoding: "utf8" });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: "text/csv", dialogTitle: "Exportar lançamentos" });
      else Alert.alert("Arquivo criado", `O CSV foi salvo em ${uri}`);
    } catch { Alert.alert("Não foi possível exportar", "Tente novamente em alguns instantes."); }
  };
  return <ScreenContainer><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><AppHeader title="Importar arquivo" subtitle="Importe seu CSV ou extrato OFX" back />
    <Surface style={styles.guide}><View style={[styles.guideIcon, { backgroundColor: colors.accent }]}><MaterialIcons name="upload-file" size={23} color={colors.primary} /></View><Text style={[styles.guideTitle, { color: colors.text }]}>Importe sua planilha</Text><Text style={[styles.guideText, { color: colors.muted }]}>Aceitamos CSV com data, descrição e valor, ou extrato bancário OFX. Formatos CSV com Débito e Crédito também funcionam.</Text><Pressable onPress={pickFile} disabled={loading} style={({ pressed }) => [styles.pick, { backgroundColor: colors.primary, opacity: pressed || loading ? .72 : 1 }]}><MaterialIcons name="attach-file" size={19} color={colors.onPrimary} /><Text style={[styles.pickText, { color: colors.onPrimary }]}>{loading ? "Lendo arquivo..." : "Escolher CSV ou OFX"}</Text></Pressable><Pressable onPress={exportCsv} style={({ pressed }) => [styles.export, { borderColor: colors.primary, opacity: pressed ? .72 : 1 }]}><MaterialIcons name="download" size={19} color={colors.primary} /><Text style={[styles.exportText, { color: colors.primary }]}>Exportar lançamentos em CSV</Text></Pressable>{importError ? <Text style={[styles.importError, { color: colors.negative }]}>{importError}</Text> : null}</Surface>
    {importSummary ? <Surface style={[styles.result, { backgroundColor: `${colors.positive}12`, borderColor: `${colors.positive}45` }]}><MaterialIcons name={importSummary.added ? "check-circle" : "info"} size={20} color={colors.positive} /><View style={styles.resultCopy}><Text style={[styles.resultTitle, { color: colors.text }]}>{importSummary.added ? `${importSummary.added} lançamento${importSummary.added === 1 ? "" : "s"} novo${importSummary.added === 1 ? "" : "s"} adicionado${importSummary.added === 1 ? "" : "s"}` : "Nenhum lançamento novo"}</Text><Text style={[styles.resultText, { color: colors.muted }]}>{importSummary.skipped ? `${importSummary.skipped} já existente${importSummary.skipped === 1 ? " foi ignorado." : "s foram ignorados."}` : "Todos os lançamentos deste arquivo eram novos."}</Text></View></Surface> : null}
    {items.length ? <><Text style={[styles.section, { color: colors.muted }]}>REVISÃO DA IMPORTAÇÃO</Text><Surface style={styles.preview}><Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>{fileName}</Text><Text style={[styles.fileMeta, { color: colors.muted }]}>{items.length} encontrados · {review.newItems.length} novo{review.newItems.length === 1 ? "" : "s"}{review.skipped ? ` · ${review.skipped} já existente${review.skipped === 1 ? "" : "s"}` : ""}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.accountRow}>{finance.accounts.map((account) => <Pressable key={account.id} onPress={() => setAccountId(account.id)} style={[styles.account, { backgroundColor: accountId === account.id ? colors.accent : colors.elevated, borderColor: accountId === account.id ? colors.primary : "transparent" }]}><Text style={[styles.accountText, { color: accountId === account.id ? colors.primary : colors.text }]}>{account.name}</Text></Pressable>)}</ScrollView>{review.newItems.length ? review.newItems.slice(0, 5).map((item, index) => <View key={`${item.importFingerprint}-${index}`} style={[styles.row, { borderTopColor: colors.border }]}><View style={styles.rowCopy}><Text style={[styles.rowName, { color: colors.text }]} numberOfLines={1}>{item.description}</Text><Text style={[styles.rowDate, { color: colors.muted }]}>{item.date}</Text></View><Text style={[styles.rowAmount, { color: item.kind === "income" ? colors.positive : colors.text }]}>{item.kind === "income" ? "+" : "−"} R$ {item.amount.toFixed(2).replace(".", ",")}</Text></View>) : <Text style={[styles.noNewItems, { color: colors.muted }]}>Este arquivo não tem lançamentos novos para esta conta.</Text>}{review.newItems.length > 5 ? <Text style={[styles.remaining, { color: colors.muted }]}>e mais {review.newItems.length - 5} lançamentos novos</Text> : null}<Pressable disabled={!accountId || !review.newItems.length} onPress={finishImport} style={({ pressed }) => [styles.import, { backgroundColor: colors.primary, opacity: pressed || !accountId || !review.newItems.length ? .55 : 1 }]}><Text style={[styles.pickText, { color: colors.onPrimary }]}>{review.newItems.length ? `Importar ${review.newItems.length} lançamento${review.newItems.length === 1 ? "" : "s"} novo${review.newItems.length === 1 ? "" : "s"}` : "Nenhum lançamento novo"}</Text></Pressable></Surface></> : null}
  </ScrollView></ScreenContainer>;
}
const styles = StyleSheet.create({ content: { paddingHorizontal: 20, paddingBottom: 28 }, guide: { borderRadius: 22, padding: 18 }, importError: { fontSize: 12, fontWeight: "700", lineHeight: 18, marginTop: 12 },  guideIcon: { height: 47, width: 47, borderRadius: 16, alignItems: "center", justifyContent: "center" }, guideTitle: { fontSize: 17, fontWeight: "900", marginTop: 15 }, guideText: { fontSize: 13, lineHeight: 19, marginTop: 5 }, pick: { height: 49, borderRadius: 15, marginTop: 18, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 7 }, export: { height: 49, borderRadius: 15, marginTop: 10, borderWidth: 1, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 7 }, pickText: { fontSize: 13, fontWeight: "900" }, exportText: { fontSize: 13, fontWeight: "900" }, result: { borderRadius: 18, borderWidth: 1, padding: 14, flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 12 }, resultCopy: { flex: 1 }, resultTitle: { fontSize: 13, fontWeight: "900" }, resultText: { fontSize: 11, lineHeight: 16, marginTop: 2 }, section: { fontSize: 10, letterSpacing: .9, fontWeight: "800", marginTop: 23, marginBottom: 8, marginLeft: 3 }, preview: { borderRadius: 20, padding: 15 }, fileName: { fontSize: 14, fontWeight: "900" }, fileMeta: { fontSize: 11, marginTop: 2 }, accountRow: { gap: 7, paddingVertical: 15 }, account: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 11, paddingVertical: 9 }, accountText: { fontSize: 11, fontWeight: "800" }, row: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderTopWidth: 1 }, rowCopy: { flex: 1, paddingRight: 10 }, rowName: { fontSize: 12, fontWeight: "800" }, rowDate: { fontSize: 10, marginTop: 2 }, rowAmount: { fontSize: 12, fontWeight: "800" }, noNewItems: { fontSize: 12, lineHeight: 18, textAlign: "center", paddingVertical: 17 }, remaining: { fontSize: 11, textAlign: "center", marginTop: 10 }, import: { height: 50, borderRadius: 15, marginTop: 17, alignItems: "center", justifyContent: "center" } });
