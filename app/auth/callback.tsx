import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { getSupabase } from '@/lib/supabase';
import { useFinanceTheme } from '@/lib/finance-theme';

export default function AuthCallback() {
  const { colors } = useFinanceTheme();
  const [message, setMessage] = useState('Confirmando seu acesso seguro...');

  useEffect(() => {
    const complete = async () => {
      try {
        const supabase = getSupabase();
        const { data: existing } = await supabase.auth.getSession();
        if (!existing.session) {
          const url = await Linking.getInitialURL();
          const code = url ? Linking.parse(url).queryParams?.code : undefined;
          if (typeof code === 'string') {
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) throw error;
          }
        }
        router.replace('/');
      } catch {
        setMessage('Não foi possível validar este link. Tente entrar novamente.');
      }
    };
    complete();
  }, []);

  return <ScreenContainer edges={['top', 'bottom']}><View style={styles.content}><ActivityIndicator color={colors.primary} size="large" /><Text style={[styles.text, { color: colors.text }]}>{message}</Text></View></ScreenContainer>;
}
const styles = StyleSheet.create({ content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 }, text: { fontSize: 15, fontWeight: '700', textAlign: 'center', marginTop: 18 } });
