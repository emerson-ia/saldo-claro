import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { AppHeader, MoneyText, SectionTitle, Surface, TransactionRow } from "@/components/finance-ui";
import { currentMonth, formatMoney, formatMonth, getCardUsage, getCategorySpending, getMonthlySummary, shiftMonth, type FinanceData } from "@/lib/finance-domain";
import { useFinance } from "@/lib/finance-store";
import { useFinanceTheme } from "@/lib/finance-theme";
import { useAuth } from "@/lib/auth-provider";
import { MonthNavigator } from "@/components/month-navigator";

export default function HomeScreen() {
  const finance = useFinance();
  const { ready, hasSeenWelcome, demoMode, transactions, cards, budgets, categories, accounts, goals, privacyMode, setPrivacyMode } = finance;
  const { colors } = useFinanceTheme();
  const { user } = useAuth();
  const firstName = ((user?.user_metadata.full_name as string | undefined) ?? user?.email?.split("@")[0] ?? "").trim().split(/\s+/)[0];
  const [month, setMonth] = useState(currentMonth);
  const financeData: FinanceData = { accounts, categories, cards, transactions, budgets, goals, demoMode, hasSeenWelcome };
  const summary = getMonthlySummary(financeData, month);
  const recentTransactions = useMemo(() => transactions.filter((item) => item.date.startsWith(month)).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5), [transactions, month]);
  const openBudget = budgets.filter((budget) => budget.month === month).map((budget) => ({ budget, category: categories.find((category) => category.id === budget.categoryId) })).find((item) => item.category);
  const budgetSpending = openBudget?.category ? getCategorySpending(financeData, month, openBudget.category.id) : 0;
  const card = cards[0];
  const cardUsage = card ? getCardUsage(financeData, card, month) : 0;
  useEffect(() => { if (ready && !hasSeenWelcome) router.replace("/welcome"); }, [ready, hasSeenWelcome]);
  if (!ready) return <ScreenContainer><View style={styles.loading}><Text style={[styles.loadingText, { color: colors.muted }]}>Preparando seu painel…</Text></View></ScreenContainer>;
  return <ScreenContainer>
    <FlatList
      data={recentTransactions}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <TransactionRow transaction={item} onPress={() => router.push("/transactions")} />}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={<View>
        <AppHeader title={demoMode ? "Olá, Marina" : firstName ? `Olá, ${firstName}` : "Olá"} subtitle={formatMonth(month)} right={<Pressable onPress={() => router.push("/profile" as never)} style={({ pressed }) => [styles.profile, { backgroundColor: colors.accent, opacity: pressed ? 0.7 : 1 }]}><MaterialIcons name="person-outline" size={22} color={colors.primary} /></Pressable>} />
        {demoMode ? <Pressable onPress={() => router.push("/settings" as never)} style={({ pressed }) => [styles.demoBanner, { backgroundColor: colors.accent, opacity: pressed ? 0.7 : 1 }]}><MaterialIcons name="visibility" size={16} color={colors.primary} /><Text style={[styles.demoText, { color: colors.primary }]}>Você está explorando dados de demonstração</Text><MaterialIcons name="chevron-right" size={18} color={colors.primary} /></Pressable> : null}
        <View style={[styles.balanceCard, { backgroundColor: colors.primaryDark }]}>
          <View style={styles.balanceTop}><View><Text style={styles.balanceLabel}>Saldo disponível</Text><MoneyText value={summary.balance} style={styles.balanceValue} /></View><Pressable accessibilityRole="button" accessibilityLabel={privacyMode ? "Mostrar valores" : "Ocultar valores"} onPress={() => setPrivacyMode(!privacyMode)} hitSlop={8} style={({ pressed }) => [styles.eye, { opacity: pressed ? .65 : 1 }]}><MaterialIcons name={privacyMode ? "visibility-off" : "visibility"} size={19} color="#D9F1EA" /></Pressable></View>
          <View style={styles.balanceLine} />
          <View style={styles.forecastRow}><Text style={styles.forecastLabel}>Previsão até o fim do mês</Text><MoneyText value={summary.forecast} style={styles.forecastValue} /></View>
        </View>
        <MonthNavigator month={month} onPrevious={() => setMonth((value) => shiftMonth(value, -1))} onNext={() => setMonth((value) => shiftMonth(value, 1))} />
        <View style={styles.quickActions}><QuickAction colors={colors} icon="add" label="Receita" tint="#DDF5E9" onPress={() => router.push("/add")} /><QuickAction colors={colors} icon="remove" label="Despesa" tint="#FBE5E5" onPress={() => router.push("/add")} /><QuickAction colors={colors} icon="swap-horiz" label="Transferir" tint="#E1EEF8" onPress={() => router.push("/add")} /><QuickAction colors={colors} icon="credit-card" label="Cartão" tint="#F9EDD9" onPress={() => router.push("/add")} /></View>
        <SectionTitle title="Atenção neste mês" />
        <View style={styles.alerts}>{openBudget?.category ? <Surface style={styles.alertCard}><View style={[styles.alertIcon, { backgroundColor: "#FFF2D8" }]}><MaterialIcons name="warning-amber" size={20} color={colors.warning} /></View><View style={styles.alertCopy}><Text style={[styles.alertTitle, { color: colors.text }]}>Orçamento de {openBudget.category.name}</Text><Text style={[styles.alertText, { color: colors.muted }]}>Você já usou {Math.round((budgetSpending / openBudget.budget.amount) * 100)}% do limite definido.</Text></View></Surface> : null}{card ? <Surface style={styles.alertCard}><View style={[styles.alertIcon, { backgroundColor: colors.accent }]}><MaterialIcons name="credit-card" size={20} color={colors.primary} /></View><View style={styles.alertCopy}><Text style={[styles.alertTitle, { color: colors.text }]}>Fatura {card.name}</Text><Text style={[styles.alertText, { color: colors.muted }]}>{cardUsage > 0 ? `Há ${formatMoney(cardUsage, privacyMode)} em compras no período.` : "Nenhuma compra registrada neste período."}</Text></View></Surface> : null}</View>
        <SectionTitle title="Resumo do mês" action="Ver relatórios" onAction={() => router.push("/reports" as never)} />
        <Surface style={styles.monthSummary}><View style={styles.monthSummaryItem}><Text style={[styles.monthSummaryLabel, { color: colors.muted }]}>Entrou</Text><MoneyText value={summary.income} style={styles.monthSummaryValue} positive /></View><View style={[styles.monthSummaryDivider, { backgroundColor: colors.border }]} /><View style={styles.monthSummaryItem}><Text style={[styles.monthSummaryLabel, { color: colors.muted }]}>Saiu</Text><MoneyText value={summary.expenses} style={styles.monthSummaryValue} negative /></View><View style={[styles.monthSummaryDivider, { backgroundColor: colors.border }]} /><View style={styles.monthSummaryItem}><Text style={[styles.monthSummaryLabel, { color: colors.muted }]}>Resultado</Text><MoneyText value={summary.result} style={styles.monthSummaryValue} positive={summary.result >= 0} negative={summary.result < 0} /></View></Surface>
        <SectionTitle title="Últimos lançamentos" action="Ver todos" onAction={() => router.push("/transactions")} />
      </View>}
      ListEmptyComponent={<Surface><Text style={[styles.emptyText, { color: colors.muted }]}>Ainda não há lançamentos. Use Adicionar para começar.</Text></Surface>}
      ListFooterComponent={<View style={{ height: 24 }} />}
    />
  </ScreenContainer>;
}

function QuickAction({ colors, icon, label, tint, onPress }: { colors: ReturnType<typeof useFinanceTheme>["colors"]; icon: keyof typeof MaterialIcons.glyphMap; label: string; tint: string; onPress: () => void }) { return <Pressable accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.quickAction, { opacity: pressed ? 0.66 : 1 }]}><View style={[styles.quickIcon, { backgroundColor: tint }]}><MaterialIcons name={icon} size={20} color={colors.primaryDark} /></View><Text style={[styles.quickLabel, { color: colors.text }]}>{label}</Text></Pressable>; }
const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 18 }, loading: { flex: 1, alignItems: "center", justifyContent: "center" }, loadingText: { fontSize: 14, fontWeight: "700" }, profile: { height: 40, width: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" }, demoBanner: { minHeight: 38, borderRadius: 13, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 14 }, demoText: { flex: 1, fontSize: 12, fontWeight: "800" }, balanceCard: { borderRadius: 25, padding: 20, shadowColor: "#064E47", shadowOpacity: 0.18, shadowRadius: 17, shadowOffset: { width: 0, height: 8 }, elevation: 3 }, balanceTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }, balanceLabel: { color: "#CBE6DF", fontSize: 13, fontWeight: "700" }, balanceValue: { color: "#FFFFFF", fontSize: 30, marginTop: 5 }, eye: { height: 35, width: 35, borderRadius: 12, backgroundColor: "#FFFFFF18", alignItems: "center", justifyContent: "center" }, balanceLine: { height: 1, backgroundColor: "#FFFFFF2B", marginVertical: 17 }, forecastRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, forecastLabel: { color: "#CBE6DF", fontSize: 12, fontWeight: "600" }, forecastValue: { color: "#FFFFFF", fontSize: 16 }, quickActions: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 }, quickAction: { alignItems: "center", width: "23%" }, quickIcon: { height: 45, width: 45, borderRadius: 16, alignItems: "center", justifyContent: "center" }, quickLabel: { fontSize: 10, fontWeight: "800", marginTop: 6 }, alerts: { gap: 10 }, alertCard: { padding: 12, borderRadius: 18, flexDirection: "row", alignItems: "center" }, alertIcon: { height: 39, width: 39, borderRadius: 13, alignItems: "center", justifyContent: "center", marginRight: 11 }, alertCopy: { flex: 1 }, alertTitle: { fontSize: 13, fontWeight: "800" }, alertText: { fontSize: 12, lineHeight: 17, marginTop: 2 }, monthSummary: { paddingVertical: 14, paddingHorizontal: 8, borderRadius: 18, flexDirection: "row", alignItems: "center" }, monthSummaryItem: { flex: 1, alignItems: "center" }, monthSummaryDivider: { width: 1, height: 34 }, monthSummaryLabel: { fontSize: 10, fontWeight: "700" }, monthSummaryValue: { fontSize: 12, marginTop: 4 }, emptyText: { textAlign: "center", fontSize: 13 },
});
