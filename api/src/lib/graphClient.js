const { ClientSecretCredential } = require("@azure/identity");
const { Client } = require("@microsoft/microsoft-graph-client");
require("isomorphic-fetch");

const GRAPH_SCOPE = "https://graph.microsoft.com/.default";

const resolveEnv = (...keys) => {
  for (const key of keys) {
    const value = process.env[key];
    if (value) {
      return value;
    }
  }
  return null;
};

const createCredential = () => {
  const tenantId =
    resolveEnv("GRAPH_TENANT_ID", "AZURE_AD_TENANT_ID") ?? undefined;
  const clientId =
    resolveEnv("GRAPH_CLIENT_ID", "MSAL_CLIENT_ID") ?? undefined;
  const clientSecret = process.env.GRAPH_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error(
      "Graph credentials missing. Ensure GRAPH_TENANT_ID (or AZURE_AD_TENANT_ID), GRAPH_CLIENT_ID (or MSAL_CLIENT_ID) and GRAPH_CLIENT_SECRET are set."
    );
  }

  return new ClientSecretCredential(tenantId, clientId, clientSecret);
};

const createGraphClient = () => {
  const credential = createCredential();

  return Client.initWithMiddleware({
    authProvider: {
      getAccessToken: async () => {
        const token = await credential.getToken(GRAPH_SCOPE);
        if (!token?.token) {
          throw new Error("Unable to acquire Graph access token.");
        }
        return token.token;
      },
    },
  });
};

module.exports = {
  createGraphClient,
};
