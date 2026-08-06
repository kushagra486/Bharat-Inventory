import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as Linking from 'expo-linking';
import { account, ID } from '@/lib/appwrite';

export interface AppUser {
  id: string;
  email: string;
  full_name?: string;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

function toAppUser(appwriteUser: { $id: string; email: string; name?: string }): AppUser {
  return { id: appwriteUser.$id, email: appwriteUser.email, full_name: appwriteUser.name || undefined };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshUser();
  }, []);

  async function refreshUser() {
    try {
      const current = await account.get();
      setUser(toAppUser(current));
    } catch {
      setUser(null);
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
    await account.createEmailPasswordSession(email, password);
    await refreshUser();
  }

  async function signOut() {
    await account.deleteSession('current');
    setUser(null);
  }

  async function resetPassword(email: string) {
    await account.createRecovery(email, Linking.createURL('/auth/reset-password'));
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
