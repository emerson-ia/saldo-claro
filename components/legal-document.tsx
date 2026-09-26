import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useFinanceTheme } from "@/lib/finance-theme";

type Section = { title: string; body: string };

export function LegalDocument({ title, updatedAt, intro, sections }: { title: string; updatedAt: string; intro: string; sections: Section[] }) {
  const { colors } = useFinanceTheme();
  return <ScreenContainer><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={() => router.canGoBack() ? router.back() : router.replace('/landing' as never)} style={({ pressed }) => [styles.back, { backgroundColor: colors.elevated, opacity: pressed ? .65 : 1 }]}><MaterialIcons name="arrow-back" size={20} color={colors.text} /></Pressable>
    <Text accessibilityRole="header" style={[styles.kicker, { color: colors.primary }]}>SALDO CLARO</Text>
    <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
    <Text style={[styles.updated, { color: colors.muted }]}>Atualizado em {updatedAt}</Text>
    <View style={[styles.intro, { backgroundColor: colors.accent }]}><Text style={[styles.introText, { color: colors.text }]}>{intro}</Text></View>
    {sections.map((section) => <View key={section.title} style={[styles.section, { borderColor: colors.border }]}><Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text><Text style={[styles.body, { color: colors.muted }]}>{section.body}</Text></View>)}
    <Pressable accessibilityRole="link" onPress={() => router.push('/support' as never)} style={({ pressed }) => [styles.help, { borderColor: colors.border, backgroundColor: colors.surface, opacity: pressed ? .7 : 1 }]}><MaterialIcons name="support-agent" size={20} color={colors.primary} /><View style={styles.helpCopy}><Text style={[styles.helpTitle, { color: colors.text }]}>Precisa falar sobre seus dados?</Text><Text style={[styles.helpText, { color: colors.muted }]}>Abra o suporte pelo app.</Text></View><MaterialIcons name="chevron-right" size={20} color={colors.muted} /></Pressable>
  </ScrollView></ScreenContainer>;
}

const styles = StyleSheet.create({ content: { padding: 20, paddingBottom: 36, maxWidth: 760, width: '100%', alignSelf: 'center' }, back: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 28 }, kicker: { fontSize: 10, fontWeight: '900', letterSpacing: 1.1 }, title: { fontSize: 32, lineHeight: 38, letterSpacing: -.8, fontWeight: '900', marginTop: 8 }, updated: { fontSize: 12, marginTop: 8 }, intro: { borderRadius: 18, padding: 16, marginTop: 25 }, introText: { fontSize: 14, lineHeight: 21, fontWeight: '700' }, section: { borderTopWidth: 1, paddingTop: 22, marginTop: 24 }, sectionTitle: { fontSize: 17, fontWeight: '900' }, body: { fontSize: 14, lineHeight: 22, marginTop: 8 }, help: { marginTop: 28, borderWidth: 1, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 11 }, helpCopy: { flex: 1 }, helpTitle: { fontSize: 13, fontWeight: '900' }, helpText: { fontSize: 12, marginTop: 2 } });
