'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  displayName: string;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function resolveDisplayName(user: User | null): Promise<string> {
  if (!user) return '';

  const { data } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle();

  const fromProfile = data?.full_name?.trim();
  if (fromProfile) return fromProfile;
  
  const emailLocal = user.email?.split('@')[0];
  return emailLocal ?? 'Usuário';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    let cancelled = false;
    let lastUserId: string | null = null;

    const applySession = async (nextSession: Session | null) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      const nextUserId = nextSession?.user?.id ?? null;
      if (nextUserId !== lastUserId) {
        lastUserId = nextUserId;
        const name = await resolveDisplayName(nextSession?.user ?? null);
        if (!cancelled) setDisplayName(name);
      } else if (!nextUserId) {
        if (!cancelled) setDisplayName('');
      }
    };

    const init = async () => {
      const {
        data: { session: initial },
      } = await supabase.auth.getSession();

      // Hardening: valida o usuário do token no cliente (evita sessão "fantasma")
      if (initial?.access_token) {
        const { data, error } = await supabase.auth.getUser(initial.access_token);
        if (error || !data.user) {
          await supabase.auth.signOut();
          await applySession(null);
          if (!cancelled) setLoading(false);
          return;
        }
      }

      await applySession(initial);
      if (!cancelled) setLoading(false);
    };

    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void (async () => {
        await applySession(nextSession);
        if (!cancelled) setLoading(false);
      })();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setDisplayName('');
  }, []);

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      displayName,
      signOut,
    }),
    [user, session, loading, displayName, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return ctx;
}
