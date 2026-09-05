import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { AppHeader } from "@/components/finance-ui";
import { todayIso, type TransactionKind } from "@/lib/finance-domain";
import { transactionKindLabel, useFinance } from "@/lib/finance-store";
import { useFinanceTheme } from "@/lib/finance-theme";

const kinds: TransactionKind[] = ["expense", "income", "transfer", "card"];

export default function AddScreen() {
  const { accounts, categories, cards, addTransaction } = useFinance();
  const { colors } = useFinanceTheme();
  const [kind, setKind] = useState<TransactionKind>("expense");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayIso());
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [destinationAccountId, setDestinationAccountId] = useState(accounts[1]?.id ?? accounts[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState(categories.find((item) => item.kind === "expense")?.id ?? "");
  const [cardId, setCardId] = useState(cards[0]?.id ?? "");
  const [isPending, setIsPending] = useState(false);
  const eligibleCategories = useMemo(() => categories.filter((item) => item.kind === (kind === "income" ? "income" : "expense")), [categories, kind]);
  const parsedAmount = Number(amount.replace(/[R$\s.]/g, "").replace(",", "."));
  const save = () => {
    if (!description.trim()) return Alert.alert("Informe uma descrição", "Use uma descrição para identificar este lançamento depois.");
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return Alert.alert("Valor inválido", "Informe um valor maior que zero.");
    if ((kind === "expense" || kind === "income" || kind === "transfer") && !accountId) return Alert.alert("Selecione uma conta", "Escolha a conta que receberá ou pagará este lançamento.");
    if (kind === "transfer" && (!destinationAccountId || destinationAccountId === accountId)) return Alert.alert("Transferência inválida", "Escolha uma conta de destino diferente da origem.");
    if (kind === "card" && !cardId) return Alert.alert("Selecione um cartão", "Cadastre ou escolha um cartão para registrar esta compra.");
    try {
      addTransaction({ kind, description: description.trim(), amount: parsedAmount, date, accountId: kind === "card" ? undefined : accountId || undefined, destinationAccountId: kind === "transfer" ? destinationAccountId : undefined, cardId: kind === "card" ? cardId : undefined, categoryId: kind === "transfer" ? undefined : categoryId || undefined, status: isPending ? "pending" : kind === "income" ? "received" : "paid" });
      Alert.alert("Lançamento salvo", "Seu painel e seus totais foram atualizados.", [{ text: "Ver lançamentos", onPress: () => router.replace("/transactions") }, { text: "Adicionar outro", onPress: () => { setDescription(""); setAmount(""); } }]);
    } catch (error) {
      Alert.alert("Não foi possível salvar", error instanceof Error ? error.message : "Tente novamente em alguns instantes.");
    }
  };
  return <ScreenContainer><KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"><AppHeader title="Novo lançamento" subtitle="Registre em poucos passos" />
    <View style={styles.typeGrid}>{kinds.map((item) => <Pressable key={item} onPress={() => { setKind(item); if (item !== "income") setCategoryId(categories.find((category) => category.kind === "expense")?.id ?? ""); else setCategoryId(categories.find((category) => category.kind === "income")?.id ?? ""); }} style={({ pressed }) => [styles.typeOption, { backgroundColor: kind === item ? colors.primary : colors.surface, borderColor: kind === item ? colors.primary : colors.border, opacity: pressed ? 0.72 : 1 }]}><MaterialIcons name={item === "income" ? "south-west" : item === "transfer" ? "swap-horiz" : item === "card" ? "credit-card" : "north-east"} size={18} color={kind === item ? "#FFFFFF" : colors.primary} /><Text style={[styles.typeText, { color: kind === item ? "#FFFFFF" : colors.text }]}>{transactionKindLabel[item]}</Text></Pressable>)}</View>
    <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Field label="Descrição"><TextInput value={description} onChangeText={setDescription} placeholder={kind === "transfer" ? "Ex.: Aporte na reserva" : "Ex.: Mercado da semana"} placeholderTextColor={colors.muted} style={[styles.input, { color: colors.text, borderColor: colors.border }]} returnKeyType="next" /></Field>
      <Field label="Valor"><TextInput value={amount} onChangeText={setAmount} placeholder="0,00" placeholderTextColor={colors.muted} keyboardType="decimal-pad" style={[styles.input, { color: colors.text, borderColor: colors.border, fontSize: 20, fontWeight: "800" }]} returnKeyType="done" /></Field>
      <Field label="Data"><TextInput value={date} onChangeText={setDate} placeholder="AAAA-MM-DD" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.text, borderColor: colors.border }]} returnKeyType="done" /></Field>
      {kind === "transfer" ? <><Picker label="Conta de origem" values={accounts.map((item) => ({ id: item.id, label: item.name }))} selected={accountId} onSelect={setAccountId} /><Picker label="Conta de destino" values={accounts.map((item) => ({ id: item.id, label: item.name }))} selected={destinationAccountId} onSelect={setDestinationAccountId} /></> : kind === "card" ? <Picker label="Cartão" values={cards.map((item) => ({ id: item.id, label: `${item.name}${item.lastDigits ? ` • ${item.lastDigits}` : ""}` }))} selected={cardId} onSelect={setCardId} /> : <Picker label="Conta" values={accounts.map((item) => ({ id: item.id, label: item.name }))} selected={accountId} onSelect={setAccountId} />}
      {kind !== "transfer" ? <Picker label="Categoria" values={eligibleCategories.map((item) => ({ id: item.id, label: item.name }))} selected={categoryId} onSelect={setCategoryId} /> : null}
      <Pressable onPress={() => setIsPending((value) => !value)} style={({ pressed }) => [styles.pending, { backgroundColor: isPending ? colors.accent : colors.elevated, opacity: pressed ? 0.7 : 1 }]}><View style={[styles.checkbox, { backgroundColor: isPending ? colors.primary : "transparent", borderColor: isPending ? colors.primary : colors.border }]}>{isPending ? <MaterialIcons name="check" size={14} color="#FFFFFF" /> : null}</View><View style={styles.pendingCopy}><Text style={[styles.pendingTitle, { color: colors.text }]}>Deixar como pendente</Text><Text style={[styles.pendingText, { color: colors.muted }]}>Entra na previsão, sem alterar o saldo realizado.</Text></View></Pressable>
    </View>
    <Pressable onPress={save} style={({ pressed }) => [styles.save, { backgroundColor: colors.primary, opacity: pressed ? 0.82 : 1 }]}><Text style={styles.saveText}>Salvar lançamento</Text><MaterialIcons name="check" size={20} color="#FFFFFF" /></Pressable>
  </ScrollView></KeyboardAvoidingView></ScreenContainer>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { const { colors } = useFinanceTheme(); return <View style={styles.field}><Text style={[styles.label, { color: colors.text }]}>{label}</Text>{children}</View>; }
function Picker({ label, values, selected, onSelect }: { label: string; values: { id: string; label: string }[]; selected: string; onSelect: (id: string) => void }) { const { colors } = useFinanceTheme(); return <View style={styles.field}><Text style={[styles.label, { color: colors.text }]}>{label}</Text>{values.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerRow}>{values.map((item) => <Pressable key={item.id} onPress={() => onSelect(item.id)} style={({ pressed }) => [styles.pickerOption, { backgroundColor: selected === item.id ? colors.accent : colors.elevated, borderColor: selected === item.id ? colors.primary : "transparent", opacity: pressed ? 0.7 : 1 }]}><Text numberOfLines={1} style={[styles.pickerText, { color: selected === item.id ? colors.primary : colors.text }]}>{item.label}</Text></Pressable>)}</ScrollView> : <Text style={[styles.emptyPicker, { color: colors.warning }]}>Nenhuma opção disponível. Cadastre em Mais.</Text>}</View>; }
const styles = StyleSheet.create({
  flex: { flex: 1 }, content: { paddingHorizontal: 20, paddingBottom: 24 }, typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: 4, marginBottom: 17 }, typeOption: { width: "48.4%", height: 46, borderRadius: 14, borderWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 }, typeText: { fontSize: 12, fontWeight: "800" }, formCard: { borderRadius: 22, borderWidth: 1, padding: 16 }, field: { marginBottom: 17 }, label: { fontSize: 13, fontWeight: "800", marginBottom: 8 }, input: { height: 48, borderRadius: 13, borderWidth: 1, paddingHorizontal: 13, fontSize: 14, fontWeight: "600" }, pickerRow: { gap: 8, paddingRight: 2 }, pickerOption: { maxWidth: 180, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1 }, pickerText: { fontSize: 12, fontWeight: "800" }, emptyPicker: { fontSize: 12, fontWeight: "700", lineHeight: 17 }, pending: { borderRadius: 15, padding: 12, flexDirection: "row", alignItems: "center", marginTop: -1 }, checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 1, alignItems: "center", justifyContent: "center", marginRight: 10 }, pendingCopy: { flex: 1 }, pendingTitle: { fontSize: 13, fontWeight: "800" }, pendingText: { fontSize: 11, lineHeight: 16, marginTop: 1 }, save: { height: 53, borderRadius: 17, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, marginTop: 16 }, saveText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
});
