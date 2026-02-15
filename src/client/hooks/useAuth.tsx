/**
 * Auth Context — JWT token management.
 *
 * Stores the access token in memory (never localStorage for PHI safety).
 * Provides login/logout and automatic session timeout.
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import type { ReactNode } from "react";
import { setTokenGetter } from "../api/client";

interface AuthState {
  token: string | null;
  user: { userId: string; email: string; role: string } | null;
  loading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

function parseJwt(token: string): { sub: string; email: string; role: string; exp: number } | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthState["user"]>(null);
  const [loading, setLoading] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const resetTimeout = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(logout, SESSION_TIMEOUT_MS);
  }, [logout]);

  const login = useCallback(
    (newToken: string) => {
      const decoded = parseJwt(newToken);
      if (!decoded) return;

      // Check expiration
      if (decoded.exp * 1000 < Date.now()) return;

      setToken(newToken);
      setUser({ userId: decoded.sub, email: decoded.email, role: decoded.role });
      resetTimeout();
    },
    [resetTimeout],
  );

  // Wire token getter for API client
  useEffect(() => {
    setTokenGetter(() => token);
  }, [token]);

  // Activity-based session timeout reset
  useEffect(() => {
    if (!token) return;

    const events = ["mousedown", "keydown", "scroll", "touchstart"] as const;
    const handler = () => resetTimeout();

    events.forEach((e) => window.addEventListener(e, handler));
    return () => {
      events.forEach((e) => window.removeEventListener(e, handler));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [token, resetTimeout]);

  // Initial load complete
  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
