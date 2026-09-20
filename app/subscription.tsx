import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppHeader, Surface } from '@/components/finance-ui';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/lib/auth-provider';
import { useFinanceTheme } from '@/lib/finance-theme';
import { getSupabase } from '@/lib/supabase';

const freeFeatures = ['Contas, cartões e lançamentos', 'Categorias e planejamento essencial', 'Relatórios e organização financeira'];
const proFeatures = ['Recorrências', 'Parcelamentos e fatura completa', 'Notificações de vencimento', 'Relatórios avançados', 'Exportação em PDF', 'Múltiplas metas'];
const billingTestMode = process.env.EXPO_PUBLIC_BILLING_TEST_MODE !== 'false';

export default function SubscriptionScreen() {
  const { colors } = useFinanceTheme();
  const { configured } = useAuth();
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const startCheckout = async () => {
    if (!configured) return;
    setLoading(true); setMessage('');
    try {
      const { data, error } = await getSupabase().functions.invoke('create-pro-checkout', { body: { period } });
      if (error || !data?.checkoutUrl) throw new Error(data?.error ?? error?.message ?? 'Não foi possível abrir o checkout.');
      await WebBrowser.openBrowserAsync(data.checkoutUrl);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível iniciar o checkout.'); }
    finally { setLoading(false); }
  };
  return <ScreenContainer><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <AppHeader title="Seu plano" subtitle="Escolha simples, sem pegadinha" back onBack={() => router.back()} />
    <Surface style={[styles.current, { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark }]}>
      <View style={styles.currentTop}><View style={styles.currentIcon}><MaterialIcons name="verified" size={20} color="#FFFFFF" /></View><View style={styles.currentCopy}><Text style={styles.currentKicker}>PLANO ATUAL</Text><Text style={styles.currentTitle}>Gratuita</Text></View><View style={styles.activeBadge}><Text style={styles.activeBadgeText}>ATIVO</Text></View></View>
      <Text style={styles.currentText}>Versão Gratuita com todas funcionalidades para sempre.</Text>
    </Surface>

    <Text style={[styles.section, { color: colors.muted }]}>O QUE JÁ ESTÁ INCLUSO</Text>
    <Surface style={styles.list}>{freeFeatures.map((feature) => <Feature key={feature} text={feature} colors={colors} />)}</Surface>

    <Text style={[styles.section, { color: colors.muted }]}>{billingTestMode ? 'CHECKOUT EM TESTE' : 'SALDO CLARO PRO'}</Text>
    <Surface style={[styles.proCard, { borderColor: colors.border }]}>
      <View style={styles.proTop}><View style={[styles.proIcon, { backgroundColor: colors.accent }]}><MaterialIcons name="auto-awesome" size={20} color={colors.primary} /></View><View style={styles.proTitleWrap}><Text style={[styles.proTitle, { color: colors.text }]}>PRO</Text><Text style={[styles.proCaption, { color: colors.muted }]}>{billingTestMode ? 'Validação interna' : 'Mais controle, menos correria'}</Text></View></View>
      <Text style={[styles.proDescription, { color: colors.text }]}>{billingTestMode ? 'Este checkout está em teste. Nenhuma cobrança real será criada nesta etapa.' : 'Recursos para quem quer antecipar contas, organizar faturas e aprofundar sua visão financeira.'}</Text>
      <View style={styles.proList}>{proFeatures.map((feature) => <Feature key={feature} text={feature} colors={colors} muted />)}</View>
      <View style={styles.periodRow}><PeriodOption title="Mensal" price="R$ 5,60/mês" active={period === 'monthly'} onPress={() => setPeriod('monthly')} colors={colors} /><PeriodOption title="Anual" price="R$ 49,90/ano" detail="Economize 26%" active={period === 'yearly'} onPress={() => setPeriod('yearly')} colors={colors} /></View>
      <Pressable disabled={!configured || loading} onPress={startCheckout} style={({ pressed }) => [styles.upgrade, { backgroundColor: colors.primary, opacity: pressed || !configured || loading ? .48 : 1 }]}>{loading ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={[styles.upgradeText, { color: colors.onPrimary }]}>{billingTestMode ? 'Testar checkout PRO' : 'Assinar PRO'}</Text>}</Pressable>
      <View style={[styles.notice, { backgroundColor: colors.elevated }]}><MaterialIcons name={configured ? 'lock-outline' : 'pause-circle-outline'} size={18} color={colors.primary} /><Text style={[styles.noticeText, { color: colors.muted }]}>{configured ? billingTestMode ? 'Ambiente de teste. Use somente dados de teste do Mercado Pago.' : 'Pagamento seguro pelo Mercado Pago. Você verá as condições finais antes de confirmar.' : 'Entre na sua conta para continuar.'}</Text></View>
      {message ? <Text style={[styles.error, { color: colors.negative }]}>{message}</Text> : null}
    </Surface>
    <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backButton, { borderColor: colors.border, opacity: pressed ? .65 : 1 }]}><Text style={[styles.backText, { color: colors.text }]}>Continuar com a versão Gratuita</Text></Pressable>
  </ScrollView></ScreenContainer>;
}

function Feature({ text, colors, muted = false }: { text: string; colors: ReturnType<typeof useFinanceTheme>['colors']; muted?: boolean }) {
  return <View style={styles.feature}><MaterialIcons name="check-circle" size={18} color={muted ? colors.muted : colors.positive} /><Text style={[styles.featureText, { color: colors.text }]}>{text}</Text></View>;
}
function PeriodOption({ title, price, detail, active, onPress, colors }: { title: string; price: string; detail?: string; active: boolean; onPress: () => void; colors: ReturnType<typeof useFinanceTheme>['colors'] }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.period, { backgroundColor: active ? colors.accent : colors.elevated, borderColor: active ? colors.primary : 'transparent', opacity: pressed ? .7 : 1 }]}><View style={styles.periodHeader}><Text style={[styles.periodTitle, { color: colors.text }]}>{title}</Text>{detail ? <Text style={[styles.periodTag, { color: colors.primary }]}>{detail}</Text> : null}</View><Text style={[styles.periodPrice, { color: colors.text }]}>{price}</Text></Pressable>;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 30 }, current: { borderRadius: 23, padding: 18 }, currentTop: { flexDirection: 'row', alignItems: 'center' }, currentIcon: { height: 40, width: 40, borderRadius: 13, backgroundColor: '#FFFFFF1E', alignItems: 'center', justifyContent: 'center', marginRight: 11 }, currentCopy: { flex: 1 }, currentKicker: { color: '#CBE6DF', fontSize: 9, fontWeight: '900', letterSpacing: 1 }, currentTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', marginTop: 2 }, activeBadge: { backgroundColor: '#FFFFFF1F', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 }, activeBadgeText: { color: '#FFFFFF', fontSize: 8, fontWeight: '900', letterSpacing: .7 }, currentText: { color: '#FFFFFF', fontSize: 15, lineHeight: 22, fontWeight: '700', marginTop: 18 }, section: { fontSize: 10, fontWeight: '900', letterSpacing: .95, marginTop: 23, marginBottom: 8, marginLeft: 3 }, list: { borderRadius: 19, padding: 15 }, feature: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 31 }, featureText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '700' }, proCard: { borderWidth: 1, borderRadius: 22, padding: 16 }, proTop: { flexDirection: 'row', alignItems: 'center' }, proIcon: { height: 42, width: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 11 }, proTitleWrap: { flex: 1 }, proTitle: { fontSize: 18, fontWeight: '900' }, proCaption: { fontSize: 11, fontWeight: '700', marginTop: 1 }, proDescription: { fontSize: 14, fontWeight: '800', lineHeight: 21, marginTop: 16 }, proList: { gap: 3, marginTop: 13 }, periodRow: { flexDirection: 'row', gap: 8, marginTop: 15 }, period: { flex: 1, borderWidth: 1, minHeight: 70, borderRadius: 14, padding: 10 }, periodHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 }, periodTitle: { fontSize: 12, fontWeight: '900' }, periodTag: { fontSize: 8, fontWeight: '900' }, periodPrice: { fontSize: 12, fontWeight: '800', marginTop: 7 }, upgrade: { height: 49, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 12 }, upgradeText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' }, notice: { borderRadius: 14, padding: 12, flexDirection: 'row', gap: 9, alignItems: 'flex-start', marginTop: 14 }, noticeText: { flex: 1, fontSize: 11, lineHeight: 16, fontWeight: '600' }, error: { fontSize: 11, lineHeight: 16, fontWeight: '700', marginTop: 10 }, backButton: { height: 50, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginTop: 16 }, backText: { fontSize: 13, fontWeight: '900' },
});
