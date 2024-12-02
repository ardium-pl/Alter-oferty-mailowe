import { Poppler } from "node-poppler";
import path from "path";
import fs from "fs-extra";
import {logger} from "./logger";
import camelcase from "camelcase";

export async function convertPdfToImages(pdfFilePath: string, saveFolder: string) {
    logger.info(`Starting conversion of PDF: ${pdfFilePath}`);
    const poppler = new Poppler();
    const outputPrefix = replacePolishCharacters(
        path.basename(pdfFilePath, path.extname(pdfFilePath))
    );
    const outputFilePath = path.join(saveFolder, `${outputPrefix}`);
    const pdfInfo: Record<string, string> = {};

    await fs.ensureDir(saveFolder);

    try {
        logger.info(`Getting PDF info for: ${pdfFilePath}`);
        const ret = await poppler.pdfInfo(pdfFilePath);
        
        if (typeof ret === 'string') {
            ret.split('\n')
                .map(r => r.split(': '))
                .forEach(r => {
                    if (r.length > 1) {
                        pdfInfo[camelcase(r[0])] = r[1].trim();
                    }
                });
        } else {
            logger.error(`Expected string output from pdfInfo but got: ${typeof ret}`);
            throw new Error('Invalid PDF info format');
        }

        logger.info(`PDF info: ${JSON.stringify(pdfInfo)}`);

        const options = {
            firstPageToConvert: 1,
            lastPageToConvert: parseInt(pdfInfo.pages),
            pngFile: true,
        };

        logger.info(`Converting PDF to images with options: ${JSON.stringify(options)}`);
        await poppler.pdfToCairo(pdfFilePath, outputFilePath, options);

        const imagePaths = [];
        for (let i = options.firstPageToConvert; i <= options.lastPageToConvert; i++) {
            const imagePathWithoutLeadingZero = `${outputFilePath}-${i}.png`;
            const imagePathWithLeadingZero = `${outputFilePath}-${i.toString().padStart(2, '0')}.png`;

            if (fs.existsSync(imagePathWithoutLeadingZero)) {
                imagePaths.push(imagePathWithoutLeadingZero);
            } else if (fs.existsSync(imagePathWithLeadingZero)) {
                imagePaths.push(imagePathWithLeadingZero);
            } else {
                logger.warn(`Expected image file not found: ${imagePathWithoutLeadingZero} or ${imagePathWithLeadingZero}`);
            }
        }

        logger.info(`Converted PDF to ${imagePaths.length} images`);
        return imagePaths;
    } catch (err) {
        logger.error("Error converting PDF to image:", err);
        throw err;
    }
}

export function replacePolishCharacters(str: string): string {
    const polishChars: Record<string, string> = {
      ą: "a",
      ć: "c",
      ę: "e",
      ł: "l",
      ń: "n",
      ó: "o",
      ś: "s",
      ź: "z",
      ż: "z",
      Ą: "A",
      Ć: "C",
      Ę: "E",
      Ł: "L",
      Ń: "N",
      Ó: "O",
      Ś: "S",
      Ź: "Z",
      Ż: "Z",
    };
  
    return str.replace(
      /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g,
      (match: string) => polishChars[match] || match
    );
  }

  export function deleteFile(filePath: string) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      } else {
        logger.info(`File not found: ${filePath}`);
      }
    } catch (err) {
      logger.error(`Error deleting file ${filePath}:`, err);
    }
  }