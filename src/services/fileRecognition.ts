import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Ocr } from "./ocr";
import { GptHandler } from "./openAI";
import z from "zod";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const FILE_VARIATIONS = [
  "Mapa",
  "Wypis gruntu",
  "Oferta",
  "Projekt zagospodarowania przestrzennego",
  "Wypis kartoteki budynków",
  "Uchwała/protokół",
  "Nic nie wnoszący plik",
] as const;

const FileVariation = z.object({
  fileVariation: z.enum(FILE_VARIATIONS),
});
const PlotData = z.object({
  location: z.object({
    town: z.string().optional(),
    precinct: z.string().optional(),
    plotNumber: z.string().optional(),
  }),
  area: z.string().optional(),
  price: z.number().optional(),
  contactToTheSeller: z.string().optional(),
  landRegisterNumber: z.string().optional(),
  comments: z.string().optional(),
});

type FileDataType = {
  fileVariation: z.infer<typeof FileVariation>;
  plotData: z.infer<typeof PlotData>;
};
class AttachmentProcessor {
  private extensionHandlers: Record<string, (filePath: string) => void>;
  private ocr = new Ocr();
  private gpt = new GptHandler();
  constructor() {
    this.extensionHandlers = {
      jpg: this.handleImage,
      png: this.handleImage,
      pdf: this.handlePdf,
    };
  }

  // Method to handle image files
  private async handleImage(filePath: string): Promise<FileDataType | null> {
    console.log(`Processing image file: ${filePath}`);

    const ocrText = await this.ocr.fileOcr(filePath);
    if (ocrText) {
      const fileVariation = await this.gpt.fileRecognition(
        ocrText,
        FileVariation
      );
      if(fileVariation.fileVariation !== "Nic nie wnoszący plik"){
          const plotData = await this.gpt.parsePlotData(ocrText, PlotData);
          return {
            fileVariation,
            plotData,
          };
      }
      else{
        return null
      }

    } else {
      return null;
    }
  }

  // Method to handle PDF files
  private async handlePdf(filePath: string): Promise<FileDataType | null> {
    console.log(`Processing PDF file: ${filePath}`);

    const ocrText = await this.ocr.pdfOcr(filePath);
    if (ocrText) {
      const fileVariation = await this.gpt.fileRecognition(
        ocrText,
        FileVariation
      );
      const plotData = await this.gpt.parsePlotData(ocrText, PlotData);

      // Ensure the return matches FileDataType
      return {
        fileVariation,
        plotData,
      };
    } else {
      return null;
    }
  }

  // Method to handle other files
  private async handleOther(filePath: string): Promise<void> {
    console.log(`Processing other file type: ${filePath}`);
    // Add your generic file handling logic here
  }

  // Method to process attachments in a folder
  // Method to process attachments in a folder
  private processAttachments(attachmentsFolder: string): void {
    fs.readdir(attachmentsFolder, (err, files) => {
      if (err) {
        console.error(
          `Error reading attachments folder ${attachmentsFolder}:`,
          err
        );
        return;
      }

      files.forEach((file) => {
        const fullPath = path.join(attachmentsFolder, file);
        const extension = path.extname(file).slice(1).toLowerCase(); // Get file extension without the dot
        const handler = this.extensionHandlers[extension] || this.handleOther;

        // Call the appropriate handler for the file
        const handlerResult: any = handler.call(this, fullPath);

        // If the handler is asynchronous, wait for the result and log it
        if (handlerResult instanceof Promise) {
          handlerResult
            .then((result) => {
              console.log(`Processed file: ${file}, Result:`, result);
            })
            .catch((error) => {
              console.error(`Error processing file: ${file}`, error);
            });
        }
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
            if (entry === "attachments") {
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
const rootFolder = path.join(__dirname, "../data");
const attachmentProcessor = new AttachmentProcessor();
attachmentProcessor.traverseFoldersAndProcessAttachments(rootFolder);
