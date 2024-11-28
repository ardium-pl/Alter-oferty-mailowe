import {Client} from '@microsoft/microsoft-graph-client';
import {EmailData, MessageResponse, UserResponse, Attachment} from '../interfaces/email.js';
import {EmailParser} from '../utils/emailParser.js';
import {saveEmailToFile, saveAttachment} from '../utils/fileSystem.js';
import {createLogger} from '../utils/logger.js';

const logger = createLogger(import.meta.url);

export class MailService {
    constructor(private client: Client) {
    }

    // Metody prywatne dla pobierania zalacznikow i odznaczania maili jako przeczytane
    private async getAttachment(userId: string, messageId: string): Promise<Attachment[]> {
        try {
            const response = await this.client
                .api(`/users/${userId}/messages/${messageId}/attachments`)
                .get();

            logger.info(`Pobrano listę ${response.value.length} załączników dla maila ${messageId}`);
            // Poprzez GRAPH API pobieramy liste zalacznikow dla danego maila
            return response.value;
        } catch (error) {
            logger.error(`Wystąpił błąd podczas pobierania załącznika: ${error}`);
            return [];
        }
    }

    private async downloadAttachment(userId: string, messageId: string, attachmentId: string): Promise<Attachment | null> {
        try {
            const attachment = await this.client
                .api(`/users/${userId}/messages/${messageId}/attachments/${attachmentId}`)
                .get();

            logger.info(`Pobrano załącznik ${attachmentId} dla maila ${messageId}`);
            return attachment;
        } catch (error) {
            logger.error(`Wystąpił błąd podczas pobierania załącznika: ${error}`);
            return null;
        }
    }

    private async markAsUnread(userId: string, messageId: string): Promise<void> {
        try {
            await this.client
                .api(`/users/${userId}/messages/${messageId}`)
                .update({isRead: false});

            logger.info(`Oznaczono maila jako nieprzeczytanego: ${messageId}`);
        } catch (error) {
            logger.error(`Błąd podczas oznaczania maila jako nieprzeczytany: ${error}`);
        }
    }

    async listUsers(): Promise<UserResponse[]> {
        try {
            const response = await this.client
                .api('/users')
                .select('id,displayName,userPrincipalName,mail')
                .get();

            const users: UserResponse[] = response.value;
            logger.info('\nDostępni użytkownicy:');
            users.forEach((user, index) => {
                logger.info(`${index + 1}. ${user.displayName} (${user.mail || user.userPrincipalName})`);
                logger.info(`   ID: ${user.id}\n`);
            });

            return users;
        } catch (error) {
            logger.error('Błąd podczas pobierania listy użytkowników:', error);
            throw error;
        }
    }

    async fetchUserEmails(userId: string): Promise<void> {
        try {
            logger.info(`\nPobieram nieprzeczytane maile dla użytkownika o ID: ${userId}`);

            const response = await this.client
                .api(`/users/${userId}/messages`)
                .select('id,subject,body,from,toRecipients,ccRecipients,receivedDateTime,hasAttachments,isRead')
                .filter('isRead eq false')  // Tylko nieprzeczytane
                .top(50)
                .get();

            const messages: MessageResponse[] = response.value;

            for (const message of messages) {
                try {
                    // Pobierz załączniki jeśli są
                    let attachments: Attachment[] = [];
                    if (message.hasAttachments) {
                        attachments = await this.getAttachment(userId, message.id);

                        // Pobierz fizycznie kazdy zalacznik
                        for (const attachment of attachments) {
                            const fullAttachment = await this.downloadAttachment(userId, message.id, attachment.id);
                            if (fullAttachment) {
                                await saveAttachment(message.id, fullAttachment);
                            }
                        }
                    }

                    // Parsuj tresc maila
                    const emailData = EmailParser.parse(message);
                    emailData.content.physicalAttachments = attachments;
                    await saveEmailToFile(message.id, emailData);

                    // Oznacz maila jako nieprzeczytanego
                    await this.markAsUnread(userId, message.id);
                } catch (error) {
                    logger.error(`Błąd podczas przetwarzania maila ${message.id}: ${error}`);
                }
            }

            logger.info(`Zakończono pobieranie wiadomości. Przetworzono ${messages.length} maili`);
        } catch (error) {
            logger.error('Wystąpił błąd:', error);
            throw error;
        }
    }
}