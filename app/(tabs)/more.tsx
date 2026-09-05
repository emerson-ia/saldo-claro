import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { FlatList, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { AppHeader, Surface } from "@/components/finance-ui";
import { useFinance } from "@/lib/finance-store";
import { useFinanceTheme } from "@/lib/finance-theme";

const menu = [
  { label: "Contas e carteiras", description: "Saldos e movimentações", icon: "account-balance-wallet", route: "/accounts" },
  { label: "Cartões", description: "Faturas, limites e compras", icon: "credit-card", route: "/cards" },
  { label: "Categorias", description: "Organize seus lançamentos", icon: "category", route: "/categories" },
  { label: "Relatórios", description: "Análises do seu mês", icon: "insights", route: "/reports" },
  { label: "Configurações", description: "Tema, privacidade e dados", icon: "settings", route: "/settings" },
] as const;

export default function MoreScreen() {
  const { privacyMode, setPrivacyMode } = useFinance();
  const { colors } = useFinanceTheme();
  return <ScreenContainer><FlatList data={menu} keyExtractor={(item) => item.label} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}
    ListHeaderComponent={<View><AppHeader title="Mais" subtitle="Deixe sua vida financeira do seu jeito" /><Surface style={[styles.privacy, { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark }]}><View style={styles.privacyIcon}><MaterialIcons name={privacyMode ? "visibility-off" : "visibility"} size={20} color="#FFFFFF" /></View><View style={styles.privacyCopy}><Text style={styles.privacyTitle}>Ocultar valores financeiros</Text><Text style={styles.privacyText}>Proteja sua privacidade na tela.</Text></View><Switch value={privacyMode} onValueChange={setPrivacyMode} trackColor={{ false: "#ffffff55", true: "#FFFFFF" }} thumbColor={privacyMode ? colors.primary : "#D6EAE4"} /></Surface><Text style={[styles.section, { color: colors.muted }]}>GERENCIAR</Text></View>}
    renderItem={({ item }) => <Pressable onPress={() => router.push(item.route as never)} style={({ pressed }) => [styles.menuItem, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}><View style={[styles.menuIcon, { backgroundColor: colors.accent }]}><MaterialIcons name={item.icon} size={20} color={colors.primary} /></View><View style={styles.menuCopy}><Text style={[styles.menuTitle, { color: colors.text }]}>{item.label}</Text><Text style={[styles.menuDescription, { color: colors.muted }]}>{item.description}</Text></View><MaterialIcons name="chevron-right" size={22} color={colors.muted} /></Pressable>}
    ListFooterComponent={<View style={{ marginTop: 19 }}><Text style={[styles.section, { color: colors.muted }]}>FERRAMENTAS</Text><Surface style={styles.tool}><View style={[styles.menuIcon, { backgroundColor: "#FFF2D8" }]}><MaterialIcons name="file-download" size={20} color={colors.warning} /></View><View style={styles.menuCopy}><Text style={[styles.menuTitle, { color: colors.text }]}>Importar e exportar</Text><Text style={[styles.menuDescription, { color: colors.muted }]}>Em breve: CSV e relatório mensal.</Text></View></Surface><Text style={[styles.version, { color: colors.muted }]}>Saldo Claro · Versão de demonstração</Text></View>}
  /></ScreenContainer>;
}
const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 24 }, privacy: { padding: 14, borderRadius: 20, flexDirection: "row", alignItems: "center" }, privacyIcon: { height: 39, width: 39, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF20", marginRight: 10 }, privacyCopy: { flex: 1 }, privacyTitle: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" }, privacyText: { color: "#CBE6DF", fontSize: 11, marginTop: 2 }, section: { fontSize: 10, fontWeight: "800", letterSpacing: 0.9, marginTop: 22, marginBottom: 8, marginLeft: 3 }, menuItem: { minHeight: 69, borderRadius: 18, borderWidth: 1, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", marginBottom: 9 }, menuIcon: { height: 40, width: 40, borderRadius: 13, alignItems: "center", justifyContent: "center", marginRight: 11 }, menuCopy: { flex: 1 }, menuTitle: { fontSize: 14, fontWeight: "800" }, menuDescription: { fontSize: 11, lineHeight: 16, marginTop: 1 }, tool: { borderRadius: 18, padding: 13, flexDirection: "row", alignItems: "center" }, version: { textAlign: "center", fontSize: 11, marginTop: 22 },
});
