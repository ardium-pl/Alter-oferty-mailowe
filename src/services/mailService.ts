import {Client} from '@microsoft/microsoft-graph-client';
import {EmailData, MessageResponse, UserResponse} from '../interfaces/email.js';
import {saveEmailToFile} from '../utils/fileSystem.js';
import { createLogger } from '../utils/logger.js';
const logger = createLogger(import.meta.url);

export class MailService {
    constructor(private client: Client) {
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
            logger.info(`\nPobieram maile dla użytkownika o ID: ${userId}`);

            const response = await this.client
                .api(`/users/${userId}/messages`)
                .select('id,subject,body,receivedDateTime')
                .top(50)
                .get();

            const messages: MessageResponse[] = response.value;

            for (const message of messages) {
                const emailData: EmailData = {
                    subject: message.subject,
                    body: message.body.content,
                    receivedDateTime: message.receivedDateTime
                };

                await saveEmailToFile(message.id, emailData);
            }

            logger.info('Zakończono pobieranie wiadomości');
        } catch (error) {
            logger.error('Wystąpił błąd:', error);
            throw error;
        }
    }
}