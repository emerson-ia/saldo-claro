import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { AppHeader, Surface } from '@/components/finance-ui';
import { SignOutModal } from '@/components/sign-out-modal';
import { useAuth } from '@/lib/auth-provider';
import { useFinanceTheme } from '@/lib/finance-theme';

export default function ProfileScreen() {
  const { user, updateName } = useAuth();
  const { colors } = useFinanceTheme();
  const initialName = (user?.user_metadata.full_name as string | undefined) ?? user?.email?.split('@')[0] ?? '';
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const saveName = async () => {
    if (!name.trim()) { setFeedback('Informe seu nome para salvar o perfil.'); return; }
    setFeedback('');
    setSaving(true);
    try {
      await updateName(name);
      router.replace('/');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Não foi possível salvar agora. Tente novamente.');
      setSaving(false);
    }
  };

  return <ScreenContainer><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <AppHeader title="Perfil" subtitle="Sua conta e organização financeira" back onBack={() => router.replace('/')} />
    <Surface style={[styles.identity, { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark }]}>
      <View style={styles.avatar}><Text style={styles.avatarText}>{(name || 'S').trim().slice(0, 1).toUpperCase()}</Text></View>
      <View style={styles.identityCopy}><Text style={styles.identityName}>{name || 'Seu perfil'}</Text><Text style={styles.identityEmail}>{user?.email}</Text></View>
    </Surface>
    <Text style={[styles.section, { color: colors.muted }]}>DADOS PESSOAIS</Text>
    <Surface style={styles.form}><Text style={[styles.label, { color: colors.text }]}>Como quer ser chamado?</Text><TextInput value={name} onChangeText={(value) => { setName(value); setFeedback(''); }} placeholder="Seu nome" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.text, borderColor: colors.border }]} /><Pressable disabled={saving} onPress={saveName} style={({ pressed }) => [styles.save, { backgroundColor: colors.primary, opacity: pressed || saving ? 0.65 : 1 }]}><Text style={[styles.saveText, { color: colors.onPrimary }]}>{saving ? 'Salvando...' : 'Salvar nome e voltar'}</Text></Pressable>{feedback ? <Text style={[styles.feedback, { color: colors.negative }]}>{feedback}</Text> : null}</Surface>
    <Text style={[styles.section, { color: colors.muted }]}>ORGANIZAÇÃO</Text>
    <ProfileAction icon="account-balance-wallet" title="Contas e carteiras" description="Adicione e edite suas contas." onPress={() => router.push('/accounts')} colors={colors} />
    <ProfileAction icon="category" title="Categorias" description="Edite receitas e despesas." onPress={() => router.push('/categories')} colors={colors} />
    <Text style={[styles.section, { color: colors.muted }]}>PLANO</Text>
    <Pressable onPress={() => router.push('/subscription')} style={({ pressed }) => [styles.plan, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? .7 : 1 }]}><View style={[styles.planIcon, { backgroundColor: colors.accent }]}><MaterialIcons name="verified" size={20} color={colors.primary} /></View><View style={styles.actionCopy}><Text style={[styles.actionTitle, { color: colors.text }]}>Versão Gratuita</Text><Text style={[styles.actionText, { color: colors.muted }]}>Todas as funcionalidades para sempre.</Text></View><MaterialIcons name="chevron-right" size={22} color={colors.muted} /></Pressable>
    <Text style={[styles.section, { color: colors.muted }]}>EM BREVE</Text>
    <Surface style={[styles.future, { backgroundColor: colors.elevated }]}><View style={[styles.futureIcon, { backgroundColor: colors.accent }]}><MaterialIcons name="account-balance" size={20} color={colors.primary} /></View><View style={styles.futureCopy}><Text style={[styles.futureTitle, { color: colors.text }]}>Conectar conta bancária</Text><Text style={[styles.futureText, { color: colors.muted }]}>Importe seus movimentos com conexão bancária segura. Projeto futuro.</Text></View><View style={[styles.tag, { backgroundColor: colors.surface }]}><Text style={[styles.tagText, { color: colors.primary }]}>EM BREVE</Text></View></Surface>
    <Text style={[styles.section, { color: colors.muted }]}>SESSÃO</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="Sair da conta" onPress={() => setLogoutOpen(true)} style={({ pressed }) => [styles.logout, { borderColor: `${colors.negative}55`, backgroundColor: `${colors.negative}0D`, opacity: pressed ? .65 : 1 }]}><View style={[styles.logoutIcon, { backgroundColor: `${colors.negative}16` }]}><MaterialIcons name="logout" size={19} color={colors.negative} /></View><View style={styles.logoutCopy}><Text style={[styles.logoutTitle, { color: colors.negative }]}>Sair da conta</Text><Text style={[styles.logoutText, { color: colors.muted }]}>Encerrar sessão neste aparelho.</Text></View><MaterialIcons name="chevron-right" size={22} color={colors.negative} /></Pressable>
  </ScrollView><SignOutModal visible={logoutOpen} onClose={() => setLogoutOpen(false)} /></ScreenContainer>;
}
function ProfileAction({ icon, title, description, onPress, colors }: { icon: keyof typeof MaterialIcons.glyphMap; title: string; description: string; onPress: () => void; colors: ReturnType<typeof useFinanceTheme>['colors'] }) { return <Pressable onPress={onPress} style={({ pressed }) => [styles.action, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}><View style={[styles.actionIcon, { backgroundColor: colors.accent }]}><MaterialIcons name={icon} size={20} color={colors.primary} /></View><View style={styles.actionCopy}><Text style={[styles.actionTitle, { color: colors.text }]}>{title}</Text><Text style={[styles.actionText, { color: colors.muted }]}>{description}</Text></View><MaterialIcons name="chevron-right" size={22} color={colors.muted} /></Pressable>; }
const styles = StyleSheet.create({ content: { paddingHorizontal: 20, paddingBottom: 28 }, identity: { padding: 16, borderRadius: 22, flexDirection: 'row', alignItems: 'center' }, avatar: { width: 52, height: 52, borderRadius: 18, backgroundColor: '#FFFFFF20', alignItems: 'center', justifyContent: 'center' }, avatarText: { color: '#FFFFFF', fontSize: 21, fontWeight: '800' }, identityCopy: { marginLeft: 13, flex: 1 }, identityName: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' }, identityEmail: { color: '#CBE6DF', fontSize: 12, marginTop: 3 }, section: { fontSize: 10, fontWeight: '800', letterSpacing: .9, marginTop: 23, marginBottom: 8, marginLeft: 3 }, form: { borderRadius: 19, padding: 15 }, label: { fontSize: 13, fontWeight: '800', marginBottom: 8 }, input: { height: 49, borderRadius: 13, borderWidth: 1, paddingHorizontal: 13, fontSize: 15, fontWeight: '600' }, save: { height: 47, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 12 }, saveText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' }, feedback: { fontSize: 12, lineHeight: 17, fontWeight: '700', marginTop: 10 }, action: { minHeight: 70, borderRadius: 18, borderWidth: 1, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', marginBottom: 9 }, actionIcon: { height: 41, width: 41, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 11 }, actionCopy: { flex: 1 }, actionTitle: { fontSize: 14, fontWeight: '800' }, actionText: { fontSize: 11, lineHeight: 16, marginTop: 2 }, plan: { minHeight: 70, borderRadius: 18, borderWidth: 1, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center' }, planIcon: { height: 41, width: 41, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 11 }, future: { borderRadius: 19, padding: 14, flexDirection: 'row', alignItems: 'center' }, futureIcon: { height: 40, width: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 11 }, futureCopy: { flex: 1 }, futureTitle: { fontSize: 14, fontWeight: '800' }, futureText: { fontSize: 11, lineHeight: 16, marginTop: 2 }, tag: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 5 }, tagText: { fontSize: 8, fontWeight: '900', letterSpacing: .55 }, logout: { minHeight: 70, borderRadius: 18, borderWidth: 1, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', marginBottom: 8 }, logoutIcon: { height: 41, width: 41, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 11 }, logoutCopy: { flex: 1 }, logoutTitle: { fontSize: 14, fontWeight: '800' }, logoutText: { fontSize: 11, lineHeight: 16, marginTop: 2 } });
