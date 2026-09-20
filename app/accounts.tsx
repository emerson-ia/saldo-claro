import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { BankBadge } from "@/components/bank-badge";
import { ScreenContainer } from "@/components/screen-container";
import { SecureDeleteModal } from "@/components/secure-delete-modal";
import { AppHeader, EmptyState, MoneyText, Surface } from "@/components/finance-ui";
import { BANKS, bankForName } from "@/lib/bank-directory";
import { calculateAccountBalance, type Account } from "@/lib/finance-domain";
import { useFinance } from "@/lib/finance-store";
import { useFinanceTheme } from "@/lib/finance-theme";

export default function AccountsScreen() {
  const { accounts, transactions, addAccount, updateAccount, deleteAccount } = useFinance();
  const { colors } = useFinanceTheme();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("");
  const [balance, setBalance] = useState("0,00");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Account | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Account | null>(null);
  const suggestions = useMemo(() => {
    const query = institution.trim().toLocaleLowerCase("pt-BR");
    return query ? BANKS.filter((bank) => bank.name.toLocaleLowerCase("pt-BR").includes(query)).slice(0, 18) : BANKS.slice(0, 18);
  }, [institution]);
  const close = () => { setOpen(false); setEditing(null); setName(""); setInstitution(""); setBalance("0,00"); setError(""); };
  const openNew = () => { close(); setOpen(true); };
  const beginEdit = (account: Account) => { setEditing(account); setName(account.name); setInstitution(account.institution ?? ""); setBalance(String(account.initialBalance).replace(".", ",")); setError(""); setOpen(true); };
  const confirmDelete = (account: Account) => Alert.alert("Excluir conta?", `A conta “${account.name}” será removida. Os lançamentos já registrados serão preservados.`, [{ text: "Cancelar", style: "cancel" }, { text: "Continuar", style: "destructive", onPress: () => setPendingDelete(account) }]);
  const chooseBank = (bankName: string) => { setInstitution(bankName); setError(""); };
  const save = () => {
    if (!name.trim()) return setError("Dê um nome para esta conta.");
    if (!institution.trim()) return setError("Digite ou escolha o banco desta conta.");
    const bank = bankForName(institution);
    const next = { name: name.trim(), type: editing?.type ?? "Conta corrente" as const, institution: institution.trim(), color: bank?.color ?? "#607D76", initialBalance: Number(balance.replace(/[.\s]/g, "").replace(",", ".")) || 0, includeInTotal: editing?.includeInTotal ?? true };
    if (editing) updateAccount(editing.id, next); else addAccount(next);
    close();
  };

  return <ScreenContainer><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <AppHeader title="Contas e carteiras" subtitle="Seu saldo é calculado pelas movimentações" back right={<Pressable accessibilityRole="button" accessibilityLabel="Adicionar conta" onPress={openNew} style={({ pressed }) => [styles.add, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}><MaterialIcons name="add" size={21} color={colors.onPrimary} /></Pressable>} />
    {accounts.length ? <View style={styles.list}>{accounts.map((account) => <Surface key={account.id} style={styles.account}><BankBadge name={account.institution || account.name} size={45} style={styles.accountIcon} /><View style={styles.accountCopy}><Text style={[styles.accountName, { color: colors.text }]}>{account.name}</Text><Text style={[styles.accountMeta, { color: colors.muted }]}>{account.institution || account.type}</Text></View><View style={styles.accountRight}><MoneyText value={calculateAccountBalance(account, transactions)} style={styles.balance} /><View style={styles.accountActions}><Pressable accessibilityRole="button" accessibilityLabel={`Editar ${account.name}`} onPress={() => beginEdit(account)} hitSlop={8}><MaterialIcons name="edit" size={18} color={colors.primary} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Excluir ${account.name}`} onPress={() => confirmDelete(account)} hitSlop={8}><MaterialIcons name="delete-outline" size={19} color={colors.negative} /></Pressable></View></View></Surface>)}</View> : <EmptyState icon="account-balance-wallet" title="Cadastre sua primeira conta" description="Contas ajudam a separar o dinheiro do dia a dia da sua reserva." action="Adicionar conta" onAction={() => setOpen(true)} />}
    <Text style={[styles.note, { color: colors.muted }]}>Os saldos são atualizados automaticamente a partir de receitas, despesas e transferências realizadas.</Text>
  </ScrollView>
  <Modal visible={open} transparent animationType="slide" onRequestClose={close}><View style={styles.overlay}><View style={[styles.sheet, { backgroundColor: colors.surface }]}><View style={[styles.handle, { backgroundColor: colors.border }]} /><ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"><Text style={[styles.sheetTitle, { color: colors.text }]}>{editing ? "Editar conta" : "Nova conta"}</Text>
    <Text style={[styles.label, { color: colors.text }]}>Nome da conta</Text><TextInput value={name} onChangeText={(value) => { setName(value); setError(""); }} placeholder="Ex.: Conta do dia a dia" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.text, borderColor: colors.border }]} />
    <Text style={[styles.label, { color: colors.text, marginTop: 15 }]}>Banco ou instituição</Text><View style={[styles.bankInput, { borderColor: colors.border, backgroundColor: colors.elevated }]}><BankBadge name={institution} size={28} /><TextInput value={institution} onChangeText={(value) => { setInstitution(value); setError(""); }} placeholder="Digite o nome do banco" placeholderTextColor={colors.muted} style={[styles.bankTextInput, { color: colors.text }]} autoCapitalize="words" /><MaterialIcons name="search" size={19} color={colors.muted} /></View>
    <View style={styles.bankHeading}><Text style={[styles.bankHint, { color: colors.muted }]}>{institution.trim() ? "Escolha a marca correspondente" : "Bancos e instituições populares"}</Text><Text style={[styles.bankCount, { color: colors.muted }]}>{suggestions.length} opções</Text></View>
    <View style={styles.bankGrid}>{suggestions.map((bank) => { const selected = institution.trim().toLocaleLowerCase("pt-BR") === bank.name.toLocaleLowerCase("pt-BR"); return <Pressable key={bank.name} accessibilityRole="button" accessibilityLabel={`Selecionar ${bank.name}`} onPress={() => chooseBank(bank.name)} style={({ pressed }) => [styles.bankOption, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.accent : colors.surface, opacity: pressed ? .68 : 1 }]}><BankBadge name={bank.name} size={36} /><Text numberOfLines={1} style={[styles.bankName, { color: selected ? colors.primary : colors.text }]}>{bank.name}</Text>{selected ? <MaterialIcons name="check-circle" size={16} color={colors.primary} style={styles.selected} /> : null}</Pressable>; })}</View>
    {institution.trim() && !suggestions.length ? <Text style={[styles.customHint, { color: colors.muted }]}>Usaremos um pin com as iniciais de “{institution.trim()}”.</Text> : null}
    <Text style={[styles.label, { color: colors.text, marginTop: 17 }]}>Saldo inicial</Text><TextInput value={balance} onChangeText={setBalance} placeholder="0,00" keyboardType="decimal-pad" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.text, borderColor: colors.border }]} />
    {error ? <Text style={[styles.error, { color: colors.negative }]}>{error}</Text> : null}
    <Pressable onPress={save} style={({ pressed }) => [styles.save, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}><Text style={[styles.saveText, { color: colors.onPrimary }]}>{editing ? "Salvar alterações" : "Salvar conta"}</Text></Pressable><Pressable onPress={close} style={styles.cancel}><Text style={[styles.cancelText, { color: colors.muted }]}>Cancelar</Text></Pressable>
  </ScrollView></View></View></Modal>
  <SecureDeleteModal visible={Boolean(pendingDelete)} itemLabel={pendingDelete?.name ?? ""} onClose={() => setPendingDelete(null)} onConfirm={() => { if (pendingDelete) deleteAccount(pendingDelete.id); }} />
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 28 }, add: { height: 40, width: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" }, list: { gap: 10 }, account: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 20 }, accountIcon: { marginRight: 12 }, accountCopy: { flex: 1 }, accountRight: { alignItems: "flex-end", gap: 8 }, accountActions: { flexDirection: "row", gap: 15, paddingRight: 1 }, accountName: { fontSize: 14, fontWeight: "800" }, accountMeta: { fontSize: 12, marginTop: 2 }, balance: { fontSize: 15 }, note: { fontSize: 12, lineHeight: 18, textAlign: "center", marginHorizontal: 20, marginTop: 20 }, overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "#00000066" }, sheet: { maxHeight: "91%", paddingHorizontal: 22, paddingTop: 14, paddingBottom: 22, borderTopLeftRadius: 28, borderTopRightRadius: 28 }, handle: { width: 38, height: 4, borderRadius: 3, alignSelf: "center", marginBottom: 18 }, sheetTitle: { fontSize: 20, fontWeight: "800", marginBottom: 18 }, label: { fontSize: 13, fontWeight: "800", marginBottom: 7 }, input: { height: 48, borderRadius: 13, borderWidth: 1, paddingHorizontal: 13, fontSize: 14, fontWeight: "600" }, bankInput: { height: 52, borderRadius: 15, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 11 }, bankTextInput: { flex: 1, height: 50, fontSize: 14, fontWeight: "700" }, bankHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 13, marginBottom: 8 }, bankHint: { fontSize: 11, fontWeight: "700" }, bankCount: { fontSize: 10, fontWeight: "800" }, bankGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, bankOption: { width: "31.9%", minHeight: 72, borderRadius: 15, borderWidth: 1, padding: 8, alignItems: "center", justifyContent: "center" }, bankName: { fontSize: 9, lineHeight: 12, fontWeight: "800", textAlign: "center", marginTop: 4, maxWidth: "100%" }, selected: { position: "absolute", top: 5, right: 5 }, customHint: { fontSize: 11, lineHeight: 16, marginTop: 9 }, error: { fontSize: 12, fontWeight: "700", marginTop: 11 }, save: { height: 51, borderRadius: 16, alignItems: "center", justifyContent: "center", marginTop: 21 }, saveText: { fontSize: 14, fontWeight: "800" }, cancel: { alignItems: "center", marginTop: 13, padding: 7 }, cancelText: { fontSize: 13, fontWeight: "800" },
});
