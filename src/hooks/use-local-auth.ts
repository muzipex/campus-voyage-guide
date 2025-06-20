import { useState, useEffect } from 'react';

export interface AuthUser {
  username: string;
  token: string;
}

const LOCAL_AUTH_KEY = 'cvguide_auth';

export function useLocalAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_AUTH_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        setUser(null);
      }
    }
  }, []);

  const login = (username: string, password: string) => {
    // For demo: accept any username/password, generate a fake token
    const token = btoa(username + ':' + password + ':' + Date.now());
    const authUser = { username, token };
    localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(authUser));
    setUser(authUser);
    return true;
  };

  const logout = () => {
    localStorage.removeItem(LOCAL_AUTH_KEY);
    setUser(null);
  };

  return { user, login, logout };
}
