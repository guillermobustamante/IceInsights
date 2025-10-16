import {
  PublicClientApplication,
  type Configuration,
} from "@azure/msal-browser";

const requiredEnv = ["VITE_MSAL_CLIENT_ID", "VITE_MSAL_AUTHORITY"] as const;

const missingEnv = requiredEnv.filter((key) => !import.meta.env[key]);

let msalConfig: Configuration | null = null;

if (missingEnv.length === 0) {
  msalConfig = {
    auth: {
      clientId: import.meta.env.VITE_MSAL_CLIENT_ID!,
      authority: import.meta.env.VITE_MSAL_AUTHORITY!,
      redirectUri:
        import.meta.env.VITE_MSAL_REDIRECT_URI || window.location.origin,
      postLogoutRedirectUri:
        import.meta.env.VITE_MSAL_POST_LOGOUT_REDIRECT_URI ||
        window.location.origin,
    },
    cache: {
      cacheLocation: "localStorage",
      storeAuthStateInCookie: false,
    },
  };
}

export const msalInstance = msalConfig
  ? new PublicClientApplication(msalConfig)
  : null;

export const msalConfigurationStatus = {
  isConfigured: msalConfig !== null,
  missingKeys: missingEnv,
};
