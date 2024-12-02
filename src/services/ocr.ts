import vision from "@google-cloud/vision";
import "dotenv/config";
import fs from "fs-extra";
import path from "path";
import { deleteFile, convertPdfToImages } from "../utils/ocrHelpers";
import { logger } from "../utils/logger";

export class Ocr {
  private static readonly VISION_AUTH = {
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL as string,
      private_key: (process.env.GOOGLE_PRIVATE_KEY as string).replace(
        /\\n/g,
        "\n"
      ), // Handling the private key newline issue
    },
    fallback: true,
  };

  private imagesFolder = "./images";
  private outputTextFolder = "./output-text";

  constructor() {
    // Ensure directories exist during initialization
    Promise.all(
      [this.imagesFolder, this.outputTextFolder].map(fs.ensureDir)
    ).catch((err) => logger.error(`Error creating directories: ${err.message}`));
  }

  public async pdfOcr(pdfFilePath: string): Promise<string> {
    const fileNameWithoutExt = path.basename(pdfFilePath, ".pdf");

    try {
      const imageFilePaths: string[] = await convertPdfToImages(
        pdfFilePath,
        this.imagesFolder
      );

      if (imageFilePaths.length === 0) {
        logger.error("No images were generated from the PDF");
        return "";
      }

      const ocrResults = await Promise.all(
        imageFilePaths.map(async (imageFilePath): Promise<string> => {
          const ocrResult = await this.fileOcr(imageFilePath);
          if (ocrResult) {
            return ocrResult;
          } else {
            logger.warn(`No text found in image: ${imageFilePath}`);
            return "";
          }
        })
      );

      const concatenatedResults = ocrResults.join("");

      await this.saveDataToTxt(fileNameWithoutExt, concatenatedResults);

      logger.info(
        ` 💚 Successfully processed and saved the OCR results for ${pdfFilePath}`
      );

      for (const imageFilePath of imageFilePaths) {
        logger.warn(`Deleting temporary image: ${imageFilePath}`);
        deleteFile(imageFilePath);
      }

      return concatenatedResults;
    } catch (err: any) {
      logger.error(`Error processing ${pdfFilePath}:`, err);
      return "";
    }
  }

  public async fileOcr(imageFilePath: string): Promise<string | null> {
    const client = new vision.ImageAnnotatorClient(Ocr.VISION_AUTH);

    logger.info(` 🕶️ Processing image with Google Vision: ${imageFilePath}`);
    try {
      const [result] = await client.documentTextDetection(imageFilePath);

      const googleVisionText = result.fullTextAnnotation?.text;

      if (!googleVisionText) {
        logger.warn(`No text found in image: ${imageFilePath}`);
        return null;
      }

      logger.info(` 💚 Successfully processed image ${imageFilePath}`);
      return  googleVisionText ;
    } catch (err: any) {
      logger.error(`Error during Google Vision OCR processing: ${err.message}`);
      return null;
    }
  }

  private async saveDataToTxt(
    fileNameWithoutExt: string,
    text: string
  ): Promise<void> {
    const textPath = path.join(this.outputTextFolder, `${fileNameWithoutExt}.txt`);

    try {
      await fs.writeFile(textPath, text, "utf8");
      logger.info(` 💚 Successfully saved the text file at: ${textPath}`);
    } catch (err: any) {
      logger.error(`Error saving the text file: ${err.message}`);
    }
  }
}
