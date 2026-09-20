import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppHeader, Surface } from '@/components/finance-ui';
import { ScreenContainer } from '@/components/screen-container';
import { getApiBaseUrl } from '@/constants/oauth';
import { useFinanceTheme } from '@/lib/finance-theme';
import { getSupabase } from '@/lib/supabase';

const freeFeatures = ['Contas, cartões e lançamentos', 'Categorias, metas e planejamento', 'Relatórios e organização financeira'];
const proFeatures = ['Automações para reduzir trabalho manual', 'Integrações com bancos e instituições financeiras', 'Conciliação e recursos avançados'];

export default function SubscriptionScreen() {
  const { colors } = useFinanceTheme();
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('yearly');
  const [billing, setBilling] = useState({ configured: false, upgradeEnabled: false });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => { fetch(`${getApiBaseUrl()}/api/billing/status`).then((response) => response.ok ? response.json() : null).then((data) => { if (data) setBilling(data); }).catch(() => undefined); }, []);
  const startCheckout = async () => {
    if (!billing.upgradeEnabled || !billing.configured) return;
    setLoading(true); setMessage('');
    try {
      const { data } = await getSupabase().auth.getSession();
      if (!data.session?.access_token) throw new Error('Entre novamente para continuar.');
      const response = await fetch(`${getApiBaseUrl()}/api/billing/mercado-pago/checkout`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` }, body: JSON.stringify({ period }) });
      const body = await response.json();
      if (!response.ok || !body.checkoutUrl) throw new Error(body.error ?? 'Não foi possível abrir o checkout.');
      await WebBrowser.openBrowserAsync(body.checkoutUrl);
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

    <Text style={[styles.section, { color: colors.muted }]}>PRÓXIMA VERSÃO</Text>
    <Surface style={[styles.proCard, { borderColor: colors.border }]}>
      <View style={styles.proTop}><View style={[styles.proIcon, { backgroundColor: colors.accent }]}><MaterialIcons name="auto-awesome" size={20} color={colors.primary} /></View><View style={styles.proTitleWrap}><Text style={[styles.proTitle, { color: colors.text }]}>PRO</Text><Text style={[styles.proCaption, { color: colors.muted }]}>Futuramente</Text></View></View>
      <Text style={[styles.proDescription, { color: colors.text }]}>Versão paga PRO futuramente com automações e integrações com bancos e instituições financeiras.</Text>
      <View style={styles.proList}>{proFeatures.map((feature) => <Feature key={feature} text={feature} colors={colors} muted />)}</View>
      <View style={styles.periodRow}><PeriodOption title="Mensal" price="R$ 9,90/mês" active={period === 'monthly'} onPress={() => setPeriod('monthly')} colors={colors} /><PeriodOption title="Anual" price="R$ 99,90/ano" detail="2 meses grátis" active={period === 'yearly'} onPress={() => setPeriod('yearly')} colors={colors} /></View>
      <Pressable disabled={!billing.upgradeEnabled || !billing.configured || loading} onPress={startCheckout} style={({ pressed }) => [styles.upgrade, { backgroundColor: colors.primary, opacity: pressed || !billing.upgradeEnabled || !billing.configured || loading ? .48 : 1 }]}>{loading ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={[styles.upgradeText, { color: colors.onPrimary }]}>Assinar PRO</Text>}</Pressable>
      <View style={[styles.notice, { backgroundColor: colors.elevated }]}><MaterialIcons name={billing.upgradeEnabled && billing.configured ? 'lock-outline' : 'pause-circle-outline'} size={18} color={colors.primary} /><Text style={[styles.noticeText, { color: colors.muted }]}>{billing.upgradeEnabled && billing.configured ? 'Pagamento seguro pelo Mercado Pago. Você verá as condições finais antes de confirmar.' : 'As assinaturas PRO estão temporariamente indisponíveis. A versão Gratuita continua completa para sempre.'}</Text></View>
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
