import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppHeader, Surface } from "@/components/finance-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useFinanceTheme } from "@/lib/finance-theme";

const B3_INFO_URL = "https://www.b3.com.br/pt_br/produtos-e-servicos/central-depositaria/canal-com-investidores/area-do-investidor/";

const sources = [
  { icon: "pie-chart-outline" as const, title: "Posição consolidada", text: "Ativos, quantidades e saldos de investimentos registrados na B3." },
  { icon: "swap-horiz" as const, title: "Movimentações", text: "Compras, vendas e transferências para completar seu histórico." },
  { icon: "event-note" as const, title: "Eventos provisionados", text: "Proventos e outros eventos corporativos disponibilizados pela B3." },
];

export default function B3Screen() {
  const { colors } = useFinanceTheme();

  return <ScreenContainer><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <AppHeader title="Investimentos B3" subtitle="Uma visão consolidada da sua carteira" back onBack={() => router.replace("/(tabs)/more")} />

    <View style={styles.hero}>
      <View style={styles.heroMark}><MaterialIcons name="show-chart" size={27} color="#EAF7FF" /></View>
      <Text style={styles.heroKicker}>CONECTE QUANDO ESTIVER PRONTO</Text>
      <Text style={styles.heroTitle}>Sua carteira, sem caçar informação em cada corretora.</Text>
      <Text style={styles.heroText}>A integração oficial da B3 poderá reunir os dados registrados em um só lugar, sempre com sua autorização.</Text>
    </View>

    <Text style={[styles.section, { color: colors.muted }]}>STATUS DA CONEXÃO</Text>
    <Surface style={[styles.statusCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.statusIcon, { backgroundColor: "#EAF5FF" }]}><MaterialIcons name="link-off" size={21} color="#176FA6" /></View>
      <View style={styles.statusCopy}><Text style={[styles.statusTitle, { color: colors.text }]}>B3 ainda não conectada</Text><Text style={[styles.statusText, { color: colors.muted }]}>Nenhum dado de investimentos foi solicitado ou salvo pelo Saldo Claro.</Text></View>
      <View style={styles.statusBadge}><Text style={styles.statusBadgeText}>SEGURO</Text></View>
    </Surface>

    <Text style={[styles.section, { color: colors.muted }]}>O QUE VAMOS LER</Text>
    <View style={styles.sourceList}>{sources.map((source) => <Surface key={source.title} style={styles.sourceCard}>
      <View style={[styles.sourceIcon, { backgroundColor: colors.accent }]}><MaterialIcons name={source.icon} size={20} color={colors.primary} /></View>
      <View style={styles.sourceCopy}><Text style={[styles.sourceTitle, { color: colors.text }]}>{source.title}</Text><Text style={[styles.sourceText, { color: colors.muted }]}>{source.text}</Text></View>
    </Surface>)}</View>

    <Text style={[styles.section, { color: colors.muted }]}>COMO A CONEXÃO FUNCIONA</Text>
    <Surface style={styles.steps}>
      <ConnectionStep number="01" title="O Saldo Claro recebe credenciais oficiais da B3" text="Essa é uma etapa técnica da plataforma, não pede sua senha." colors={colors} />
      <ConnectionStep number="02" title="Você autoriza o compartilhamento na própria B3" text="O consentimento acontece no ambiente oficial da B3, sob seu controle." colors={colors} />
      <ConnectionStep number="03" title="A carteira entra aqui com atualização D-1" text="Posição e movimentações passam a aparecer na sua visão financeira." colors={colors} last />
    </Surface>

    <View style={[styles.notice, { backgroundColor: colors.elevated }]}><MaterialIcons name="lock-outline" size={19} color={colors.primary} /><Text style={[styles.noticeText, { color: colors.muted }]}>Nunca informe sua senha da Área do Investidor dentro do Saldo Claro. A autorização correta será feita pela B3.</Text></View>
    <Pressable accessibilityRole="button" accessibilityLabel="Conhecer a Área do Investidor da B3" onPress={() => Linking.openURL(B3_INFO_URL)} style={({ pressed }) => [styles.infoButton, { borderColor: colors.primary, opacity: pressed ? .68 : 1 }]}><MaterialIcons name="open-in-new" size={19} color={colors.primary} /><Text style={[styles.infoButtonText, { color: colors.primary }]}>Conhecer a Área do Investidor</Text></Pressable>
    <Text style={[styles.disclaimer, { color: colors.muted }]}>A integração ainda depende do credenciamento do Saldo Claro junto à B3. Esta tela não recomenda ativos nem executa operações.</Text>
  </ScrollView></ScreenContainer>;
}

function ConnectionStep({ number, title, text, colors, last = false }: { number: string; title: string; text: string; colors: ReturnType<typeof useFinanceTheme>["colors"]; last?: boolean }) {
  return <View style={[styles.step, !last && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}><Text style={[styles.stepNumber, { color: colors.primary }]}>{number}</Text><View style={styles.stepCopy}><Text style={[styles.stepTitle, { color: colors.text }]}>{title}</Text><Text style={[styles.stepText, { color: colors.muted }]}>{text}</Text></View></View>;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  hero: { backgroundColor: "#123A57", borderRadius: 25, padding: 20, overflow: "hidden" },
  heroMark: { height: 52, width: 52, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF20" },
  heroKicker: { color: "#A8D9F9", fontSize: 9, letterSpacing: 1, fontWeight: "900", marginTop: 17 },
  heroTitle: { color: "#FFFFFF", fontSize: 25, lineHeight: 30, letterSpacing: -0.7, fontWeight: "900", marginTop: 7, maxWidth: 330 },
  heroText: { color: "#C9E3F3", fontSize: 13, lineHeight: 19, marginTop: 10, maxWidth: 345 },
  section: { fontSize: 10, fontWeight: "900", letterSpacing: 0.9, marginTop: 23, marginBottom: 8, marginLeft: 3 },
  statusCard: { borderRadius: 19, padding: 14, flexDirection: "row", alignItems: "center" },
  statusIcon: { height: 42, width: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", marginRight: 11 },
  statusCopy: { flex: 1 }, statusTitle: { fontSize: 14, fontWeight: "900" }, statusText: { fontSize: 11, lineHeight: 16, marginTop: 2 },
  statusBadge: { backgroundColor: "#EAF5FF", borderRadius: 8, paddingHorizontal: 7, paddingVertical: 5, marginLeft: 7 }, statusBadgeText: { color: "#176FA6", fontSize: 8, letterSpacing: 0.5, fontWeight: "900" },
  sourceList: { gap: 9 }, sourceCard: { borderRadius: 19, padding: 14, flexDirection: "row", alignItems: "center" }, sourceIcon: { height: 41, width: 41, borderRadius: 13, alignItems: "center", justifyContent: "center", marginRight: 11 }, sourceCopy: { flex: 1 }, sourceTitle: { fontSize: 14, fontWeight: "900" }, sourceText: { fontSize: 11, lineHeight: 16, marginTop: 2 },
  steps: { borderRadius: 20, paddingHorizontal: 15 }, step: { flexDirection: "row", paddingVertical: 16, gap: 13 }, stepNumber: { fontSize: 11, fontWeight: "900", letterSpacing: 0.7, width: 24, paddingTop: 2 }, stepCopy: { flex: 1 }, stepTitle: { fontSize: 13, lineHeight: 18, fontWeight: "900" }, stepText: { fontSize: 11, lineHeight: 16, marginTop: 3 },
  notice: { borderRadius: 17, padding: 13, flexDirection: "row", alignItems: "flex-start", gap: 9, marginTop: 13 }, noticeText: { flex: 1, fontSize: 11, lineHeight: 16, fontWeight: "700" },
  infoButton: { height: 50, borderRadius: 15, borderWidth: 1, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, marginTop: 15 }, infoButtonText: { fontSize: 13, fontWeight: "900" }, disclaimer: { fontSize: 10, lineHeight: 15, textAlign: "center", marginTop: 13, paddingHorizontal: 10 },
});
