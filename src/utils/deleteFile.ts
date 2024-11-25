import fs from "fs";
import { logger } from "./logger.ts";

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