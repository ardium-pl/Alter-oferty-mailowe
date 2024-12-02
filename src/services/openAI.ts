import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { ZodType, ZodTypeDef } from "zod";
import { FILE_VARIATIONS } from "./fileRecognition";

export class GptHandler {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  private async _getGptResponse<T extends ZodType<any, ZodTypeDef, any>>(
    systemMessage: string,
    ocrText: string,
    dataSchema: T,
    schemaName: string
  ): Promise<T["_output"]> {
    const rawResponse = await this.client.beta.chat.completions.parse({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: ocrText },
      ],
      response_format: zodResponseFormat(dataSchema, schemaName),
    });

    const message = rawResponse.choices[0]?.message;
    if (message?.parsed) {
      return message.parsed as T["_output"];
    } else if (message?.refusal) {
      throw new Error(`🤖 AI refused to process the text: ${message.refusal}`);
    } else {
      throw new Error("Failed to parse OCR text");
    }
  }

  public async fileRecognition<T extends ZodType<any, ZodTypeDef, any>>(
    ocrText: string,
    dataSchema: T
  ): Promise<T["_output"]> {
    const systemMessage = `You're an expert at recognizing files by the plots. Analyzing the provided text from OCR, evaluate what type of file it is by choosing one of the given types. Possible file types: ${JSON.stringify(FILE_VARIATIONS, null, 2)}`;
    const schemaName = "FileVariations";
    return this._getGptResponse(systemMessage, ocrText, dataSchema, schemaName);
  }

  public async parsePlotData<T extends ZodType<any, ZodTypeDef, any>>(
    ocrText: string,
    dataSchema: T
  ): Promise<T["_output"]> {
    const systemMessage = "You are an expert at extracting data from files by the plots. Analyzing the provided text from OCR, extract data (if possible) according to the provided JSON schema: ";
    const schemaName = "PlotData";
    return this._getGptResponse(systemMessage, ocrText, dataSchema, schemaName);
  }
}
