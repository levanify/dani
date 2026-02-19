import OpenAI from "openai";
import { TELEGRAM_ACK_PROMPT, TELEGRAM_SYSTEM_PROMPT } from "./prompts";

export type DaniAssistant = {
  quickAck(userMessage: string): Promise<string>;
  chat(userMessage: string): Promise<string>;
};

type OpenAIResponseText = {
  output_text?: string;
  output?: Array<{
    type: string;
    content?: Array<{ type: string; text?: string }>;
  }>;
};

function getOutputText(response: OpenAIResponseText): string {
  if (response.output_text) {
    return response.output_text;
  }

  for (const item of response.output ?? []) {
    if (item.type !== "message") {
      continue;
    }

    for (const content of item.content ?? []) {
      if (content.type === "output_text" && content.text) {
        return content.text;
      }
    }
  }

  return "";
}

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

      return getOutputText(response);
    },
    async chat(userMessage: string): Promise<string> {
      const response = await client.responses.create({
        model: "gpt-5.2-chat-latest",
        tools: [{ type: "web_search" }],
        instructions: TELEGRAM_SYSTEM_PROMPT,
        input: userMessage,
      });

      return getOutputText(response);
    },
  };
}
