import * as fs from "fs";
import { Client } from "@microsoft/microsoft-graph-client";

export async function uploadFile(accessToken: string, folderId: string, filePath: string, email: string) {
    const client = Client.init({
        authProvider: (done) => done(null, accessToken),
    });

    const fileName = filePath.split("/").pop();
    const fileContent = fs.readFileSync(filePath);

    await client
    .api(`/users/${email}/drive/items/${folderId}:/${fileName}:/content`)
    .put(fileContent);
}

export async function createFolder(accessToken: string, folderName: string, parentFolderId: string = "root", email: string): Promise<string> {
    const client = Client.init({
        authProvider: (done) => done(null, accessToken),
    });

    const folder = await client
    .api(`/users/${email}/drive/items/${parentFolderId}/children`)
    .post({
        name: folderName,
        folder: {},
        "@microsoft.graph.conflictBehavior": "rename",
    });

    return folder.id;
}

export async function listAllUsers(accessToken: string): Promise<void> {
    console.log("Initializing Microsoft Graph client...");
    
    const client = Client.init({
        authProvider: (done) => done(null, accessToken),
    });

    console.log("Fetching users from Microsoft Graph...");
    try {
        const users = await client.api("/users").get();

        console.log("Successfully retrieved users!");
        console.log(`Total users retrieved: ${users.value.length}`);
        users.value.forEach((user: any, index: number) => {
            console.log(`User ${index + 1}:`);
            console.log(`  Display Name: ${user.displayName}`);
            console.log(`  Email: ${user.userPrincipalName}`);
            console.log(`  ID: ${user.id}`);
            console.log("----------------------");
        });
    } catch (error: any) {
        console.error("Error retrieving users:");
        console.error("Error message:", error.message);
        console.error("Error details:", error);
    }
}
