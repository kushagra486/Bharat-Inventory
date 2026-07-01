import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthCtx {
  user: User | null; session: Session | null; loading: boolean;
  signIn: (e: string, p: string) => Promise<void>;
  signUp: (e: string, p: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}
const Ctx = createContext<AuthCtx>({} as AuthCtx);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session); setUser(session?.user ?? null); setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => {
      setSession(s); setUser(s?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);
  return (
    <Ctx.Provider value={{
      user, session, loading,
      signIn: async (e, p) => { const { error } = await supabase.auth.signInWithPassword({ email: e, password: p }); if (error) throw error; },
      signUp: async (e, p, name) => { const { error } = await supabase.auth.signUp({ email: e, password: p, options: { data: { full_name: name } } }); if (error) throw error; },
      signOut: async () => { const { error } = await supabase.auth.signOut(); if (error) throw error; },
    }}>
      {children}
    </Ctx.Provider>
  );
}
export const useAuth = () => useContext(Ctx);
