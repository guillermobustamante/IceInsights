const { ClientSecretCredential } = require("@azure/identity");
const { Client } = require("@microsoft/microsoft-graph-client");
require("isomorphic-fetch");

const GRAPH_SCOPE = "https://graph.microsoft.com/.default";

const createCredential = () => {
  const tenantId = process.env.GRAPH_TENANT_ID;
  const clientId = process.env.GRAPH_CLIENT_ID;
  const clientSecret = process.env.GRAPH_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error(
      "Graph credentials missing. Ensure GRAPH_TENANT_ID, GRAPH_CLIENT_ID, and GRAPH_CLIENT_SECRET are set."
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
