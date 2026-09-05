import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useEffect, useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { AppHeader, MoneyText, ProgressBar, SectionTitle, Surface, TransactionRow } from "@/components/finance-ui";
import { currentMonth, formatMonth, getCardUsage, getMonthlySummary, type FinanceData } from "@/lib/finance-domain";
import { useFinance } from "@/lib/finance-store";
import { useFinanceTheme } from "@/lib/finance-theme";

export default function HomeScreen() {
  const finance = useFinance();
  const { ready, hasSeenWelcome, demoMode, transactions, cards, budgets, categories, accounts, goals } = finance;
  const { colors } = useFinanceTheme();
  const month = currentMonth();
  const financeData: FinanceData = { accounts, categories, cards, transactions, budgets, goals, demoMode, hasSeenWelcome };
  const summary = getMonthlySummary(financeData, month);
  const recentTransactions = useMemo(() => [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5), [transactions]);
  const openBudget = budgets.map((budget) => ({ budget, category: categories.find((category) => category.id === budget.categoryId) })).find((item) => item.category);
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
        <AppHeader title={demoMode ? "Olá, Marina" : "Olá, tudo bem?"} subtitle={formatMonth(month)} right={<Pressable onPress={() => router.push("/settings" as never)} style={({ pressed }) => [styles.profile, { backgroundColor: colors.accent, opacity: pressed ? 0.7 : 1 }]}><MaterialIcons name="person-outline" size={22} color={colors.primary} /></Pressable>} />
        {demoMode ? <Pressable onPress={() => router.push("/settings" as never)} style={({ pressed }) => [styles.demoBanner, { backgroundColor: colors.accent, opacity: pressed ? 0.7 : 1 }]}><MaterialIcons name="visibility" size={16} color={colors.primary} /><Text style={[styles.demoText, { color: colors.primary }]}>Você está explorando dados de demonstração</Text><MaterialIcons name="chevron-right" size={18} color={colors.primary} /></Pressable> : null}
        <View style={[styles.balanceCard, { backgroundColor: colors.primaryDark }]}>
          <View style={styles.balanceTop}><View><Text style={styles.balanceLabel}>Saldo disponível</Text><MoneyText value={summary.balance} style={styles.balanceValue} /></View><View style={styles.eye}><MaterialIcons name="visibility" size={19} color="#D9F1EA" /></View></View>
          <View style={styles.balanceLine} />
          <View style={styles.forecastRow}><Text style={styles.forecastLabel}>Previsão até o fim do mês</Text><MoneyText value={summary.forecast} style={styles.forecastValue} /></View>
        </View>
        <View style={styles.monthNavigator}><Pressable onPress={() => undefined} style={({ pressed }) => [styles.monthArrow, { backgroundColor: colors.elevated, opacity: pressed ? 0.65 : 1 }]}><MaterialIcons name="chevron-left" size={22} color={colors.text} /></Pressable><Text style={[styles.monthName, { color: colors.text }]}>{formatMonth(month)}</Text><Pressable onPress={() => undefined} style={({ pressed }) => [styles.monthArrow, { backgroundColor: colors.elevated, opacity: pressed ? 0.65 : 1 }]}><MaterialIcons name="chevron-right" size={22} color={colors.text} /></Pressable></View>
        <View style={styles.summaryGrid}><SummaryTile label="Receitas" value={summary.income} positive colors={colors} /><SummaryTile label="Despesas" value={summary.expenses} negative colors={colors} /><SummaryTile label="Resultado" value={summary.result} positive={summary.result >= 0} negative={summary.result < 0} colors={colors} /><SummaryTile label="A gastar" value={Math.max(0, summary.forecast)} colors={colors} /></View>
        <View style={styles.quickActions}><QuickAction colors={colors} icon="add" label="Receita" tint="#DDF5E9" onPress={() => router.push("/add")} /><QuickAction colors={colors} icon="remove" label="Despesa" tint="#FBE5E5" onPress={() => router.push("/add")} /><QuickAction colors={colors} icon="swap-horiz" label="Transferir" tint="#E1EEF8" onPress={() => router.push("/add")} /><QuickAction colors={colors} icon="credit-card" label="Cartão" tint="#F9EDD9" onPress={() => router.push("/add")} /></View>
        <SectionTitle title="Atenção neste mês" />
        <View style={styles.alerts}>{openBudget?.category ? <Surface style={styles.alertCard}><View style={[styles.alertIcon, { backgroundColor: "#FFF2D8" }]}><MaterialIcons name="warning-amber" size={20} color={colors.warning} /></View><View style={styles.alertCopy}><Text style={[styles.alertTitle, { color: colors.text }]}>{openBudget.category.name} está acompanhada</Text><Text style={[styles.alertText, { color: colors.muted }]}>Você já usou {Math.round((summary.expenses / openBudget.budget.amount) * 100)}% do orçamento definido.</Text></View></Surface> : null}{card ? <Surface style={styles.alertCard}><View style={[styles.alertIcon, { backgroundColor: colors.accent }]}><MaterialIcons name="credit-card" size={20} color={colors.primary} /></View><View style={styles.alertCopy}><Text style={[styles.alertTitle, { color: colors.text }]}>Fatura {card.name}</Text><Text style={[styles.alertText, { color: colors.muted }]}>{cardUsage > 0 ? `Há ${cardUsage.toFixed(0)} em compras no período.` : "Nenhuma compra registrada neste período."}</Text></View></Surface> : null}</View>
        <SectionTitle title="Visão rápida" action="Ver relatórios" onAction={() => router.push("/reports" as never)} />
        <Surface style={styles.chartCard}><View style={styles.chartTop}><Text style={[styles.chartTitle, { color: colors.text }]}>Receitas e despesas</Text><Text style={[styles.chartCaption, { color: colors.muted }]}>Este mês</Text></View><View style={styles.barBlock}><View style={styles.barLabels}><Text style={[styles.barLabel, { color: colors.muted }]}>Entrou</Text><MoneyText value={summary.income} style={styles.barValue} positive /></View><ProgressBar value={100} color={colors.positive} /></View><View style={styles.barBlock}><View style={styles.barLabels}><Text style={[styles.barLabel, { color: colors.muted }]}>Saiu</Text><MoneyText value={summary.expenses} style={styles.barValue} negative /></View><ProgressBar value={summary.income ? (summary.expenses / summary.income) * 100 : 0} color={colors.negative} /></View></Surface>
        <SectionTitle title="Últimos lançamentos" action="Ver todos" onAction={() => router.push("/transactions")} />
      </View>}
      ListEmptyComponent={<Surface><Text style={[styles.emptyText, { color: colors.muted }]}>Ainda não há lançamentos. Use Adicionar para começar.</Text></Surface>}
      ListFooterComponent={<View style={{ height: 24 }} />}
    />
  </ScreenContainer>;
}

function SummaryTile({ label, value, positive, negative, colors }: { label: string; value: number; positive?: boolean; negative?: boolean; colors: ReturnType<typeof useFinanceTheme>["colors"] }) { return <Surface style={styles.summaryTile}><Text style={[styles.summaryLabel, { color: colors.muted }]}>{label}</Text><MoneyText value={value} style={styles.summaryMoney} positive={positive} negative={negative} /></Surface>; }
function QuickAction({ colors, icon, label, tint, onPress }: { colors: ReturnType<typeof useFinanceTheme>["colors"]; icon: keyof typeof MaterialIcons.glyphMap; label: string; tint: string; onPress: () => void }) { return <Pressable accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.quickAction, { opacity: pressed ? 0.66 : 1 }]}><View style={[styles.quickIcon, { backgroundColor: tint }]}><MaterialIcons name={icon} size={20} color={colors.primaryDark} /></View><Text style={[styles.quickLabel, { color: colors.text }]}>{label}</Text></Pressable>; }
const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 18 }, loading: { flex: 1, alignItems: "center", justifyContent: "center" }, loadingText: { fontSize: 14, fontWeight: "700" }, profile: { height: 40, width: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" }, demoBanner: { minHeight: 38, borderRadius: 13, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 14 }, demoText: { flex: 1, fontSize: 12, fontWeight: "800" }, balanceCard: { borderRadius: 25, padding: 20, shadowColor: "#064E47", shadowOpacity: 0.18, shadowRadius: 17, shadowOffset: { width: 0, height: 8 }, elevation: 3 }, balanceTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }, balanceLabel: { color: "#CBE6DF", fontSize: 13, fontWeight: "700" }, balanceValue: { color: "#FFFFFF", fontSize: 30, marginTop: 5 }, eye: { height: 35, width: 35, borderRadius: 12, backgroundColor: "#FFFFFF18", alignItems: "center", justifyContent: "center" }, balanceLine: { height: 1, backgroundColor: "#FFFFFF2B", marginVertical: 17 }, forecastRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, forecastLabel: { color: "#CBE6DF", fontSize: 12, fontWeight: "600" }, forecastValue: { color: "#FFFFFF", fontSize: 16 }, monthNavigator: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 18 }, monthArrow: { height: 35, width: 35, borderRadius: 12, alignItems: "center", justifyContent: "center" }, monthName: { fontSize: 14, fontWeight: "800" }, summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 16 }, summaryTile: { width: "48.4%", padding: 13, borderRadius: 17 }, summaryLabel: { fontSize: 11, fontWeight: "700" }, summaryMoney: { fontSize: 15, marginTop: 5 }, quickActions: { flexDirection: "row", justifyContent: "space-between", marginTop: 23 }, quickAction: { alignItems: "center", width: "23%" }, quickIcon: { height: 45, width: 45, borderRadius: 16, alignItems: "center", justifyContent: "center" }, quickLabel: { fontSize: 10, fontWeight: "800", marginTop: 6 }, alerts: { gap: 10 }, alertCard: { padding: 12, borderRadius: 18, flexDirection: "row", alignItems: "center" }, alertIcon: { height: 39, width: 39, borderRadius: 13, alignItems: "center", justifyContent: "center", marginRight: 11 }, alertCopy: { flex: 1 }, alertTitle: { fontSize: 13, fontWeight: "800" }, alertText: { fontSize: 12, lineHeight: 17, marginTop: 2 }, chartCard: { padding: 16, borderRadius: 20 }, chartTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 17 }, chartTitle: { fontSize: 14, fontWeight: "800" }, chartCaption: { fontSize: 12 }, barBlock: { marginBottom: 15 }, barLabels: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }, barLabel: { fontSize: 12, fontWeight: "700" }, barValue: { fontSize: 13 }, emptyText: { textAlign: "center", fontSize: 13 },
});
