import "dotenv/config";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Ocr, OcrResult } from './ocr';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class AttachmentProcessor {
    private extensionHandlers: Record<string, (filePath: string) => void>;
    private ocr = new Ocr();
    constructor() {

        this.extensionHandlers = {
            jpg: this.handleImage,
            png: this.handleImage,
            pdf: this.handlePdf,
        };
    }

    // Method to handle image files
    private async handleImage(filePath: string): Promise<OcrResult | null> {
        console.log(`Processing image file: ${filePath}`);
        const ocrData = this.ocr.fileOcr(filePath);
        console.log(ocrData)
        return ocrData
        
    }

    // Method to handle PDF files
    private async handlePdf(filePath: string): Promise<void> {
        console.log(`Processing PDF file: ${filePath}`);
        const ocrData = this.ocr.pdfOcr(filePath);
        console.log(ocrData)
        // Add your PDF processing logic here
    }

    // Method to handle other files
    private async handleOther(filePath: string): Promise<void> {
        console.log(`Processing other file type: ${filePath}`);
        // Add your generic file handling logic here
    }

    // Method to process attachments in a folder
    private processAttachments(attachmentsFolder: string): void {
        fs.readdir(attachmentsFolder, (err, files) => {
            if (err) {
                console.error(`Error reading attachments folder ${attachmentsFolder}:`, err);
                return;
            }

            files.forEach((file) => {
                const fullPath = path.join(attachmentsFolder, file);
                const extension = path.extname(file).slice(1).toLowerCase(); // Get file extension without the dot
                const handler = this.extensionHandlers[extension] || this.handleOther;

                // Call the appropriate handler for the file
                handler.call(this, fullPath);
            });
        });
    }

    // Method to traverse folders and process attachments
    public traverseFoldersAndProcessAttachments(baseFolder: string): void {
        fs.readdir(baseFolder, (err, entries) => {
            if (err) {
                console.error(`Error reading folder ${baseFolder}:`, err);
                return;
            }

            entries.forEach((entry) => {
                const fullPath = path.join(baseFolder, entry);

                fs.stat(fullPath, (err, stats) => {
                    if (err) {
                        console.error(`Error reading entry ${fullPath}:`, err);
                        return;
                    }

                    if (stats.isDirectory()) {
                        if (entry === 'attachments') {
                            // Process files in the 'attachments' directory
                            this.processAttachments(fullPath);
                        } else {
                            // Recursively traverse subdirectories
                            this.traverseFoldersAndProcessAttachments(fullPath);
                        }
                    }
                });
            });
        });
    }
}

// Example usage
const rootFolder = path.join(__dirname, '../data');
const attachmentProcessor = new AttachmentProcessor();
attachmentProcessor.traverseFoldersAndProcessAttachments(rootFolder);
