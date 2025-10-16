import { PublicClientApplication, type Configuration } from "@azure/msal-browser";

const requiredEnv = ["VITE_MSAL_CLIENT_ID", "VITE_MSAL_AUTHORITY"] as const;

requiredEnv.forEach((key) => {
  if (!import.meta.env[key]) {
    throw new Error(`Missing environment variable: ${key}`);
  }
});

const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_MSAL_CLIENT_ID!,
    authority: import.meta.env.VITE_MSAL_AUTHORITY!,
    redirectUri: import.meta.env.VITE_MSAL_REDIRECT_URI || window.location.origin,
    postLogoutRedirectUri:
      import.meta.env.VITE_MSAL_POST_LOGOUT_REDIRECT_URI || window.location.origin,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);
