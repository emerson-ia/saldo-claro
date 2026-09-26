import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import { router } from 'expo-router';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/lib/auth-provider';
import { useFinanceTheme } from '@/lib/finance-theme';

type Mode = 'login' | 'signup' | 'reset';

export function AuthScreen({ mode }: { mode: Mode }) {
  const { configured, signIn, signUp, resetPassword, signInWithGoogle } = useAuth();
  const { colors } = useFinanceTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const title = mode === 'login' ? 'Sua vida financeira, no lugar certo.' : mode === 'signup' ? 'Crie seu espaço financeiro.' : 'Recupere seu acesso.';
  const subtitle = mode === 'login' ? 'Entre para continuar de onde parou.' : mode === 'signup' ? 'Use um e-mail que você acessa com frequência.' : 'Vamos enviar um link seguro para seu e-mail.';

  const submit = async () => {
    if (!configured) {
      Alert.alert('Configuração pendente', 'Falta conectar o Supabase para ativar login e sincronização.');
      return;
    }
    const nextErrors: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) nextErrors.email = 'Informe um e-mail válido.';
    if (mode !== 'reset' && password.length < 6) nextErrors.password = 'Use pelo menos 6 caracteres.';
    if (mode === 'signup' && password !== confirmPassword) nextErrors.confirmPassword = 'As senhas precisam ser iguais.';
    if (mode === 'signup' && !acceptedTerms) nextErrors.terms = 'Você precisa aceitar os Termos e a Política de Privacidade.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      if (mode === 'login') await signIn(email, password);
      if (mode === 'signup') {
        const result = await signUp(email, password);
        Alert.alert(result.confirmationRequired ? 'Confirme seu e-mail' : 'Conta criada', result.confirmationRequired ? 'Enviamos um link de confirmação para seu e-mail.' : 'Sua conta foi criada e já está pronta.');
      }
      if (mode === 'reset') {
        await resetPassword(email);
        Alert.alert('Confira seu e-mail', 'Enviamos um link seguro para redefinir sua senha.');
        router.replace('/auth/login' as never);
      }
    } catch (error) {
      Alert.alert('Não foi possível continuar', error instanceof Error ? error.message : 'Tente novamente em alguns instantes.');
    } finally {
      setSubmitting(false);
    }
  };

  const google = async () => {
    if (!configured) {
      Alert.alert('Configuração pendente', 'Conecte o Supabase e o Google antes de usar esta opção.');
      return;
    }
    setSubmitting(true);
    try { await signInWithGoogle(); } catch (error) { Alert.alert('Não foi possível entrar com Google', error instanceof Error ? error.message : 'Tente novamente.'); } finally { setSubmitting(false); }
  };

  return <ScreenContainer edges={['top', 'bottom', 'left', 'right']} containerClassName="bg-background">
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={[styles.mark, { backgroundColor: colors.primaryDark }]}><MaterialIcons name="account-balance-wallet" size={31} color="#FFFFFF" /><View style={styles.markDot} /></View>
        <Text style={[styles.brand, { color: colors.primary }]}>SALDO CLARO</Text>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>{subtitle}</Text>

        <View style={[styles.form, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Field label="Seu e-mail" error={errors.email} value={email} onChangeText={(value) => { setEmail(value); setErrors((current) => ({ ...current, email: '' })); }} placeholder="voce@email.com" keyboardType="email-address" autoComplete="email" textContentType="emailAddress" autoCapitalize="none" colors={colors} />
          {mode !== 'reset' ? <Field label="Senha" error={errors.password} value={password} onChangeText={(value) => { setPassword(value); setErrors((current) => ({ ...current, password: '' })); }} placeholder="No mínimo 6 caracteres" secureTextEntry autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} textContentType={mode === 'signup' ? 'newPassword' : 'password'} colors={colors} /> : null}
          {mode === 'signup' ? <><Field label="Repita sua senha" error={errors.confirmPassword} value={confirmPassword} onChangeText={(value) => { setConfirmPassword(value); setErrors((current) => ({ ...current, confirmPassword: '' })); }} placeholder="Digite novamente" secureTextEntry autoComplete="new-password" textContentType="newPassword" colors={colors} /><Pressable accessibilityRole="checkbox" accessibilityState={{ checked: acceptedTerms }} onPress={() => { setAcceptedTerms((value) => !value); setErrors((current) => ({ ...current, terms: '' })); }} style={styles.termsRow}><MaterialIcons name={acceptedTerms ? 'check-box' : 'check-box-outline-blank'} size={22} color={errors.terms ? colors.negative : colors.primary} /><Text style={[styles.termsText, { color: colors.muted }]}>Li e aceito os <Text onPress={() => router.push('/legal/terms' as never)} style={{ color: colors.primary, fontWeight: '800' }}>Termos de Uso</Text> e a <Text onPress={() => router.push('/legal/privacy' as never)} style={{ color: colors.primary, fontWeight: '800' }}>Política de Privacidade</Text>.</Text></Pressable>{errors.terms ? <Text accessibilityLiveRegion="polite" style={[styles.fieldError, { color: colors.negative }]}>{errors.terms}</Text> : null}<View style={[styles.confirmationNotice, { backgroundColor: colors.accent }]}><MaterialIcons name="mark-email-read" size={18} color={colors.primary} /><Text style={[styles.confirmationText, { color: colors.text }]}>Depois de criar a conta, você precisa confirmar o link enviado para seu e-mail antes de entrar.</Text></View></> : null}
          {mode === 'login' ? <Pressable accessibilityRole="link" onPress={() => router.push('/auth/recover' as never)} hitSlop={10} style={styles.recovery}><Text style={[styles.recoveryText, { color: colors.primary }]}>Esqueci minha senha</Text></Pressable> : null}
          <Pressable disabled={submitting} onPress={submit} style={({ pressed }) => [styles.primary, { backgroundColor: colors.primary, opacity: pressed || submitting ? 0.72 : 1 }]}><Text style={[styles.primaryText, { color: colors.onPrimary }]}>{submitting ? 'Aguarde...' : mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar conta e enviar confirmação' : 'Enviar link de recuperação'}</Text><MaterialIcons name={mode === 'reset' ? 'mail-outline' : 'arrow-forward'} size={20} color={colors.onPrimary} /></Pressable>
        </View>

        {mode !== 'reset' ? <><View style={styles.divider}><View style={[styles.dividerLine, { backgroundColor: colors.border }]} /><Text style={[styles.dividerText, { color: colors.muted }]}>ou continue com</Text><View style={[styles.dividerLine, { backgroundColor: colors.border }]} /></View>
        <Pressable disabled={submitting} onPress={google} style={({ pressed }) => [styles.google, { borderColor: colors.border, backgroundColor: colors.surface, opacity: pressed || submitting ? 0.7 : 1 }]}><MaterialIcons name="g-translate" size={20} color={colors.text} /><Text style={[styles.googleText, { color: colors.text }]}>Google</Text></Pressable></> : null}

        <View style={styles.switchRow}><Text style={[styles.switchCopy, { color: colors.muted }]}>{mode === 'login' ? 'Ainda não tem conta?' : mode === 'signup' ? 'Já tem uma conta?' : 'Lembrou sua senha?'}</Text><Pressable accessibilityRole="link" onPress={() => router.push((mode === 'login' ? '/auth/register' : '/auth/login') as never)} hitSlop={10}><Text style={[styles.switchAction, { color: colors.primary }]}>{mode === 'login' ? 'Criar agora' : 'Entrar'}</Text></Pressable></View>
        {!configured ? <View style={[styles.notice, { backgroundColor: colors.accent }]}><MaterialIcons name="info-outline" size={17} color={colors.primary} /><Text style={[styles.noticeText, { color: colors.primary }]}>A interface está pronta. Falta conectar o Supabase para ativar as contas.</Text></View> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  </ScreenContainer>;
}

export default function LoginScreen() {
  return <AuthScreen mode="login" />;
}

function Field({ label, colors, error, ...input }: { label: string; error?: string; colors: ReturnType<typeof useFinanceTheme>['colors'] } & React.ComponentProps<typeof TextInput>) { return <View style={styles.field}><Text style={[styles.label, { color: colors.text }]}>{label}</Text><TextInput {...input} accessibilityLabel={label} accessibilityHint={error} placeholderTextColor={colors.muted} style={[styles.input, { color: colors.text, borderColor: error ? colors.negative : colors.border }]} />{error ? <Text accessibilityLiveRegion="polite" style={[styles.fieldError, { color: colors.negative }]}>{error}</Text> : null}</View>; }

const styles = StyleSheet.create({
  flex: { flex: 1 }, scroll: { flexGrow: 1, padding: 28, paddingTop: 58, paddingBottom: 32 }, mark: { width: 66, height: 66, borderRadius: 22, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, markDot: { position: 'absolute', width: 9, height: 9, borderRadius: 5, backgroundColor: '#E5B24B', top: 13, right: 13 }, brand: { marginTop: 28, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 }, title: { marginTop: 9, fontSize: 30, lineHeight: 37, letterSpacing: -0.75, fontWeight: '800' }, subtitle: { marginTop: 10, fontSize: 15, lineHeight: 23 }, form: { marginTop: 31, borderWidth: 1, borderRadius: 22, padding: 18 }, field: { marginBottom: 16 }, label: { fontSize: 13, fontWeight: '800', marginBottom: 8 }, input: { height: 50, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, fontSize: 15, fontWeight: '600' }, fieldError: { fontSize: 12, lineHeight: 17, fontWeight: '700', marginTop: 6 }, termsRow: { flexDirection: 'row', gap: 9, alignItems: 'flex-start', marginTop: -2, marginBottom: 8 }, termsText: { flex: 1, fontSize: 12, lineHeight: 17 }, recovery: { alignSelf: 'flex-start', marginTop: -5, marginBottom: 21 }, recoveryText: { fontSize: 13, fontWeight: '800' }, primary: { height: 53, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 4 }, primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' }, divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 23 }, dividerLine: { height: 1, flex: 1 }, dividerText: { fontSize: 12, fontWeight: '700' }, google: { height: 52, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9 }, googleText: { fontSize: 14, fontWeight: '800' }, switchRow: { marginTop: 26, justifyContent: 'center', flexDirection: 'row', gap: 5 }, switchCopy: { fontSize: 13 }, switchAction: { fontSize: 13, fontWeight: '800' }, notice: { marginTop: 26, padding: 13, borderRadius: 15, flexDirection: 'row', gap: 9, alignItems: 'flex-start' }, noticeText: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: '700' }, confirmationNotice: { borderRadius: 14, padding: 12, flexDirection: 'row', gap: 9, alignItems: 'flex-start', marginTop: -2, marginBottom: 19 }, confirmationText: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: '700' },
});
