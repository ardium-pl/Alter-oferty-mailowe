import { ConfidentialClientApplication } from "@azure/msal-node";

const clientId = process.env.CLIENT_ID as string;
const clientSecret = process.env.CLIENT_SECRET as string;
const tenantId = process.env.TENANT_ID as string;

export async function getAccessToken(): Promise<string> {
    const msalConfig = {
        auth: {
            clientId,
            authority: `https://login.microsoftonline.com/${tenantId}`,
            clientSecret,
        },
    };

    const cca = new ConfidentialClientApplication(msalConfig);

    const authResponse = await cca.acquireTokenByClientCredential({
        scopes: ["https://graph.microsoft.com/.default"],
    });

    if (!authResponse || !authResponse.accessToken) {
        throw new Error("Failed to acquire access token");
    }

    return authResponse.accessToken;
}
