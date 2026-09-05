import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { formatDate, formatMoney, type Category, type Transaction } from "@/lib/finance-domain";
import { useFinance } from "@/lib/finance-store";
import { useFinanceTheme } from "@/lib/finance-theme";

export function AppHeader({ title, subtitle, back = false, right }: { title: string; subtitle?: string; back?: boolean; right?: ReactNode }) {
  const { colors } = useFinanceTheme();
  return <View style={styles.header}>
    <View style={styles.headerTitleRow}>
      {back ? <Pressable accessibilityLabel="Voltar" onPress={() => router.back()} style={({ pressed }) => [styles.back, { backgroundColor: colors.elevated, opacity: pressed ? 0.7 : 1 }]}><MaterialIcons name="arrow-back" size={21} color={colors.text} /></Pressable> : null}
      <View style={styles.headerText}><Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>{subtitle ? <Text style={[styles.headerSubtitle, { color: colors.muted }]}>{subtitle}</Text> : null}</View>
    </View>
    {right}
  </View>;
}

export function Surface({ children, style }: { children: ReactNode; style?: object }) {
  const { colors } = useFinanceTheme();
  return <View style={[styles.surface, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>{children}</View>;
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const { colors } = useFinanceTheme();
  return <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>{action && onAction ? <Pressable onPress={onAction} style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1 })}><Text style={[styles.sectionAction, { color: colors.primary }]}>{action}</Text></Pressable> : null}</View>;
}

export function MoneyText({ value, style, positive, negative }: { value: number; style?: object; positive?: boolean; negative?: boolean }) {
  const { privacyMode } = useFinance();
  const { colors } = useFinanceTheme();
  return <Text style={[styles.money, { color: positive ? colors.positive : negative ? colors.negative : colors.text }, style]}>{formatMoney(value, privacyMode)}</Text>;
}

export function ProgressBar({ value, color, trackColor }: { value: number; color: string; trackColor?: string }) {
  const { colors } = useFinanceTheme();
  return <View style={[styles.progressTrack, { backgroundColor: trackColor ?? colors.elevated }]}><View style={[styles.progressFill, { backgroundColor: color, width: `${Math.max(0, Math.min(value, 100))}%` }]} /></View>;
}

function transactionCategory(categories: Category[], transaction: Transaction) { return categories.find((category) => category.id === transaction.categoryId); }

export function TransactionRow({ transaction, compact = false, onPress }: { transaction: Transaction; compact?: boolean; onPress?: () => void }) {
  const { categories, privacyMode } = useFinance();
  const { colors } = useFinanceTheme();
  const category = transactionCategory(categories, transaction);
  const isIncome = transaction.kind === "income";
  const isTransfer = transaction.kind === "transfer";
  const iconName = isIncome ? "south-west" : isTransfer ? "swap-horiz" : transaction.kind === "card" ? "credit-card" : (category?.icon as keyof typeof MaterialIcons.glyphMap) ?? "receipt-long";
  const status = transaction.status === "pending" ? "Pendente" : transaction.status === "overdue" ? "Atrasado" : transaction.status === "received" ? "Recebido" : transaction.status === "paid" ? "Pago" : "Cancelado";
  return <Pressable disabled={!onPress} onPress={onPress} style={({ pressed }) => [styles.transactionRow, { opacity: pressed ? 0.72 : 1 }]}>
    <View style={[styles.transactionIcon, { backgroundColor: isIncome ? `${colors.positive}18` : isTransfer ? `${colors.primary}18` : `${colors.negative}14` }]}><MaterialIcons name={iconName} size={20} color={isIncome ? colors.positive : isTransfer ? colors.primary : colors.negative} /></View>
    <View style={styles.transactionCopy}><Text numberOfLines={1} style={[styles.transactionTitle, { color: colors.text }]}>{transaction.description}</Text><Text style={[styles.transactionMeta, { color: colors.muted }]}>{formatDate(transaction.date)} · {category?.name ?? status}{transaction.installment ? ` · ${transaction.installment.current}/${transaction.installment.total}` : ""}</Text></View>
    <View style={styles.transactionAmountWrap}><Text style={[styles.transactionAmount, { color: isIncome ? colors.positive : isTransfer ? colors.primary : colors.text }]}>{isIncome ? "+" : isTransfer ? "↔" : "−"}{formatMoney(transaction.amount, privacyMode).replace("R$", "")}</Text><Text style={[styles.status, { color: transaction.status === "pending" ? colors.warning : colors.muted }]}>{status}</Text></View>
  </Pressable>;
}

export function EmptyState({ icon, title, description, action, onAction }: { icon: keyof typeof MaterialIcons.glyphMap; title: string; description: string; action?: string; onAction?: () => void }) {
  const { colors } = useFinanceTheme();
  return <Surface style={styles.empty}><View style={[styles.emptyIcon, { backgroundColor: colors.accent }]}><MaterialIcons name={icon} size={27} color={colors.primary} /></View><Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text><Text style={[styles.emptyDescription, { color: colors.muted }]}>{description}</Text>{action && onAction ? <Pressable onPress={onAction} style={({ pressed }) => [styles.primarySmall, { backgroundColor: colors.primary, opacity: pressed ? 0.84 : 1 }]}><Text style={styles.primarySmallText}>{action}</Text></Pressable> : null}</Surface>;
}

export function IconButton({ icon, label, onPress, tone = "neutral" }: { icon: keyof typeof MaterialIcons.glyphMap; label: string; onPress: () => void; tone?: "neutral" | "primary" }) {
  const { colors } = useFinanceTheme();
  const background = tone === "primary" ? colors.primary : colors.elevated;
  const color = tone === "primary" ? "#FFFFFF" : colors.text;
  return <Pressable accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.iconButton, { backgroundColor: background, opacity: pressed ? 0.7 : 1 }]}><MaterialIcons name={icon} size={20} color={color} /></Pressable>;
}

export const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14 },
  headerTitleRow: { flexDirection: "row", alignItems: "center", flex: 1 }, headerText: { flexShrink: 1 }, headerTitle: { fontSize: 25, lineHeight: 31, fontWeight: "800", letterSpacing: -0.5 }, headerSubtitle: { fontSize: 13, lineHeight: 18, marginTop: 1 }, back: { height: 40, width: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginRight: 10 },
  surface: { borderRadius: 22, borderWidth: 1, padding: 16, shadowColor: "#0C211C", shadowOpacity: 0.04, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 1 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 25, marginBottom: 11 }, sectionTitle: { fontSize: 17, fontWeight: "800", letterSpacing: -0.2 }, sectionAction: { fontSize: 13, fontWeight: "700" },
  money: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 }, progressTrack: { height: 8, borderRadius: 4, overflow: "hidden" }, progressFill: { height: "100%", borderRadius: 4 },
  transactionRow: { flexDirection: "row", alignItems: "center", minHeight: 68, paddingVertical: 8 }, transactionIcon: { width: 42, height: 42, borderRadius: 15, alignItems: "center", justifyContent: "center", marginRight: 11 }, transactionCopy: { flex: 1, minWidth: 0 }, transactionTitle: { fontSize: 14, lineHeight: 19, fontWeight: "700" }, transactionMeta: { fontSize: 12, lineHeight: 17, marginTop: 1 }, transactionAmountWrap: { alignItems: "flex-end", marginLeft: 8 }, transactionAmount: { fontSize: 14, fontWeight: "800" }, status: { fontSize: 11, fontWeight: "600", marginTop: 2 },
  empty: { alignItems: "center", paddingVertical: 28, paddingHorizontal: 20 }, emptyIcon: { height: 54, width: 54, borderRadius: 19, alignItems: "center", justifyContent: "center", marginBottom: 12 }, emptyTitle: { fontSize: 16, fontWeight: "800", textAlign: "center" }, emptyDescription: { fontSize: 13, lineHeight: 19, marginTop: 6, textAlign: "center", maxWidth: 265 }, primarySmall: { borderRadius: 14, paddingHorizontal: 15, paddingVertical: 10, marginTop: 16 }, primarySmallText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  iconButton: { height: 40, width: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
});
