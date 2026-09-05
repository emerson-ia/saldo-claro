import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useFinance } from "@/lib/finance-store";
import { useFinanceTheme } from "@/lib/finance-theme";

export default function WelcomeScreen() {
  const { completeWelcome, addAccount } = useFinance();
  const { colors } = useFinanceTheme();
  const [step, setStep] = useState<"welcome" | "account">("welcome");
  const [accountName, setAccountName] = useState("Minha conta principal");
  const [balance, setBalance] = useState("0,00");
  const startDemo = () => { completeWelcome("demo"); router.replace("/"); };
  const startFresh = () => setStep("account");
  const finishFresh = () => {
    completeWelcome("fresh");
    addAccount({ name: accountName.trim() || "Minha conta principal", type: "Conta corrente", institution: "", color: "#0B6B62", initialBalance: Number(balance.replace(".", "").replace(",", ".")) || 0, includeInTotal: true });
    router.replace("/");
  };

  return <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-background">
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={[styles.logo, { backgroundColor: colors.primaryDark }]}><MaterialIcons name="account-balance-wallet" size={38} color="#FFFFFF" /><View style={[styles.logoDot, { backgroundColor: "#E5B24B" }]} /></View>
      {step === "welcome" ? <>
        <Text style={[styles.kicker, { color: colors.primary }]}>BEM-VINDO AO SALDO CLARO</Text>
        <Text style={[styles.title, { color: colors.text }]}>Organize seu dinheiro com mais tranquilidade.</Text>
        <Text style={[styles.description, { color: colors.muted }]}>Registre o que entra e sai, acompanhe seus cartões e planeje os próximos passos em um único lugar.</Text>
        <View style={styles.features}>
          <Feature colors={colors} icon="account-balance" title="Contas e cartões" text="Veja saldos, limites e faturas com clareza." />
          <Feature colors={colors} icon="insights" title="Visão do mês" text="Entenda receitas, despesas e previsão." />
          <Feature colors={colors} icon="flag" title="Metas possíveis" text="Acompanhe cada objetivo no seu ritmo." />
        </View>
        <Pressable onPress={startFresh} style={({ pressed }) => [styles.primary, { backgroundColor: colors.primary, opacity: pressed ? 0.84 : 1 }]}><Text style={styles.primaryText}>Começar a organizar</Text><MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" /></Pressable>
        <Pressable onPress={startDemo} style={({ pressed }) => [styles.secondary, { borderColor: colors.border, opacity: pressed ? 0.65 : 1 }]}><Text style={[styles.secondaryText, { color: colors.text }]}>Explorar com dados de demonstração</Text></Pressable>
        <Text style={[styles.footnote, { color: colors.muted }]}>Você poderá alterar essas escolhas nas configurações.</Text>
      </> : <>
        <Pressable onPress={() => setStep("welcome")} style={({ pressed }) => [styles.back, { backgroundColor: colors.elevated, opacity: pressed ? 0.7 : 1 }]}><MaterialIcons name="arrow-back" color={colors.text} size={20} /></Pressable>
        <Text style={[styles.kicker, { color: colors.primary }]}>PRIMEIRO PASSO</Text>
        <Text style={[styles.title, { color: colors.text }]}>Vamos criar sua primeira conta.</Text>
        <Text style={[styles.description, { color: colors.muted }]}>O saldo será usado como ponto de partida. Você poderá cadastrar outras contas e cartões depois.</Text>
        <View style={[styles.form, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.text }]}>Nome da conta</Text>
          <TextInput value={accountName} onChangeText={setAccountName} placeholder="Ex.: Conta do dia a dia" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.text, borderColor: colors.border }]} returnKeyType="done" />
          <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Saldo inicial</Text>
          <TextInput value={balance} onChangeText={setBalance} placeholder="0,00" placeholderTextColor={colors.muted} keyboardType="decimal-pad" style={[styles.input, { color: colors.text, borderColor: colors.border }]} returnKeyType="done" />
          <Text style={[styles.helper, { color: colors.muted }]}>Moeda selecionada: Real brasileiro (BRL).</Text>
        </View>
        <Pressable onPress={finishFresh} style={({ pressed }) => [styles.primary, { backgroundColor: colors.primary, opacity: pressed ? 0.84 : 1 }]}><Text style={styles.primaryText}>Concluir e abrir painel</Text><MaterialIcons name="check" size={20} color="#FFFFFF" /></Pressable>
        <Pressable onPress={startDemo} style={({ pressed }) => [styles.textButton, { opacity: pressed ? 0.65 : 1 }]}><Text style={[styles.textButtonText, { color: colors.primary }]}>Pular e conhecer o modo de demonstração</Text></Pressable>
      </>}
    </ScrollView>
  </ScreenContainer>;
}

function Feature({ colors, icon, title, text }: { colors: ReturnType<typeof useFinanceTheme>["colors"]; icon: keyof typeof MaterialIcons.glyphMap; title: string; text: string }) {
  return <View style={styles.feature}><View style={[styles.featureIcon, { backgroundColor: colors.accent }]}><MaterialIcons name={icon} size={21} color={colors.primary} /></View><View style={styles.featureCopy}><Text style={[styles.featureTitle, { color: colors.text }]}>{title}</Text><Text style={[styles.featureText, { color: colors.muted }]}>{text}</Text></View></View>;
}

const styles = StyleSheet.create({
  scroll: { padding: 28, paddingTop: 42, paddingBottom: 28, flexGrow: 1, justifyContent: "center" }, logo: { height: 78, width: 78, borderRadius: 26, alignItems: "center", justifyContent: "center", alignSelf: "flex-start", marginBottom: 31, overflow: "hidden" }, logoDot: { position: "absolute", right: 15, top: 16, height: 10, width: 10, borderRadius: 5 }, kicker: { fontSize: 11, letterSpacing: 1.1, fontWeight: "800", marginBottom: 10 }, title: { fontSize: 31, lineHeight: 39, fontWeight: "800", letterSpacing: -0.8 }, description: { fontSize: 16, lineHeight: 24, marginTop: 14 }, features: { marginTop: 30, gap: 17 }, feature: { flexDirection: "row", alignItems: "center" }, featureIcon: { height: 44, width: 44, borderRadius: 15, alignItems: "center", justifyContent: "center", marginRight: 13 }, featureCopy: { flex: 1 }, featureTitle: { fontSize: 14, lineHeight: 19, fontWeight: "800" }, featureText: { fontSize: 13, lineHeight: 18, marginTop: 1 }, primary: { minHeight: 53, borderRadius: 17, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 32 }, primaryText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" }, secondary: { minHeight: 51, borderRadius: 17, borderWidth: 1, alignItems: "center", justifyContent: "center", marginTop: 12 }, secondaryText: { fontSize: 14, fontWeight: "800" }, footnote: { fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 16 }, back: { height: 40, width: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 26, marginLeft: -4 }, form: { marginTop: 30, borderRadius: 21, borderWidth: 1, padding: 18 }, label: { fontSize: 13, fontWeight: "800", marginBottom: 8 }, input: { height: 48, borderRadius: 13, borderWidth: 1, paddingHorizontal: 13, fontSize: 15, fontWeight: "600" }, helper: { fontSize: 12, lineHeight: 18, marginTop: 10 }, textButton: { alignItems: "center", marginTop: 16, padding: 8 }, textButtonText: { fontSize: 13, fontWeight: "800", textAlign: "center" },
});
