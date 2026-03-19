import React, { createContext, useContext, useEffect, useState } from 'react';

type AccessRole = 'user' | 'admin' | 'helper' | 'team';
type UserType = 'audience' | 'artist';

interface ServerUser {
  id: string;
  email: string;
}

interface Profile {
  id: string;
  email: string;
  access_role: AccessRole;
  user_type: UserType;
  display_name: string | null;
}

interface AuthContextType {
  user: ServerUser | null;
  profile: Profile | null;
  token: string;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string, userType: UserType) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ServerUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);

  const storageKey = 'couchslam_auth_v1';
  const serverBaseUrl = (import.meta.env.VITE_SERVER_BASE_URL as string | undefined) || '';
  const loginUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/auth/login.php` : '';
  const registerUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/auth/register.php` : '';

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as any;
        if (parsed?.user && parsed?.profile) {
          const p = parsed.profile as any;
          const migratedProfile: Profile = {
            id: String(p.id ?? parsed.user.email),
            email: String(p.email ?? parsed.user.email),
            access_role: (p.access_role as AccessRole) || 'user',
            user_type: (p.user_type as UserType) || 'audience',
            display_name: (p.display_name as string | null) ?? null,
          };

          setUser(parsed.user as ServerUser);
          setProfile(migratedProfile);

          const migratedToken = String(parsed.token || '');
          setToken(migratedToken);
          localStorage.setItem(storageKey, JSON.stringify({ user: parsed.user, profile: migratedProfile, token: migratedToken }));
        }
      }
    } catch {
      localStorage.removeItem(storageKey);
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!loginUrl) {
      throw new Error('Missing VITE_SERVER_BASE_URL');
    }

    const res = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = (await res.json()) as any;
    if (!res.ok || !data?.success) {
      throw new Error(data?.message || 'Login failed');
    }

    const accessRole: AccessRole = (data?.user?.accessRole as AccessRole) || 'user';
    const userType: UserType = (data?.user?.userType as UserType) || 'audience';
    const displayName: string | null = data?.user?.displayName ?? null;

    const newUser: ServerUser = {
      id: String(data?.user?.id || email),
      email,
    };

    const newProfile: Profile = {
      id: String(data?.user?.id || email),
      email,
      access_role: accessRole,
      user_type: userType,
      display_name: displayName,
    };

    setUser(newUser);
    setProfile(newProfile);
    const newToken = String(data?.token || '');
    setToken(newToken);

    localStorage.setItem(storageKey, JSON.stringify({ user: newUser, profile: newProfile, token: newToken }));
  };

  const signUp = async (email: string, password: string, displayName: string, userType: UserType) => {
    if (!registerUrl) {
      throw new Error('Missing VITE_SERVER_BASE_URL');
    }

    const res = await fetch(registerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, displayName, userType }),
    });

    const data = (await res.json()) as any;
    if (!res.ok || !data?.success) {
      throw new Error(data?.message || 'Sign up failed');
    }

    const newUser: ServerUser = {
      id: String(data?.user?.id || email),
      email,
    };

    const newProfile: Profile = {
      id: String(data?.user?.id || email),
      email,
      access_role: (data?.user?.accessRole as AccessRole) || (data?.user?.role as AccessRole) || 'user',
      user_type: (data?.user?.userType as UserType) || userType,
      display_name: (data?.user?.displayName as string | null) ?? displayName,
    };

    setUser(newUser);
    setProfile(newProfile);

    const newToken = String(data?.token || '');
    setToken(newToken);

    localStorage.setItem(storageKey, JSON.stringify({ user: newUser, profile: newProfile, token: newToken }));
  };

  const signOut = async () => {
    localStorage.removeItem(storageKey);
    setUser(null);
    setProfile(null);
    setToken('');
  };

  return (
    <AuthContext.Provider value={{ user, profile, token, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
