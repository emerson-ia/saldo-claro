'use client';

import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useRouter, useSegments } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { AppState, Platform } from 'react-native';
import type { Session, User } from '@supabase/supabase-js';
import { getSupabase, hasSupabaseConfig } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

type AuthContextValue = {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ confirmationRequired: boolean }>;
  resetPassword: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  verifyPassword: (password: string) => Promise<void>;
  updateName: (name: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readableError(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'Não foi possível concluir. Tente novamente.';
}

export function AuthProvider({ children }: PropsWithChildren) {
  const configured = hasSupabaseConfig();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(configured);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    const supabase = getSupabase();
    supabase.auth.getSession().then(({ data, error }) => {
      if (!error) setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    if (Platform.OS !== 'web') {
      const appStateSubscription = AppState.addEventListener('change', (state) => {
        if (state === 'active') supabase.auth.startAutoRefresh();
        else supabase.auth.stopAutoRefresh();
      });
      return () => {
        subscription.subscription.unsubscribe();
        appStateSubscription.remove();
      };
    }

    return () => subscription.subscription.unsubscribe();
  }, [configured]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await getSupabase().auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw new Error(readableError(error));
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const redirectTo = Linking.createURL('auth/callback');
    const { data, error } = await getSupabase().auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: redirectTo } });
    if (error) throw new Error(readableError(error));
    return { confirmationRequired: !data.session };
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await getSupabase().auth.resetPasswordForEmail(email.trim(), { redirectTo: Linking.createURL('auth/callback') });
    if (error) throw new Error(readableError(error));
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const redirectTo = Linking.createURL('auth/callback');
    const { data, error } = await getSupabase().auth.signInWithOAuth({ provider: 'google', options: { redirectTo, skipBrowserRedirect: true } });
    if (error || !data.url) throw new Error(readableError(error));

    if (Platform.OS === 'web') {
      window.location.assign(data.url);
      return;
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success') return;
    const code = Linking.parse(result.url).queryParams?.code;
    if (typeof code !== 'string') throw new Error('O Google não devolveu uma sessão válida. Tente novamente.');
    const { error: exchangeError } = await getSupabase().auth.exchangeCodeForSession(code);
    if (exchangeError) throw new Error(readableError(exchangeError));
  }, []);

  const verifyPassword = useCallback(async (password: string) => {
    const email = session?.user.email;
    if (!email) throw new Error('Não foi possível validar a senha desta conta.');
    const { error } = await getSupabase().auth.signInWithPassword({ email, password });
    if (error) throw new Error('Senha incorreta. A exclusão não foi realizada.');
  }, [session?.user.email]);

  const updateName = useCallback(async (name: string) => {
    const { data, error } = await getSupabase().auth.updateUser({ data: { full_name: name.trim() } });
    if (error) throw new Error(readableError(error));
    setSession((previous) => previous ? { ...previous, user: data.user } : previous);
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await getSupabase().auth.signOut();
    if (error) throw new Error(readableError(error));
  }, []);

  const value = useMemo(() => ({ configured, loading, session, user: session?.user ?? null, signIn, signUp, resetPassword, signInWithGoogle, verifyPassword, updateName, signOut }), [configured, loading, session, signIn, signUp, resetPassword, signInWithGoogle, verifyPassword, updateName, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  return context;
}

export function AuthGate({ children }: PropsWithChildren) {
  const { configured, loading, user } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    const firstSegment = segments[0] as string | undefined;
    const onAuthRoute = firstSegment === 'auth';
    const onPublicRoute = onAuthRoute || firstSegment === 'landing';
    if (!configured || !user) {
      if (!onPublicRoute) router.replace('/auth/login' as never);
      return;
    }
    if (onAuthRoute) router.replace('/');
  }, [configured, loading, user, segments, router]);

  return <>{children}</>;
}
