import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { AppHeader, MoneyText, SectionTitle, Surface, TransactionRow } from "@/components/finance-ui";
import { currentMonth, formatDate, formatMoney, formatMonth, getEndOfMonthForecast, getFinancialAlerts, getMonthlySummary, getSafeToSpendSummary, shiftMonth, type FinanceData, type FinancialAlert } from "@/lib/finance-domain";
import { useFinance } from "@/lib/finance-store";
import { useFinanceTheme } from "@/lib/finance-theme";
import { useAuth } from "@/lib/auth-provider";
import { MonthNavigator } from "@/components/month-navigator";

export default function HomeScreen() {
  const finance = useFinance();
  const { ready, hasSeenWelcome, demoMode, transactions, cards, budgets, categories, accounts, goals, recurringRules, safetyBuffer, privacyMode, setPrivacyMode } = finance;
  const { colors } = useFinanceTheme();
  const { user } = useAuth();
  const firstName = ((user?.user_metadata.full_name as string | undefined) ?? user?.email?.split("@")[0] ?? "").trim().split(/\s+/)[0];
  const [month, setMonth] = useState(currentMonth);
  const financeData: FinanceData = { accounts, categories, cards, transactions, budgets, goals, recurringRules, safetyBuffer, demoMode, hasSeenWelcome };
  const summary = getMonthlySummary(financeData, month);
  const safeToSpend = getSafeToSpendSummary(financeData);
  const endOfMonthForecast = getEndOfMonthForecast(financeData);
  const recentTransactions = useMemo(() => transactions.filter((item) => item.date.startsWith(month)).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5), [transactions, month]);
  const alerts = getFinancialAlerts(financeData);
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
          <View style={styles.balanceTop}><View><Text style={styles.balanceLabel}>SEU SALDO CLARO</Text><Text style={styles.balanceQuestion}>Quanto você pode gastar?</Text></View><Pressable accessibilityRole="button" accessibilityLabel={privacyMode ? "Mostrar valores" : "Ocultar valores"} onPress={() => setPrivacyMode(!privacyMode)} hitSlop={8} style={({ pressed }) => [styles.eye, { opacity: pressed ? .65 : 1 }]}><MaterialIcons name={privacyMode ? "visibility-off" : "visibility"} size={19} color="#D9F1EA" /></Pressable></View>
          <MoneyText value={safeToSpend.available} style={styles.balanceValue} />
          {safeToSpend.shortfall > 0 ? <Text style={styles.shortfall}>Faltam {formatMoney(safeToSpend.shortfall, privacyMode)} para cobrir os compromissos registrados.</Text> : <Text style={styles.dailyAllowance}>Você pode usar até {formatMoney(safeToSpend.dailyAllowance, privacyMode)} por dia até {formatDate(safeToSpend.nextIncomeDate)}.</Text>}
          <View style={styles.balanceLine} />
          <View style={styles.commitmentRow}><Text style={styles.forecastLabel}>Saldo nas contas</Text><MoneyText value={safeToSpend.accountBalance} style={styles.forecastValue} /></View>
          <View style={styles.commitmentRow}><Text style={styles.forecastLabel}>Comprometido até {formatDate(safeToSpend.nextIncomeDate)}</Text><MoneyText value={safeToSpend.scheduledExpenses + safeToSpend.cardCommitments} style={styles.forecastValue} negative /></View>
          {(safeToSpend.goalReserve > 0 || safeToSpend.safetyBuffer > 0) ? <View style={styles.commitmentRow}><Text style={styles.forecastLabel}>Reservado para metas e segurança</Text><MoneyText value={safeToSpend.goalReserve + safeToSpend.safetyBuffer} style={styles.forecastValue} negative /></View> : null}
          <Pressable accessibilityRole="button" onPress={() => router.push("/settings" as never)} style={({ pressed }) => [styles.bufferLink, { opacity: pressed ? .68 : 1 }]}><MaterialIcons name="tune" size={15} color="#D9F1EA" /><Text style={styles.bufferText}>Ajustar margem de segurança</Text><MaterialIcons name="chevron-right" size={17} color="#D9F1EA" /></Pressable>
        </View>
        <View style={[styles.forecastCard, { backgroundColor: colors.accent, borderColor: `${colors.primary}24` }]}>
          <View style={styles.forecastTop}>
            <View style={[styles.forecastIcon, { backgroundColor: colors.primary }]}><MaterialIcons name="calendar-month" size={19} color="#FFFFFF" /></View>
            <View style={styles.forecastCopy}><Text style={[styles.forecastKicker, { color: colors.primary }]}>PREVISÃO DO FIM DO MÊS</Text><Text style={[styles.forecastTitle, { color: colors.text }]}>{endOfMonthForecast.projectedBalance >= 0 ? "Você termina o mês com" : "Atenção: o mês fecha negativo"}</Text></View>
          </View>
          <MoneyText value={Math.abs(endOfMonthForecast.projectedBalance)} style={[styles.forecastAmount, { color: endOfMonthForecast.projectedBalance >= 0 ? colors.primaryDark : colors.negative }]} />
          <Text style={[styles.forecastDescription, { color: colors.muted }]}>Baseado nos lançamentos registrados para {formatMonth(endOfMonthForecast.month).toLowerCase()}.</Text>
          <View style={[styles.forecastLine, { backgroundColor: `${colors.primary}22` }]} />
          <View style={styles.forecastBreakdown}>
            <ForecastMetric label="Saldo atual" value={endOfMonthForecast.accountBalance} colors={colors} />
            <ForecastMetric label="A receber" value={endOfMonthForecast.expectedIncome} colors={colors} positive />
            <ForecastMetric label="A pagar + cartão" value={endOfMonthForecast.expectedExpenses + endOfMonthForecast.cardCommitments} colors={colors} negative />
          </View>
        </View>
        <MonthNavigator month={month} onPrevious={() => setMonth((value) => shiftMonth(value, -1))} onNext={() => setMonth((value) => shiftMonth(value, 1))} />
        <View style={styles.quickActions}><QuickAction colors={colors} icon="add" label="Receita" tint="#DDF5E9" onPress={() => router.push("/add")} /><QuickAction colors={colors} icon="remove" label="Despesa" tint="#FBE5E5" onPress={() => router.push("/add")} /><QuickAction colors={colors} icon="swap-horiz" label="Transferir" tint="#E1EEF8" onPress={() => router.push("/add")} /><QuickAction colors={colors} icon="credit-card" label="Cartão" tint="#F9EDD9" onPress={() => router.push("/add")} /></View>
        {alerts.length ? <><SectionTitle title="Atenção neste mês" /><View style={styles.alerts}>{alerts.map((alert) => <SmartAlert key={alert.id} alert={alert} />)}</View></> : null}
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
function ForecastMetric({ label, value, colors, positive, negative }: { label: string; value: number; colors: ReturnType<typeof useFinanceTheme>["colors"]; positive?: boolean; negative?: boolean }) { return <View style={styles.forecastMetric}><Text style={[styles.forecastMetricLabel, { color: colors.muted }]}>{label}</Text><MoneyText value={value} style={[styles.forecastMetricValue, { color: positive ? colors.positive : negative ? colors.negative : colors.text }]} positive={positive} negative={negative} /></View>; }
function SmartAlert({ alert }: { alert: FinancialAlert }) { const { colors } = useFinanceTheme(); const danger = alert.severity === "danger"; const iconColor = danger ? colors.negative : colors.warning; const tint = danger ? `${colors.negative}16` : "#FFF2D8"; return <Surface style={styles.alertCard}><View style={[styles.alertIcon, { backgroundColor: tint }]}><MaterialIcons name={alert.icon} size={20} color={iconColor} /></View><View style={styles.alertCopy}><Text style={[styles.alertTitle, { color: colors.text }]}>{alert.title}</Text><Text style={[styles.alertText, { color: colors.muted }]}>{alert.description}</Text></View></Surface>; }
const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 18 }, loading: { flex: 1, alignItems: "center", justifyContent: "center" }, loadingText: { fontSize: 14, fontWeight: "700" }, profile: { height: 40, width: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" }, demoBanner: { minHeight: 38, borderRadius: 13, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 14 }, demoText: { flex: 1, fontSize: 12, fontWeight: "800" }, balanceCard: { borderRadius: 25, padding: 20, shadowColor: "#064E47", shadowOpacity: 0.18, shadowRadius: 17, shadowOffset: { width: 0, height: 8 }, elevation: 3 }, balanceTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }, balanceLabel: { color: "#A9D9CD", fontSize: 10, letterSpacing: 1.1, fontWeight: "900" }, balanceQuestion: { color: "#E4F5F0", fontSize: 15, fontWeight: "700", marginTop: 5 }, balanceValue: { color: "#FFFFFF", fontSize: 34, marginTop: 9, fontWeight: "800" }, dailyAllowance: { color: "#CBE6DF", fontSize: 12, lineHeight: 18, marginTop: 5, fontWeight: "600" }, shortfall: { color: "#FFD9D9", fontSize: 12, lineHeight: 18, marginTop: 5, fontWeight: "700" }, eye: { height: 35, width: 35, borderRadius: 12, backgroundColor: "#FFFFFF18", alignItems: "center", justifyContent: "center" }, balanceLine: { height: 1, backgroundColor: "#FFFFFF2B", marginVertical: 15 }, commitmentRow: { flexDirection: "row", gap: 12, alignItems: "flex-start", justifyContent: "space-between", paddingVertical: 3 }, forecastLabel: { color: "#CBE6DF", fontSize: 11, fontWeight: "600", flex: 1, lineHeight: 16 }, forecastValue: { color: "#FFFFFF", fontSize: 13, fontWeight: "800", textAlign: "right" }, bufferLink: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#FFFFFF20", flexDirection: "row", alignItems: "center", gap: 5 }, bufferText: { color: "#D9F1EA", fontSize: 11, fontWeight: "800", flex: 1 }, forecastCard: { marginTop: 14, borderWidth: 1, borderRadius: 22, padding: 16 }, forecastTop: { flexDirection: "row", alignItems: "center" }, forecastIcon: { height: 39, width: 39, borderRadius: 13, alignItems: "center", justifyContent: "center", marginRight: 10 }, forecastCopy: { flex: 1 }, forecastKicker: { fontSize: 9, letterSpacing: .9, fontWeight: "900" }, forecastTitle: { fontSize: 14, fontWeight: "800", marginTop: 3 }, forecastAmount: { fontSize: 27, lineHeight: 34, fontWeight: "900", marginTop: 13 }, forecastDescription: { fontSize: 11, lineHeight: 16, marginTop: 3 }, forecastLine: { height: 1, marginVertical: 13 }, forecastBreakdown: { flexDirection: "row", gap: 8 }, forecastMetric: { flex: 1 }, forecastMetricLabel: { fontSize: 9, fontWeight: "700", lineHeight: 13 }, forecastMetricValue: { fontSize: 11, fontWeight: "900", marginTop: 3 }, quickActions: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 }, quickAction: { alignItems: "center", width: "23%" }, quickIcon: { height: 45, width: 45, borderRadius: 16, alignItems: "center", justifyContent: "center" }, quickLabel: { fontSize: 10, fontWeight: "800", marginTop: 6 }, alerts: { gap: 10 }, alertCard: { padding: 12, borderRadius: 18, flexDirection: "row", alignItems: "center" }, alertIcon: { height: 39, width: 39, borderRadius: 13, alignItems: "center", justifyContent: "center", marginRight: 11 }, alertCopy: { flex: 1 }, alertTitle: { fontSize: 13, fontWeight: "800" }, alertText: { fontSize: 12, lineHeight: 17, marginTop: 2 }, monthSummary: { paddingVertical: 14, paddingHorizontal: 8, borderRadius: 18, flexDirection: "row", alignItems: "center" }, monthSummaryItem: { flex: 1, alignItems: "center" }, monthSummaryDivider: { width: 1, height: 34 }, monthSummaryLabel: { fontSize: 10, fontWeight: "700" }, monthSummaryValue: { fontSize: 12, marginTop: 4 }, emptyText: { textAlign: "center", fontSize: 13 },
});
