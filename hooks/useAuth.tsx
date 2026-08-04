import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Models } from 'react-native-appwrite';
import { account, ID } from '@/lib/appwrite';

type AppwriteUser = Models.User<Models.Preferences>;

interface AuthContextType {
  user: AppwriteUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

function getRecoveryRedirectUrl(): string {
  if (typeof window !== 'undefined' && window.location) {
    return `${window.location.origin}/auth/reset-password`;
  }
  return 'https://bharat-inventory.vercel.app/auth/reset-password';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppwriteUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshUser();
  }, []);

  async function refreshUser() {
    try {
      const current = await account.get();
      setUser(current);
    } catch {
      // No session yet -- skip the login wall by dropping visitors into an
      // anonymous session instead. They still get a real, isolated user ID
      // that the existing per-user document permissions work against.
      try {
        await account.createAnonymousSession();
        setUser(await account.get());
      } catch {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    await account.createEmailPasswordSession(email, password);
    await refreshUser();
  }

  async function signUp(email: string, password: string, fullName: string) {
    await account.create(ID.unique(), email, password, fullName);
  }

  async function signOut() {
    await account.deleteSession('current');
    await refreshUser();
  }

  async function resetPassword(email: string) {
    await account.createRecovery(email, getRecoveryRedirectUrl());
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
