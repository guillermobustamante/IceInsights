/* eslint-disable react-refresh/only-export-components */
import {
  type AccountInfo,
  type AuthenticationResult,
} from "@azure/msal-browser";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { msalInstance, msalConfigurationStatus } from "./msalInstance";

interface AuthContextValue {
  account: AccountInfo | null;
  isReady: boolean;
  isAuthenticating: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const setActiveAccount = (account: AccountInfo | null) => {
  if (!msalInstance) {
    return;
  }
  if (account) {
    msalInstance.setActiveAccount(account);
  } else {
    msalInstance.setActiveAccount(null);
  }
};

const resolveAccountFromResult = (
  result: AuthenticationResult | null
): AccountInfo | null => {
  if (!msalInstance) {
    return null;
  }
  if (result?.account) {
    return result.account;
  }
  const existingAccounts = msalInstance.getAllAccounts();
  return existingAccounts.length > 0 ? existingAccounts[0] : null;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const init = async () => {
      if (!msalInstance) {
        setError(
          msalConfigurationStatus.missingKeys.length > 0
            ? `Missing authentication configuration: ${msalConfigurationStatus.missingKeys.join(
                ", "
              )}`
            : "Authentication is not configured."
        );
        setIsReady(true);
        return;
      }
      try {
        await msalInstance.initialize();
        const result = await msalInstance.handleRedirectPromise();
        if (!active) {
          return;
        }
        const resolvedAccount = resolveAccountFromResult(result);
        setActiveAccount(resolvedAccount);
        setAccount(resolvedAccount);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Authentication initialization failed."
          );
        }
      } finally {
        if (active) {
          setIsReady(true);
        }
      }
    };

    void init();

    const callbackId = msalInstance
      ? msalInstance.addEventCallback((event) => {
          if (event.eventType === "msal:loginSuccess" && event.payload) {
            const payload = event.payload as AuthenticationResult;
            setActiveAccount(payload.account);
            setAccount(payload.account ?? null);
          }
          if (event.eventType === "msal:logoutSuccess") {
            setActiveAccount(null);
            setAccount(null);
          }
        })
      : undefined;

    return () => {
      active = false;
      if (callbackId && msalInstance) {
        msalInstance.removeEventCallback(callbackId);
      }
    };
  }, []);

  const login = useCallback(async () => {
    if (!msalInstance) {
      setError(
        "Authentication is not available. Please contact your administrator."
      );
      return;
    }
    setIsAuthenticating(true);
    setError(null);
    try {
      await msalInstance.loginRedirect({
        scopes: ["openid", "profile", "email"],
        prompt: "select_account",
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Login request failed unexpectedly."
      );
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const logout = useCallback(async () => {
    if (!msalInstance) {
      setError(
        "Authentication is not available. Please contact your administrator."
      );
      return;
    }
    setIsAuthenticating(true);
    setError(null);
    try {
      await msalInstance.logoutRedirect();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Logout request failed unexpectedly."
      );
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      account,
      isReady,
      isAuthenticating,
      error,
      login,
      logout,
    }),
    [account, error, isAuthenticating, isReady, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
