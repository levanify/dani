import OpenAI from "openai";
import { TELEGRAM_ACK_PROMPT, TELEGRAM_SYSTEM_PROMPT } from "./prompts";
import { NodeEnv } from "../config/env";

export type DaniAssistant = {
  quickAck(userMessage: string): Promise<string>;
  chat(userMessage: string): Promise<string>;
};

function createClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY environment variable.");
  }

  return new OpenAI({ apiKey });
}

export function createDaniAssistant(
  client: OpenAI = createClient(),
): DaniAssistant {
  return {
    async quickAck(userMessage: string): Promise<string> {
      const response = await client.responses.create({
        model: "gpt-4.1-mini",
        instructions: TELEGRAM_ACK_PROMPT,
        input: userMessage,
      });

      return response.output_text;
    },

    async chat(userMessage: string): Promise<string> {
      const response = await client.responses.create({
        model: "gpt-5.2-chat-latest",
        tools: [{ type: "web_search" }],
        instructions: TELEGRAM_SYSTEM_PROMPT,
        input: userMessage,
      });
      
      if (process.env.NODE_ENV === NodeEnv.Development) {
        console.log(JSON.stringify(response, null, 2));
      }

      return response.output_text;
    },
  };
}
