import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useMemo, useState } from "react";
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { AppHeader, EmptyState, TransactionRow } from "@/components/finance-ui";
import { formatMoney, type Transaction } from "@/lib/finance-domain";
import { useFinance } from "@/lib/finance-store";
import { useFinanceTheme } from "@/lib/finance-theme";

export default function TransactionsScreen() {
  const { transactions, updateTransactionStatus, deleteTransaction } = useFinance();
  const { colors } = useFinanceTheme();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "realized">("all");
  const [selected, setSelected] = useState<Transaction | null>(null);
  const filtered = useMemo(() => transactions.filter((item) => {
    const matchesQuery = item.description.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR"));
    const matchesFilter = filter === "all" || (filter === "pending" ? item.status === "pending" || item.status === "overdue" : item.status === "paid" || item.status === "received");
    return matchesQuery && matchesFilter;
  }).sort((a, b) => b.date.localeCompare(a.date)), [transactions, query, filter]);
  const markAsDone = () => { if (!selected) return; updateTransactionStatus(selected.id, selected.kind === "income" ? "received" : "paid"); setSelected(null); };
  const confirmDelete = () => { if (!selected) return; const id = selected.id; Alert.alert("Excluir lançamento?", "Esta ação remove o lançamento e atualiza os cálculos do painel.", [{ text: "Cancelar", style: "cancel" }, { text: "Excluir", style: "destructive", onPress: () => { deleteTransaction(id); setSelected(null); } }]); };
  return <ScreenContainer>
    <FlatList data={filtered} keyExtractor={(item) => item.id} renderItem={({ item }) => <TransactionRow transaction={item} onPress={() => setSelected(item)} />} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}
      ListHeaderComponent={<View><AppHeader title="Lançamentos" subtitle="Tudo o que movimenta seu dinheiro" /><View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}><MaterialIcons name="search" size={20} color={colors.muted} /><TextInput value={query} onChangeText={setQuery} placeholder="Buscar por descrição" placeholderTextColor={colors.muted} style={[styles.searchInput, { color: colors.text }]} returnKeyType="search" /></View><View style={styles.filters}><FilterChip label="Todos" active={filter === "all"} onPress={() => setFilter("all")} /><FilterChip label="Pendentes" active={filter === "pending"} onPress={() => setFilter("pending")} /><FilterChip label="Realizados" active={filter === "realized"} onPress={() => setFilter("realized")} /></View></View>}
      ListEmptyComponent={<EmptyState icon="receipt-long" title="Nenhum lançamento encontrado" description={query ? "Tente outra busca ou remova o filtro." : "Registre uma receita, despesa, transferência ou compra no cartão."} />}
      ListFooterComponent={<View style={{ height: 18 }} />}
    />
    <Modal visible={Boolean(selected)} transparent animationType="slide" onRequestClose={() => setSelected(null)}><Pressable onPress={() => setSelected(null)} style={styles.modalOverlay}><Pressable onPress={() => undefined} style={[styles.sheet, { backgroundColor: colors.surface }]}>{selected ? <><View style={[styles.sheetHandle, { backgroundColor: colors.border }]} /><Text style={[styles.sheetTitle, { color: colors.text }]}>{selected.description}</Text><Text style={[styles.sheetValue, { color: selected.kind === "income" ? colors.positive : colors.text }]}>{selected.kind === "income" ? "+" : "−"}{formatMoney(selected.amount)}</Text><Text style={[styles.sheetMeta, { color: colors.muted }]}>Status atual: {selected.status === "pending" ? "Pendente" : selected.status === "received" ? "Recebido" : "Pago"}</Text>{selected.status === "pending" || selected.status === "overdue" ? <Pressable onPress={markAsDone} style={({ pressed }) => [styles.sheetPrimary, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}><MaterialIcons name="check" size={20} color="#FFFFFF" /><Text style={styles.sheetPrimaryText}>{selected.kind === "income" ? "Marcar como recebido" : "Marcar como pago"}</Text></Pressable> : null}<Pressable onPress={confirmDelete} style={({ pressed }) => [styles.sheetDelete, { backgroundColor: `${colors.negative}12`, opacity: pressed ? 0.72 : 1 }]}><MaterialIcons name="delete-outline" size={19} color={colors.negative} /><Text style={[styles.sheetDeleteText, { color: colors.negative }]}>Excluir lançamento</Text></Pressable><Pressable onPress={() => setSelected(null)} style={({ pressed }) => [styles.sheetCancel, { opacity: pressed ? 0.65 : 1 }]}><Text style={[styles.sheetCancelText, { color: colors.muted }]}>Fechar</Text></Pressable></> : null}</Pressable></Pressable></Modal>
  </ScreenContainer>;
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) { const { colors } = useFinanceTheme(); return <Pressable onPress={onPress} style={({ pressed }) => [styles.filter, { backgroundColor: active ? colors.primary : colors.elevated, opacity: pressed ? 0.7 : 1 }]}><Text style={[styles.filterText, { color: active ? "#FFFFFF" : colors.text }]}>{label}</Text></Pressable>; }
const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 20 }, search: { height: 48, borderRadius: 15, borderWidth: 1, alignItems: "center", flexDirection: "row", paddingHorizontal: 13, marginTop: 2 }, searchInput: { flex: 1, fontSize: 14, fontWeight: "600", marginLeft: 9, height: 46 }, filters: { flexDirection: "row", gap: 8, marginVertical: 16 }, filter: { paddingVertical: 9, paddingHorizontal: 13, borderRadius: 13 }, filterText: { fontSize: 12, fontWeight: "800" }, modalOverlay: { flex: 1, backgroundColor: "#00000066", justifyContent: "flex-end" }, sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: 32 }, sheetHandle: { width: 38, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 20 }, sheetTitle: { fontSize: 21, fontWeight: "800", textAlign: "center" }, sheetValue: { fontSize: 26, lineHeight: 34, fontWeight: "800", textAlign: "center", marginTop: 6 }, sheetMeta: { fontSize: 13, textAlign: "center", marginTop: 7 }, sheetPrimary: { height: 50, borderRadius: 16, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, marginTop: 24 }, sheetPrimaryText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" }, sheetDelete: { height: 50, borderRadius: 16, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, marginTop: 10 }, sheetDeleteText: { fontSize: 14, fontWeight: "800" }, sheetCancel: { alignItems: "center", marginTop: 16, padding: 8 }, sheetCancelText: { fontSize: 14, fontWeight: "800" },
});
