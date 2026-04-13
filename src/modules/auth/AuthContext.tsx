import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import axios from "axios";
import {
  getMe,
  loginWithPassword,
  logoutAll,
  logoutCurrentSession,
  refreshAccessToken,
  setAccessToken,
} from "./api/authApi";
import { queryClient } from "@/lib/queryClient";
import {
  clearAuthSession,
  getAuthSession,
  setAuthSession,
} from "./authStorage";
import type { AuthSession } from "./types";

type AuthContextValue = {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  isLoggingOut: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutAllDevices: () => Promise<void>;
  rehydrateFromTokens: (token: string, refreshToken: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() =>
    getAuthSession()
  );
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const rehydrateFromTokens = useCallback(async (token: string, refreshToken: string) => {
    setAccessToken(token);
    const meResult = await getMe(token);
    const nextSession: AuthSession = {
      token,
      refreshToken,
      user: {
        email: meResult.user.email,
        employee_number: meResult.user.employee_number,
        is_system_admin: meResult.user.is_system_admin,
        must_change_password: Boolean(meResult.user.must_change_password),
      },
    };
    setAuthSession(nextSession);
    setSession(nextSession);
  }, []);

  useEffect(() => {
    const bootstrapSession = async () => {
      const storedSession = getAuthSession();

      if (!storedSession) {
        setAccessToken(null);
        setIsAuthLoading(false);
        return;
      }

      setAccessToken(storedSession.token);

      try {
        const meResult = await getMe(storedSession.token);
        const nextSession: AuthSession = {
          token: storedSession.token,
          refreshToken: storedSession.refreshToken,
          user: {
            email: meResult.user.email,
            employee_number: meResult.user.employee_number,
            is_system_admin: meResult.user.is_system_admin,
            must_change_password: Boolean(meResult.user.must_change_password),
          },
        };
        setAuthSession(nextSession);
        setSession(nextSession);
        setIsAuthLoading(false);
        return;
      } catch (err) {
        const status = axios.isAxiosError(err) ? err.response?.status : undefined;
        if (status !== 401) {
          clearAuthSession();
          setAccessToken(null);
          setSession(null);
          setIsAuthLoading(false);
          return;
        }
      }

      try {
        const refreshed = await refreshAccessToken(storedSession.refreshToken);
        const meResult = await getMe(refreshed.token);

        const nextSession: AuthSession = {
          token: refreshed.token,
          refreshToken: refreshed.refresh_token,
          user: {
            email: meResult.user.email,
            employee_number: meResult.user.employee_number,
            is_system_admin: meResult.user.is_system_admin,
            must_change_password: Boolean(meResult.user.must_change_password),
          },
        };

        setAuthSession(nextSession);
        setSession(nextSession);
      } catch {
        clearAuthSession();
        setAccessToken(null);
        setSession(null);
      } finally {
        setIsAuthLoading(false);
      }
    };

    void bootstrapSession();
  }, []);

  const login = async (email: string, password: string) => {
    const loginResult = await loginWithPassword({ email, password });
    const meResult = await getMe(loginResult.token);

    const nextSession: AuthSession = {
      token: loginResult.token,
      refreshToken: loginResult.refreshToken,
      user: {
        email: meResult.user.email,
        employee_number: meResult.user.employee_number,
        is_system_admin: meResult.user.is_system_admin,
        must_change_password: Boolean(meResult.user.must_change_password),
      },
    };

    setAuthSession(nextSession);
    setAccessToken(nextSession.token);
    setSession(nextSession);
  };

  const logout = async () => {
    setIsLoggingOut(true);
    if (session?.refreshToken) {
      try {
        await logoutCurrentSession(session.refreshToken);
      } catch {
        // Clear local session even if backend logout call fails.
      }
    }
    clearAuthSession();
    setAccessToken(null);
    setSession(null);
    queryClient.removeQueries({ queryKey: ["directory"] });
    setIsLoggingOut(false);
  };

  const logoutAllDevices = async () => {
    setIsLoggingOut(true);
    if (session?.token) {
      try {
        await logoutAll(session.token);
      } catch {
        // Clear local session even if backend logout call fails.
      }
    }
    clearAuthSession();
    setAccessToken(null);
    setSession(null);
    queryClient.removeQueries({ queryKey: ["directory"] });
    setIsLoggingOut(false);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: Boolean(session?.token),
      isAuthLoading,
      isLoggingOut,
      login,
      logout,
      logoutAllDevices,
      rehydrateFromTokens,
    }),
    [isAuthLoading, isLoggingOut, rehydrateFromTokens, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
