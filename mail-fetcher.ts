// import {Client} from '@microsoft/microsoft-graph-client';
// import {ClientSecretCredential} from '@azure/identity';
// import {promises as fsPromises} from 'fs';
// import {join} from 'path';
// import * as process from 'process';
// import 'dotenv/config';
//
// interface EmailData {
//     subject: string;
//     body: string;
//     receivedDateTime: string;
// }
//
// interface MessageResponse {
//     id: string;
//     subject: string;
//     body: {
//         content: string;
//     };
//     receivedDateTime: string;
// }
//
// interface UserResponse {
//     id: string;
//     displayName: string;
//     userPrincipalName: string;
//     mail: string;
// }
//
// interface Credentials {
//     clientId: string;
//     clientSecret: string;
//     tenantId: string;
// }
//
// const credentials: Credentials = {
//     clientId: process.env.CLIENT_ID ?? '',
//     clientSecret: process.env.CLIENT_SECRET ?? '',
//     tenantId: process.env.TENANT_ID ?? ''
// };
//
// if (!credentials.clientId || !credentials.clientSecret || !credentials.tenantId) {
//     throw new Error('Missing required credentials');
// }
//
// async function initializeGraphClient(): Promise<Client> {
//     const credential = new ClientSecretCredential(
//         credentials.tenantId,
//         credentials.clientId,
//         credentials.clientSecret
//     );
//
//     return Client.init({
//         authProvider: async (done) => {
//             try {
//                 const token = await credential.getToken(['https://graph.microsoft.com/.default']);
//                 if (!token?.token) {
//                     throw new Error('Failed to obtain token');
//                 }
//                 done(null, token.token);
//             } catch (error) {
//                 done(error as Error, null);
//             }
//         },
//     });
// }
//
// async function listUsers(): Promise<UserResponse[]> {
//     try {
//         const client = await initializeGraphClient();
//
//         const response = await client
//             .api('/users')
//             .select('id,displayName,userPrincipalName,mail')
//             .get();
//
//         const users: UserResponse[] = response.value;
//
//         // Wyświetl listę użytkowników
//         console.log('\nDostępni użytkownicy:');
//         users.forEach((user, index) => {
//             console.log(`${index + 1}. ${user.displayName} (${user.mail || user.userPrincipalName})`);
//             console.log(`   ID: ${user.id}\n`);
//         });
//
//         return users;
//     } catch (error) {
//         console.error('Błąd podczas pobierania listy użytkowników:', error);
//         throw error;
//     }
// }
//
// async function fetchEmails(userId: string): Promise<void> {
//     try {
//         const dataDir = join(process.cwd(), 'data');
//         await fsPromises.mkdir(dataDir, {recursive: true});
//         const client = await initializeGraphClient();
//
//         console.log(`\nPobieram maile dla użytkownika o ID: ${userId}`);
//
//         const response = await client
//             .api(`/users/${userId}/messages`)
//             .select('id,subject,body,receivedDateTime')
//             .top(50)
//             .get();
//
//         const messages: MessageResponse[] = response.value;
//
//         for (const message of messages) {
//             const fileName = `${message.id}-${Date.now()}.json`;
//             const filePath = join(dataDir, fileName);
//
//             const emailData: EmailData = {
//                 subject: message.subject,
//                 body: message.body.content,
//                 receivedDateTime: message.receivedDateTime
//             };
//
//             await fsPromises.writeFile(
//                 filePath,
//                 JSON.stringify(emailData, null, 2),
//                 'utf-8'
//             );
//
//             console.log(`Zapisano wiadomość: ${fileName}`);
//         }
//
//         console.log('Zakończono pobieranie wiadomości');
//     } catch (error) {
//         console.error('Wystąpił błąd:', error);
//         throw error;
//     }
// }
//
// // Główna funkcja kodu aplikacji
// async function main() {
//     try {
//         console.log('Pobieram listę użytkowników...');
//         const users = await listUsers();
//
//         if (users.length === 0) {
//             console.log('Nie znaleziono żadnych użytkowników');
//             return;
//         }
//
//         // Dla przykładu staram sie pobierać maile dla pierwszego użytkownika z listy
//         const selectedUser = users[0];
//         console.log(`\nPobieram maile dla użytkownika: ${selectedUser.displayName}`);
//         await fetchEmails(selectedUser.id);
//
//     } catch (error) {
//         console.error('Wystąpił błąd:', error);
//     }
// }
//
// // Uruchomienie aplikacji
// main().catch(console.error);