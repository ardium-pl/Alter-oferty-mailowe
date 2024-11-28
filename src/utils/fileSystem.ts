import {promises as fsPromises} from 'fs';
import {join} from 'path';
import {EmailData} from '../interfaces/email.js';
import { createLogger } from './logger.js';
const logger = createLogger(import.meta.url);
import {existsSync} from 'fs';

const DATA_DIR = join(process.cwd(), 'data');

export async function initializeDataDirectory(): Promise<void> {
    await fsPromises.mkdir(DATA_DIR, {recursive: true});
}

export async function resetDataDirectory(): Promise<void> {
    if (existsSync(DATA_DIR)) {
        await fsPromises.rm(DATA_DIR, {recursive: true, force: true});
        logger.info('Usunięto folder data z zapisanymi mailami');
    }
    await initializeDataDirectory();
    logger.info('Utworzono nowy pusty folder data');
}

export async function saveEmailToFile(messageId: string, emailData: EmailData): Promise<void> {
    const fileName = `${messageId}-${Date.now()}.json`;
    const filePath = join(DATA_DIR, fileName);

    await fsPromises.writeFile(
        filePath,
        JSON.stringify(emailData, null, 2),
        'utf-8'
    );

    logger.info(`Zapisano wiadomość: ${fileName}`);
}