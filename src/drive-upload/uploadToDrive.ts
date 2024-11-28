import { createFolder, uploadFile } from "./upload";
import "dotenv/config";
import { getAccessToken } from "./getAccessToken";

async function main() {
    const email = "";
    const filePath = "../../files/"; // Replace with your file path
    const folderName = "Pliki euvic chatbot";
    
    console.log("Starting the script...");
    console.log(`Target email: ${email}`);
    console.log(`Target file path: ${filePath}`);
    console.log(`Target folder name: ${folderName}`);
    
    try {
        // Step 1: Get Access Token
        console.log("Retrieving access token...");
        const accessToken = await getAccessToken();
        console.log("Access token retrieved successfully!");

        // Step 2: Check if Target User's OneDrive is Initialized
        console.log(`Checking if OneDrive is initialized for user: ${email}`);
        const driveCheck = await fetch(`https://graph.microsoft.com/v1.0/users/${email}/drive`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!driveCheck.ok) {
            throw new Error(`OneDrive not initialized for user: ${email}. Response: ${await driveCheck.text()}`);
        }
        console.log("OneDrive is initialized!");

        // Step 3: Create Folder
        console.log("Creating folder...");
        console.log(`Folder name: ${folderName}`);
        const folderId = await createFolder(accessToken, folderName, undefined, email);
        
        console.log(`Folder created successfully! Folder ID: ${folderId}`);
        
        // Step 4: Upload File
        console.log("Uploading file...");
        console.log(`File path: ${filePath}`);
        console.log(`Uploading to folder ID: ${folderId}`);
        await uploadFile(accessToken, folderId, filePath, email);
        
        console.log("File uploaded successfully!");
    } catch (error: any) {
        console.error("Error encountered during execution:");
        console.error("Error message:", error.message);
        console.error("Error stack trace:", error.stack);

        if (error.response) {
            console.error("Error response status:", error.response.status);
            console.error("Error response headers:", error.response.headers);
            console.error("Error response body:", error.response.data);
        }
    }
}

await main();
